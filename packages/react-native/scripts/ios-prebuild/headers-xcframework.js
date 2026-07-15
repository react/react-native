/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

/**
 * Headers-only xcframework emitter — the shared recipe behind
 * ReactNativeHeaders.xcframework (headers-compose.js) and the
 * ReactNativeDependenciesHeaders.xcframework sidecar (the deps prebuild's
 * compose-framework.js). A headers-only artifact is a LIBRARY-type
 * xcframework: stub static archives (nothing embeds in apps) paired with a
 * staged Headers dir. The per-slice Headers/ layout and the Info.plist
 * `HeadersPath` key — what makes SwiftPM auto-serve the headers with zero
 * flags — are produced by `xcodebuild -create-xcframework -library ...
 * -headers ...` itself and are never hand-written (framework-type entries
 * hard-reject `HeadersPath`; verified 2026-07-04).
 *
 * This module must stay dependency-light (fs/path/child_process only): the
 * deps prebuild under scripts/releases requires it across the package
 * boundary.
 */

const {execFileSync} = require('child_process');
const fs = require('fs');
const path = require('path');

// APFS clonefile (-c) is a macOS-only cp flag; plain -R elsewhere (Linux CI
// exercises these paths through the jest integration tests).
const CP_FLAGS = process.platform === 'darwin' ? '-Rc' : '-R';

/*::
export type StubSlice = {
  name: string, // human label
  sdk: string, // xcrun --sdk name
  targets: Array<string>, // clang -target triples (lipo'd when > 1)
};
*/

const DEFAULT_STUB_SLICES /*: Array<StubSlice> */ = [
  {name: 'ios', sdk: 'iphoneos', targets: ['arm64-apple-ios15.0']},
  {
    name: 'ios-simulator',
    sdk: 'iphonesimulator',
    targets: [
      'arm64-apple-ios15.0-simulator',
      'x86_64-apple-ios15.0-simulator',
    ],
  },
];

// Mac Catalyst slice — used by the real compose (the cached-artifact
// repackage path skips it to stay fast; React.xcframework carries it).
const CATALYST_STUB_SLICE /*: StubSlice */ = {
  name: 'mac-catalyst',
  sdk: 'macosx',
  targets: ['arm64-apple-ios15.0-macabi', 'x86_64-apple-ios15.0-macabi'],
};

// SupportedPlatform(+variant) from an xcframework Info.plist -> stub recipe.
// The min OS version in the triple only shapes the stub object file; slice
// identity (what create-xcframework groups by) comes from platform + variant
// + archs.
const PLATFORM_STUB_RECIPES /*: {
  [key: string]: {sdk: string, os: string, suffix: string},
} */ = {
  ios: {sdk: 'iphoneos', os: 'ios15.0', suffix: ''},
  'ios-simulator': {
    sdk: 'iphonesimulator',
    os: 'ios15.0',
    suffix: '-simulator',
  },
  'ios-maccatalyst': {sdk: 'macosx', os: 'ios15.0', suffix: '-macabi'},
  macos: {sdk: 'macosx', os: 'macosx11.0', suffix: ''},
  tvos: {sdk: 'appletvos', os: 'tvos15.1', suffix: ''},
  'tvos-simulator': {
    sdk: 'appletvsimulator',
    os: 'tvos15.1',
    suffix: '-simulator',
  },
  xros: {sdk: 'xros', os: 'xros1.0', suffix: ''},
  'xros-simulator': {sdk: 'xrsimulator', os: 'xros1.0', suffix: '-simulator'},
};

/**
 * Derives stub slices matching an existing (binary) xcframework's slice set,
 * so a headers-only sidecar resolves for every platform the binary does.
 */
function stubSlicesFromXcframework(
  xcfwPath /*: string */,
) /*: Array<StubSlice> */ {
  let plist;
  try {
    plist = JSON.parse(
      execFileSync('plutil', [
        '-convert',
        'json',
        '-o',
        '-',
        path.join(xcfwPath, 'Info.plist'),
      ]).toString(),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `headers-xcframework: failed to parse Info.plist of ${xcfwPath}: ${message}`,
    );
  }
  return plist.AvailableLibraries.map(lib => {
    const key =
      lib.SupportedPlatformVariant != null
        ? `${lib.SupportedPlatform}-${lib.SupportedPlatformVariant}`
        : lib.SupportedPlatform;
    const recipe = PLATFORM_STUB_RECIPES[key];
    if (recipe == null) {
      throw new Error(
        `headers-xcframework: no stub recipe for slice '${key}' of ` +
          `${xcfwPath}. Add it to PLATFORM_STUB_RECIPES.`,
      );
    }
    return {
      name: key,
      sdk: recipe.sdk,
      targets: lib.SupportedArchitectures.map(
        a => `${a}-apple-${recipe.os}${recipe.suffix}`,
      ),
    };
  });
}

/**
 * Composes `<name>.xcframework` under `outDir` from an already-populated
 * Headers stage dir: one stub static archive per slice, then
 * `xcodebuild -create-xcframework` pairing every archive with the stage.
 * The caller owns (and cleans) the stage dir.
 */
function composeHeadersOnlyXcframework(
  outDir /*: string */,
  name /*: string */,
  stage /*: string */,
  slices /*: Array<StubSlice> */,
) /*: string */ {
  const work = fs.mkdtempSync(path.join(outDir, '.stub-work-'));
  // try/finally so an xcrun/xcodebuild failure mid-compose doesn't leave the
  // .stub-work-* staging dir behind in outDir.
  try {
    fs.writeFileSync(
      path.join(work, 'stub.c'),
      `// ${name} is headers-only; this stub satisfies xcframework tooling.\n` +
        `static int ${name}Stub __attribute__((unused)) = 0;\n`,
    );
    const libs = slices.map(slice => {
      const sdkPath = execFileSync('xcrun', [
        '--sdk',
        slice.sdk,
        '--show-sdk-path',
      ])
        .toString()
        .trim();
      const thins = slice.targets.map((t, i) => {
        const obj = path.join(work, `stub-${slice.name}-${i}.o`);
        execFileSync('xcrun', [
          'clang',
          '-c',
          '-target',
          t,
          '-isysroot',
          sdkPath,
          path.join(work, 'stub.c'),
          '-o',
          obj,
        ]);
        const lib = path.join(work, `stub-${slice.name}-${i}.a`);
        execFileSync('xcrun', ['libtool', '-static', '-o', lib, obj], {
          stdio: ['ignore', 'pipe', 'ignore'],
        });
        return lib;
      });
      const outLib = path.join(work, `lib${name}-${slice.name}.a`);
      if (thins.length === 1) {
        fs.copyFileSync(thins[0], outLib);
      } else {
        execFileSync('xcrun', ['lipo', '-create', ...thins, '-output', outLib]);
      }
      return outLib;
    });

    const outXcfw = path.join(outDir, `${name}.xcframework`);
    fs.rmSync(outXcfw, {recursive: true, force: true});
    const xcframeworkArgs = ['-create-xcframework'];
    for (const l of libs) {
      xcframeworkArgs.push('-library', l, '-headers', stage);
    }
    xcframeworkArgs.push('-output', outXcfw);
    execFileSync('xcodebuild', xcframeworkArgs, {stdio: 'pipe'});
    return outXcfw;
  } finally {
    fs.rmSync(work, {recursive: true, force: true});
  }
}

const DEPS_HEADERS_XCFRAMEWORK_NAME = 'ReactNativeDependenciesHeaders';

/**
 * Builds ReactNativeDependenciesHeaders.xcframework: the headers-only sidecar
 * serving the third-party deps namespaces (folly/glog/boost/fmt/
 * double-conversion/fast_float/SocketRocket). The binary
 * ReactNativeDependencies.xcframework is FRAMEWORK-type, so its root Headers/
 * dir is invisible to SwiftPM — this LIBRARY-type sidecar is what makes the
 * deps headers auto-served, keeping ReactNativeHeaders pure-RN.
 *
 * Set-equality with `namespaces` (headers-spec.js DEPS_NAMESPACES) is
 * enforced fail-closed in BOTH directions: a declared namespace missing from
 * `depsHeaders` would ship a silently-broken sidecar; an undeclared dir means
 * a new third-party dep was added without a spec decision.
 */
function buildDepsHeadersXcframework(
  outDir /*: string */,
  depsHeaders /*: string */,
  namespaces /*: Array<string> */,
  slices /*: Array<StubSlice> */,
) /*: string */ {
  const found = fs
    .readdirSync(depsHeaders, {withFileTypes: true})
    .filter(e => e.isDirectory())
    .map(e => String(e.name));
  const missing = namespaces.filter(ns => !found.includes(ns));
  const undeclared = found.filter(d => !namespaces.includes(d));
  if (missing.length > 0 || undeclared.length > 0) {
    throw new Error(
      `headers-xcframework: deps namespaces out of sync with the spec.\n` +
        (missing.length > 0
          ? `  missing from ${depsHeaders}: ${missing.join(', ')}\n`
          : '') +
        (undeclared.length > 0
          ? `  undeclared in DEPS_NAMESPACES (headers-spec.js): ${undeclared.join(', ')}\n`
          : '') +
        `Declare new deps deliberately — the sidecar and the spec must agree.`,
    );
  }

  const stage = fs.mkdtempSync(path.join(outDir, '.deps-headers-stage-'));
  // try/finally so a cp/compose failure doesn't leave the .deps-headers-stage-*
  // dir behind in outDir (= third-party/ for the deps path).
  let outXcfw;
  try {
    for (const ns of namespaces) {
      execFileSync('/bin/cp', [
        CP_FLAGS,
        path.join(depsHeaders, ns),
        path.join(stage, ns),
      ]);
    }
    outXcfw = composeHeadersOnlyXcframework(
      outDir,
      DEPS_HEADERS_XCFRAMEWORK_NAME,
      stage,
      slices,
    );
  } finally {
    fs.rmSync(stage, {recursive: true, force: true});
  }
  console.log(
    `headers-xcframework: ${DEPS_HEADERS_XCFRAMEWORK_NAME}.xcframework ` +
      `(${slices.map(s => s.name).join(', ')}) -> ${outXcfw} ` +
      `(namespaces: ${namespaces.join(', ')})`,
  );
  return outXcfw;
}

module.exports = {
  CATALYST_STUB_SLICE,
  DEFAULT_STUB_SLICES,
  DEPS_HEADERS_XCFRAMEWORK_NAME,
  buildDepsHeadersXcframework,
  composeHeadersOnlyXcframework,
  stubSlicesFromXcframework,
};

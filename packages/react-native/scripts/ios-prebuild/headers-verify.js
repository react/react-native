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
 * Headers gate — verifies the composed prebuilt header layout at GENERATOR
 * time, so consumer-facing regressions fail the prebuild instead of a
 * downstream (rn-tester / Expo / community) build. Three stages:
 *
 *  1. INCLUDE HEALTH (no artifact needed): every shipped header's
 *     notShipped / unresolved / quotedNotShipped includes are ratcheted
 *     against a committed baseline (headers-include-baseline.json). A NEW
 *     offender fails; a resolved one is reported so the baseline can shrink.
 *     Update intentionally with --update-baseline.
 *  2. STRUCTURAL: the composed artifact's module maps / umbrellas are
 *     byte-identical to what the current spec renders, and the R9 private
 *     headers + deps namespaces are physically present.
 *  3. COMPILE (simulator SDK, syntax-only):
 *     a. An ObjC TU that __has_include-asserts the R9/R10 surfaces, then
 *        imports <React/RCTBridge.h> under -fmodules (precompiling the React
 *        module = compiling EVERY umbrella header + the R9 modular member),
 *        one header from every R5 namespace module (precompiling each), and
 *        the R10 per-namespace umbrella.
 *     b. A privileged-consumer ObjC++ TU (the Expo shape): textually imports
 *        every R9 textual Fabric header against ReactNativeHeaders.
 *     c. A Swift TU: `import React` + `RCTBridge.moduleRegistry` — the Expo
 *        Swift case, proving the R9 modular header is module-visible.
 *
 * Usage:
 *   node scripts/ios-prebuild/headers-verify.js [--flavor Debug|Release]
 *        [--artifacts <dir>] [--skip-compile] [--update-baseline]
 */

const {computeInventory} = require('./headers-inventory');
const {
  planFromInventory,
  renderNamespaceModuleMap,
  renderReactModuleMap,
  renderUmbrellaHeader,
} = require('./headers-spec');
const {execFileSync} = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

/*:: import type {HeadersSpecPlan} from './headers-spec'; */

const RN_ROOT = path.join(__dirname, '..', '..');
const BASELINE_PATH = path.join(__dirname, 'headers-include-baseline.json');

// Mirrors the folly compiler flags RN itself builds with (helpers.rb).
const FOLLY_DEFINES = [
  '-DFOLLY_MOBILE=1',
  '-DFOLLY_USE_LIBCPP=1',
  '-DFOLLY_CFG_NO_COROUTINES=1',
  '-DFOLLY_HAVE_CLOCK_GETTIME=1',
];
const SIM_TARGET = 'arm64-apple-ios15.0-simulator';

function log(msg /*: string */) {
  console.log(`[headers-verify] ${msg}`);
}

// ---------------------------------------------------------------------------
// Stage 1 — include health ratchet
// ---------------------------------------------------------------------------

/**
 * Flattens an inventory's include-health offenders to stable, sorted strings:
 * "<category> <naturalPath> -> <token>".
 */
function collectIncludeHealth(inventory /*: any */) /*: Array<string> */ {
  const out = [];
  for (const h of inventory.headers) {
    for (const t of h.includes.notShipped) {
      out.push(`notShipped ${h.naturalPath} -> ${t}`);
    }
    for (const t of h.includes.unresolved) {
      out.push(`unresolved ${h.naturalPath} -> ${t}`);
    }
    for (const t of h.includes.quotedNotShipped) {
      out.push(`quotedNotShipped ${h.naturalPath} -> ${t}`);
    }
  }
  return out.sort();
}

/**
 * Ratchet compare. New offenders (not in baseline) are failures; baseline
 * entries no longer present are reported so the baseline can shrink.
 */
function diffAgainstBaseline(
  current /*: Array<string> */,
  baseline /*: Array<string> */,
) /*: {newOffenders: Array<string>, resolved: Array<string>} */ {
  const base = new Set(baseline);
  const cur = new Set(current);
  return {
    newOffenders: current.filter(x => !base.has(x)),
    resolved: baseline.filter(x => !cur.has(x)),
  };
}

function verifyIncludeHealth(
  inventory /*: any */,
  updateBaseline /*: boolean */,
) /*: void */ {
  const current = collectIncludeHealth(inventory);
  if (updateBaseline) {
    fs.writeFileSync(BASELINE_PATH, JSON.stringify(current, null, 2) + '\n');
    log(`include-health baseline updated (${current.length} entries).`);
    return;
  }
  if (!fs.existsSync(BASELINE_PATH)) {
    throw new Error(
      `include-health baseline missing at ${BASELINE_PATH}. ` +
        `Generate it with --update-baseline.`,
    );
  }
  const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
  const {newOffenders, resolved} = diffAgainstBaseline(current, baseline);
  if (resolved.length > 0) {
    log(
      `include-health: ${resolved.length} baseline entr(ies) resolved — ` +
        `shrink the baseline with --update-baseline:\n  ${resolved.join('\n  ')}`,
    );
  }
  if (newOffenders.length > 0) {
    throw new Error(
      `include-health ratchet: ${newOffenders.length} NEW unresolvable ` +
        `include(s) in shipped headers (work in source builds via pod header ` +
        `maps, break the packaged layout):\n  ${newOffenders.join('\n  ')}\n` +
        `Fix the include (ship the target header / guard it), or — only if ` +
        `knowingly acceptable — add it to the baseline with --update-baseline.`,
    );
  }
  log(`include-health: OK (${current.length} baselined, 0 new).`);
}

// ---------------------------------------------------------------------------
// Stage 2 — structural checks against the composed artifact
// ---------------------------------------------------------------------------

function findSimSlice(
  xcfwPath /*: string */,
  probe /*: string */,
) /*: string */ {
  const slices = fs
    .readdirSync(xcfwPath)
    .filter(
      d =>
        d.includes('simulator') && fs.existsSync(path.join(xcfwPath, d, probe)),
    );
  if (slices.length === 0) {
    throw new Error(`No simulator slice with ${probe} under ${xcfwPath}`);
  }
  return path.join(xcfwPath, slices[0]);
}

function assertFileEquals(
  filePath /*: string */,
  expected /*: string */,
  what /*: string */,
) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${what} missing: ${filePath}`);
  }
  const actual = fs.readFileSync(filePath, 'utf8');
  if (actual !== expected) {
    throw new Error(
      `${what} does not match the current spec render: ${filePath}\n` +
        `The artifact is stale or was composed from a different tree — ` +
        `recompose (node scripts/ios-prebuild -c) and re-verify.`,
    );
  }
}

function verifyStructural(
  plan /*: HeadersSpecPlan */,
  artifactsDir /*: string */,
) /*: {reactSlice: string, rnhHeaders: string} */ {
  const reactSlice = findSimSlice(
    path.join(artifactsDir, 'React.xcframework'),
    'React.framework',
  );
  const fwk = path.join(reactSlice, 'React.framework');
  assertFileEquals(
    path.join(fwk, 'Modules', 'module.modulemap'),
    renderReactModuleMap(plan.privateReactHeaders),
    'React module map',
  );
  assertFileEquals(
    path.join(fwk, 'Headers', 'React-umbrella.h'),
    renderUmbrellaHeader(plan.umbrella),
    'React umbrella header',
  );
  for (const name of [
    ...plan.privateReactHeaders.modular,
    ...plan.privateReactHeaders.textual,
  ]) {
    if (!fs.existsSync(path.join(fwk, 'Headers', name))) {
      throw new Error(`R9 private header missing from artifact: ${name}`);
    }
  }

  const rnhSlice = findSimSlice(
    path.join(artifactsDir, 'ReactNativeHeaders.xcframework'),
    'Headers',
  );
  const rnhHeaders = path.join(rnhSlice, 'Headers');
  assertFileEquals(
    path.join(rnhHeaders, 'module.modulemap'),
    renderNamespaceModuleMap(plan.namespaceModules),
    'ReactNativeHeaders module map',
  );
  for (const u of plan.namespaceUmbrellas) {
    assertFileEquals(
      path.join(rnhHeaders, u.relPath),
      u.content,
      `R10 umbrella ${u.relPath}`,
    );
  }
  // ReactNativeHeaders is PURE-RN: every deps namespace must stay ABSENT.
  // They ship in the ReactNativeDependenciesHeaders sidecar (one physical
  // home per namespace) — relocated copies collide with the real pods' own
  // headers (SocketRocket / Expo use_frameworks regression, 2026-07-03).
  for (const ns of plan.depsNamespaces) {
    if (fs.existsSync(path.join(rnhHeaders, ns))) {
      throw new Error(
        `deps namespace '${ns}' found in ReactNativeHeaders — it must NOT be ` +
          `relocated (it ships in ReactNativeDependenciesHeaders; textual ` +
          `copies collide with the real pods' headers).`,
      );
    }
  }
  log('structural: OK (module maps + umbrellas byte-match the spec render).');
  return {reactSlice, rnhHeaders};
}

// ---------------------------------------------------------------------------
// Stage 3 — compile gates
// ---------------------------------------------------------------------------

/** ObjC TU: __has_include asserts + React module + every namespace module. */
function renderObjcFixture(plan /*: HeadersSpecPlan */) /*: string */ {
  const lines = [];
  for (const name of [
    ...plan.privateReactHeaders.modular,
    ...plan.privateReactHeaders.textual,
  ]) {
    lines.push(
      `#if !__has_include(<React/${name}>)`,
      `#error "R9 private header not servable: <React/${name}>"`,
      `#endif`,
    );
  }
  for (const u of plan.namespaceUmbrellas) {
    lines.push(
      `#if !__has_include(<${u.relPath}>)`,
      `#error "R10 umbrella not servable: <${u.relPath}>"`,
      `#endif`,
    );
  }
  // Precompiles the React framework module (every umbrella header + the R9
  // modular member compile as module members).
  lines.push('#import <React/RCTBridge.h>');
  for (const name of plan.privateReactHeaders.modular) {
    lines.push(`#import <React/${name}>`);
  }
  // One header per R5 namespace module precompiles the whole module.
  for (const ns of Object.keys(plan.namespaceModules).sort()) {
    lines.push(`#import <${plan.namespaceModules[ns][0]}>`);
  }
  for (const u of plan.namespaceUmbrellas) {
    lines.push(`#import <${u.relPath}>`);
  }
  return lines.join('\n') + '\n';
}

/** Privileged-consumer ObjC++ TU (Expo shape): the R9 textual surface. */
function renderPrivilegedFixture(plan /*: HeadersSpecPlan */) /*: string */ {
  return (
    plan.privateReactHeaders.textual
      .map(name => `#import <React/${name}>`)
      .join('\n') + '\n'
  );
}

/** Swift fixture: the Expo Swift private-API case. */
function renderSwiftFixture() /*: string */ {
  return `import React
func _headersVerifyProbe(_ bridge: RCTBridge) {
  // RCTBridge.moduleRegistry is declared in RCTBridge+Private.h (an R9
  // modular member) — visible through \`import React\` iff R9 holds.
  _ = bridge.moduleRegistry
}
`;
}

function xcrun(args /*: Array<string> */, what /*: string */) {
  try {
    execFileSync('xcrun', args, {stdio: ['ignore', 'pipe', 'pipe']});
  } catch (e) {
    const stderr = e.stderr != null ? String(e.stderr) : String(e);
    throw new Error(`${what} FAILED:\n${stderr}`);
  }
}

function runCompileGates(
  plan /*: HeadersSpecPlan */,
  reactSlice /*: string */,
  rnhHeaders /*: string */,
  depsHeaders /*: string */,
) /*: void */ {
  const sdk = execFileSync(
    'xcrun',
    ['--sdk', 'iphonesimulator', '--show-sdk-path'],
    {encoding: 'utf8'},
  ).trim();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'headers-verify-'));
  try {
    // ReactNativeHeaders is pure-RN, so the deps headers (folly/glog/... —
    // reached textually from RN's public headers) come from the deps
    // artifact's Headers dir, exactly as consumers get them from the
    // ReactNativeDependencies pod / ReactNativeDependenciesHeaders sidecar.
    const common = [
      '-fsyntax-only',
      '-target',
      SIM_TARGET,
      '-isysroot',
      sdk,
      '-F',
      reactSlice,
      '-I',
      rnhHeaders,
      '-I',
      depsHeaders,
    ];

    const objc = path.join(tmp, 'gate-modules.m');
    fs.writeFileSync(objc, renderObjcFixture(plan));
    xcrun(
      [
        'clang',
        '-x',
        'objective-c',
        '-fobjc-arc',
        '-fmodules',
        `-fmodules-cache-path=${path.join(tmp, 'mc')}`,
        ...common,
        objc,
      ],
      'ObjC module gate (React module + namespace modules + R10 umbrella)',
    );
    log(
      `compile: React module + ${Object.keys(plan.namespaceModules).length} ` +
        `namespace modules precompile OK.`,
    );

    const objcxx = path.join(tmp, 'gate-privileged.mm');
    fs.writeFileSync(objcxx, renderPrivilegedFixture(plan));
    xcrun(
      [
        'clang++',
        '-x',
        'objective-c++',
        '-std=c++20',
        '-fobjc-arc',
        ...FOLLY_DEFINES,
        '-Wno-comma',
        '-Wno-shorten-64-to-32',
        ...common,
        objcxx,
      ],
      'Privileged-consumer gate (R9 textual Fabric headers)',
    );
    log('compile: privileged-consumer (Expo-shape) ObjC++ fixture OK.');

    const swift = path.join(tmp, 'gate-swift.swift');
    fs.writeFileSync(swift, renderSwiftFixture());
    xcrun(
      [
        'swiftc',
        '-typecheck',
        '-sdk',
        sdk,
        '-target',
        SIM_TARGET,
        '-module-cache-path',
        path.join(tmp, 'mc-swift'),
        '-F',
        reactSlice,
        '-I',
        rnhHeaders,
        '-I',
        depsHeaders,
        swift,
      ],
      'Swift gate (import React + RCTBridge.moduleRegistry)',
    );
    log('compile: Swift moduleRegistry fixture OK.');
  } finally {
    fs.rmSync(tmp, {recursive: true, force: true});
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv /*: Array<string> */) /*: {
  flavor: string,
  artifacts: ?string,
  skipCompile: boolean,
  updateBaseline: boolean,
} */ {
  let flavor = 'Debug';
  let artifacts /*: ?string */ = null;
  let skipCompile = false;
  let updateBaseline = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--flavor') {
      flavor = argv[++i];
    } else if (argv[i] === '--artifacts') {
      artifacts = argv[++i];
    } else if (argv[i] === '--skip-compile') {
      skipCompile = true;
    } else if (argv[i] === '--update-baseline') {
      updateBaseline = true;
    }
  }
  return {flavor, artifacts, skipCompile, updateBaseline};
}

function main(argv /*:: ?: Array<string> */) /*: void */ {
  const args = parseArgs(argv ?? process.argv.slice(2));
  const inventory = computeInventory(RN_ROOT);
  const plan = planFromInventory(inventory, RN_ROOT);
  if (plan.collisions.length > 0) {
    throw new Error(`R8 collisions:\n  ${plan.collisions.join('\n  ')}`);
  }

  verifyIncludeHealth(inventory, args.updateBaseline);
  if (args.updateBaseline) {
    return;
  }

  const artifactsDir =
    args.artifacts ??
    path.join(RN_ROOT, '.build', 'output', 'xcframeworks', args.flavor);
  if (!fs.existsSync(artifactsDir)) {
    throw new Error(
      `No composed artifacts at ${artifactsDir} — run the compose first ` +
        `(node scripts/ios-prebuild -c -f ${args.flavor}).`,
    );
  }
  const {reactSlice, rnhHeaders} = verifyStructural(plan, artifactsDir);

  if (args.skipCompile) {
    log('compile gates skipped (--skip-compile).');
  } else {
    // ReactNativeHeaders is pure-RN — the compile gates additionally need the
    // deps headers, served from the staged deps artifact (the same content
    // the ReactNativeDependenciesHeaders sidecar ships).
    const depsHeaders = path.join(
      RN_ROOT,
      'third-party',
      'ReactNativeDependencies.xcframework',
      'Headers',
    );
    if (!fs.existsSync(depsHeaders)) {
      throw new Error(
        `deps headers missing at ${depsHeaders} — stage the ` +
          `ReactNativeDependencies artifact before running the compile gates ` +
          `(or pass --skip-compile).`,
      );
    }
    runCompileGates(plan, reactSlice, rnhHeaders, depsHeaders);
  }
  log('ALL GATES PASSED.');
}

if (require.main === module) {
  main();
}

module.exports = {
  collectIncludeHealth,
  diffAgainstBaseline,
  renderObjcFixture,
  renderPrivilegedFixture,
  main,
};

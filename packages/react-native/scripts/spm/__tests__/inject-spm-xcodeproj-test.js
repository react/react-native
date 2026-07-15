/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

const {
  injectSpmIntoPbxproj,
  planInjection,
} = require('../generate-spm-xcodeproj');
const fs = require('fs');
const path = require('path');

const PLAIN = fs.readFileSync(
  path.join(__dirname, '__fixtures__', 'plain-app.pbxproj'),
  'utf8',
);

// Derive a CocoaPods-integrated variant by layering a Pods xcconfig onto the
// app target's Debug config (what makes in-place injection refuse).
const PODS = PLAIN.replace(
  'AA0000000000000000000901 /* Debug */ = {\n\t\t\tisa = XCBuildConfiguration;\n\t\t\tbuildSettings = {',
  'AA0000000000000000000901 /* Debug */ = {\n\t\t\tisa = XCBuildConfiguration;\n\t\t\tbaseConfigurationReference = BB0000000000000000000001 /* Pods-MyApp.debug.xcconfig */;\n\t\t\tbuildSettings = {',
);

const RN_PATH = '../node_modules/react-native';

// Absolute, mirroring resolveHermesCliPathSetting (a `..`-relative path through
// a symlinked react-native would resolve to the wrong dir at build time).
const TEST_HERMES_CLI_PATH =
  '/abs/node_modules/hermes-compiler/hermesc/osx-bin/hermesc';
const TEST_FRAMEWORKS = [
  {
    id: 'react',
    frameworkName: 'React',
    executableName: 'React',
    artifactRelativePath: 'React.xcframework',
    slices: [
      {
        sdk: 'iphoneos*',
        platform: 'ios',
        variant: null,
        architectures: ['arm64'],
        libraryIdentifier: 'ios-arm64',
        libraryPath: 'React.framework',
        binaryPath: 'React.framework/React',
      },
      {
        sdk: 'iphonesimulator*',
        platform: 'ios',
        variant: 'simulator',
        architectures: ['arm64', 'x86_64'],
        libraryIdentifier: 'ios-arm64_x86_64-simulator',
        libraryPath: 'React.framework',
        binaryPath: 'React.framework/React',
      },
    ],
  },
];

function inject(
  text,
  remote = null,
  hermesCliPath = TEST_HERMES_CLI_PATH,
  generatedSources = [],
) {
  const plan = planInjection(text, {});
  expect(plan.ok).toBe(true);
  return injectSpmIntoPbxproj(
    text,
    {
      rootUuid: plan.rootUuid,
      targetUuid: plan.target.uuid,
      configUuids: plan.configUuids,
      frameworksPhaseUuid: plan.frameworksPhaseUuid,
      sourcesPhaseUuid: plan.sourcesPhaseUuid,
    },
    RN_PATH,
    remote,
    hermesCliPath,
    generatedSources,
    TEST_FRAMEWORKS,
  );
}

// A normalized generated source under the app root (the Expo case:
// build/generated/autolinking/expo/ExpoModulesProvider.swift). `path` is
// SRCROOT-relative, so `sourceTree = SOURCE_ROOT`.
const PROVIDER_SOURCE = {
  path: 'build/generated/autolinking/expo/ExpoModulesProvider.swift',
  name: 'ExpoModulesProvider.swift',
  sourceTree: 'SOURCE_ROOT',
  fileType: 'sourcecode.swift',
};

// A simple balanced-delimiter check (the injected file must stay well-formed).
function isBalanced(text) {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      i++;
      while (i < text.length && text[i] !== '"') {
        if (text[i] === '\\') i++;
        i++;
      }
    } else if (c === '{' || c === '(') {
      depth++;
    } else if (c === '}' || c === ')') {
      depth--;
    }
  }
  return depth === 0;
}

describe('planInjection', () => {
  it('accepts a plain SPM-only app and resolves its anchors', () => {
    const plan = planInjection(PLAIN, {});
    expect(plan.ok).toBe(true);
    expect(plan.target.name).toBe('MyApp');
    expect(plan.configUuids).toHaveLength(2); // Debug + Release
    expect(plan.frameworksPhaseUuid).toMatch(/^[0-9A-Fa-f]{24}$/);
    // Also resolves the Sources phase (generated sources compile into it).
    expect(plan.sourcesPhaseUuid).toMatch(/^[0-9A-Fa-f]{24}$/);
  });

  it('refuses a CocoaPods-integrated target (fail-closed for fallback)', () => {
    const plan = planInjection(PODS, {});
    expect(plan.ok).toBe(false);
    expect(plan.reason).toMatch(/CocoaPods/);
  });

  it('refuses when there is no application target', () => {
    const noApp = PLAIN.replace(
      '"com.apple.product-type.application"',
      '"com.apple.product-type.framework"',
    );
    const plan = planInjection(noApp, {});
    expect(plan.ok).toBe(false);
    expect(plan.reason).toMatch(/no application target/);
  });
});

describe('injectSpmIntoPbxproj — Tier 1 (SPM graph)', () => {
  it('adds the local package references and product dependencies', () => {
    const {text} = inject(PLAIN);
    expect(text).toContain('/* Begin XCLocalSwiftPackageReference section */');
    expect(text).toContain('relativePath = build/xcframeworks');
    expect(text).toContain('relativePath = build/generated/autolinking');
    expect(text).toContain('relativePath = build/generated/ios');
    // One XCSwiftPackageProductDependency per product (6).
    expect(text.match(/isa = XCSwiftPackageProductDependency;/g)).toHaveLength(
      6,
    );
    expect(text).toContain('productName = ReactHeaders');
    expect(text).not.toContain('productName = ReactNative;');
    expect(text).toContain('productName = Autolinked');
    expect(text).toContain('productName = ReactCodegen');
  });

  it('wires packageReferences onto the project and product deps onto the target', () => {
    const {text} = inject(PLAIN);
    expect(text).toMatch(/packageReferences = \(/);
    expect(text).toMatch(/packageProductDependencies = \(/);
    // Product build files land in the Frameworks phase.
    expect(text).toContain('ReactHeaders in Frameworks');
  });

  it('uses remote package references in remote mode', () => {
    const remote = {
      url: 'https://github.com/facebook/react-native',
      version: '0.87.0',
      identity: 'react-native',
    };
    const {text} = inject(PLAIN, remote);
    expect(text).toContain('/* Begin XCRemoteSwiftPackageReference section */');
    expect(text).toContain(
      'repositoryURL = "https://github.com/facebook/react-native"',
    );
    // build/xcframeworks is NOT referenced locally in remote mode.
    expect(text).not.toContain('relativePath = build/xcframeworks');
    // The app's generated-code packages stay local.
    expect(text).toContain('relativePath = build/generated/ios');
  });
});

describe('injectSpmIntoPbxproj — Tier 2 (build settings + phase)', () => {
  it('merges React build settings into BOTH build configurations', () => {
    const {text} = inject(PLAIN);
    expect(text.match(/-ObjC/g)).toHaveLength(2);
    expect(text.match(/REACT_NATIVE_PATH = /g)).toHaveLength(2);
    expect(text).not.toContain('fmodule-map-file=');
    expect(text).toContain('build/generated/autolinking/headers');
    expect(text.match(/CLANG_CXX_LANGUAGE_STANDARD = "c\+\+20"/g)).toHaveLength(
      2,
    );
    // HERMES_CLI_PATH points react-native-xcode.sh at the hermes-compiler npm
    // package (no hermes-engine pod under SPM), injected into both configs.
    expect(text.match(/HERMES_CLI_PATH = /g)).toHaveLength(2);
    expect(text).toContain(TEST_HERMES_CLI_PATH);
    expect(text).toContain('RN_SPM_FLAVOR = debug');
    expect(text).toContain('RN_SPM_FLAVOR = release');
    expect(text).toContain('RN_SPM_REACT_BINARY[sdk=iphoneos*]');
    expect(text).toContain('RN_SPM_REACT_BINARY[sdk=iphonesimulator*]');
    expect(text).toContain('$(RN_SPM_REACT_BINARY)');
  });

  it('omits HERMES_CLI_PATH when hermesc could not be resolved', () => {
    const {text} = inject(PLAIN, null, null);
    expect(text).not.toContain('HERMES_CLI_PATH');
  });

  it('prepends the Sync SPM Autolinking build phase', () => {
    const {text} = inject(PLAIN);
    expect(text).toContain('Sync SPM Autolinking');
    expect(text).toContain('npx react-native spm sync');
    // It runs before Sources.
    const syncIdx = text.indexOf('Sync SPM Autolinking */,');
    const sourcesIdx = text.indexOf('Sources */,');
    expect(syncIdx).toBeGreaterThan(-1);
    expect(syncIdx).toBeLessThan(sourcesIdx);
  });

  it('adds one generated embed phase immediately after Frameworks', () => {
    const {text} = inject(PLAIN);
    expect(text).not.toContain('Fix SPM Embedded Flavor');
    const bp = text.slice(text.indexOf('buildPhases = ('));
    const arr = bp.slice(0, bp.indexOf(');'));
    const comments = [...arr.matchAll(/\/\* ([^*]+) \*\//g)].map(m => m[1]);
    expect(comments[0]).toBe('Sync SPM Autolinking'); // prepended, first
    expect(comments.indexOf('Embed React Native Flavored Frameworks')).toBe(
      comments.indexOf('Frameworks') + 1,
    );
    expect(text).toContain('$(SRCROOT)/build/xcframeworks/.artifact-stamp');
    expect(text).toContain('$(RN_SPM_REACT_FRAMEWORK)');
    expect(text).toContain(
      '$(TARGET_BUILD_DIR)/$(FRAMEWORKS_FOLDER_PATH)/React.framework',
    );
  });
});

describe('injectSpmIntoPbxproj — Tier 3 (plugin generated sources)', () => {
  it('wires a manifest entry into the app target (ref + build file + Sources + group)', () => {
    const {text, generatedSourceUuids} = inject(PLAIN, null, null, [
      PROVIDER_SOURCE,
    ]);
    const [fileRefUuid, buildFileUuid] =
      generatedSourceUuids[PROVIDER_SOURCE.path];
    expect(fileRefUuid).toMatch(/^[0-9A-F]{24}$/);
    expect(buildFileUuid).toMatch(/^[0-9A-F]{24}$/);

    // PBXFileReference with the SRCROOT-relative path + SOURCE_ROOT tree.
    expect(text).toContain(`${fileRefUuid} /* ExpoModulesProvider.swift */`);
    expect(text).toContain('lastKnownFileType = sourcecode.swift');
    expect(text).toContain(`path = ${PROVIDER_SOURCE.path};`);
    expect(text).toContain('sourceTree = SOURCE_ROOT;');

    // PBXBuildFile → the file ref, and a Sources-phase membership.
    expect(text).toContain(
      `${buildFileUuid} /* ExpoModulesProvider.swift in Sources */ = {isa = PBXBuildFile; fileRef = ${fileRefUuid} /* ExpoModulesProvider.swift */;};`,
    );
    // The build file is a member of the Sources phase (compiled into the app).
    const sourcesPhase = text.slice(
      text.indexOf('/* Begin PBXSourcesBuildPhase section */'),
    );
    expect(sourcesPhase.slice(0, sourcesPhase.indexOf('/* End'))).toContain(
      `${buildFileUuid} /* ExpoModulesProvider.swift in Sources */,`,
    );

    // The single "SPM Generated Sources" group, parented and holding the ref.
    expect(text).toContain('/* SPM Generated Sources */ = {');
    expect(text).toContain('isa = PBXGroup;');
    const groupBlock = text.slice(
      text.indexOf('/* SPM Generated Sources */ = {'),
    );
    expect(groupBlock.slice(0, groupBlock.indexOf('};'))).toContain(
      `${fileRefUuid} /* ExpoModulesProvider.swift */,`,
    );
    // File ref + build file UUIDs are tracked for deinit.
    const {injectedUuids} = inject(PLAIN, null, null, [PROVIDER_SOURCE]);
    expect(injectedUuids).toEqual(
      expect.arrayContaining([fileRefUuid, buildFileUuid]),
    );
    expect(isBalanced(text)).toBe(true);
  });

  it('is idempotent with generated sources — a second run is byte-for-byte identical', () => {
    const first = inject(PLAIN, null, null, [PROVIDER_SOURCE]).text;
    const plan = planInjection(first, {});
    const second = injectSpmIntoPbxproj(
      first,
      {
        rootUuid: plan.rootUuid,
        targetUuid: plan.target.uuid,
        configUuids: plan.configUuids,
        frameworksPhaseUuid: plan.frameworksPhaseUuid,
        sourcesPhaseUuid: plan.sourcesPhaseUuid,
      },
      RN_PATH,
      null,
      null,
      [PROVIDER_SOURCE],
      TEST_FRAMEWORKS,
    ).text;
    expect(second).toBe(first);
  });

  it('stores an out-of-tree source as an absolute <absolute> reference', () => {
    const abs = {
      path: '/opt/generated/OtherProvider.swift',
      name: 'OtherProvider.swift',
      sourceTree: '"<absolute>"',
      fileType: 'sourcecode.swift',
    };
    const {text} = inject(PLAIN, null, null, [abs]);
    expect(text).toContain('path = /opt/generated/OtherProvider.swift;');
    expect(text).toContain('sourceTree = "<absolute>";');
  });

  it('logs loudly and skips wiring when the target has no Sources phase', () => {
    const noSources = PLAIN.replace(
      /\/\* Begin PBXSourcesBuildPhase section \*\/[\s\S]*?\/\* End PBXSourcesBuildPhase section \*\/\n\n/,
      '',
    );
    const plan = planInjection(noSources, {});
    expect(plan.ok).toBe(true);
    expect(plan.sourcesPhaseUuid).toBeNull();

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const {text, generatedSourceUuids} = injectSpmIntoPbxproj(
      noSources,
      {
        rootUuid: plan.rootUuid,
        targetUuid: plan.target.uuid,
        configUuids: plan.configUuids,
        frameworksPhaseUuid: plan.frameworksPhaseUuid,
        sourcesPhaseUuid: plan.sourcesPhaseUuid,
      },
      RN_PATH,
      null,
      null,
      [PROVIDER_SOURCE],
      TEST_FRAMEWORKS,
    );
    const logged = spy.mock.calls.map(c => c[0]).join('\n');
    spy.mockRestore();

    expect(logged).toMatch(/no Sources build phase/);
    // No generated source wired, but the SPM graph injection still happened.
    expect(generatedSourceUuids).toEqual({});
    expect(text).not.toContain('SPM Generated Sources');
    expect(text).toContain('productName = ReactHeaders');
  });
});

describe('injectSpmIntoPbxproj — invariants', () => {
  it('produces a balanced (well-formed) pbxproj', () => {
    const {text} = inject(PLAIN);
    expect(isBalanced(PLAIN)).toBe(true);
    expect(isBalanced(text)).toBe(true);
  });

  it('is idempotent — a second injection is a byte-for-byte no-op', () => {
    const first = inject(PLAIN).text;
    const plan = planInjection(first, {});
    const second = injectSpmIntoPbxproj(
      first,
      {
        rootUuid: plan.rootUuid,
        targetUuid: plan.target.uuid,
        configUuids: plan.configUuids,
        frameworksPhaseUuid: plan.frameworksPhaseUuid,
      },
      RN_PATH,
      null,
      null,
      [],
      TEST_FRAMEWORKS,
    ).text;
    expect(second).toBe(first);
  });

  it('keeps the diff small — only adds lines, never removes original ones', () => {
    const {text} = inject(PLAIN);
    // Every original line is preserved verbatim (purely additive splice).
    for (const line of PLAIN.split('\n')) {
      if (line.trim() === '') continue;
      expect(text).toContain(line);
    }
    const added = text.split('\n').length - PLAIN.split('\n').length;
    // Sanity bound: the complete SPM graph + conditional settings + phases is
    // still a compact additive transform.
    expect(added).toBeGreaterThan(0);
    expect(added).toBeLessThan(220);
  });

  it('refreshes a stale shellScript on re-injection', () => {
    const first = inject(PLAIN).text;
    // Simulate an earlier run whose generated script has since changed (e.g.
    // fixed dispatch logic) by corrupting a substring of the baked-in script.
    const stale = first.replace(
      'npx react-native spm sync',
      'STALE_OLD_SYNC_COMMAND',
    );
    expect(stale).not.toBe(first);
    const plan = planInjection(stale, {});
    const second = injectSpmIntoPbxproj(
      stale,
      {
        rootUuid: plan.rootUuid,
        targetUuid: plan.target.uuid,
        configUuids: plan.configUuids,
        frameworksPhaseUuid: plan.frameworksPhaseUuid,
      },
      RN_PATH,
      null,
      null,
      [],
      TEST_FRAMEWORKS,
    ).text;
    // The stale marker is gone and the current script is restored.
    expect(second).not.toContain('STALE_OLD_SYNC_COMMAND');
    expect(second).toContain('npx react-native spm sync');
    expect(second).toBe(first);
  });

  it('namespaces injected UUIDs by the host project root (collision-safe, stable)', () => {
    const {injectedUuids} = inject(PLAIN);
    // All injected UUIDs are valid 24-hex and none collide with the originals.
    const originalUuids = new Set(PLAIN.match(/[0-9A-Fa-f]{24}/g));
    for (const u of injectedUuids) {
      expect(u).toMatch(/^[0-9A-F]{24}$/);
      expect(originalUuids.has(u)).toBe(false);
    }
    // Deterministic across runs.
    expect(inject(PLAIN).injectedUuids).toEqual(injectedUuids);
  });
});

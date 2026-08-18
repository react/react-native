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
  buildPhaseOrder,
  injectSpmIntoPbxproj,
  planInjection,
} = require('../generate-spm-xcodeproj');
const {isBalanced} = require('./pbxproj-oracles');
const fs = require('node:fs');
const path = require('node:path');

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

// The app target's two XCBuildConfiguration UUIDs in the fixture.
const APP_DEBUG_CONFIG = 'AA0000000000000000000901';
const APP_RELEASE_CONFIG = 'AA00000000000000000000A2';

const DEBUG_CONFIG_HEAD =
  'AA0000000000000000000901 /* Debug */ = {\n\t\t\tisa = XCBuildConfiguration;\n\t\t\tbuildSettings = {';

// Seed the app target's Debug config with a SWIFT_ACTIVE_COMPILATION_CONDITIONS
// the user already had, in the scalar form Xcode and the app template write.
function withDebugCondition(text, value) {
  return text.replace(
    DEBUG_CONFIG_HEAD,
    `${DEBUG_CONFIG_HEAD}\n\t\t\t\tSWIFT_ACTIVE_COMPILATION_CONDITIONS = ${value};`,
  );
}

// One XCBuildConfiguration's buildSettings dict, by config UUID. Build settings
// hold only scalars and `( … )` arrays, so the first `};` closes the dict.
function buildSettingsOf(text, configUuid) {
  const open = text.indexOf(
    'buildSettings = {',
    text.indexOf(`${configUuid} /*`),
  );
  return text.slice(open, text.indexOf('};', open));
}
// Derive a variant whose app-target configs already carry HEADER_SEARCH_PATHS,
// set to any valid pbxproj value: a plain scalar (which injection promotes to an
// array) or an array injection appends to.
function withHeaderSearchPaths(value) {
  return PLAIN.replaceAll(
    'PRODUCT_BUNDLE_IDENTIFIER = com.example.MyApp;',
    `HEADER_SEARCH_PATHS = ${value};\n\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = com.example.MyApp;`,
  );
}

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
  scriptPhases = [],
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
    scriptPhases,
  );
}

// The app target's buildPhases members, in order, by trailing comment.
function buildPhaseComments(text) {
  const bp = text.slice(text.indexOf('buildPhases = ('));
  const arr = bp.slice(0, bp.indexOf(');'));
  return [...arr.matchAll(/\/\* ([^*]+) \*\//g)].map(m => m[1]);
}

// Move the "Sync SPM Autolinking" membership line below the Sources one — what a
// user dragging the phase down in Xcode produces. RN never re-seats its own sync
// phase, so the move sticks.
function dragSyncBelowSources(text) {
  const memberLine = comment =>
    new RegExp(`\\n[\\t ]*[0-9A-Fa-f]{24} /\\* ${comment} \\*/,`).exec(text)[0];
  const sync = memberLine('Sync SPM Autolinking');
  const sources = memberLine('Sources');
  return text.replace(sync, '').replace(sources, sources + sync);
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

  // Swift's `#if DEBUG` — which AppDelegate.swift's bundleURL() uses to pick the
  // Metro URL — is gated by this setting alone. CocoaPods injects it at `pod
  // install`; an SPM app has to get it here or a Debug build looks for a
  // main.jsbundle it never built.
  it('sets SWIFT_ACTIVE_COMPILATION_CONDITIONS = DEBUG on the debug config only', () => {
    const {text} = inject(PLAIN);
    const debugSettings = buildSettingsOf(text, APP_DEBUG_CONFIG);
    expect(debugSettings).toMatch(
      /SWIFT_ACTIVE_COMPILATION_CONDITIONS = \(\s*"\$\(inherited\)",\s*DEBUG,\s*\)/,
    );
    expect(buildSettingsOf(text, APP_RELEASE_CONFIG)).not.toContain(
      'SWIFT_ACTIVE_COMPILATION_CONDITIONS',
    );
  });

  it('leaves a config that already sets DEBUG (scalar form) untouched', () => {
    const {text} = inject(withDebugCondition(PLAIN, '"$(inherited) DEBUG"'));
    // Not promoted to an array, not re-appended — DEBUG is already there.
    expect(buildSettingsOf(text, APP_DEBUG_CONFIG)).toContain(
      'SWIFT_ACTIVE_COMPILATION_CONDITIONS = "$(inherited) DEBUG";',
    );
    expect(text.match(/\bDEBUG\b/g)).toHaveLength(1);
  });

  it("adds DEBUG alongside the user's own compilation conditions", () => {
    const {text} = inject(
      withDebugCondition(PLAIN, '"$(inherited) MY_DEBUG_UI"'),
    );
    // MY_DEBUG_UI must not be mistaken for DEBUG by a substring check.
    const debugSettings = buildSettingsOf(text, APP_DEBUG_CONFIG);
    expect(debugSettings).toContain('"$(inherited) MY_DEBUG_UI"');
    expect(debugSettings).toMatch(/^\s*DEBUG,$/m);
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

  it.each([
    [
      '"$(inherited)"',
      ['"$(inherited)"', '"$(SRCROOT)/build/generated/autolinking/headers"'],
    ],
    [
      '"$(inherited) $(SRCROOT)/vendor/include"',
      [
        '"$(inherited)"',
        '"$(inherited) $(SRCROOT)/vendor/include"',
        '"$(SRCROOT)/build/generated/autolinking/headers"',
      ],
    ],
  ])(
    'promotes a pre-existing HEADER_SEARCH_PATHS scalar (%s) to an array, keeping its value and one $(inherited)',
    (scalar, expectedMembers) => {
      const {text} = inject(withHeaderSearchPaths(scalar));
      const arrays = [
        ...text.matchAll(/HEADER_SEARCH_PATHS = \(\n([\s\S]*?)\t+\);/g),
      ].map(m =>
        m[1]
          .split('\n')
          .map(line => line.trim().replace(/,$/, ''))
          .filter(member => member.length > 0),
      );
      // Both app-target configs (Debug + Release).
      expect(arrays).toEqual([expectedMembers, expectedMembers]);
    },
  );

  it('appends to a pre-existing ONE-LINE HEADER_SEARCH_PATHS array in place', () => {
    const {text} = inject(withHeaderSearchPaths('("$(inherited)", )'));
    expect(isBalanced(text)).toBe(true);
    const arrays = [
      ...text.matchAll(/HEADER_SEARCH_PATHS = \(([^\n]*)\);/g),
    ].map(m => m[1]);
    // Both app-target configs, each keeping the one-line shape it was written in.
    expect(arrays).toEqual(
      Array(2).fill(
        '"$(inherited)", "$(SRCROOT)/build/generated/autolinking/headers", ',
      ),
    );
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

// A generated source's `name` (its basename) is plugin-derived, so it reaches
// the file reference's, the build file's and the Sources-membership comments
// under the same rules as a script-phase name: normalized, never raw. A `{`
// there makes findObjectByUuid read the next object's body as this one's, and a
// `,` makes removeArrayMembersByUuid chew the wrong line — corruption with no
// error. [label, filename, expected comment]
const HOSTILE_SOURCE_NAMES = [
  ['an opening brace', 'Weird{Name}.swift', 'Weird Name .swift'],
  ['a comma', 'Weird,Name.swift', 'Weird Name.swift'],
];

describe.each(HOSTILE_SOURCE_NAMES)(
  'injectSpmIntoPbxproj — a generated source whose filename contains %s',
  (_label, fileName, comment) => {
    const src = {
      path: `build/generated/autolinking/expo/${fileName}`,
      name: fileName,
      sourceTree: 'SOURCE_ROOT',
      fileType: 'sourcecode.swift',
    };

    it('normalizes all three comments and keeps the project balanced', () => {
      const {text, generatedSourceUuids} = inject(PLAIN, null, null, [src]);
      const [fileRefUuid, buildFileUuid] = generatedSourceUuids[src.path];
      expect(definitionComment(text, fileRefUuid)).toBe(comment);
      expect(definitionComment(text, buildFileUuid)).toBe(
        `${comment} in Sources`,
      );
      expect(text).toContain(`fileRef = ${fileRefUuid} /* ${comment} */;`);
      const sourcesPhase = text.slice(
        text.indexOf('/* Begin PBXSourcesBuildPhase section */'),
      );
      expect(sourcesPhase.slice(0, sourcesPhase.indexOf('/* End'))).toContain(
        `${buildFileUuid} /* ${comment} in Sources */,`,
      );
      expect(isBalanced(text)).toBe(true);
    });

    it('leaves the path and name VALUES verbatim', () => {
      const {text} = inject(PLAIN, null, null, [src]);
      expect(text).toContain(`path = "${src.path}";`);
      expect(text).toContain(`name = "${fileName}";`);
    });

    it('re-injects byte-identically', () => {
      const first = inject(PLAIN, null, null, [src]).text;
      expect(inject(first, null, null, [src]).text).toBe(first);
    });
  },
);

describe('injectSpmIntoPbxproj — an ordinary generated-source name', () => {
  // Normalization must be invisible for every real-world filename, or every
  // already-injected project churns on its next sync.
  it('reaches all three comments byte-unchanged', () => {
    const {text, generatedSourceUuids} = inject(PLAIN, null, null, [
      PROVIDER_SOURCE,
    ]);
    const [fileRefUuid, buildFileUuid] =
      generatedSourceUuids[PROVIDER_SOURCE.path];
    expect(definitionComment(text, fileRefUuid)).toBe(
      'ExpoModulesProvider.swift',
    );
    expect(definitionComment(text, buildFileUuid)).toBe(
      'ExpoModulesProvider.swift in Sources',
    );
    expect(text).toContain(
      `fileRef = ${fileRefUuid} /* ExpoModulesProvider.swift */;`,
    );
  });
});

// Plugin-declared build phases (the expo-constants case: write app.config into
// the app bundle after the JS bundle phase).
const APP_CONFIG_PHASE = {
  id: 'expo-constants.app-config',
  name: 'Bundle Expo app.config',
  script: 'echo ok > app.config',
  position: 'end',
  inputPaths: ['$(SRCROOT)/app.json'],
  outputPaths: ['$(TARGET_BUILD_DIR)/EXConstants.bundle/app.config'],
};

describe('injectSpmIntoPbxproj — Tier 4 (plugin script phases)', () => {
  it('adds one shell script phase carrying the declared name, script and paths', () => {
    const {text, scriptPhaseUuids} = inject(
      PLAIN,
      null,
      null,
      [],
      [APP_CONFIG_PHASE],
    );
    // Two RN-owned phases (sync + embed) plus this one.
    expect(text.match(/isa = PBXShellScriptBuildPhase;/g)).toHaveLength(3);

    const uuid = scriptPhaseUuids[APP_CONFIG_PHASE.id];
    expect(uuid).toMatch(/^[0-9A-F]{24}$/);
    expect(text).toContain(`${uuid} /* Bundle Expo app.config */ = {`);
    expect(text).toContain('name = "Bundle Expo app.config";');
    expect(text).toContain('shellScript = "echo ok > app.config";');
    expect(text).toContain('\t\t\t\t"$(SRCROOT)/app.json",\n');
    expect(text).toContain(
      '\t\t\t\t"$(TARGET_BUILD_DIR)/EXConstants.bundle/app.config",\n',
    );
    // Recorded so `deinit` reverses it and `update` reconciles it.
    const {injectedUuids} = inject(PLAIN, null, null, [], [APP_CONFIG_PHASE]);
    expect(injectedUuids).toEqual(expect.arrayContaining([uuid]));
    expect(isBalanced(text)).toBe(true);
  });

  it('emits an unquoted alwaysOutOfDate = 1 only when the phase asks for it', () => {
    const withFlag = inject(
      PLAIN,
      null,
      null,
      [],
      [{...APP_CONFIG_PHASE, alwaysOutOfDate: true}],
    ).text;
    expect(withFlag).toContain('alwaysOutOfDate = 1;');
    // Xcode writes it immediately after `isa` — match that to avoid churn.
    expect(withFlag).toContain(
      'isa = PBXShellScriptBuildPhase;\n\t\t\talwaysOutOfDate = 1;',
    );

    for (const phase of [
      APP_CONFIG_PHASE,
      {...APP_CONFIG_PHASE, alwaysOutOfDate: false},
    ]) {
      expect(inject(PLAIN, null, null, [], [phase]).text).not.toContain(
        'alwaysOutOfDate',
      );
    }
  });

  it("places an 'end' phase last in buildPhases", () => {
    const {text} = inject(PLAIN, null, null, [], [APP_CONFIG_PHASE]);
    const comments = buildPhaseComments(text);
    expect(comments[comments.length - 1]).toBe('Bundle Expo app.config');
    // NOTE: the fixture target has only Sources/Frameworks/Resources — it has
    // no "Bundle React Native code and images" phase, so the real requirement
    // (an 'end' phase runs AFTER the JS bundle phase) is not asserted here.
    // End-of-array position is what delivers it on a real app target.
  });

  it("places a 'beforeCompile' phase after the sync phase and before Sources", () => {
    const {text} = inject(
      PLAIN,
      null,
      null,
      [],
      [{...APP_CONFIG_PHASE, position: 'beforeCompile'}],
    );
    const comments = buildPhaseComments(text);
    expect(comments.slice(0, 3)).toEqual([
      'Sync SPM Autolinking',
      'Bundle Expo app.config',
      'Sources',
    ]);
  });

  it('preserves declared order within each position', () => {
    const phase = (id, position) => ({
      ...APP_CONFIG_PHASE,
      id,
      name: id,
      position,
    });
    const {text} = inject(
      PLAIN,
      null,
      null,
      [],
      [
        phase('pre-a', 'beforeCompile'),
        phase('post-a', 'end'),
        phase('pre-b', 'beforeCompile'),
        phase('post-b', 'end'),
      ],
    );
    const comments = buildPhaseComments(text);
    expect(comments.slice(0, 4)).toEqual([
      'Sync SPM Autolinking',
      'pre-a',
      'pre-b',
      'Sources',
    ]);
    expect(comments.slice(-2)).toEqual(['post-a', 'post-b']);
  });

  it('is idempotent with script phases — a second run is byte-for-byte identical', () => {
    const phases = [
      {...APP_CONFIG_PHASE, alwaysOutOfDate: true},
      {...APP_CONFIG_PHASE, id: 'other', name: 'Other', position: 'end'},
    ];
    const first = inject(PLAIN, null, null, [], phases).text;
    const second = inject(first, null, null, [], phases).text;
    expect(second).toBe(first);
  });

  it('escapes a script carrying quotes, a backslash, a newline and a $(VAR)', () => {
    const script =
      'echo "a\\b" > "$(DERIVED_FILE_DIR)/x"\nprintf \'%s\\n\' done';
    const phases = [{...APP_CONFIG_PHASE, script}];
    const {text} = inject(PLAIN, null, null, [], phases);
    expect(text).toContain(
      'shellScript = "echo \\"a\\\\b\\" > \\"$(DERIVED_FILE_DIR)/x\\"\\nprintf \'%s\\\\n\' done";',
    );
    expect(isBalanced(text)).toBe(true);
    expect(inject(text, null, null, [], phases).text).toBe(text);
  });

  it('quotes a name containing a double quote in the field, dropping it from the comments', () => {
    const phases = [{...APP_CONFIG_PHASE, name: 'Bundle "app.config"'}];
    const {text, scriptPhaseUuids} = inject(PLAIN, null, null, [], phases);
    const uuid = scriptPhaseUuids[APP_CONFIG_PHASE.id];
    expect(text).toContain('name = "Bundle \\"app.config\\"";');
    expect(text).toContain(`${uuid} /* Bundle app.config */ = {`);
    expect(buildPhaseComments(text)).toContain('Bundle app.config');
    expect(isBalanced(text)).toBe(true);
    expect(inject(text, null, null, [], phases).text).toBe(text);
  });

  it('a rename refreshes the name field AND both /* … */ comments', () => {
    const first = inject(
      PLAIN,
      null,
      null,
      [],
      [{...APP_CONFIG_PHASE, name: 'Write App Config'}],
    ).text;
    const renamed = inject(
      first,
      null,
      null,
      [],
      [{...APP_CONFIG_PHASE, name: 'Write Expo Config'}],
    ).text;
    // Xcode normalizes comments on its next write, so a stale one is a spurious
    // diff in the user's repo: nothing but the name may differ.
    expect(renamed).not.toContain('Write App Config');
    expect(renamed).toBe(
      first.split('Write App Config').join('Write Expo Config'),
    );
  });
});

// A declared `position` — and the declared order of two phases sharing one — is
// enforced on every sync, not only at first injection. The membership lines are
// rewritten ONLY when the actual order differs, which is what keeps an unchanged
// sync byte-identical.
describe('injectSpmIntoPbxproj — repositioning plugin script phases', () => {
  const phase = (id, position) => ({
    ...APP_CONFIG_PHASE,
    id,
    name: id,
    position,
  });

  it('moves a phase from end to beforeCompile and back again', () => {
    const atEnd = inject(PLAIN, null, null, [], [phase('a', 'end')]).text;
    expect(buildPhaseComments(atEnd).slice(-1)).toEqual(['a']);

    const beforeCompile = [phase('a', 'beforeCompile')];
    const moved = inject(atEnd, null, null, [], beforeCompile).text;
    expect(buildPhaseComments(moved).slice(0, 3)).toEqual([
      'Sync SPM Autolinking',
      'a',
      'Sources',
    ]);
    expect(isBalanced(moved)).toBe(true);
    // Re-syncing the now-matching declaration changes nothing.
    expect(inject(moved, null, null, [], beforeCompile).text).toBe(moved);

    // And back: a move is a pure reordering of the membership lines.
    expect(inject(moved, null, null, [], [phase('a', 'end')]).text).toBe(atEnd);
  });

  it('reorders two phases sharing a position when their declared order swaps', () => {
    const inOrder = inject(
      PLAIN,
      null,
      null,
      [],
      [phase('b1', 'beforeCompile'), phase('b2', 'beforeCompile')],
    ).text;
    expect(buildPhaseComments(inOrder).slice(0, 4)).toEqual([
      'Sync SPM Autolinking',
      'b1',
      'b2',
      'Sources',
    ]);

    const swapped = inject(
      inOrder,
      null,
      null,
      [],
      [phase('b2', 'beforeCompile'), phase('b1', 'beforeCompile')],
    ).text;
    expect(buildPhaseComments(swapped).slice(0, 4)).toEqual([
      'Sync SPM Autolinking',
      'b2',
      'b1',
      'Sources',
    ]);
  });

  it('reseats only the phase whose position changed', () => {
    const declared = [
      phase('a', 'beforeCompile'),
      phase('b', 'beforeCompile'),
      phase('c', 'beforeCompile'),
    ];
    const first = inject(PLAIN, null, null, [], declared).text;
    expect(buildPhaseComments(first).slice(0, 5)).toEqual([
      'Sync SPM Autolinking',
      'a',
      'b',
      'c',
      'Sources',
    ]);

    const {text} = inject(
      first,
      null,
      null,
      [],
      [declared[0], {...declared[1], position: 'end'}, declared[2]],
    );
    const comments = buildPhaseComments(text);
    expect(comments.slice(0, 4)).toEqual([
      'Sync SPM Autolinking',
      'a',
      'c',
      'Sources',
    ]);
    expect(comments[comments.length - 1]).toBe('b');
  });

  it('moves a phase the user dragged in Xcode back to its declared position', () => {
    const phases = [phase('a', 'end')];
    const {text: first, scriptPhaseUuids} = inject(
      PLAIN,
      null,
      null,
      [],
      phases,
    );
    const memberLine = `\n\t\t\t\t${scriptPhaseUuids.a} /* a */,`;
    expect(first).toContain(memberLine);
    const dragged = first
      .replace(memberLine, '')
      .replace('buildPhases = (\n', `buildPhases = (${memberLine}\n`);
    expect(buildPhaseComments(dragged)[0]).toBe('a');

    expect(inject(dragged, null, null, [], phases).text).toBe(first);
  });

  // RN never re-seats its own sync phase, so a user who drags it below Sources
  // keeps it there — but `beforeCompile` means before Sources, which is the
  // guarantee the plugin contract makes.
  it('seats a beforeCompile phase before Sources even when the sync phase sits below it', () => {
    const dragged = dragSyncBelowSources(inject(PLAIN).text);
    expect(buildPhaseComments(dragged).slice(0, 2)).toEqual([
      'Sources',
      'Sync SPM Autolinking',
    ]);

    const declared = [phase('a', 'beforeCompile')];
    const {text} = inject(dragged, null, null, [], declared);
    expect(buildPhaseComments(text)).toEqual([
      'a',
      'Sources',
      'Sync SPM Autolinking',
      'Frameworks',
      'Embed React Native Flavored Frameworks',
      'Resources',
    ]);
    expect(isBalanced(text)).toBe(true);
    expect(inject(text, null, null, [], declared).text).toBe(text);
  });

  it('falls back to the sync phase as the anchor when the target has no Sources phase', () => {
    const noSources = PLAIN.replace(
      /\/\* Begin PBXSourcesBuildPhase section \*\/[\s\S]*?\/\* End PBXSourcesBuildPhase section \*\/\n\n/,
      '',
    );
    const {text} = inject(
      noSources,
      null,
      null,
      [],
      [phase('a', 'beforeCompile')],
    );
    expect(buildPhaseComments(text).slice(0, 2)).toEqual([
      'Sync SPM Autolinking',
      'a',
    ]);
  });

  it.each([
    ['one end phase', [phase('a', 'end')]],
    ['one beforeCompile phase', [phase('a', 'beforeCompile')]],
    [
      'two beforeCompile phases',
      [phase('b1', 'beforeCompile'), phase('b2', 'beforeCompile')],
    ],
    ['two end phases', [phase('e1', 'end'), phase('e2', 'end')]],
    [
      'mixed positions',
      [
        phase('b1', 'beforeCompile'),
        phase('e1', 'end'),
        phase('b2', 'beforeCompile'),
        phase('e2', 'end'),
      ],
    ],
  ])('re-syncs %s byte-identically', (_label, phases) => {
    const first = inject(PLAIN, null, null, [], phases).text;
    expect(inject(first, null, null, [], phases).text).toBe(first);
  });
});

// The membership order drives every re-seating decision, so it must list the
// members and nothing else: a `/* … */` comment is arbitrary plugin-supplied
// text, and a phase NAMED like a UUID would otherwise read as an extra member —
// making the actual order permanently disagree with the declared one.
describe('buildPhaseOrder', () => {
  const PHANTOM = 'ABCDEF012345678901234567';

  it('lists only line-leading UUIDs, never one inside a comment', () => {
    const {text} = inject(
      PLAIN,
      null,
      null,
      [],
      [{...APP_CONFIG_PHASE, name: PHANTOM}],
    );
    const plan = planInjection(text, {});
    const order = buildPhaseOrder(text, plan.target);

    expect(text).toContain(`/* ${PHANTOM} */,`);
    expect(order).not.toContain(PHANTOM);
    expect(order).toHaveLength(buildPhaseComments(text).length);
  });

  it('seats a phase named like a UUID normally, and re-syncs byte-identically', () => {
    const phases = [
      {...APP_CONFIG_PHASE, name: PHANTOM, position: 'beforeCompile'},
    ];
    const first = inject(PLAIN, null, null, [], phases).text;
    expect(buildPhaseComments(first).slice(0, 3)).toEqual([
      'Sync SPM Autolinking',
      PHANTOM,
      'Sources',
    ]);
    expect(inject(first, null, null, [], phases).text).toBe(first);
  });
});

// The trailing comment beside a UUID on its object-definition line.
function definitionComment(text, uuid) {
  const m = new RegExp(`\\n\\t*${uuid}(?: /\\* (.*?) \\*/)? = \\{`).exec(text);
  return m == null ? null : (m[1] ?? null);
}

// A pbxproj `/* … */` comment is cosmetic — Xcode regenerates it from the
// object's own `name` field — so a plugin-supplied name is NORMALIZED for the
// comment and kept verbatim (quoted) in the field. Nothing a scanner could read
// as structure may survive into a comment: findObjectByUuid takes the first `{`
// after the UUID as the object's body, and removeArrayMembersByUuid identifies a
// member line by its trailing comma — so a `{` or a `,` in a comment splices
// fields into the wrong object, or makes `deinit` chew the section header.
// [label, name, expected comment]
const HOSTILE_NAMES = [
  ['an opening brace', 'Bundle { app', 'Bundle app'],
  ['a closing brace', 'Bundle } app', 'Bundle app'],
  ['an opening paren', 'Bundle (app', 'Bundle app'],
  ['a closing paren', 'Bundle app)', 'Bundle app'],
  ['a comma', 'A , B', 'A B'],
  ['a semicolon', 'A; B', 'A B'],
  ['an equals sign', 'name = {', 'name'],
  ['a comment terminator', 'Bad */ = { x', 'Bad x'],
  ['a comment opener', 'Bad /* x', 'Bad x'],
  ['a bare asterisk', 'A * B', 'A B'],
  ['a bare slash', 'Copy A/B', 'Copy A B'],
  ['an unbalanced double quote', 'He said "hi', 'He said hi'],
  ['a balanced double-quote pair', 'Bundle "app.config"', 'Bundle app.config'],
  ['a tab', 'A\tB', 'A B'],
  ['non-ASCII characters', 'Générer la config 📦', 'Générer la config 📦'],
  ['300 characters', `Bundle ${'x'.repeat(300)}`, `Bundle ${'x'.repeat(300)}`],
  // Nothing printable survives normalization — fall back to the phase id,
  // itself normalized (see the scoped-id describe below).
  ['only structural characters', '*/*', APP_CONFIG_PHASE.id],
];

describe.each(HOSTILE_NAMES)(
  'injectSpmIntoPbxproj — a plugin phase name containing %s',
  (_label, name, comment) => {
    const phases = [{...APP_CONFIG_PHASE, name}];

    it('normalizes it in both comments and keeps the project balanced', () => {
      const {text, scriptPhaseUuids} = inject(PLAIN, null, null, [], phases);
      const uuid = scriptPhaseUuids[APP_CONFIG_PHASE.id];
      expect(definitionComment(text, uuid)).toBe(comment);
      expect(buildPhaseComments(text)).toContain(comment);
      expect(isBalanced(text)).toBe(true);
      // The phase object is intact — the sanity check that nothing was spliced
      // into a neighbouring object through a comment-borne `{`.
      expect(text).toContain(`${uuid} /* ${comment} */ = {`);
      expect(text.match(/isa = PBXShellScriptBuildPhase;/g)).toHaveLength(3);
    });

    it('re-injects byte-identically', () => {
      const first = inject(PLAIN, null, null, [], phases).text;
      expect(inject(first, null, null, [], phases).text).toBe(first);
    });
  },
);

// A scoped npm package name is the natural stable id for a package-owned phase
// (`@expo/log-box` is a named consumer), so `@` and `/` are in the id charset.
// The id is also the comment's fallback, and it is normalized there exactly like
// a name — the comment must not depend on which characters the charset admits.
describe('injectSpmIntoPbxproj — a scoped-npm-name phase id', () => {
  const SCOPED = {...APP_CONFIG_PHASE, id: '@expo/log-box'};

  it('keys the phase UUID on the scoped id verbatim', () => {
    const {scriptPhaseUuids} = inject(PLAIN, null, null, [], [SCOPED]);
    expect(Object.keys(scriptPhaseUuids)).toEqual(['@expo/log-box']);
    expect(scriptPhaseUuids['@expo/log-box']).toMatch(/^[0-9A-F]{24}$/);
  });

  it('normalizes the id when nothing in the name survives', () => {
    const phases = [{...SCOPED, name: '*/*'}];
    const {text, scriptPhaseUuids} = inject(PLAIN, null, null, [], phases);
    const uuid = scriptPhaseUuids['@expo/log-box'];
    expect(definitionComment(text, uuid)).toBe('@expo log-box');
    expect(buildPhaseComments(text)).toContain('@expo log-box');
    expect(text).toContain(`${uuid} /* @expo log-box */ = {`);
    expect(isBalanced(text)).toBe(true);
    expect(inject(text, null, null, [], phases).text).toBe(text);
  });

  it('writes no comment at all when neither the name nor the id survives', () => {
    const phases = [{...APP_CONFIG_PHASE, id: '//', name: '*/*'}];
    const {text, scriptPhaseUuids} = inject(PLAIN, null, null, [], phases);
    const uuid = scriptPhaseUuids['//'];
    expect(definitionComment(text, uuid)).toBe(null);
    expect(text).toContain(`${uuid} = {`);
    expect(text).toMatch(new RegExp(`\\n\\t+${uuid},`));
    expect(isBalanced(text)).toBe(true);
    expect(inject(text, null, null, [], phases).text).toBe(text);
  });
});

describe('injectSpmIntoPbxproj — phase name field vs. comment', () => {
  it('keeps the raw name in the escaped `name` field Xcode displays', () => {
    const cases = [
      ['Bundle "app.config"', 'name = "Bundle \\"app.config\\"";'],
      ['A\tB', 'name = "A\\tB";'],
      ['name = {', 'name = "name = {";'],
      ['*/*', 'name = "*/*";'],
    ];
    for (const [name, expected] of cases) {
      const {text} = inject(
        PLAIN,
        null,
        null,
        [],
        [{...APP_CONFIG_PHASE, name}],
      );
      expect(text).toContain(expected);
    }
  });

  it("leaves React Native's own two phase comments byte-identical", () => {
    const {text} = inject(PLAIN, null, null, [], [APP_CONFIG_PHASE]);
    for (const label of [
      'Sync SPM Autolinking',
      'Embed React Native Flavored Frameworks',
    ]) {
      expect(text).toMatch(
        new RegExp(`\\n\\t\\t[0-9A-F]{24} /\\* ${label} \\*/ = \\{`),
      );
      expect(text).toMatch(
        new RegExp(`\\n\\t\\t\\t\\t[0-9A-F]{24} /\\* ${label} \\*/,`),
      );
    }
  });

  // Xcode's own comment convention for a package reference carries quotes and
  // slashes. Normalizing those would rewrite bytes Xcode itself produces, so
  // only untrusted labels go through commentSafe.
  it("preserves Xcode's comment convention for the package references", () => {
    const {text} = inject(
      PLAIN,
      null,
      null,
      [PROVIDER_SOURCE],
      [APP_CONFIG_PHASE],
    );
    expect(text).toContain(
      '/* XCLocalSwiftPackageReference "build/generated/autolinking" */',
    );
    expect(text).toContain('/* ExpoModulesProvider.swift in Sources */');
    expect(text).toContain('/* ReactHeaders in Frameworks */');
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

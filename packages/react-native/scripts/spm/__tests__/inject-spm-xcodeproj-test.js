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
  buildSyncAutolinkingScript,
  generateReactNativeXcconfig,
  injectSpmIntoPbxproj,
  planInjection,
} = require('../generate-spm-xcodeproj');
const {findField, findObjectByUuid, quoteIfNeeded} = require('../spm-pbxproj');
const {isBalanced} = require('./pbxproj-oracles');
const fs = require('node:fs');
const os = require('node:os');
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
// Seed a whole `KEY = value;` field into both app-target configs.
function withAppSetting(field) {
  return PLAIN.replaceAll(
    'PRODUCT_BUNDLE_IDENTIFIER = com.example.MyApp;',
    `${field}\n\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = com.example.MyApp;`,
  );
}

function withHeaderSearchPaths(value) {
  return withAppSetting(`HEADER_SEARCH_PATHS = ${value};`);
}

// The app target's Debug config already based on an xcconfig of the user's own.
const FOREIGN_XCCONFIG = PLAIN.replace(
  DEBUG_CONFIG_HEAD,
  'AA0000000000000000000901 /* Debug */ = {\n\t\t\tisa = XCBuildConfiguration;\n\t\t\tbaseConfigurationReference = CC0000000000000000000001 /* App.xcconfig */;\n\t\t\tbuildSettings = {',
).replace(
  '/* End PBXFileReference section */',
  '\t\tCC0000000000000000000001 /* App.xcconfig */ = {isa = PBXFileReference; lastKnownFileType = text.xcconfig; path = Config/App.xcconfig; sourceTree = "<group>"; };\n/* End PBXFileReference section */',
);

const XCCONFIG_PATH = 'ReactNativeSPM/ReactNativeSPM.xcconfig';
const SYNC_SCRIPT_PATH = 'ReactNativeSPM/Scripts/sync-autolinking.sh';
const EMBED_SCRIPT_PATH = 'ReactNativeSPM/Scripts/embed-flavored-frameworks.sh';

// The raw (still plist-quoted) shellScript value of the phase labelled `label`.
function shellScriptOf(text, label) {
  const uuid = new RegExp(`([0-9A-F]{24}) /\\* ${label} \\*/ = \\{`).exec(
    text,
  )[1];
  return findField(text, findObjectByUuid(text, uuid), 'shellScript').value;
}

const RN_PATH = '../node_modules/react-native';
const RN_PATHS = {fromAppRoot: RN_PATH, fromSrcRoot: RN_PATH};
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
  // Dead positional slot: injectSpmIntoPbxproj no longer takes a hermesCliPath
  // (see the HERMES_CLI_PATH test below). Kept so the call sites below, which
  // pass it as `null`, stay untouched.
  _hermesCliPath = null,
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
    RN_PATHS,
    remote,
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

  // The generated xcconfig sits below the target's own settings, so a list
  // setting the target sets without $(inherited) hides React Native's.
  it.each([
    ['HEADER_SEARCH_PATHS', '"$(SRCROOT)/Vendor"'],
    ['OTHER_LDFLAGS', '(\n\t\t\t\t\t"-lc++",\n\t\t\t\t)'],
    ['FRAMEWORK_SEARCH_PATHS', '""'],
    ['LD_RUNPATH_SEARCH_PATHS', '"@executable_path/Frameworks"'],
  ])('refuses %s set without $(inherited), naming it', (key, value) => {
    const plan = planInjection(withAppSetting(`${key} = ${value};`), {});
    expect(plan.ok).toBe(false);
    expect(plan.reason).toContain(`${key} (Debug, Release)`);
    expect(plan.reason).toContain('$(inherited)');
  });

  it('refuses SWIFT_ACTIVE_COMPILATION_CONDITIONS without $(inherited) on a debug configuration', () => {
    const plan = planInjection(withDebugCondition(PLAIN, 'MY_FLAG'), {});
    expect(plan.ok).toBe(false);
    expect(plan.reason).toContain(
      'SWIFT_ACTIVE_COMPILATION_CONDITIONS (Debug)',
    );
  });

  it('accepts SWIFT_ACTIVE_COMPILATION_CONDITIONS without $(inherited) on a release configuration, which gets none', () => {
    const releaseHead = DEBUG_CONFIG_HEAD.replace(
      'AA0000000000000000000901 /* Debug */',
      'AA00000000000000000000A2 /* Release */',
    );
    const text = PLAIN.replace(
      releaseHead,
      `${releaseHead}\n\t\t\t\tSWIFT_ACTIVE_COMPILATION_CONDITIONS = MY_FLAG;`,
    );
    expect(text).not.toBe(PLAIN);
    expect(planInjection(text, {}).ok).toBe(true);
  });

  it.each([
    ['a scalar', '"$(inherited) $(SRCROOT)/Vendor"'],
    [
      'an array',
      '(\n\t\t\t\t\t"$(inherited)",\n\t\t\t\t\t"$(SRCROOT)/Vendor",\n\t\t\t\t)',
    ],
    ['the brace form', '"${inherited} $(SRCROOT)/Vendor"'],
  ])(
    'accepts a list setting that keeps $(inherited) in %s',
    (_label, value) => {
      expect(planInjection(withHeaderSearchPaths(value), {}).ok).toBe(true);
    },
  );

  it("refuses a configuration already based on the user's own xcconfig", () => {
    const plan = planInjection(FOREIGN_XCCONFIG, {});
    expect(plan.ok).toBe(false);
    expect(plan.reason).toContain('Debug');
    expect(plan.reason).toContain('Config/App.xcconfig');
    expect(plan.reason).toContain('#include');
    expect(plan.reason).toContain(XCCONFIG_PATH);
  });

  it('accepts a project it already based on the generated xcconfig', () => {
    expect(planInjection(inject(PLAIN).text, {}).ok).toBe(true);
  });
});

// FOREIGN_XCCONFIG with the reference inside a `Config` group, the way Xcode
// files an xcconfig dragged into a folder of the navigator.
const FOREIGN_XCCONFIG_IN_GROUP = FOREIGN_XCCONFIG.replace(
  'path = Config/App.xcconfig;',
  'path = App.xcconfig;',
)
  .replace(
    '\t\t\t\tAA00000000000000000000F1 /* Products */,\n',
    '\t\t\t\tAA00000000000000000000F1 /* Products */,\n\t\t\t\tCC0000000000000000000002 /* Config */,\n',
  )
  .replace(
    '/* End PBXGroup section */',
    '\t\tCC0000000000000000000002 /* Config */ = {\n\t\t\tisa = PBXGroup;\n\t\t\tchildren = (\n\t\t\t\tCC0000000000000000000001 /* App.xcconfig */,\n\t\t\t);\n\t\t\tpath = Config;\n\t\t\tsourceTree = "<group>";\n\t\t};\n/* End PBXGroup section */',
  );

describe("planInjection — a configuration based on the user's own xcconfig", () => {
  let roots = [];
  afterEach(() => {
    for (const root of roots) {
      fs.rmSync(root, {recursive: true, force: true});
    }
    roots = [];
  });

  // An app root (== SRCROOT) holding `files`, app-root-relative path → content.
  function appRootWith(files) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-include-'));
    roots.push(root);
    for (const [relPath, content] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(root, relPath)), {recursive: true});
      fs.writeFileSync(path.join(root, relPath), content, 'utf8');
    }
    return root;
  }

  function plan(files, text = FOREIGN_XCCONFIG) {
    const root = appRootWith(files);
    return planInjection(text, {appRoot: root, srcRoot: root});
  }

  const INCLUDES_GENERATED = `#include "../${XCCONFIG_PATH}"\n`;

  it('accepts it when the xcconfig #includes the generated one', () => {
    const result = plan({'Config/App.xcconfig': INCLUDES_GENERATED});
    expect(result.ok).toBe(true);
    expect(result.includedByConfigUuids).toEqual([APP_DEBUG_CONFIG]);
  });

  it('includes no configuration it bases on the generated xcconfig itself', () => {
    expect(planInjection(PLAIN, {}).includedByConfigUuids).toEqual([]);
  });

  it('finds an xcconfig filed under a navigator group', () => {
    expect(
      plan(
        {'Config/App.xcconfig': INCLUDES_GENERATED},
        FOREIGN_XCCONFIG_IN_GROUP,
      ).ok,
    ).toBe(true);
  });

  it('follows #include? chains, each path relative to the file that holds it', () => {
    expect(
      plan({
        'Config/App.xcconfig':
          '// Shared settings\n#include? "Shared/Base.xcconfig"\n',
        'Config/Shared/Base.xcconfig': `#include "../../${XCCONFIG_PATH}"\n`,
      }).ok,
    ).toBe(true);
  });

  it.each([
    [
      'a path relative to the project directory',
      `#include "${XCCONFIG_PATH}"\n`,
    ],
    ['a commented-out include', `// ${INCLUDES_GENERATED}`],
    ['an include of a file that is missing', '#include? "Missing.xcconfig"\n'],
  ])('refuses %s', (_label, content) => {
    expect(plan({'Config/App.xcconfig': content}).ok).toBe(false);
  });

  it('refuses an include cycle that never reaches the generated xcconfig', () => {
    const result = plan({
      'Config/App.xcconfig': '#include "Base.xcconfig"\n',
      'Config/Base.xcconfig': '#include "App.xcconfig"\n',
    });
    expect(result.ok).toBe(false);
  });

  it('still refuses a list setting without $(inherited) on it', () => {
    const result = plan(
      {'Config/App.xcconfig': INCLUDES_GENERATED},
      FOREIGN_XCCONFIG.replaceAll(
        'PRODUCT_BUNDLE_IDENTIFIER = com.example.MyApp;',
        'HEADER_SEARCH_PATHS = /vendor;\n\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = com.example.MyApp;',
      ),
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('HEADER_SEARCH_PATHS (Debug, Release)');
  });

  it('names the exact line to add, relative to the xcconfig that needs it', () => {
    const result = plan({'Config/App.xcconfig': 'MY_SETTING = 1\n'});
    expect(result.ok).toBe(false);
    expect(result.reason).toContain(
      `#include "../${XCCONFIG_PATH}" to Config/App.xcconfig`,
    );
    expect(result.reason).not.toContain('project directory');
  });

  it('says the path is relative to the xcconfig when it cannot find the file', () => {
    const result = plan({});
    expect(result.ok).toBe(false);
    expect(result.reason).toContain(
      `#include ${XCCONFIG_PATH} from Config/App.xcconfig`,
    );
    expect(result.reason).toContain(
      'relative to the folder that holds Config/App.xcconfig',
    );
    expect(result.reason).not.toContain('project directory');
  });

  it("keeps the user's base and records the configuration as including the generated xcconfig", () => {
    const root = appRootWith({'Config/App.xcconfig': INCLUDES_GENERATED});
    const accepted = planInjection(FOREIGN_XCCONFIG, {
      appRoot: root,
      srcRoot: root,
    });
    const {text, xcconfig, generatedFiles} = injectSpmIntoPbxproj(
      FOREIGN_XCCONFIG,
      {
        rootUuid: accepted.rootUuid,
        targetUuid: accepted.target.uuid,
        configUuids: accepted.configUuids,
        includedByConfigUuids: accepted.includedByConfigUuids,
        frameworksPhaseUuid: accepted.frameworksPhaseUuid,
        sourcesPhaseUuid: accepted.sourcesPhaseUuid,
      },
      RN_PATHS,
      null,
      [],
      TEST_FRAMEWORKS,
    );
    const baseOf = configUuid =>
      findField(
        text,
        findObjectByUuid(text, configUuid),
        'baseConfigurationReference',
      )?.value;
    expect(baseOf(APP_DEBUG_CONFIG)).toBe(
      'CC0000000000000000000001 /* App.xcconfig */',
    );
    expect(baseOf(APP_RELEASE_CONFIG)).toBe(
      `${xcconfig.fileRefUuid} /* ReactNativeSPM.xcconfig */`,
    );
    expect(xcconfig.configUuids).toEqual([APP_RELEASE_CONFIG]);
    expect(xcconfig.includedByConfigUuids).toEqual([APP_DEBUG_CONFIG]);
    expect(text).toContain(`path = ${XCCONFIG_PATH};`);
    expect(generatedFiles[XCCONFIG_PATH]).toContain(
      'RN_SPM_FLAVOR[config=Debug] = debug\n',
    );
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
  const PROJECT_DEBUG_CONFIG = 'AA0000000000000000000701';
  const PROJECT_RELEASE_CONFIG = 'AA0000000000000000000801';
  const ALL_CONFIGS = [
    PROJECT_DEBUG_CONFIG,
    PROJECT_RELEASE_CONFIG,
    APP_DEBUG_CONFIG,
    APP_RELEASE_CONFIG,
  ];
  const appSettingsOf = text =>
    [APP_DEBUG_CONFIG, APP_RELEASE_CONFIG].map(config =>
      buildSettingsOf(text, config),
    );
  // React Native installed elsewhere, with `frameworks` in place of the
  // default ones — what a later `spm update` sees.
  const injectRelocated = frameworks => {
    const plan = planInjection(PLAIN, {});
    const relocated = '../../elsewhere/react-native';
    return injectSpmIntoPbxproj(
      PLAIN,
      {
        rootUuid: plan.rootUuid,
        targetUuid: plan.target.uuid,
        configUuids: plan.configUuids,
        frameworksPhaseUuid: plan.frameworksPhaseUuid,
        sourcesPhaseUuid: plan.sourcesPhaseUuid,
      },
      {fromAppRoot: relocated, fromSrcRoot: relocated},
      null,
      [],
      frameworks,
      [],
    );
  };

  // A routine `spm update` must not touch project.pbxproj, so none of these may
  // live in it — they are the ones whose values follow the installed frameworks.
  it('writes no React build setting into any configuration', () => {
    const {text} = inject(PLAIN);
    for (const config of ALL_CONFIGS) {
      const settings = buildSettingsOf(text, config);
      expect(settings).toBe(buildSettingsOf(PLAIN, config));
      expect(settings).not.toMatch(
        /RN_SPM_|OTHER_LDFLAGS|FRAMEWORK_SEARCH_PATHS|HEADER_SEARCH_PATHS|LD_RUNPATH_SEARCH_PATHS|SWIFT_ACTIVE_COMPILATION_CONDITIONS|CLANG_CXX_LANGUAGE_STANDARD|REACT_NATIVE_PATH/,
      );
    }
  });

  it('bases every app configuration on the generated xcconfig, next to isa', () => {
    const {text, injectedUuids, xcconfig} = inject(PLAIN);
    const ref =
      /baseConfigurationReference = ([0-9A-F]{24}) \/\* ReactNativeSPM\.xcconfig \*\/;/.exec(
        text,
      )[1];
    for (const [config, name] of [
      [APP_DEBUG_CONFIG, 'Debug'],
      [APP_RELEASE_CONFIG, 'Release'],
    ]) {
      expect(text).toContain(
        `${config} /* ${name} */ = {\n\t\t\tisa = XCBuildConfiguration;\n` +
          `\t\t\tbaseConfigurationReference = ${ref} /* ReactNativeSPM.xcconfig */;\n` +
          '\t\t\tbuildSettings = {',
      );
    }
    expect(text.match(/baseConfigurationReference = /g)).toHaveLength(2);
    expect(xcconfig.configUuids).toEqual([
      APP_DEBUG_CONFIG,
      APP_RELEASE_CONFIG,
    ]);

    const fileRef = findObjectByUuid(text, ref);
    const field = key => findField(text, fileRef, key)?.value;
    expect(field('isa')).toBe('PBXFileReference');
    expect(field('lastKnownFileType')).toBe('text.xcconfig');
    expect(field('name')).toBe('ReactNativeSPM.xcconfig');
    expect(field('path')).toBe(XCCONFIG_PATH);
    expect(field('sourceTree')).toBe('SOURCE_ROOT');
    expect(injectedUuids).toContain(ref);
    // Visible in the navigator, at the top of the project.
    const mainGroup = findObjectByUuid(text, 'AA00000000000000000000E1');
    expect(findField(text, mainGroup, 'children').value).toContain(
      `${ref} /* ReactNativeSPM.xcconfig */,`,
    );
  });

  it('returns the xcconfig generated for the configurations based on it', () => {
    const {generatedFiles} = inject(PLAIN);
    expect(generatedFiles[XCCONFIG_PATH]).toBe(
      generateReactNativeXcconfig(
        ['Debug', 'Release'],
        RN_PATH,
        TEST_FRAMEWORKS,
      ),
    );
  });

  // An absolute hermesc path is machine-specific, and the app commits its
  // project.pbxproj. react-native-xcode.sh resolves hermesc through
  // react-native's own dependency graph at build time instead.
  it('never writes HERMES_CLI_PATH, into the project or a generated file', () => {
    const {text, generatedFiles} = inject(PLAIN);
    expect(text).not.toContain('HERMES_CLI_PATH');
    for (const content of Object.values(generatedFiles)) {
      expect(content).not.toContain('HERMES_CLI_PATH');
    }
  });

  it.each([
    ['HEADER_SEARCH_PATHS', withHeaderSearchPaths('"$(inherited)"')],
    [
      'HEADER_SEARCH_PATHS',
      withHeaderSearchPaths('(\n\t\t\t\t\t"$(inherited)",\n\t\t\t\t)'),
    ],
    [
      'SWIFT_ACTIVE_COMPILATION_CONDITIONS',
      withDebugCondition(PLAIN, '"$(inherited) MY_DEBUG_UI"'),
    ],
  ])("leaves the configuration's own %s untouched", (_key, before) => {
    expect(appSettingsOf(inject(before).text)).toEqual(appSettingsOf(before));
  });

  // The CocoaPods template anchors REACT_NATIVE_PATH on ${PODS_ROOT}, which
  // resolves empty once CocoaPods is gone, and a target's own value outranks
  // any xcconfig — so it has to leave the project for the xcconfig's to apply.
  it('removes a ${PODS_ROOT}-anchored REACT_NATIVE_PATH so the xcconfig value applies', () => {
    const before = withAppSetting(
      'REACT_NATIVE_PATH = "${PODS_ROOT}/../../node_modules/react-native";',
    );
    const {text, xcconfig, generatedFiles} = inject(before);
    expect(appSettingsOf(text)).toEqual(appSettingsOf(PLAIN));
    expect(xcconfig.removedPodsRootReactNativePath).toBe(true);
    expect(generatedFiles[XCCONFIG_PATH]).toContain(
      `\nREACT_NATIVE_PATH = $(SRCROOT)/${RN_PATH}\n`,
    );
  });

  it("keeps a REACT_NATIVE_PATH of the project's own", () => {
    const before = withAppSetting(
      'REACT_NATIVE_PATH = ../../node_modules/react-native;',
    );
    const {text, xcconfig} = inject(before);
    expect(appSettingsOf(text)).toEqual(appSettingsOf(before));
    expect(xcconfig.removedPodsRootReactNativePath).toBe(false);
  });

  it('prepends the Sync SPM Autolinking build phase', () => {
    const {text} = inject(PLAIN);
    expect(text).toContain('Sync SPM Autolinking');
    // It runs before Sources.
    const syncIdx = text.indexOf('Sync SPM Autolinking */,');
    const sourcesIdx = text.indexOf('Sources */,');
    expect(syncIdx).toBeGreaterThan(-1);
    expect(syncIdx).toBeLessThan(sourcesIdx);
  });

  // The script bodies change whenever React Native's do, so they live in
  // generated files; the phase only carries a wrapper that never changes.
  it.each([
    ['Sync SPM Autolinking', SYNC_SCRIPT_PATH, 'npx react-native spm sync'],
    [
      'Embed React Native Flavored Frameworks',
      EMBED_SCRIPT_PATH,
      'copy_and_sign "${RN_SPM_REACT_FRAMEWORK:-}" "React.framework"',
    ],
  ])('runs the %s script from %s', (label, scriptPath, bodyLine) => {
    const {text, generatedFiles} = inject(PLAIN);
    const wrapper = shellScriptOf(text, label);
    expect(wrapper).toContain(`$SRCROOT/${scriptPath}`);
    expect(wrapper).toContain('spm update');
    expect(text).not.toContain(quoteIfNeeded(bodyLine).slice(1, -1));
    expect(text).not.toContain('set -euo pipefail');
    expect(generatedFiles[scriptPath]).toContain(bodyLine);
  });

  it('keeps the script wrappers identical across React Native versions and frameworks', () => {
    const {text} = inject(PLAIN);
    const other = injectRelocated([]).text;
    for (const label of [
      'Sync SPM Autolinking',
      'Embed React Native Flavored Frameworks',
    ]) {
      expect(shellScriptOf(other, label)).toBe(shellScriptOf(text, label));
    }
  });

  // A routine `spm update` must leave project.pbxproj alone while the
  // frameworks keep their ids and names: slice paths and architectures land
  // only in the generated xcconfig.
  it('produces a byte-identical project.pbxproj across a version bump (path + slice content change)', () => {
    const bumped = TEST_FRAMEWORKS.map(framework => ({
      ...framework,
      slices: framework.slices.map(slice => ({
        ...slice,
        architectures: [...slice.architectures, 'arm64e'],
        libraryIdentifier: `${slice.libraryIdentifier}_arm64e`,
        binaryPath: 'React.framework/Versions/Current/React',
      })),
    }));
    const before = inject(PLAIN);
    const after = injectRelocated(bumped);
    expect(after.generatedFiles[XCCONFIG_PATH]).not.toBe(
      before.generatedFiles[XCCONFIG_PATH],
    );
    expect(after.text).toBe(before.text);
  });

  it('runs every injected shell-script build phase under bash, not /bin/sh', () => {
    // Their bodies start with `set -euo pipefail`, which a non-bash /bin/sh
    // (e.g. dash) rejects at runtime.
    const {text} = inject(PLAIN);
    const phaseCount = text.match(/isa = PBXShellScriptBuildPhase;/g)?.length;
    const bashCount = text.match(/shellPath = \/bin\/bash;/g)?.length;
    expect(phaseCount).toBeGreaterThan(0);
    expect(bashCount).toBe(phaseCount);
  });

  it('upgrades an already-injected phase from /bin/sh to bash on re-run', () => {
    // A project injected before this fix recorded `shellPath = /bin/sh;` on
    // the Sync SPM Autolinking phase. Re-running inject (e.g. `spm update`)
    // must refresh it in place, not just apply bash to newly-created phases.
    const {text: firstText} = inject(PLAIN);
    const downgraded = firstText.replace(
      /shellPath = \/bin\/bash;/g,
      'shellPath = /bin/sh;',
    );
    const {text: secondText} = inject(downgraded);
    expect(secondText).not.toContain('shellPath = /bin/sh;');
    const phaseCount = secondText.match(
      /isa = PBXShellScriptBuildPhase;/g,
    )?.length;
    expect(secondText.match(/shellPath = \/bin\/bash;/g)?.length).toBe(
      phaseCount,
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

  // The phase only runs the script file, so the file has to be an input for
  // Xcode to re-run the phase when the file alone changes.
  it('lists its script file among the embed phase inputs', () => {
    const {text} = inject(PLAIN);
    const uuid =
      /([0-9A-F]{24}) \/\* Embed React Native Flavored Frameworks \*\/ = \{/.exec(
        text,
      )[1];
    expect(
      findField(text, findObjectByUuid(text, uuid), 'inputPaths').value,
    ).toContain(`${quoteIfNeeded(`$(SRCROOT)/${EMBED_SCRIPT_PATH}`)},`);
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
      RN_PATHS,
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
      RN_PATHS,
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
    const first = inject(PLAIN);
    const plan = planInjection(first.text, {});
    const second = injectSpmIntoPbxproj(
      first.text,
      {
        rootUuid: plan.rootUuid,
        targetUuid: plan.target.uuid,
        configUuids: plan.configUuids,
        frameworksPhaseUuid: plan.frameworksPhaseUuid,
      },
      RN_PATHS,
      null,
      [],
      TEST_FRAMEWORKS,
    );
    expect(second.text).toBe(first.text);
    expect(second.generatedFiles).toEqual(first.generatedFiles);
    expect(second.xcconfig).toEqual(first.xcconfig);
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

  it('replaces an inline script body from an earlier version with the wrapper', () => {
    const first = inject(PLAIN).text;
    const stale = first.replace(
      shellScriptOf(first, 'Sync SPM Autolinking'),
      quoteIfNeeded(buildSyncAutolinkingScript(RN_PATH)),
    );
    expect(stale).toContain('npx react-native spm sync');
    const plan = planInjection(stale, {});
    const second = injectSpmIntoPbxproj(
      stale,
      {
        rootUuid: plan.rootUuid,
        targetUuid: plan.target.uuid,
        configUuids: plan.configUuids,
        frameworksPhaseUuid: plan.frameworksPhaseUuid,
      },
      RN_PATHS,
      null,
      [],
      TEST_FRAMEWORKS,
    ).text;
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

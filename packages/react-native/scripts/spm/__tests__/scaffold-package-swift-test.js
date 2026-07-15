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
  SCAFFOLDER_MARKER,
  SCAFFOLDER_VERSION,
  emitScaffoldedPackageSwift,
  scaffoldAll,
  scaffoldPackageSwiftForDep,
  translatePodspecToSpmTarget,
} = require('../scaffold-package-swift');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Minimal PodspecModel fixture builder so each test stays focused on the
// field it exercises.
function podspec(overrides /*: Object */ = {}) {
  return {
    name: 'react-native-foo',
    version: '1.0',
    sourceFiles: [],
    publicHeaderFiles: [],
    privateHeaderFiles: [],
    excludeFiles: [],
    headerMappingsDir: null,
    headerMappingsDirs: [],
    headerDir: null,
    frameworks: [],
    weakFrameworks: [],
    libraries: [],
    dependencies: [],
    compilerFlags: [],
    headerSearchPaths: [],
    preprocessorDefines: [],
    resources: [],
    requiresArc: true,
    warnings: [],
    partial: false,
    usesInstallModulesDependencies: false,
    ...overrides,
  };
}

function autolinkedDep(overrides = {}) {
  return {
    name: 'react-native-foo',
    root: '/fake/node_modules/react-native-foo',
    platforms: {
      ios: {
        podspecPath:
          '/fake/node_modules/react-native-foo/react-native-foo.podspec',
      },
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// translatePodspecToSpmTarget — pure: PodspecModel + AutolinkedDep →
// SpmScaffoldSpec. Buckets deps, substitutes Xcode tokens, validates names.
// ---------------------------------------------------------------------------

describe('translatePodspecToSpmTarget', () => {
  it('always uses toSwiftName(npm-name) as the SPM target name — header_dir does NOT change the target name', () => {
    // The autolinker registers every autolinked dep under toSwiftName(npmName)
    // in its aggregator. The scaffolded Package.swift's product MUST match
    // that or SPM resolution fails on the .product(name:, package:) lookup.
    // header_dir flows through headerSearchPaths instead.
    const model = podspec({
      headerDir: 'react/renderer/components/safeareacontext',
    });
    const spec = translatePodspecToSpmTarget(
      model,
      autolinkedDep({name: 'react-native-safe-area-context'}),
    );
    expect(spec.swiftName).toBe('ReactNativeSafeAreaContext');
  });

  it('adds dirname(header_mappings_dir) as a header search path so namespaced includes resolve (reanimated/worklets pattern)', () => {
    // reanimated/worklets ship headers at `apple/reanimated/...` and
    // `Common/cpp/reanimated/...` with per-subspec header_mappings_dir, and
    // include them as `<reanimated/...>`. SPM has no header_mappings_dir copy
    // step, so the parent of each mappings dir must be on the search path.
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rea-scaffold-'));
    try {
      fs.mkdirSync(path.join(root, 'apple', 'reanimated'), {recursive: true});
      fs.mkdirSync(path.join(root, 'Common', 'cpp', 'reanimated'), {
        recursive: true,
      });
      const model = podspec({
        headerMappingsDirs: ['Common/cpp/reanimated', 'apple/reanimated'],
      });
      const spec = translatePodspecToSpmTarget(
        model,
        autolinkedDep({name: 'react-native-reanimated', root}),
      );
      expect(spec.headerSearchPaths).toContain('apple');
      expect(spec.headerSearchPaths).toContain('Common/cpp');
    } finally {
      fs.rmSync(root, {recursive: true, force: true});
    }
  });

  it('skips a header_mappings_dir whose parent dir does not exist on disk', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rea-scaffold-'));
    try {
      const model = podspec({headerMappingsDirs: ['nope/reanimated']});
      const spec = translatePodspecToSpmTarget(
        model,
        autolinkedDep({name: 'react-native-foo', root}),
      );
      expect(spec.headerSearchPaths).not.toContain('nope');
    } finally {
      fs.rmSync(root, {recursive: true, force: true});
    }
  });

  it('wires a pod-style dependency (RNWorklets) to its npm sibling via the podToNpm index', () => {
    const model = podspec({dependencies: ['RNWorklets', 'React-jsi']});
    const spec = translatePodspecToSpmTarget(
      model,
      autolinkedDep({name: 'react-native-reanimated'}),
      new Map([
        ['RNWorklets', 'react-native-worklets'],
        ['RNReanimated', 'react-native-reanimated'],
      ]),
    );
    // RNWorklets → sibling; React-jsi → collapses into ReactNative core.
    expect(spec.siblingNames).toContain('react-native-worklets');
    expect(spec.coreReactNative).toBe(true);
  });

  it('does not self-wire when a pod dependency maps back to the dep itself', () => {
    const model = podspec({dependencies: ['RNReanimated']});
    const spec = translatePodspecToSpmTarget(
      model,
      autolinkedDep({name: 'react-native-reanimated'}),
      new Map([['RNReanimated', 'react-native-reanimated']]),
    );
    expect(spec.siblingNames).not.toContain('react-native-reanimated');
  });

  it('derives publicHeadersPath from header_mappings_dir, preferring the cross-platform (Common) namespace root', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wk-scaffold-'));
    try {
      fs.mkdirSync(path.join(root, 'Common', 'cpp', 'worklets'), {
        recursive: true,
      });
      fs.mkdirSync(path.join(root, 'apple', 'worklets'), {recursive: true});
      const model = podspec({
        headerMappingsDirs: ['Common/cpp/worklets', 'apple/worklets'],
        publicHeaderFiles: ['Common/cpp/worklets/**/*.h'],
      });
      const spec = translatePodspecToSpmTarget(
        model,
        autolinkedDep({name: 'react-native-worklets', root}),
      );
      // Common/cpp (parent of Common/cpp/worklets) is what dependents need to
      // resolve <worklets/...>; the apple/ root is not preferred.
      expect(spec.publicHeadersPath).toBe('Common/cpp');
    } finally {
      fs.rmSync(root, {recursive: true, force: true});
    }
  });

  it('header-map emulation: adds every header-containing subdir to the search path (flat-include libs like svg)', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hmap-scaffold-'));
    try {
      fs.mkdirSync(path.join(root, 'apple', 'Elements'), {recursive: true});
      fs.mkdirSync(path.join(root, 'apple', 'Text'), {recursive: true});
      fs.writeFileSync(path.join(root, 'apple', 'Elements', 'A.h'), '');
      fs.writeFileSync(path.join(root, 'apple', 'Text', 'B.h'), '');
      fs.writeFileSync(path.join(root, 'apple', 'C.mm'), '');
      const model = podspec({
        sourceFiles: ['apple/Elements/A.h', 'apple/Text/B.h', 'apple/C.mm'],
      });
      const spec = translatePodspecToSpmTarget(
        model,
        autolinkedDep({name: 'react-native-svg', root}),
      );
      expect(spec.headerSearchPaths).toContain('apple/Elements');
      expect(spec.headerSearchPaths).toContain('apple/Text');
    } finally {
      fs.rmSync(root, {recursive: true, force: true});
    }
  });

  it('expands a recursive `/**` HEADER_SEARCH_PATH into the base dir + all subdirs (skia shape)', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rec-scaffold-'));
    try {
      fs.mkdirSync(path.join(root, 'cpp', 'skia', 'include', 'core'), {
        recursive: true,
      });
      const model = podspec({
        headerSearchPaths: ['$(PODS_TARGET_SRCROOT)/cpp//**'],
      });
      const spec = translatePodspecToSpmTarget(
        model,
        autolinkedDep({name: 'react-native-skia', root}),
      );
      expect(spec.headerSearchPaths).toContain('cpp'); // base
      expect(spec.headerSearchPaths).toContain('cpp/skia'); // makes <include/core/X.h> resolve
      expect(spec.headerSearchPaths).toContain('cpp/skia/include/core');
    } finally {
      fs.rmSync(root, {recursive: true, force: true});
    }
  });

  it('flags needsObjCPrefix (and adds "." to the search path) when the target has ObjC(++) sources', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'objc-scaffold-'));
    try {
      fs.writeFileSync(path.join(root, 'A.mm'), '');
      const model = podspec({sourceFiles: ['A.mm', 'B.cpp']});
      const spec = translatePodspecToSpmTarget(
        model,
        autolinkedDep({name: 'react-native-foo', root}),
      );
      expect(spec.needsObjCPrefix).toBe(true);
      expect(spec.headerSearchPaths).toContain('.');
    } finally {
      fs.rmSync(root, {recursive: true, force: true});
    }
  });

  it('does not flag needsObjCPrefix for a C++-only target', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cpp-scaffold-'));
    try {
      fs.writeFileSync(path.join(root, 'A.cpp'), '');
      const model = podspec({sourceFiles: ['A.cpp']});
      const spec = translatePodspecToSpmTarget(
        model,
        autolinkedDep({name: 'react-native-foo', root}),
      );
      expect(spec.needsObjCPrefix).toBe(false);
    } finally {
      fs.rmSync(root, {recursive: true, force: true});
    }
  });

  it('does not add "." for a single-segment header_mappings_dir', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rea-scaffold-'));
    try {
      fs.mkdirSync(path.join(root, 'ios'), {recursive: true});
      const model = podspec({headerMappingsDirs: ['ios']});
      const spec = translatePodspecToSpmTarget(
        model,
        autolinkedDep({name: 'react-native-foo', root}),
      );
      expect(spec.headerSearchPaths).not.toContain('.');
    } finally {
      fs.rmSync(root, {recursive: true, force: true});
    }
  });

  it('still uses toSwiftName(npm-name) even when header_dir is a plain identifier (matches autolinker registration)', () => {
    const model = podspec({headerDir: 'reanimated'});
    const spec = translatePodspecToSpmTarget(
      model,
      autolinkedDep({name: 'react-native-reanimated'}),
    );
    expect(spec.swiftName).toBe('ReactNativeReanimated');
  });

  it('falls back cleanly when header_dir is absent', () => {
    const model = podspec({headerDir: null});
    const spec = translatePodspecToSpmTarget(
      model,
      autolinkedDep({name: 'react-native-foo-bar'}),
    );
    expect(spec.swiftName).toBe('ReactNativeFooBar');
  });

  it('substitutes $(PODS_TARGET_SRCROOT) in HEADER_SEARCH_PATHS with the target-relative form', () => {
    const model = podspec({
      headerSearchPaths: ['$(PODS_TARGET_SRCROOT)/common/cpp'],
    });
    const spec = translatePodspecToSpmTarget(model, autolinkedDep());
    expect(spec.headerSearchPaths).toEqual(['common/cpp']);
  });

  it('drops HEADER_SEARCH_PATHS entries with unresolved Xcode tokens and warns', () => {
    const model = podspec({
      headerSearchPaths: [
        '$(PODS_TARGET_SRCROOT)/ok',
        '$(SOMETHING_UNKNOWN)/foo',
      ],
    });
    const spec = translatePodspecToSpmTarget(model, autolinkedDep());
    expect(spec.headerSearchPaths).toEqual(['ok']);
    expect(spec.warnings.some(w => /SOMETHING_UNKNOWN/.test(w))).toBe(true);
  });

  it('buckets React-Core / React-jsi / RCT-Folly / glog into the single ReactNative product', () => {
    const model = podspec({
      dependencies: ['React-Core', 'React-jsi', 'RCT-Folly', 'glog'],
    });
    const spec = translatePodspecToSpmTarget(model, autolinkedDep());
    expect(spec.coreReactNative).toBe(true);
    expect(spec.siblingNames).toEqual([]);
  });

  it('routes sibling RN deps (react-native-*) into siblingNames', () => {
    const model = podspec({
      dependencies: ['React-Core', 'react-native-worklets'],
    });
    const spec = translatePodspecToSpmTarget(model, autolinkedDep());
    expect(spec.coreReactNative).toBe(true);
    expect(spec.siblingNames).toEqual(['react-native-worklets']);
  });

  it('treats a package.json codegenConfig as an implicit React-core dep (New-Arch libs strip install_modules_dependencies — svg shape)', () => {
    // svg declares its React-core dep only via install_modules_dependencies(s),
    // which we strip — so model.dependencies has NO React-Core. The codegenConfig
    // marker is what tells us it still needs the React-GeneratedCode package.
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codegen-dep-'));
    try {
      fs.writeFileSync(
        path.join(root, 'package.json'),
        JSON.stringify({
          name: 'react-native-svg',
          codegenConfig: {name: 'rnsvg'},
        }),
      );
      const model = podspec({dependencies: []}); // nothing explicit
      const spec = translatePodspecToSpmTarget(
        model,
        autolinkedDep({name: 'react-native-svg', root}),
      );
      expect(spec.coreReactNative).toBe(true);
    } finally {
      fs.rmSync(root, {recursive: true, force: true});
    }
  });

  it('treats install_modules_dependencies (no codegenConfig) as an implicit React-core dep (rn-tester TestLibrary shape)', () => {
    // A plain ObjC module (rn-tester's TestLibraryApple/Common) wires React
    // core ONLY via install_modules_dependencies(s) and has NO codegenConfig.
    // The stripped helper leaves model.dependencies without React-Core, so the
    // usesInstallModulesDependencies marker is what keeps coreReactNative true.
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'imd-dep-'));
    try {
      fs.writeFileSync(
        path.join(root, 'package.json'),
        JSON.stringify({name: 'TestLibraryApple'}), // no codegenConfig
      );
      const model = podspec({
        dependencies: [],
        usesInstallModulesDependencies: true,
      });
      const spec = translatePodspecToSpmTarget(
        model,
        autolinkedDep({name: 'TestLibraryApple', root}),
      );
      expect(spec.coreReactNative).toBe(true);
    } finally {
      fs.rmSync(root, {recursive: true, force: true});
    }
  });

  it('does NOT force coreReactNative for a non-codegen dep with no React deps', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'no-codegen-dep-'));
    try {
      fs.writeFileSync(
        path.join(root, 'package.json'),
        JSON.stringify({name: 'react-native-foo'}), // no codegenConfig
      );
      const model = podspec({dependencies: []});
      const spec = translatePodspecToSpmTarget(
        model,
        autolinkedDep({name: 'react-native-foo', root}),
      );
      expect(spec.coreReactNative).toBe(false);
    } finally {
      fs.rmSync(root, {recursive: true, force: true});
    }
  });

  it('warns + drops unknown non-RN dependencies (MMKV, AFNetworking)', () => {
    const model = podspec({dependencies: ['MMKV', 'AFNetworking']});
    const spec = translatePodspecToSpmTarget(model, autolinkedDep());
    expect(spec.coreReactNative).toBe(false);
    expect(spec.siblingNames).toEqual([]);
    expect(spec.warnings.some(w => /MMKV/.test(w))).toBe(true);
    expect(spec.warnings.some(w => /AFNetworking/.test(w))).toBe(true);
  });

  it('silently drops cross-subspec refs like "react-native-foo/common" from the same podspec', () => {
    // CocoaPods uses this for one subspec depending on another from the
    // SAME spec — after flattenSubspecs merges everything into one SPM
    // target the ref is meaningless. Must not be treated as a sibling.
    const model = podspec({
      name: 'react-native-safe-area-context',
      dependencies: ['React-Core', 'react-native-safe-area-context/common'],
    });
    const spec = translatePodspecToSpmTarget(
      model,
      autolinkedDep({name: 'react-native-safe-area-context'}),
    );
    expect(spec.siblingNames).toEqual([]);
    expect(spec.coreReactNative).toBe(true);
  });

  it('strips subspec suffix from sibling RN deps ("react-native-worklets/foo" → "react-native-worklets")', () => {
    const model = podspec({
      dependencies: ['react-native-worklets/foo', 'react-native-worklets/bar'],
    });
    const spec = translatePodspecToSpmTarget(model, autolinkedDep());
    expect(spec.siblingNames).toEqual(['react-native-worklets']);
  });

  it('passes through frameworks, weak frameworks, compiler flags, resources', () => {
    const model = podspec({
      frameworks: ['UIKit', 'CoreMotion'],
      weakFrameworks: ['SafariServices'],
      compilerFlags: ['-Wno-documentation'],
      resources: ['Foo.png'],
    });
    const spec = translatePodspecToSpmTarget(model, autolinkedDep());
    expect(spec.extraFrameworks).toEqual(['UIKit', 'CoreMotion']);
    expect(spec.weakFrameworks).toEqual(['SafariServices']);
    expect(spec.compilerFlags).toEqual(['-Wno-documentation']);
    expect(spec.resources).toEqual(['Foo.png']);
  });

  it('expands podspec source globs into explicit file paths against the dep root, and infers publicHeadersPath', () => {
    // Fake a dep on disk so glob expansion can find real files.
    const depDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-translate-'));
    try {
      fs.mkdirSync(path.join(depDir, 'ios', 'Sub'), {recursive: true});
      fs.writeFileSync(path.join(depDir, 'ios', 'Foo.h'), '');
      fs.writeFileSync(path.join(depDir, 'ios', 'Foo.mm'), '');
      fs.writeFileSync(path.join(depDir, 'ios', 'Sub', 'Bar.h'), '');
      const model = podspec({sourceFiles: ['ios/**/*.{h,m,mm}']});
      const spec = translatePodspecToSpmTarget(
        model,
        autolinkedDep({root: depDir}),
      );
      // SPM rejects globs — these must be explicit relative paths now.
      expect(spec.sources).toEqual(
        expect.arrayContaining(['ios/Foo.h', 'ios/Foo.mm', 'ios/Sub/Bar.h']),
      );
      // publicHeadersPath is inferred from the first existing prefix dir
      // (so SPM's "publicHeadersPath defaults to non-existent include/"
      // error doesn't fire).
      expect(spec.publicHeadersPath).toBe('ios');
    } finally {
      fs.rmSync(depDir, {recursive: true, force: true});
    }
  });

  it('filters out files matching exclude_files globs after expansion', () => {
    const depDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-translate-'));
    try {
      fs.mkdirSync(path.join(depDir, 'ios', 'Fabric'), {recursive: true});
      fs.writeFileSync(path.join(depDir, 'ios', 'KeepMe.h'), '');
      fs.writeFileSync(path.join(depDir, 'ios', 'Fabric', 'SkipMe.h'), '');
      const model = podspec({
        sourceFiles: ['ios/**/*.h'],
        excludeFiles: ['ios/Fabric/**'],
      });
      const spec = translatePodspecToSpmTarget(
        model,
        autolinkedDep({root: depDir}),
      );
      expect(spec.sources).toContain('ios/KeepMe.h');
      expect(spec.sources).not.toContain('ios/Fabric/SkipMe.h');
    } finally {
      fs.rmSync(depDir, {recursive: true, force: true});
    }
  });
});

// ---------------------------------------------------------------------------
// emitScaffoldedPackageSwift — pure: SpmScaffoldSpec → Swift string.
// Snapshot-style "contains" assertions on the key emitted lines.
// ---------------------------------------------------------------------------

describe('emitScaffoldedPackageSwift', () => {
  function baseSpec(overrides = {}) {
    return {
      swiftName: 'foo',
      sources: [],
      headerSearchPaths: [],
      preprocessorDefines: [],
      needsObjCPrefix: false,
      coreReactNative: false,
      siblingNames: [],
      extraFrameworks: [],
      weakFrameworks: [],
      compilerFlags: [],
      publicHeadersPath: null,
      resources: [],
      warnings: [],
      ...overrides,
    };
  }

  it('contains the SCAFFOLDER marker (after the line-1 swift-tools-version directive) and NOT the autolinker AUTOGEN marker', () => {
    const out = emitScaffoldedPackageSwift(baseSpec());
    // Line 1 is reserved for the swift-tools-version directive — SPM ignores
    // it elsewhere. The scaffolder marker lives on a subsequent line.
    expect(out.split('\n', 1)[0]).toMatch(/^\/\/ swift-tools-version: /);
    expect(out).toContain(SCAFFOLDER_MARKER);
    // The autolinker's marker — must be absent so isSelfManagedPackage
    // treats this file as self-managed.
    expect(out).not.toContain(
      '// AUTO-GENERATED by scripts/generate-spm-autolinking.js',
    );
  });

  it('includes a cache-slot label comment when provided (bumps SPM manifest hash on slot change)', () => {
    const out = emitScaffoldedPackageSwift(baseSpec(), {
      cacheSlotLabel: '0.87.0-nightly-20260513-abc/debug',
    });
    expect(out).toContain('// Cache slot: 0.87.0-nightly-20260513-abc/debug');
  });

  it('emits DEBUG/NDEBUG config-gated cxxSettings so Fabric C++ matches the prebuilt React.framework ABI', () => {
    const out = emitScaffoldedPackageSwift(baseSpec());
    expect(out).toContain('.define("DEBUG", .when(configuration: .debug))');
    expect(out).toContain('.define("NDEBUG", .when(configuration: .release))');
  });

  it('is fully declarative — no runtime discovery code, no Foundation import', () => {
    const out = emitScaffoldedPackageSwift(baseSpec());
    expect(out).not.toContain('import Foundation');
    expect(out).not.toContain('#filePath');
    expect(out).not.toContain('FileManager');
  });

  it('emits a header-search-path directive per podspec entry (.headerSearchPath("common/cpp"))', () => {
    const out = emitScaffoldedPackageSwift(
      baseSpec({headerSearchPaths: ['common/cpp']}),
    );
    expect(out).toContain('.headerSearchPath("common/cpp")');
  });

  it('declares the ReactNative package + product via scaffold-time relative paths when coreReactNative is true', () => {
    const out = emitScaffoldedPackageSwift(baseSpec({coreReactNative: true}), {
      cacheSlotLabel: null,
      remote: null,
      codegenPackageDir: '../../ios/build/generated/ios',
      localXcfwPackageDir: '../../ios/build/xcframeworks',
    });
    expect(out).toContain(
      '.package(name: "ReactNative", path: "../../ios/build/xcframeworks")',
    );
    expect(out).toContain(
      '.package(name: "React-GeneratedCode", path: "../../ios/build/generated/ios")',
    );
    expect(out).toContain(
      '.product(name: "ReactHeaders", package: "ReactNative")',
    );
  });

  it('throws when coreReactNative is set but no codegenPackageDir was provided', () => {
    expect(() =>
      emitScaffoldedPackageSwift(baseSpec({coreReactNative: true})),
    ).toThrow(/codegenPackageDir is required/);
  });

  it('remote mode: declares .package(url:exact:) and needs no local xcframeworks path', () => {
    const out = emitScaffoldedPackageSwift(baseSpec({coreReactNative: true}), {
      cacheSlotLabel: null,
      remote: {
        url: 'https://github.com/facebook/react-native-apple',
        version: '0.87.0',
        identity: 'react-native-apple',
      },
      codegenPackageDir: '../../ios/build/generated/ios',
      localXcfwPackageDir: null,
    });
    expect(out).toContain(
      '.package(url: "https://github.com/facebook/react-native-apple", exact: "0.87.0")',
    );
    expect(out).toContain(
      '.product(name: "ReactHeaders", package: "react-native-apple")',
    );
    expect(out).not.toContain('build/xcframeworks');
  });

  it('emits sibling .package(path: "../<SwiftName>") + .product entries for sibling RN deps', () => {
    const out = emitScaffoldedPackageSwift(
      baseSpec({siblingNames: ['react-native-worklets']}),
    );
    // Path uses the libs/<SwiftName> symlink name (where the autolinker places
    // the sibling), NOT the npm name — `../react-native-worklets` would be
    // `libs/react-native-worklets`, which does not exist.
    expect(out).toContain(
      '.package(name: "ReactNativeWorklets", path: "../ReactNativeWorklets")',
    );
    expect(out).toContain(
      '.product(name: "ReactNativeWorklets", package: "ReactNativeWorklets")',
    );
  });

  it('-includes the ObjC prefix header in c/cxx settings when needsObjCPrefix is set', () => {
    const withPrefix = emitScaffoldedPackageSwift(
      baseSpec({needsObjCPrefix: true}),
    );
    expect(
      (
        withPrefix.match(
          /\.unsafeFlags\(\["-include", "react-native-spm-prefix\.h"\]\)/g,
        ) ?? []
      ).length,
    ).toBe(2); // cSettings + cxxSettings
    // Not emitted for a C/C++-only target.
    const noPrefix = emitScaffoldedPackageSwift(
      baseSpec({needsObjCPrefix: false}),
    );
    expect(noPrefix).not.toContain('-include');
  });

  it('emits preprocessor defines as .define(...) in c/cxx settings, escaping quoted values and honoring config', () => {
    const out = emitScaffoldedPackageSwift(
      baseSpec({
        preprocessorDefines: [
          {name: 'WORKLETS_VERSION', value: '0.9.2', config: null},
          {
            name: 'WORKLETS_FEATURE_FLAGS',
            value: '"[A:false][B:true]"',
            config: null,
          },
          {name: 'HERMES_ENABLE_DEBUGGER', value: '1', config: 'debug'},
          {name: 'NDEBUG', value: null, config: 'release'},
        ],
      }),
    );
    expect(out).toContain('.define("WORKLETS_VERSION", to: "0.9.2")');
    // Embedded quotes escaped for the Swift string literal.
    expect(out).toContain(
      '.define("WORKLETS_FEATURE_FLAGS", to: "\\"[A:false][B:true]\\"")',
    );
    expect(out).toContain(
      '.define("HERMES_ENABLE_DEBUGGER", to: "1", .when(configuration: .debug))',
    );
    // Valueless define + release config.
    expect(out).toContain('.define("NDEBUG", .when(configuration: .release))');
  });

  it('emits sources: array when podspec declared globs', () => {
    const out = emitScaffoldedPackageSwift(
      baseSpec({sources: ['ios/**/*.{h,m,mm}', 'common/cpp/**/*.{cpp,h}']}),
    );
    expect(out).toContain('sources: [');
    expect(out).toContain('"ios/**/*.{h,m,mm}"');
    expect(out).toContain('"common/cpp/**/*.{cpp,h}"');
  });

  it('omits sources: line when no globs (SPM auto-scans target dir)', () => {
    const out = emitScaffoldedPackageSwift(baseSpec({sources: []}));
    expect(out).not.toContain('sources: [');
  });

  it('emits publicHeadersPath when header_mappings_dir set', () => {
    const out = emitScaffoldedPackageSwift(
      baseSpec({publicHeadersPath: 'common/cpp/foo'}),
    );
    expect(out).toContain('publicHeadersPath: "common/cpp/foo"');
  });

  it('dedups linker frameworks (default + extras = no UIKit twice)', () => {
    const out = emitScaffoldedPackageSwift(
      baseSpec({extraFrameworks: ['UIKit', 'CoreMotion']}),
    );
    const uikitCount = (out.match(/\.linkedFramework\("UIKit"\)/g) || [])
      .length;
    expect(uikitCount).toBe(1);
    expect(out).toContain('.linkedFramework("CoreMotion")');
  });

  it('embeds podspec compiler_flags into cxxSettings unsafeFlags', () => {
    const out = emitScaffoldedPackageSwift(
      baseSpec({compilerFlags: ['-Wno-documentation']}),
    );
    expect(out).toContain('"-Wno-documentation"');
  });
});

// ---------------------------------------------------------------------------
// scaffoldPackageSwiftForDep — orchestrator with I/O. Tested via temp dirs;
// covers each skip rule + the happy path.
// ---------------------------------------------------------------------------

describe('scaffoldPackageSwiftForDep', () => {
  let appRoot;
  let depRoot;

  beforeEach(() => {
    appRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-scaffold-app-'));
    depRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-scaffold-dep-'));
  });

  afterEach(() => {
    fs.rmSync(appRoot, {recursive: true, force: true});
    fs.rmSync(depRoot, {recursive: true, force: true});
  });

  function makePodspec() {
    // Minimal valid podspec — exercises the regex-parser fallback path.
    const podspecPath = path.join(depRoot, 'react-native-foo.podspec');
    fs.writeFileSync(
      podspecPath,
      `
Pod::Spec.new do |s|
  s.name = "react-native-foo"
  s.version = "1.0"
  s.source_files = "ios/**/*.{h,m,mm}"
  s.dependency "React-Core"
end
`,
    );
    return podspecPath;
  }

  function makeCtx(overrides = {}) {
    return {
      appRoot,
      projectRoot: appRoot,
      reactNativeRoot: appRoot,
      force: false,
      dryRun: false,
      cacheSlotLabel: null,
      ...overrides,
    };
  }

  function makeDep(overrides = {}) {
    return {
      name: 'react-native-foo',
      root: depRoot,
      platforms: {ios: {}},
      ...overrides,
    };
  }

  it('writes Package.swift into the dep root on the happy path', () => {
    makePodspec();
    const result = scaffoldPackageSwiftForDep(makeDep(), makeCtx());
    expect(result.status).toBe('written');
    expect(fs.existsSync(path.join(depRoot, 'Package.swift'))).toBe(true);
    const content = fs.readFileSync(
      path.join(depRoot, 'Package.swift'),
      'utf8',
    );
    // Line 1 is the swift-tools-version directive; the scaffolder marker
    // appears immediately after (still detectable by `isScaffolded` checks
    // that scan the whole file).
    expect(content.split('\n', 1)[0]).toMatch(/^\/\/ swift-tools-version: /);
    expect(content).toContain(SCAFFOLDER_MARKER);
  });

  it('skips (does not write) a mixed-language dep — Swift + ObjC(++) cannot share one SPM target', () => {
    // react-native-screens shape: a single source glob mixing .swift and .mm.
    const podspecPath = path.join(depRoot, 'react-native-foo.podspec');
    fs.writeFileSync(
      podspecPath,
      `
Pod::Spec.new do |s|
  s.name = "react-native-foo"
  s.version = "1.0"
  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.dependency "React-Core"
end
`,
    );
    fs.mkdirSync(path.join(depRoot, 'ios'), {recursive: true});
    fs.writeFileSync(path.join(depRoot, 'ios', 'Foo.swift'), '');
    fs.writeFileSync(path.join(depRoot, 'ios', 'Foo.mm'), '');
    const result = scaffoldPackageSwiftForDep(makeDep(), makeCtx());
    expect(result.status).toBe('skipped-mixed-language');
    // Fail-closed: no half-baked manifest left behind.
    expect(fs.existsSync(path.join(depRoot, 'Package.swift'))).toBe(false);
  });

  it('computes app paths relative to the libs/<SwiftName> symlink, not dep.root (fresh-resolve correctness)', () => {
    makePodspec();
    const result = scaffoldPackageSwiftForDep(makeDep(), makeCtx());
    expect(result.status).toBe('written');
    const content = fs.readFileSync(
      path.join(depRoot, 'Package.swift'),
      'utf8',
    );
    // swiftName = ReactNativeFoo; the autolinker references the dep via
    // build/generated/autolinking/libs/ReactNativeFoo. SwiftPM resolves the
    // manifest's relative paths against THAT location, so:
    //   build/generated/ios  -> ../../../ios
    //   build/xcframeworks    -> ../../../../xcframeworks
    expect(content).toContain(
      '.package(name: "React-GeneratedCode", path: "../../../ios")',
    );
    expect(content).toContain(
      '.package(name: "ReactNative", path: "../../../../xcframeworks")',
    );
    // The old dep.root-relative form (doubled to …/autolinking/ios/build/...
    // through the symlink) must NOT be emitted.
    expect(content).not.toContain('../../ios/build/generated/ios');
  });

  it('reports previouslyExisted=false for first-time scaffolds (so the CLI can prompt)', () => {
    makePodspec();
    const result = scaffoldPackageSwiftForDep(makeDep(), makeCtx());
    expect(result.status).toBe('written');
    expect(result.previouslyExisted).toBe(false);
  });

  it('reports previouslyExisted=true when regenerating an existing scaffolder-marker file (slot change)', () => {
    makePodspec();
    fs.writeFileSync(
      path.join(depRoot, 'Package.swift'),
      `${SCAFFOLDER_MARKER}\n// Cache slot: OLD\n`,
    );
    const result = scaffoldPackageSwiftForDep(
      makeDep(),
      makeCtx({cacheSlotLabel: 'NEW'}),
    );
    expect(result.status).toBe('written');
    expect(result.previouslyExisted).toBe(true);
  });

  it('skips with skipped-no-ios when autolinking.json has no ios platform', () => {
    const result = scaffoldPackageSwiftForDep(
      makeDep({platforms: {ios: null}}),
      makeCtx(),
    );
    expect(result.status).toBe('skipped-no-ios');
  });

  it('skips with skipped-no-podspec when no .podspec exists in dep root', () => {
    const result = scaffoldPackageSwiftForDep(makeDep(), makeCtx());
    expect(result.status).toBe('skipped-no-podspec');
  });

  it('refuses to touch a Package.swift that lacks the scaffolder marker (user/upstream-managed)', () => {
    makePodspec();
    fs.writeFileSync(
      path.join(depRoot, 'Package.swift'),
      '// Hand-written. Do not touch.',
    );
    const result = scaffoldPackageSwiftForDep(makeDep(), makeCtx());
    expect(result.status).toBe('skipped-self-managed');
    // File unchanged
    expect(fs.readFileSync(path.join(depRoot, 'Package.swift'), 'utf8')).toBe(
      '// Hand-written. Do not touch.',
    );
  });

  it('refuses to scaffold when a nested ios/Package.swift exists without markers', () => {
    makePodspec();
    // Library ships its manifest under ios/ to keep the npm-package root
    // free of SPM artifacts. The scaffolder should NOT write a stray root
    // Package.swift — that would shadow the nested one (the autolinker
    // checks the root first).
    fs.mkdirSync(path.join(depRoot, 'ios'), {recursive: true});
    const nestedContent =
      '// swift-tools-version: 6.0\n// Hand-written nested manifest.\n';
    fs.writeFileSync(path.join(depRoot, 'ios', 'Package.swift'), nestedContent);
    const result = scaffoldPackageSwiftForDep(makeDep(), makeCtx());
    expect(result.status).toBe('skipped-self-managed');
    // Root stayed clean
    expect(fs.existsSync(path.join(depRoot, 'Package.swift'))).toBe(false);
    // Nested file untouched
    expect(
      fs.readFileSync(path.join(depRoot, 'ios', 'Package.swift'), 'utf8'),
    ).toBe(nestedContent);
  });

  it('refuses to overwrite a Package.swift carrying the autolinker AUTOGEN_MARKER', () => {
    makePodspec();
    fs.writeFileSync(
      path.join(depRoot, 'Package.swift'),
      '// AUTO-GENERATED by scripts/generate-spm-autolinking.js – do not edit.\n',
    );
    const result = scaffoldPackageSwiftForDep(makeDep(), makeCtx());
    expect(result.status).toBe('skipped-autogen');
  });

  it('skips re-scaffolding when the existing file carries the scaffolder marker AND the same cache slot', () => {
    makePodspec();
    // Pre-existing scaffold from same slot AND current generator version
    // — otherwise the version-bump skip-bypass kicks in.
    const prior =
      SCAFFOLDER_MARKER +
      `\n// AUTO-SCAFFOLDED-VERSION: ${SCAFFOLDER_VERSION}` +
      '\n// Cache slot: 0.87.0-X/debug\n// rest unchanged';
    fs.writeFileSync(path.join(depRoot, 'Package.swift'), prior);
    const result = scaffoldPackageSwiftForDep(
      makeDep(),
      makeCtx({cacheSlotLabel: '0.87.0-X/debug'}),
    );
    expect(result.status).toBe('skipped-scaffolder-marker');
    expect(fs.readFileSync(path.join(depRoot, 'Package.swift'), 'utf8')).toBe(
      prior,
    );
  });

  it('REGENERATES when the existing scaffolder file is from a different cache slot (manifest hash bump)', () => {
    makePodspec();
    const prior =
      SCAFFOLDER_MARKER + '\n// Cache slot: OLD-slot/debug\n// rest';
    fs.writeFileSync(path.join(depRoot, 'Package.swift'), prior);
    const result = scaffoldPackageSwiftForDep(
      makeDep(),
      makeCtx({cacheSlotLabel: 'NEW-slot/debug'}),
    );
    expect(result.status).toBe('written');
    expect(
      fs.readFileSync(path.join(depRoot, 'Package.swift'), 'utf8'),
    ).toContain('// Cache slot: NEW-slot/debug');
  });

  it('--force re-overwrites a scaffolder-marker file even when the slot is unchanged', () => {
    makePodspec();
    const prior =
      SCAFFOLDER_MARKER +
      '\n// Cache slot: SLOT-A/debug\n// hand edits here will be lost';
    fs.writeFileSync(path.join(depRoot, 'Package.swift'), prior);
    const result = scaffoldPackageSwiftForDep(
      makeDep(),
      makeCtx({cacheSlotLabel: 'SLOT-A/debug', force: true}),
    );
    expect(result.status).toBe('written');
    expect(
      fs.readFileSync(path.join(depRoot, 'Package.swift'), 'utf8'),
    ).not.toContain('hand edits here will be lost');
  });

  it('--dry-run produces a ScaffoldResult but writes nothing', () => {
    makePodspec();
    const result = scaffoldPackageSwiftForDep(
      makeDep(),
      makeCtx({dryRun: true}),
    );
    expect(result.status).toBe('written');
    expect(fs.existsSync(path.join(depRoot, 'Package.swift'))).toBe(false);
  });

  it("honors a dep's spm: { scaffold: false } opt-out in its react-native.config.js", () => {
    makePodspec();
    fs.writeFileSync(
      path.join(depRoot, 'react-native.config.js'),
      'module.exports = { spm: { scaffold: false } };',
    );
    const result = scaffoldPackageSwiftForDep(makeDep(), makeCtx());
    expect(result.status).toBe('skipped-opt-out');
  });

  it('returns skipped-is-react-native for `react-native` itself (handled by the xcframework path)', () => {
    const result = scaffoldPackageSwiftForDep(
      makeDep({name: 'react-native'}),
      makeCtx(),
    );
    expect(result.status).toBe('skipped-is-react-native');
  });
});

// ---------------------------------------------------------------------------
// scaffoldAll — minimal smoke test. The orchestrator delegates everything
// to scaffoldPackageSwiftForDep (already covered above); here we just
// verify it reads autolinking.json and produces one result per dep.
// ---------------------------------------------------------------------------

describe('scaffoldAll', () => {
  let appRoot;

  beforeEach(() => {
    appRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-scaffold-all-'));
  });

  afterEach(() => {
    fs.rmSync(appRoot, {recursive: true, force: true});
  });

  it('returns [] and logs when autolinking.json is absent', () => {
    const results = scaffoldAll({
      appRoot,
      projectRoot: appRoot,
      reactNativeRoot: appRoot,
    });
    expect(results).toEqual([]);
  });

  it('walks dependencies in autolinking.json and produces one result per entry', () => {
    const autolinkingDir = path.join(appRoot, 'build/generated/autolinking');
    fs.mkdirSync(autolinkingDir, {recursive: true});
    fs.writeFileSync(
      path.join(autolinkingDir, 'autolinking.json'),
      JSON.stringify({
        dependencies: {
          'react-native-a': {root: '/no/such/a', platforms: {ios: {}}},
          'react-native-b': {root: '/no/such/b', platforms: {ios: null}},
        },
      }),
    );
    const results = scaffoldAll({
      appRoot,
      projectRoot: appRoot,
      reactNativeRoot: appRoot,
    });
    expect(results.length).toBe(2);
    expect(results.find(r => r.depName === 'react-native-b').status).toBe(
      'skipped-no-ios',
    );
    // react-native-a's root doesn't exist → skipped-no-podspec
    expect(results.find(r => r.depName === 'react-native-a').status).toBe(
      'skipped-no-podspec',
    );
  });
});

// ---------------------------------------------------------------------------
// SCAFFOLDER_VERSION — auto-regen when the emitter's output format changes
//
// Without versioning, a Package.swift scaffolded by an older generator stays
// on disk indefinitely (skip-on-marker), even when our template has since
// been fixed. Bumping SCAFFOLDER_VERSION triggers a one-time regeneration
// on next scaffold. Edits are persisted via patch-package per the marker
// comment, so destructive regen here aligns with the documented workflow.
// ---------------------------------------------------------------------------

describe('SCAFFOLDER_VERSION', () => {
  it('is a positive integer', () => {
    expect(Number.isInteger(SCAFFOLDER_VERSION)).toBe(true);
    expect(SCAFFOLDER_VERSION).toBeGreaterThanOrEqual(1);
  });

  it('emitter writes the current version to the file', () => {
    const out = emitScaffoldedPackageSwift({
      swiftName: 'foo',
      sources: [],
      headerSearchPaths: [],
      preprocessorDefines: [],
      needsObjCPrefix: false,
      coreReactNative: false,
      siblingNames: [],
      extraFrameworks: [],
      weakFrameworks: [],
      compilerFlags: [],
      publicHeadersPath: null,
      resources: [],
      warnings: [],
    });
    expect(out).toMatch(
      new RegExp(`^// AUTO-SCAFFOLDED-VERSION: ${SCAFFOLDER_VERSION}$`, 'm'),
    );
  });
});

describe('scaffoldPackageSwiftForDep — version-based regen', () => {
  let tempDir;
  let depRoot;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-scaffold-version-'));
    depRoot = path.join(tempDir, 'node_modules', 'react-native-foo');
    fs.mkdirSync(depRoot, {recursive: true});
    fs.writeFileSync(
      path.join(depRoot, 'package.json'),
      JSON.stringify({name: 'react-native-foo', version: '1.0.0'}),
    );
    fs.writeFileSync(
      path.join(depRoot, 'react-native-foo.podspec'),
      "Pod::Spec.new do |s|\n  s.name = 'react-native-foo'\n  s.version = '1.0'\n  s.source_files = 'ios/**/*.{h,m,mm}'\nend\n",
    );
  });

  afterEach(() => {
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  function makeDep() {
    return {
      name: 'react-native-foo',
      root: depRoot,
      platforms: {ios: {}},
    };
  }

  function makeCtx(overrides = {}) {
    return {
      appRoot: tempDir,
      reactNativeRoot: depRoot,
      force: false,
      dryRun: false,
      cacheSlotLabel: 'SLOT-A/debug',
      skipDeps: new Set(),
      ...overrides,
    };
  }

  it('regenerates a file scaffolded under an older version, even without --force', () => {
    const olderVersion = Math.max(1, SCAFFOLDER_VERSION - 1);
    fs.writeFileSync(
      path.join(depRoot, 'Package.swift'),
      `${SCAFFOLDER_MARKER}\n// AUTO-SCAFFOLDED-VERSION: ${olderVersion}\n// Cache slot: SLOT-A/debug\n`,
    );
    const result = scaffoldPackageSwiftForDep(makeDep(), makeCtx());
    expect(result.status).toBe('written');
    const after = fs.readFileSync(path.join(depRoot, 'Package.swift'), 'utf8');
    expect(after).toContain(
      `// AUTO-SCAFFOLDED-VERSION: ${SCAFFOLDER_VERSION}`,
    );
  });

  it('regenerates a marker-tagged file with NO version line (treats as v1)', () => {
    fs.writeFileSync(
      path.join(depRoot, 'Package.swift'),
      `${SCAFFOLDER_MARKER}\n// Cache slot: SLOT-A/debug\n// pre-versioning scaffold\n`,
    );
    const result = scaffoldPackageSwiftForDep(makeDep(), makeCtx());
    expect(result.status).toBe('written');
    const after = fs.readFileSync(path.join(depRoot, 'Package.swift'), 'utf8');
    expect(after).not.toContain('pre-versioning scaffold');
    expect(after).toContain(
      `// AUTO-SCAFFOLDED-VERSION: ${SCAFFOLDER_VERSION}`,
    );
  });

  it('skips when the existing file is already at the current version and slot', () => {
    fs.writeFileSync(
      path.join(depRoot, 'Package.swift'),
      `${SCAFFOLDER_MARKER}\n// AUTO-SCAFFOLDED-VERSION: ${SCAFFOLDER_VERSION}\n// Cache slot: SLOT-A/debug\n`,
    );
    const result = scaffoldPackageSwiftForDep(makeDep(), makeCtx());
    expect(result.status).toBe('skipped-scaffolder-marker');
  });
});

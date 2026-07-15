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
  AUTOGEN_MARKER,
  MissingManifestError,
  collectSpmSources,
  expandSpmSourceGlobs,
  findSelfManagedPackageDir,
  generateAutolinkedPackageSwift,
  generateSynthPackageSwift,
  hasMixedLanguageSources,
  hasPodspec,
  linkHeaderTree,
  main,
  reactDescriptor,
  reportMissingManifests,
} = require('../generate-spm-autolinking');
const fs = require('fs');
const os = require('os');
const path = require('path');

// ---------------------------------------------------------------------------
// reactDescriptor — the ReactDescriptor handed to autolinking plugins
// ---------------------------------------------------------------------------

describe('reactDescriptor (plugin context.react)', () => {
  it('builds a local package ref (absolute path + relPath) and the full product set when codegen exists', () => {
    const d = reactDescriptor(
      '/abs/app/build/xcframeworks',
      '../xcframeworks',
      true,
    );
    expect(d.packageRef).toEqual({
      name: 'ReactNative',
      path: '/abs/app/build/xcframeworks',
      relPath: '../xcframeworks',
    });
    // Full product set, incl. ReactAppHeaders in the SEPARATE React-GeneratedCode
    // package (the entry a hand-rolled plugin would miss).
    expect(d.products).toEqual([
      {name: 'ReactHeaders', package: 'ReactNative'},
      {name: 'ReactNativeHeaders', package: 'ReactNative'},
      {name: 'ReactNativeDependenciesHeaders', package: 'ReactNative'},
      {name: 'ReactAppHeaders', package: 'React-GeneratedCode'},
    ]);
  });

  it('omits React-GeneratedCode products when the codegen package is absent', () => {
    const d = reactDescriptor(
      '/abs/app/build/xcframeworks',
      '../xcframeworks',
      false,
    );
    expect(d.products).toEqual([
      {name: 'ReactHeaders', package: 'ReactNative'},
      {name: 'ReactNativeHeaders', package: 'ReactNative'},
      {name: 'ReactNativeDependenciesHeaders', package: 'ReactNative'},
    ]);
    // Invariant: no listed product references a package that isn't resolvable.
    expect(d.products.some(p => p.package === 'React-GeneratedCode')).toBe(
      false,
    );
  });

  it('returns null when there is no resolvable React dependency', () => {
    expect(reactDescriptor(null, null, false)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// generateAutolinkedPackageSwift — top-level aggregator
//
// Post-refactor shape: autolinked/Package.swift is a thin meta-package that
// references each autolinked dep as its own sub-package via .package(path:),
// and re-exports them via a single AutolinkedAggregate target. Per-dep
// settings (cFlags, cxxFlags, header paths, link order) live in each synth
// sub-package — see generateSynthPackageSwift below.
// ---------------------------------------------------------------------------

describe('generateAutolinkedPackageSwift (aggregator)', () => {
  it('emits a valid swift-tools-version 6.0 package with an Autolinked product backed by AutolinkedAggregate', () => {
    const result = generateAutolinkedPackageSwift({});
    expect(result).toContain('// swift-tools-version: 6.0');
    expect(result).toContain('import PackageDescription');
    expect(result).toContain(
      '.library(name: "Autolinked", targets: ["AutolinkedAggregate"])',
    );
    expect(result).toContain('name: "AutolinkedAggregate"');
  });

  it('references each npm dep as .package(path: "packages/<SwiftName>") and depends on its product', () => {
    const result = generateAutolinkedPackageSwift({
      npmDeps: [{swiftName: 'A'}, {swiftName: 'B'}],
    });
    expect(result).toContain('.package(name: "A", path: "packages/A")');
    expect(result).toContain('.package(name: "B", path: "packages/B")');
    expect(result).toContain('.product(name: "A", package: "A")');
    expect(result).toContain('.product(name: "B", package: "B")');
  });

  it('emits autolinking-plugin package + product contributions (path and remote)', () => {
    const result = generateAutolinkedPackageSwift({
      pluginPackageDeps: [
        {name: 'ExpoModulesCore', path: '../../../../node_modules/expo'},
        {name: 'ReactNative', url: 'https://example/rn.git', version: '0.87.0'},
      ],
      pluginProductDeps: [
        {name: 'ExpoModulesCore', package: 'ExpoModulesCore'},
      ],
    });
    expect(result).toContain(
      '.package(name: "ExpoModulesCore", path: "../../../../node_modules/expo")',
    );
    expect(result).toContain(
      '.package(url: "https://example/rn.git", exact: "0.87.0")',
    );
    expect(result).toContain(
      '.product(name: "ExpoModulesCore", package: "ExpoModulesCore")',
    );
  });

  it('emits an eval-time missing-manifest guard naming each lib by npm name', () => {
    const result = generateAutolinkedPackageSwift({
      npmDeps: [
        {
          swiftName: 'ReactNativeSafeAreaContext',
          packagePath: 'libs/ReactNativeSafeAreaContext',
          npmName: 'react-native-safe-area-context',
        },
      ],
    });
    // The guard runs at resolution (manifest eval) — before the Xcode sync
    // build phase — so a wiped library manifest surfaces an actionable message
    // instead of SwiftPM's opaque "manifest cannot be accessed".
    expect(result).toContain('let __rnAutolinkedLibs');
    expect(result).toContain(
      '(path: "libs/ReactNativeSafeAreaContext", npm: "react-native-safe-area-context")',
    );
    expect(result).toContain('FileManager.default.fileExists');
    expect(result).toContain('npx react-native spm scaffold');
    expect(result).toContain('npx patch-package');
    expect(result).toContain('fatalError(');
    // The guard reads its own location to resolve lib paths.
    expect(result).toContain('#filePath');
  });

  it('omits the guard entirely when there are no npm deps', () => {
    const result = generateAutolinkedPackageSwift({});
    expect(result).not.toContain('__rnAutolinkedLibs');
  });

  it('emits inline .target() blocks for each inlineTarget alongside AutolinkedAggregate', () => {
    const result = generateAutolinkedPackageSwift({
      inlineTargets: [
        {
          name: 'ScreenshotManager',
          path: 'sources/ScreenshotManager',
          exclude: [],
          publicHeadersPath: '.',
        },
      ],
      xcframeworksRelPath: '../build/xcframeworks',
      hasReactDep: true,
      hasXcfwHeaders: true,
      hasDepsHeaders: true,
    });
    // ReactNative dep is needed because inline targets reference it
    expect(result).toContain(
      '.package(name: "ReactNative", path: "../build/xcframeworks")',
    );
    // Aggregator depends on inline targets via .target(name: ...)
    expect(result).toContain('.target(name: "ScreenshotManager")');
    // Inline target's own declaration appears in the targets array
    expect(result).toMatch(
      /name: "ScreenshotManager",[\s\S]*?path: "sources\/ScreenshotManager"/,
    );
    // Inline target depends on the invariant React compile product.
    expect(result).toMatch(
      /name: "ScreenshotManager",[\s\S]*?\.product\(name: "ReactHeaders", package: "ReactNative"\)/,
    );
    // Inline targets resolve headers via product deps — no -I flags, no VFS.
    expect(result).toContain(
      '.product(name: "ReactNativeHeaders", package: "ReactNative")',
    );
    expect(result).toContain(
      '.product(name: "ReactAppHeaders", package: "React-GeneratedCode")',
    );
    expect(result).not.toContain('rnCoreHeaders');
    expect(result).not.toContain('-ivfsoverlay');
    expect(result).toContain('.linkedFramework("CoreGraphics")');
  });

  it('mixes npm sub-package deps and inline targets in a single aggregator', () => {
    const result = generateAutolinkedPackageSwift({
      npmDeps: [{swiftName: 'NpmA'}],
      inlineTargets: [
        {
          name: 'LocalA',
          path: 'sources/LocalA',
          exclude: [],
          publicHeadersPath: '.',
        },
      ],
      xcframeworksRelPath: '../build/xcframeworks',
      hasReactDep: true,
      hasXcfwHeaders: true,
    });
    // Both forms of dep on AutolinkedAggregate
    expect(result).toContain('.product(name: "NpmA", package: "NpmA")');
    expect(result).toContain('.target(name: "LocalA")');
  });

  it('emits a stub aggregator when neither npmDeps nor inlineTargets are provided', () => {
    const result = generateAutolinkedPackageSwift({});
    expect(result).toContain('name: "AutolinkedAggregate"');
    expect(result).not.toContain('.package(name:');
  });
});

// ---------------------------------------------------------------------------
// generateSynthPackageSwift — per-dep synthesized Package.swift
//
// Each autolinked dep gets its own SPM package, written under
// autolinked/packages/<SwiftName>/Package.swift. Sources are mirrored into
// <packageDir>/Sources/<SwiftName>/ so SPM's path-containment check passes.
//
// The synth Package.swift embeds the dep's settings (cFlags, cxxFlags, header
// paths) and declares cross-package dependencies for its transitive
// spmDependencies as sibling synth packages at path "../<OtherName>".
// ---------------------------------------------------------------------------

describe('generateSynthPackageSwift', () => {
  function baseSpec(overrides /*: ?Object */) {
    return {
      swiftName: 'MyDep',
      exclude: [],
      publicHeadersPath: '.',
      spmDependencies: [],
      hasReactDep: true,
      hasXcfwHeaders: true,
      hasDepsHeaders: false,
      codegenHeadersIncluded: false,
      ...overrides,
    };
  }

  it('emits a valid Package with name/product matching swiftName', () => {
    const result = generateSynthPackageSwift(baseSpec());
    expect(result).toContain('// swift-tools-version: 6.0');
    expect(result).toContain('name: "MyDep"');
    expect(result).toContain('.library(');
    expect(result).toContain('name: "MyDep"');
    expect(result).toContain('targets: ["MyDep"]');
    // Target path points at the mirrored sources sub-dir
    expect(result).toContain('path: "Sources/MyDep"');
  });

  it('declares the library product as type: .dynamic so SPM framework-wraps it (enables <Module/Header.h> includes)', () => {
    const result = generateSynthPackageSwift(baseSpec());
    expect(result).toContain(
      '.library(name: "MyDep", type: .dynamic, targets: ["MyDep"])',
    );
  });

  it('emits DEBUG/NDEBUG config-gated cxxSettings so Fabric C++ matches the prebuilt React.framework ABI', () => {
    const result = generateSynthPackageSwift(baseSpec());
    expect(result).toContain('.define("DEBUG", .when(configuration: .debug))');
    expect(result).toContain(
      '.define("NDEBUG", .when(configuration: .release))',
    );
  });

  it('depends on ReactNative via a fixed relative path (default synth depth)', () => {
    const result = generateSynthPackageSwift(baseSpec({hasReactDep: true}));
    expect(result).toContain(
      '.package(name: "ReactNative", path: "../../../../xcframeworks")',
    );
    expect(result).toContain(
      '.package(name: "React-GeneratedCode", path: "../../../ios")',
    );
    expect(result).toContain(
      '.product(name: "ReactHeaders", package: "ReactNative")',
    );
    // Fully declarative — no runtime discovery, no Foundation import.
    expect(result).not.toContain('import Foundation');
    expect(result).not.toContain('spm-paths.json');
    expect(result).not.toContain('#filePath');
  });

  it('honors caller-supplied reactNativePackagePath / codegenPackagePath', () => {
    const result = generateSynthPackageSwift(
      baseSpec({
        hasReactDep: true,
        reactNativePackagePath: '../../rel/xcframeworks',
        codegenPackagePath: '../../rel/ios',
      }),
    );
    expect(result).toContain(
      '.package(name: "ReactNative", path: "../../rel/xcframeworks")',
    );
    expect(result).toContain(
      '.package(name: "React-GeneratedCode", path: "../../rel/ios")',
    );
  });

  it('declares sibling synth packages at path "../<OtherName>" for each spmDependencies entry', () => {
    const result = generateSynthPackageSwift(
      baseSpec({spmDependencies: [{swiftName: 'CommonDep'}]}),
    );
    expect(result).toContain(
      '.package(name: "CommonDep", path: "../CommonDep")',
    );
    expect(result).toContain(
      '.product(name: "CommonDep", package: "CommonDep")',
    );
  });

  it('serves React headers via product deps (binaryTargets + ReactAppHeaders)', () => {
    const result = generateSynthPackageSwift(baseSpec({hasReactDep: true}));
    expect(result).toContain(
      '.product(name: "ReactNativeHeaders", package: "ReactNative")',
    );
    expect(result).toContain(
      '.product(name: "ReactAppHeaders", package: "React-GeneratedCode")',
    );
    // No header-search-path vars, no flags, no legacy VFS machinery.
    expect(result).not.toContain('rnCoreHeaders');
    expect(result).not.toContain('unsafeFlags(["-I"');
    expect(result).not.toContain('ReactHeadersAll');
    expect(result).not.toContain('-ivfsoverlay');
    expect(result).not.toContain('let xcfwHeaders');
    expect(result).not.toContain('let vfsOverlay');
    expect(result).not.toContain('let depsHeaders');
  });

  it('emits exclude list when given', () => {
    const result = generateSynthPackageSwift(
      baseSpec({exclude: ['tests/', 'broken.m']}),
    );
    expect(result).toContain('exclude: ["tests/", "broken.m"]');
  });

  it('omits publicHeadersPath when null (not all targets expose headers)', () => {
    const result = generateSynthPackageSwift(
      baseSpec({publicHeadersPath: null}),
    );
    expect(result).not.toContain('publicHeadersPath:');
  });

  it('links UIKit and Foundation frameworks by default', () => {
    const result = generateSynthPackageSwift(baseSpec());
    expect(result).toContain('.linkedFramework("UIKit")');
    expect(result).toContain('.linkedFramework("Foundation")');
  });

  // -------------------------------------------------------------------------
  // In-place mode: synth Package.swift lives in the dep's real source dir
  // (target.path = ".") with an absolute appRoot. Used by the production
  // emitter so Xcode can save source files normally (atomic-save through a
  // symlink in autolinked/ fails with NSFileNoSuchFileError).
  // -------------------------------------------------------------------------

  it('emits no runtime discovery — fully declarative manifest', () => {
    const result = generateSynthPackageSwift({
      swiftName: 'MyDep',
      publicHeadersPath: 'include',
      hasReactDep: true,
      targetPath: '.',
    });
    expect(result).not.toContain('rnSpmPaths');
    expect(result).not.toContain('spm-paths.json');
    expect(result).not.toContain('import Foundation');
    expect(result).toContain('path: "."');
  });

  it('in-place mode: ReactNative dep path uses the default fixed relative path', () => {
    const result = generateSynthPackageSwift({
      swiftName: 'MyDep',
      hasReactDep: true,
      targetPath: '.',
    });
    expect(result).toContain(
      '.package(name: "ReactNative", path: "../../../../xcframeworks")',
    );
  });

  it('in-place mode: sibling synth refs use absolute paths from siblingSynthAbsolutePaths', () => {
    const result = generateSynthPackageSwift({
      swiftName: 'MyDep',
      hasReactDep: true,
      targetPath: '.',
      spmDependencies: [{swiftName: 'CommonDep'}],
      siblingSynthAbsolutePaths: {CommonDep: '/abs/path/to/common'},
    });
    expect(result).toContain(
      '.package(name: "CommonDep", path: "/abs/path/to/common")',
    );
    expect(result).toContain(
      '.product(name: "CommonDep", package: "CommonDep")',
    );
  });

  it('falls back to a relative sibling path when no absolute synth path is provided', () => {
    const result = generateSynthPackageSwift({
      swiftName: 'MyDep',
      targetPath: '.',
      spmDependencies: [{swiftName: 'Missing'}],
      siblingSynthAbsolutePaths: {},
    });
    expect(result).toContain('.package(name: "Missing", path: "../Missing")');
  });

  it('wrapper-dir mode: target.path = "root" (a dir symlink) so Xcode atomic-save works on real files', () => {
    const result = generateSynthPackageSwift({
      swiftName: 'MyDep',
      hasReactDep: true,
      hasXcfwHeaders: true,
      targetPath: 'root',
      appRootAbsolute: '/abs/app/root',
      autogenHeadersAbsolute:
        '/abs/app/root/build/generated/autolinking/headers',
    });
    expect(result).toContain('path: "root"');
  });

  it('wrapper-dir mode: routes all includes through the single merged tree (autolinking headers folded in)', () => {
    const result = generateSynthPackageSwift({
      swiftName: 'MyDep',
      hasReactDep: true,
      hasXcfwHeaders: true,
      targetPath: 'root',
      appRootAbsolute: '/abs/app',
      autogenHeadersAbsolute: '/abs/app/build/generated/autolinking/headers',
    });
    // The autolinking headers dir is folded into the per-app farm (served by
    // the ReactAppHeaders product) — never a separate -I.
    expect(result).not.toContain(
      '"-I", "/abs/app/build/generated/autolinking/headers"',
    );
  });

  it('wrapper-dir mode: omits publicHeadersPath (headers route through -I instead)', () => {
    const result = generateSynthPackageSwift({
      swiftName: 'MyDep',
      hasReactDep: true,
      hasXcfwHeaders: true,
      targetPath: 'root',
      appRootAbsolute: '/abs',
      autogenHeadersAbsolute: '/abs/headers',
      // publicHeadersPath intentionally not set
    });
    expect(result).not.toContain('publicHeadersPath:');
  });
});

// ---------------------------------------------------------------------------
// linkHeaderTree
//
// Mirrors header files from srcDir into a separate destDir via relative
// symlinks. Used for the centralized cross-package headers tree at
// <outputDir>/headers/<SwiftName>/.
// ---------------------------------------------------------------------------

describe('linkHeaderTree', () => {
  let tmpDirs;

  beforeEach(() => {
    tmpDirs = [];
  });

  afterEach(() => {
    for (const dir of tmpDirs) {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  function makeTmpDirs() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-headers-'));
    tmpDirs.push(root);
    const src = path.join(root, 'src');
    const dest = path.join(root, 'headers', 'MyDep');
    fs.mkdirSync(src, {recursive: true});
    return {root, src, dest};
  }

  it('symlinks each header from srcDir into destDir with a relative target', () => {
    const {src, dest} = makeTmpDirs();
    fs.writeFileSync(path.join(src, 'Foo.h'), '// foo\n');
    fs.writeFileSync(path.join(src, 'Foo.mm'), '// not a header — skip\n');

    linkHeaderTree(src, dest);

    const link = path.join(dest, 'Foo.h');
    expect(fs.lstatSync(link).isSymbolicLink()).toBe(true);
    // dest sits under root/headers/MyDep, src under root/src — relative target
    // walks up two levels then back down into src/.
    expect(fs.readlinkSync(link)).toBe('../../src/Foo.h');
    expect(fs.existsSync(path.join(dest, 'Foo.mm'))).toBe(false);
  });

  it('preserves nested header subdirs so <Name/Sub/Header.h> resolves (ReactCommonSamples case)', () => {
    const {src, dest} = makeTmpDirs();
    fs.mkdirSync(path.join(src, 'ReactCommon'));
    fs.writeFileSync(path.join(src, 'ReactCommon', 'Nested.h'), '// nested\n');

    linkHeaderTree(src, dest);

    const link = path.join(dest, 'ReactCommon', 'Nested.h');
    expect(fs.lstatSync(link).isSymbolicLink()).toBe(true);
    expect(fs.readlinkSync(link)).toBe('../../../src/ReactCommon/Nested.h');
  });

  it('is idempotent: re-running with the same headers preserves symlink inodes', () => {
    const {src, dest} = makeTmpDirs();
    fs.writeFileSync(path.join(src, 'Stable.h'), '// h\n');

    linkHeaderTree(src, dest);
    const link = path.join(dest, 'Stable.h');
    const inoBefore = fs.lstatSync(link).ino;

    linkHeaderTree(src, dest);
    expect(fs.lstatSync(link).ino).toBe(inoBefore);
  });

  it('prunes symlinks for headers that no longer exist in srcDir', () => {
    const {src, dest} = makeTmpDirs();
    fs.writeFileSync(path.join(src, 'A.h'), '// a\n');
    fs.writeFileSync(path.join(src, 'B.h'), '// b\n');
    linkHeaderTree(src, dest);

    expect(fs.existsSync(path.join(dest, 'B.h'))).toBe(true);

    // Remove B.h from src and re-run; the stale symlink should be gone.
    fs.unlinkSync(path.join(src, 'B.h'));
    linkHeaderTree(src, dest);

    expect(fs.existsSync(path.join(dest, 'A.h'))).toBe(true);
    expect(fs.existsSync(path.join(dest, 'B.h'))).toBe(false);
  });

  it('removes destDir entirely when srcDir has no headers', () => {
    const {src, dest} = makeTmpDirs();
    // No header files in src — just a non-header.
    fs.writeFileSync(path.join(src, 'thing.mm'), '// impl\n');
    fs.mkdirSync(dest, {recursive: true});
    fs.writeFileSync(path.join(dest, 'Stale.h'), '// stale\n');

    linkHeaderTree(src, dest);

    expect(fs.existsSync(dest)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// collectSpmSources — recursive auto-discovery used as the default `sources:`
// allowlist. Skip-dirs (tests/, __tests__/, android/, …) are pruned at every
// depth. Anything not matching ALL_SOURCE_EXTENSIONS is left out (no .js,
// .podspec, .md, package.json, CMakeLists.txt).
// ---------------------------------------------------------------------------

describe('collectSpmSources', () => {
  let tmpDirs;

  beforeEach(() => {
    tmpDirs = [];
  });

  afterEach(() => {
    for (const dir of tmpDirs) {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  function makeTmp() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-sources-'));
    tmpDirs.push(dir);
    return dir;
  }

  it('returns every source file under sourcePath, sorted, forward-slash-separated', () => {
    const dir = makeTmp();
    fs.writeFileSync(path.join(dir, 'A.h'), '');
    fs.writeFileSync(path.join(dir, 'A.mm'), '');
    fs.mkdirSync(path.join(dir, 'Sub'));
    fs.writeFileSync(path.join(dir, 'Sub', 'B.cpp'), '');
    fs.writeFileSync(path.join(dir, 'Sub', 'B.hpp'), '');

    expect(collectSpmSources(dir)).toEqual([
      'A.h',
      'A.mm',
      'Sub/B.cpp',
      'Sub/B.hpp',
    ]);
  });

  it('ignores non-source files like .js, .ts, .podspec, .md, CMakeLists.txt, package.json', () => {
    const dir = makeTmp();
    fs.writeFileSync(path.join(dir, 'Module.mm'), '');
    fs.writeFileSync(path.join(dir, 'module.js'), '');
    fs.writeFileSync(path.join(dir, 'index.ts'), '');
    fs.writeFileSync(path.join(dir, 'My.podspec'), '');
    fs.writeFileSync(path.join(dir, 'README.md'), '');
    fs.writeFileSync(path.join(dir, 'CMakeLists.txt'), '');
    fs.writeFileSync(path.join(dir, 'package.json'), '{}');

    expect(collectSpmSources(dir)).toEqual(['Module.mm']);
  });

  it('skips test/__tests__/__mocks__/jest/android/node_modules directories at the top level', () => {
    const dir = makeTmp();
    fs.writeFileSync(path.join(dir, 'Real.mm'), '');
    for (const skip of [
      'tests',
      '__tests__',
      '__mocks__',
      'test',
      'jest',
      'android',
      'node_modules',
    ]) {
      fs.mkdirSync(path.join(dir, skip));
      fs.writeFileSync(path.join(dir, skip, 'Hidden.mm'), '');
    }

    expect(collectSpmSources(dir)).toEqual(['Real.mm']);
  });

  it('skips skip-dirs at any nesting depth (the regression that motivated the switch)', () => {
    // NativeCxxModuleExample/tests/NativeCxxModuleExampleTests.cpp shape:
    // the test dir lives under a nested subdir, not at the source root.
    const dir = makeTmp();
    fs.mkdirSync(path.join(dir, 'NativeCxxModuleExample', 'tests'), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(dir, 'NativeCxxModuleExample', 'NativeCxxModuleExample.mm'),
      '',
    );
    fs.writeFileSync(
      path.join(
        dir,
        'NativeCxxModuleExample',
        'tests',
        'NativeCxxModuleExampleTests.cpp',
      ),
      '',
    );

    expect(collectSpmSources(dir)).toEqual([
      'NativeCxxModuleExample/NativeCxxModuleExample.mm',
    ]);
  });

  it('returns an empty list when sourcePath does not exist', () => {
    expect(collectSpmSources('/no/such/dir/spm-test')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// expandSpmSourceGlobs — translates CocoaPods-style globs (e.g.
// 'ios/**/*.{h,m,mm}') into a sorted list of matching file paths. Skip-dir
// filtering still applies even when the pattern would otherwise match.
// ---------------------------------------------------------------------------

describe('expandSpmSourceGlobs', () => {
  let tmpDirs;

  beforeEach(() => {
    tmpDirs = [];
  });

  afterEach(() => {
    for (const dir of tmpDirs) {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  function makeTmp() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-globs-'));
    tmpDirs.push(dir);
    return dir;
  }

  it('** matches any depth, with brace alternation expanding extensions', () => {
    const dir = makeTmp();
    fs.mkdirSync(path.join(dir, 'ios', 'Sub'), {recursive: true});
    fs.writeFileSync(path.join(dir, 'ios', 'Root.h'), '');
    fs.writeFileSync(path.join(dir, 'ios', 'Root.m'), '');
    fs.writeFileSync(path.join(dir, 'ios', 'Sub', 'Deep.mm'), '');
    fs.writeFileSync(path.join(dir, 'ios', 'ignored.txt'), '');

    expect(expandSpmSourceGlobs(dir, ['ios/**/*.{h,m,mm}'])).toEqual([
      'ios/Root.h',
      'ios/Root.m',
      'ios/Sub/Deep.mm',
    ]);
  });

  it('single * stays within one segment', () => {
    const dir = makeTmp();
    fs.mkdirSync(path.join(dir, 'a', 'b'), {recursive: true});
    fs.writeFileSync(path.join(dir, 'a', 'Foo.mm'), '');
    fs.writeFileSync(path.join(dir, 'a', 'b', 'Bar.mm'), '');

    expect(expandSpmSourceGlobs(dir, ['a/*.mm'])).toEqual(['a/Foo.mm']);
  });

  it('still skips SKIP_DIRS_DEFAULT even when the glob would match inside them', () => {
    const dir = makeTmp();
    fs.mkdirSync(path.join(dir, 'tests'));
    fs.writeFileSync(path.join(dir, 'Real.mm'), '');
    fs.writeFileSync(path.join(dir, 'tests', 'Hidden.mm'), '');

    expect(expandSpmSourceGlobs(dir, ['**/*.mm'])).toEqual(['Real.mm']);
  });

  it('multiple patterns are unioned and deduplicated', () => {
    const dir = makeTmp();
    fs.writeFileSync(path.join(dir, 'A.h'), '');
    fs.writeFileSync(path.join(dir, 'A.mm'), '');

    expect(expandSpmSourceGlobs(dir, ['*.h', '*.mm', '*.{h,mm}'])).toEqual([
      'A.h',
      'A.mm',
    ]);
  });

  it('returns an empty list when no pattern matches', () => {
    const dir = makeTmp();
    fs.writeFileSync(path.join(dir, 'A.mm'), '');

    expect(expandSpmSourceGlobs(dir, ['nope/*.swift'])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// generateSynthPackageSwift — sources: line rendering
// ---------------------------------------------------------------------------

describe('generateSynthPackageSwift (sources: allowlist)', () => {
  it('emits a multi-line sources: array when spec.sources is non-empty', () => {
    const result = generateSynthPackageSwift({
      swiftName: 'MyDep',
      hasReactDep: true,
      hasXcfwHeaders: true,
      targetPath: '.',
      sources: ['root/A.mm', 'root/Sub/B.cpp'],
      appRootAbsolute: '/abs/app',
      autogenHeadersAbsolute: '/abs/app/headers',
    });
    expect(result).toContain('sources: [');
    expect(result).toContain('"root/A.mm"');
    expect(result).toContain('"root/Sub/B.cpp"');
    // Order matters for diff readability: sources: comes after path: and
    // before publicHeadersPath:.
    const sourcesIdx = result.indexOf('sources: [');
    const pathIdx = result.indexOf('path: "."');
    const publicHeadersIdx = result.indexOf('publicHeadersPath:');
    expect(pathIdx).toBeLessThan(sourcesIdx);
    if (publicHeadersIdx !== -1) {
      expect(sourcesIdx).toBeLessThan(publicHeadersIdx);
    }
  });

  it('omits sources: line when spec.sources is null or empty (falls back to SPM auto-scan)', () => {
    const a = generateSynthPackageSwift({
      swiftName: 'A',
      targetPath: '.',
      appRootAbsolute: '/abs',
    });
    const b = generateSynthPackageSwift({
      swiftName: 'B',
      targetPath: '.',
      sources: [],
      appRootAbsolute: '/abs',
    });
    expect(a).not.toContain('sources: [');
    expect(b).not.toContain('sources: [');
  });
});

// ---------------------------------------------------------------------------
// spm.name override — verifies that a non-default Swift name (set by a
// library author via react-native.config.js `spm.name`) flows verbatim into
// the synth Package.swift: target name, library name, product references,
// and sibling package paths all use the override.
// ---------------------------------------------------------------------------

describe('generateSynthPackageSwift (spm.name override)', () => {
  it('uses the override Swift name for the target, library, and product', () => {
    const result = generateSynthPackageSwift({
      swiftName: 'worklets', // override from spm.name (default would be "ReactNativeWorklets")
      hasReactDep: true,
      hasXcfwHeaders: true,
      targetPath: 'root',
      appRootAbsolute: '/abs/app',
      autogenHeadersAbsolute: '/abs/app/headers',
    });
    expect(result).toContain('name: "worklets"');
    expect(result).toContain('.library(name: "worklets"');
    expect(result).toContain('targets: ["worklets"]');
    // The auto-derived name must not appear anywhere.
    expect(result).not.toContain('ReactNativeWorklets');
  });

  it('emits the override name in sibling .package(...) and .product(...) refs when a transitive dep was overridden', () => {
    // Simulates the case where reanimated declares spm.dependencies on
    // react-native-worklets, and worklets has set spm.name: "worklets".
    // The autolinker's swiftNameByNpm map resolves the transitive to
    // "worklets" before passing it to generateSynthPackageSwift.
    const result = generateSynthPackageSwift({
      swiftName: 'reanimated',
      hasReactDep: true,
      hasXcfwHeaders: true,
      targetPath: 'root',
      appRootAbsolute: '/abs/app',
      autogenHeadersAbsolute: '/abs/app/headers',
      spmDependencies: [{swiftName: 'worklets'}],
      siblingSynthAbsolutePaths: {worklets: '/abs/app/packages/worklets'},
    });
    expect(result).toContain(
      '.package(name: "worklets", path: "/abs/app/packages/worklets")',
    );
    expect(result).toContain('.product(name: "worklets", package: "worklets")');
    expect(result).not.toContain('ReactNativeWorklets');
  });
});

// ---------------------------------------------------------------------------
// findSelfManagedPackageDir — detects hand-authored Package.swift at either
// the dep root or under ios/. The nested layout lets community libraries
// keep their npm-package root free of SPM artifacts (.build/, .swiftpm/).
// ---------------------------------------------------------------------------

describe('findSelfManagedPackageDir', () => {
  let depRoot;

  beforeEach(() => {
    depRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-selfmgd-'));
  });

  afterEach(() => {
    fs.rmSync(depRoot, {recursive: true, force: true});
  });

  it('returns null when no Package.swift exists at any candidate location', () => {
    expect(findSelfManagedPackageDir(depRoot)).toBe(null);
  });

  it('returns the dep root when <dep>/Package.swift exists without the AUTOGEN marker', () => {
    fs.writeFileSync(
      path.join(depRoot, 'Package.swift'),
      '// swift-tools-version: 6.0\n// Hand-authored.\n',
    );
    expect(findSelfManagedPackageDir(depRoot)).toBe(depRoot);
  });

  it('returns null when <dep>/Package.swift carries the AUTOGEN marker', () => {
    fs.writeFileSync(
      path.join(depRoot, 'Package.swift'),
      AUTOGEN_MARKER + '\n// synth wrapper content\n',
    );
    expect(findSelfManagedPackageDir(depRoot)).toBe(null);
  });

  it('returns <dep>/ios when only the nested manifest exists and lacks the AUTOGEN marker', () => {
    fs.mkdirSync(path.join(depRoot, 'ios'));
    fs.writeFileSync(
      path.join(depRoot, 'ios', 'Package.swift'),
      '// swift-tools-version: 6.0\n// Hand-authored nested manifest.\n',
    );
    expect(findSelfManagedPackageDir(depRoot)).toBe(path.join(depRoot, 'ios'));
  });

  it('prefers the root manifest when both root and nested manifests exist', () => {
    fs.writeFileSync(
      path.join(depRoot, 'Package.swift'),
      '// Root manifest.\n',
    );
    fs.mkdirSync(path.join(depRoot, 'ios'));
    fs.writeFileSync(
      path.join(depRoot, 'ios', 'Package.swift'),
      '// Nested manifest.\n',
    );
    expect(findSelfManagedPackageDir(depRoot)).toBe(depRoot);
  });

  it('falls back to the nested manifest when the root one is autolinker-generated', () => {
    // Models the transition state: dep was previously autolinker-wrapped and
    // recently shipped its own ios/Package.swift. The root file (a leftover
    // synth manifest from a prior run) shouldn't shadow the hand-authored one.
    fs.writeFileSync(
      path.join(depRoot, 'Package.swift'),
      AUTOGEN_MARKER + '\n// stale synth\n',
    );
    fs.mkdirSync(path.join(depRoot, 'ios'));
    fs.writeFileSync(
      path.join(depRoot, 'ios', 'Package.swift'),
      '// Hand-authored nested manifest.\n',
    );
    expect(findSelfManagedPackageDir(depRoot)).toBe(path.join(depRoot, 'ios'));
  });
});

// ---------------------------------------------------------------------------
// hasPodspec — does the dep ship a podspec (auto-scaffoldable)?
// ---------------------------------------------------------------------------
describe('hasPodspec', () => {
  let depRoot;

  beforeEach(() => {
    depRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-podspec-'));
  });

  afterEach(() => {
    fs.rmSync(depRoot, {recursive: true, force: true});
  });

  it('returns false when no .podspec exists at the root or under ios/', () => {
    expect(hasPodspec(depRoot)).toBe(false);
  });

  it('returns true for a .podspec at the dep root', () => {
    fs.writeFileSync(path.join(depRoot, 'Foo.podspec'), '# podspec');
    expect(hasPodspec(depRoot)).toBe(true);
  });

  it('returns true for a .podspec under ios/', () => {
    fs.mkdirSync(path.join(depRoot, 'ios'));
    fs.writeFileSync(path.join(depRoot, 'ios', 'Foo.podspec'), '# podspec');
    expect(hasPodspec(depRoot)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Missing-manifest error — the gate that replaced the silent synth wrapper
// for community npm deps. The `error:` line prefix is the load-bearing
// contract: Xcode parses it to render a build error.
// ---------------------------------------------------------------------------
describe('MissingManifestError + reportMissingManifests', () => {
  let errSpy;

  beforeEach(() => {
    errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errSpy.mockRestore();
  });

  it('carries the dep list and a scaffold instruction on the error', () => {
    const deps = [{name: 'Foo', npmName: 'react-native-foo', hasPodspec: true}];
    const err = new MissingManifestError(deps);
    expect(err).toBeInstanceOf(Error);
    expect(err.missingManifests).toEqual(deps);
    expect(err.message).toContain('react-native spm scaffold');
  });

  it('emits one `error:`-prefixed line per dep naming the npm package + fix', () => {
    const err = reportMissingManifests([
      {name: 'Foo', npmName: 'react-native-foo', hasPodspec: true},
      {name: 'Bar', npmName: 'react-native-bar', hasPodspec: true},
    ]);
    expect(err).toBeInstanceOf(MissingManifestError);
    expect(errSpy).toHaveBeenCalledTimes(2);
    const lines = errSpy.mock.calls.map(c => c[0]);
    // Xcode only renders the `error: ` headline; each dep is one such message.
    expect(lines.every(l => l.startsWith('error: '))).toBe(true);
    expect(lines[0]).toContain('react-native-foo');
    expect(lines[0]).toContain('npx react-native spm scaffold');
    // The pressure mechanics: persist via patch-package, and the error returns
    // on a fresh node_modules if you don't (no auto-scaffold/auto-restore).
    expect(lines[0]).toContain('patch-package');
    expect(lines[0]).toContain('node_modules is reset');
  });

  it('tells the user a podspec-less dep cannot be auto-scaffolded', () => {
    reportMissingManifests([
      {name: 'Baz', npmName: 'react-native-baz', hasPodspec: false},
    ]);
    const line = errSpy.mock.calls[0][0];
    expect(line.startsWith('error: ')).toBe(true);
    expect(line).toContain('no podspec');
    expect(line).toContain('react-native-baz');
  });

  it('gives a mixed-language dep a DISTINCT error (not "run scaffold") with an opt-out + binary path', () => {
    reportMissingManifests([
      {
        name: 'Screens',
        npmName: 'react-native-screens',
        hasPodspec: true,
        mixed: true,
      },
    ]);
    const line = errSpy.mock.calls[0][0];
    expect(line.startsWith('error: ')).toBe(true);
    expect(line).toContain('mixed Swift');
    // Must NOT tell them to scaffold — scaffolding can't fix mixed-language.
    expect(line).not.toContain('react-native spm scaffold');
    // The two real escape hatches:
    expect(line).toContain('react-native.config.js'); // opt out of autolinking
    expect(line).toContain('platforms: { ios: null }');
    expect(line).toContain('xcframework'); // or consume as a prebuilt binary
  });
});

describe('hasMixedLanguageSources', () => {
  let root;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-mixed-'));
  });

  afterEach(() => {
    fs.rmSync(root, {recursive: true, force: true});
  });

  it('is true when both .swift and .mm exist under the source dir (screens shape)', () => {
    fs.mkdirSync(path.join(root, 'ios'), {recursive: true});
    fs.writeFileSync(path.join(root, 'ios', 'RNSScreen.swift'), '');
    fs.writeFileSync(path.join(root, 'ios', 'RNSScreen.mm'), '');
    expect(hasMixedLanguageSources(root)).toBe(true);
  });

  it('is false for a pure-ObjC++ lib (svg/skia shape)', () => {
    fs.mkdirSync(path.join(root, 'apple'), {recursive: true});
    fs.writeFileSync(path.join(root, 'apple', 'A.mm'), '');
    fs.writeFileSync(path.join(root, 'apple', 'B.h'), '');
    expect(hasMixedLanguageSources(root)).toBe(false);
  });

  it('ignores .swift that lives only under example/ or __tests__ (not real sources)', () => {
    fs.mkdirSync(path.join(root, 'ios'), {recursive: true});
    fs.writeFileSync(path.join(root, 'ios', 'A.mm'), '');
    fs.mkdirSync(path.join(root, 'example', 'ios'), {recursive: true});
    fs.writeFileSync(path.join(root, 'example', 'ios', 'App.swift'), '');
    expect(hasMixedLanguageSources(root)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// main() — autolinking plugin host exemption
//
// A dep that declares an autolinking plugin OWNS its native contribution (the
// plugin returns its package/product deps). RN must NOT also try to
// source-build that dep through the community-lib path: a plugin host like
// Expo typically ships no Package.swift and is mixed Swift/ObjC, so the
// community-lib path would raise MissingManifestError before the plugin ever
// runs. The regression pair below pins that exemption down — the negative
// control proves it is load-bearing (remove the plugin and the SAME dep throws).
// ---------------------------------------------------------------------------

describe('main() — autolinking plugin host exemption', () => {
  let created = [];
  let spies = [];

  beforeEach(() => {
    // Silence the [generate-spm-autolinking] logger (console.log/warn/error).
    for (const m of ['log', 'warn', 'error']) {
      spies.push(jest.spyOn(console, m).mockImplementation(() => {}));
    }
  });

  afterEach(() => {
    for (const s of spies) s.mockRestore();
    spies = [];
    for (const d of created) fs.rmSync(d, {recursive: true, force: true});
    created = [];
  });

  // Builds a minimal app fixture whose ONLY autolinked iOS dep is `expo`, which
  // ships NO Package.swift. When `withPlugin` is set, expo declares an
  // autolinking plugin in its own react-native.config.js (transitive opt-in).
  function buildFixture({withPlugin}) {
    const appRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-plugin-host-'));
    created.push(appRoot);
    // rnRoot only needs to exist (main() existence-checks it, then passes it
    // through as context.reactNativeRoot).
    const rnRoot = path.join(appRoot, 'rn');
    fs.mkdirSync(rnRoot, {recursive: true});
    // package.json so findProjectRoot() resolves to appRoot.
    fs.writeFileSync(
      path.join(appRoot, 'package.json'),
      JSON.stringify({name: 'app'}),
    );
    // The plugin-host dep: native sources present, but NO Package.swift.
    const expoDir = path.join(appRoot, 'node_modules', 'expo');
    fs.mkdirSync(path.join(expoDir, 'ios'), {recursive: true});
    fs.writeFileSync(
      path.join(expoDir, 'ios', 'Expo.mm'),
      '// native source\n',
    );
    if (withPlugin) {
      fs.writeFileSync(
        path.join(expoDir, 'react-native.config.js'),
        "module.exports = { spm: { autolinkingPlugin: './spm-plugin.js' } };\n",
      );
      fs.writeFileSync(
        path.join(expoDir, 'spm-plugin.js'),
        'module.exports = function () {\n' +
          '  return {\n' +
          "    packageDependencies: [{name: 'ExpoModulesCore', path: '../../../../node_modules/expo/ios'}],\n" +
          "    productDependencies: [{name: 'ExpoModulesCore', package: 'ExpoModulesCore'}],\n" +
          '  };\n' +
          '};\n',
      );
    }
    const autolinkDir = path.join(appRoot, 'build', 'generated', 'autolinking');
    fs.mkdirSync(autolinkDir, {recursive: true});
    fs.writeFileSync(
      path.join(autolinkDir, 'autolinking.json'),
      JSON.stringify({
        dependencies: {expo: {root: expoDir, platforms: {ios: {}}}},
      }),
    );
    return {appRoot, rnRoot};
  }

  it('exempts a plugin-host dep from source-building (no MissingManifestError; plugin contribution merged)', () => {
    const {appRoot, rnRoot} = buildFixture({withPlugin: true});
    expect(() =>
      main(['--app-root', appRoot, '--react-native-root', rnRoot]),
    ).not.toThrow();

    const pkg = fs.readFileSync(
      path.join(appRoot, 'build/generated/autolinking/Package.swift'),
      'utf8',
    );
    // The plugin's contribution is present …
    expect(pkg).toContain('.package(name: "ExpoModulesCore"');
    expect(pkg).toContain(
      '.product(name: "ExpoModulesCore", package: "ExpoModulesCore")',
    );
    // … and expo is NOT source-built as a community lib: no wrapper package
    // reference and no eval-time missing-manifest guard.
    expect(pkg).not.toContain('path: "packages/');
    expect(pkg).not.toContain('__rnAutolinkedLibs');
  });

  it('negative control: without the plugin declaration the SAME dep throws MissingManifestError (exemption is load-bearing)', () => {
    const {appRoot, rnRoot} = buildFixture({withPlugin: false});
    expect(() =>
      main(['--app-root', appRoot, '--react-native-root', rnRoot]),
    ).toThrow(MissingManifestError);
  });
});

// ---------------------------------------------------------------------------
// main() — plugin flavoredFrameworks sidecar
//
// Both plugin sidecars (.spm-plugin-flavored-frameworks.json, consumed by
// artifact preparation, and .spm-plugin-generated-sources.json, consumed by
// the injector) are ALWAYS rewritten — `[]` when no plugin
// declares any — so removing a plugin clears stale entries.
// ---------------------------------------------------------------------------

describe('main() — flavoredFrameworks sidecar', () => {
  let created = [];
  let spies = [];

  beforeEach(() => {
    for (const m of ['log', 'warn', 'error']) {
      spies.push(jest.spyOn(console, m).mockImplementation(() => {}));
    }
  });
  afterEach(() => {
    for (const s of spies) s.mockRestore();
    spies = [];
    for (const d of created) fs.rmSync(d, {recursive: true, force: true});
    created = [];
  });

  const sidecarPath = appRoot =>
    path.join(
      appRoot,
      'build',
      'generated',
      'autolinking',
      '.spm-plugin-flavored-frameworks.json',
    );

  function scaffold(autolinkingDeps) {
    const appRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-flavart-'));
    created.push(appRoot);
    const rnRoot = path.join(appRoot, 'rn');
    fs.mkdirSync(rnRoot, {recursive: true});
    fs.writeFileSync(
      path.join(appRoot, 'package.json'),
      JSON.stringify({name: 'app'}),
    );
    const autolinkDir = path.join(appRoot, 'build', 'generated', 'autolinking');
    fs.mkdirSync(autolinkDir, {recursive: true});
    fs.writeFileSync(
      path.join(autolinkDir, 'autolinking.json'),
      JSON.stringify({dependencies: autolinkingDeps}),
    );
    return {appRoot, rnRoot};
  }

  it('writes [] to the generated-sources sidecar when no plugin declares any (clears stale entries)', () => {
    const {appRoot, rnRoot} = scaffold({});
    const genSourcesPath = path.join(
      path.dirname(sidecarPath(appRoot)),
      '.spm-plugin-generated-sources.json',
    );
    // Pre-seed a stale manifest to prove it is overwritten, not left alone —
    // the injector's reconciliation trusts this file, so a full plugin
    // removal must reset it to [].
    fs.writeFileSync(genSourcesPath, JSON.stringify([{path: '/stale.swift'}]));
    main(['--app-root', appRoot, '--react-native-root', rnRoot]);
    expect(JSON.parse(fs.readFileSync(genSourcesPath, 'utf8'))).toEqual([]);
  });

  it('writes [] when no plugin declares flavored artifacts (clears stale entries)', () => {
    const {appRoot, rnRoot} = scaffold({});
    // Pre-seed a stale sidecar to prove it is overwritten, not left alone.
    fs.writeFileSync(sidecarPath(appRoot), JSON.stringify([{id: 'stale'}]));
    main(['--app-root', appRoot, '--react-native-root', rnRoot]);
    expect(JSON.parse(fs.readFileSync(sidecarPath(appRoot), 'utf8'))).toEqual(
      [],
    );
  });

  it('records a plugin-declared flavored framework to the sidecar', () => {
    const {appRoot, rnRoot} = scaffold({
      expo: {
        root: path.join('__EXPO__'),
        platforms: {ios: {}},
      },
    });
    const expoDir = path.join(appRoot, 'node_modules', 'expo');
    fs.mkdirSync(path.join(expoDir, 'ios'), {recursive: true});
    fs.writeFileSync(path.join(expoDir, 'ios', 'Expo.mm'), '// native\n');
    // Point autolinking.json's expo root at the real dir.
    fs.writeFileSync(
      path.join(
        appRoot,
        'build',
        'generated',
        'autolinking',
        'autolinking.json',
      ),
      JSON.stringify({
        dependencies: {expo: {root: expoDir, platforms: {ios: {}}}},
      }),
    );
    fs.writeFileSync(
      path.join(expoDir, 'react-native.config.js'),
      "module.exports = { spm: { autolinkingPlugin: './spm-plugin.js' } };\n",
    );
    fs.writeFileSync(
      path.join(expoDir, 'spm-plugin.js'),
      'module.exports = function () {\n' +
        '  return {\n' +
        "    packageDependencies: [{name: 'ExpoModulesCore', path: '../../../../node_modules/expo/ios'}],\n" +
        "    productDependencies: [{name: 'ExpoModulesCore', package: 'ExpoModulesCore'}],\n" +
        '    flavoredFrameworks: [{\n' +
        "      id: 'expo-modules-core',\n" +
        "      frameworkName: 'ExpoModulesCore',\n" +
        "      linkage: 'dynamic',\n" +
        "      flavors: {debug: '/abs/debug/ExpoModulesCore.xcframework', release: '/abs/release/ExpoModulesCore.xcframework'},\n" +
        '    }],\n' +
        '  };\n' +
        '};\n',
    );

    main(['--app-root', appRoot, '--react-native-root', rnRoot]);

    expect(JSON.parse(fs.readFileSync(sidecarPath(appRoot), 'utf8'))).toEqual([
      {
        id: 'expo-modules-core',
        frameworkName: 'ExpoModulesCore',
        linkage: 'dynamic',
        flavors: {
          debug: '/abs/debug/ExpoModulesCore.xcframework',
          release: '/abs/release/ExpoModulesCore.xcframework',
        },
      },
    ]);
  });
});

// ---------------------------------------------------------------------------
// main() — .spm-sync-watch-paths emission (mixed dirs + files)
//
// The watch file drives the Xcode auto-sync stale check. It must carry, mixed
// and deduped/sorted: (1) each module's source DIR; (2) each npm dep's
// checked-in root Package.swift (FILE) and .react-native/ (DIR) — threaded from
// the autolinking model's dep root, not derived by walking up; (3) plugin
// watchPaths. Nonexistent paths are filtered at emission time.
// ---------------------------------------------------------------------------

describe('main() — .spm-sync-watch-paths emission', () => {
  let created = [];
  let spies = [];

  beforeEach(() => {
    for (const m of ['log', 'warn', 'error']) {
      spies.push(jest.spyOn(console, m).mockImplementation(() => {}));
    }
  });
  afterEach(() => {
    for (const s of spies) s.mockRestore();
    spies = [];
    for (const d of created) fs.rmSync(d, {recursive: true, force: true});
    created = [];
  });

  function readWatchLines(appRoot) {
    const contents = fs.readFileSync(
      path.join(appRoot, 'build/generated/autolinking/.spm-sync-watch-paths'),
      'utf8',
    );
    return contents.split('\n').filter(l => l.length > 0);
  }

  it('emits source dirs + dep manifests + .react-native dirs + plugin paths, deduped and sorted', () => {
    // realpath so paths derived here match a plugin's realpath'd __dirname
    // (macOS /var → /private/var symlink).
    const appRoot = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'spm-watch-emit-')),
    );
    created.push(appRoot);
    const rnRoot = path.join(appRoot, 'rn');
    fs.mkdirSync(rnRoot, {recursive: true});
    fs.writeFileSync(
      path.join(appRoot, 'package.json'),
      JSON.stringify({name: 'app'}),
    );

    // (B) A self-managed community dep: root Package.swift (no AUTOGEN marker)
    // makes it self-managed; it also ships a .react-native/ metadata dir.
    const fooDir = path.join(appRoot, 'node_modules', 'react-native-foo');
    fs.mkdirSync(fooDir, {recursive: true});
    fs.writeFileSync(
      path.join(fooDir, 'Package.swift'),
      '// swift-tools-version:5.9\n// hand-authored\n',
    );
    fs.mkdirSync(path.join(fooDir, '.react-native'));
    fs.writeFileSync(path.join(fooDir, '.react-native', 'meta.json'), '{}\n');
    fs.writeFileSync(path.join(fooDir, 'Foo.swift'), '// src\n');

    // (C) A plugin-host dep contributing watchPaths: one existing absolute path
    // (kept), one absent absolute path (filtered at emission), one relative
    // path (dropped by invokePlugins).
    const expoDir = path.join(appRoot, 'node_modules', 'expo');
    fs.mkdirSync(path.join(expoDir, 'ios'), {recursive: true});
    fs.writeFileSync(path.join(expoDir, 'ios', 'Expo.mm'), '// native\n');
    fs.writeFileSync(path.join(expoDir, 'Package.swift'), '// expo manifest\n');
    fs.writeFileSync(
      path.join(expoDir, 'react-native.config.js'),
      "module.exports = { spm: { autolinkingPlugin: './spm-plugin.js' } };\n",
    );
    fs.writeFileSync(
      path.join(expoDir, 'spm-plugin.js'),
      [
        "const path = require('path');",
        'module.exports = function () {',
        '  return {',
        "    packageDependencies: [{name: 'ExpoModulesCore', path: '../../../../node_modules/expo/ios'}],",
        "    productDependencies: [{name: 'ExpoModulesCore', package: 'ExpoModulesCore'}],",
        '    watchPaths: [',
        "      path.join(__dirname, 'Package.swift'),", // exists → kept
        "      path.join(__dirname, 'MISSING.swift'),", // absent → filtered at emission
        "      'rel/manifest',", // relative → dropped by invokePlugins
        '    ],',
        '  };',
        '};',
      ].join('\n') + '\n',
    );

    const autolinkDir = path.join(appRoot, 'build', 'generated', 'autolinking');
    fs.mkdirSync(autolinkDir, {recursive: true});
    fs.writeFileSync(
      path.join(autolinkDir, 'autolinking.json'),
      JSON.stringify({
        dependencies: {
          'react-native-foo': {root: fooDir, platforms: {ios: {}}},
          expo: {root: expoDir, platforms: {ios: {}}},
        },
      }),
    );

    main(['--app-root', appRoot, '--react-native-root', rnRoot]);

    const lines = readWatchLines(appRoot);

    // (A/B) foo's source dir, root manifest FILE, and .react-native DIR.
    expect(lines).toContain(fooDir);
    expect(lines).toContain(path.join(fooDir, 'Package.swift'));
    expect(lines).toContain(path.join(fooDir, '.react-native'));

    // (C) plugin's existing absolute watchPath is kept.
    expect(lines).toContain(path.join(expoDir, 'Package.swift'));

    // Filtered / dropped entries never reach the file.
    expect(lines.some(l => l.includes('MISSING.swift'))).toBe(false);
    expect(lines.some(l => l.includes('rel/manifest'))).toBe(false);

    // Deduped and sorted (stable, deterministic output).
    expect(new Set(lines).size).toBe(lines.length);
    expect([...lines].sort()).toEqual(lines);
  });
});

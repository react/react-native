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

const {flattenSubspecs, readPodspec, regexPodspec} = require('../read-podspec');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Real-world podspec fixtures inlined as strings. The regex parser is tested
// against these directly; flattenSubspecs is tested against pod-ipc-style
// JSON objects that match what `pod ipc spec` actually emits.

const SAFE_AREA_PODSPEC = `
require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-safe-area-context"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]
  s.platforms    = { :ios => "12.4", :tvos => "12.4", :osx => "10.15" }
  s.source       = { :git => package["repository"]["url"], :tag => "#{s.version}" }
  s.source_files = "ios/**/*.{h,m,mm}"
  s.dependency "React-Core"
end
`;

const SIMPLE_LIB_PODSPEC = `
Pod::Spec.new do |s|
  s.name = "react-native-foo"
  s.version = "1.2.3"
  s.source_files = "ios/**/*.{h,m,mm}"
  s.public_header_files = "ios/**/*.h"
  s.framework = "UIKit"
  s.frameworks = ["Foundation", "CoreGraphics"]
  s.dependency "React-Core"
  s.dependency "React-jsi"
end
`;

const REANIMATED_LIKE_PODSPEC = `
Pod::Spec.new do |s|
  s.name = "RNReanimated"
  s.version = "1.0.0"
  s.dependency "RNWorklets"
  install_modules_dependencies(s)
  s.subspec "common" do |ss|
    ss.source_files = "Common/cpp/reanimated/**/*.{cpp,h}"
    ss.header_mappings_dir = "Common/cpp/reanimated"
    ss.header_dir = "reanimated"
  end
  s.subspec "apple" do |ss|
    ss.source_files = "apple/reanimated/**/*.{mm,h,m}"
    ss.header_mappings_dir = "apple/reanimated"
  end
end
`;

const HEADER_SEARCH_PATHS_PODSPEC = `
Pod::Spec.new do |s|
  s.name = "react-native-thing"
  s.version = "1.0"
  s.source_files = "ios/**/*.{h,m,mm}"
  s.pod_target_xcconfig = {
    "HEADER_SEARCH_PATHS" => "\\"$(PODS_TARGET_SRCROOT)/common/cpp\\""
  }
end
`;

// Helper: write a fixture to a temp file and return its path.
function writeFixture(name, content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-podspec-'));
  const file = path.join(dir, name);
  fs.writeFileSync(file, content);
  return {file, dir};
}

// ---------------------------------------------------------------------------
// regexPodspec — best-effort fallback when CocoaPods isn't available.
// Should handle simple RN libs cleanly and degrade gracefully on subspecs /
// install_modules_dependencies() (warns + partial = true).
// ---------------------------------------------------------------------------

describe('regexPodspec', () => {
  it('extracts name, version, source_files, dependency from a real-world simple podspec', () => {
    const {file, dir} = writeFixture(
      'react-native-safe-area-context.podspec',
      SAFE_AREA_PODSPEC,
    );
    try {
      const raw = regexPodspec(file);
      expect(raw.name).toBe('react-native-safe-area-context');
      expect(raw.source_files).toEqual(['ios/**/*.{h,m,mm}']);
      expect(raw.dependencies).toEqual(['React-Core']);
    } finally {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  it('handles s.framework (singular method call) and s.frameworks (array assignment) together', () => {
    const {file, dir} = writeFixture('simple.podspec', SIMPLE_LIB_PODSPEC);
    try {
      const raw = regexPodspec(file);
      expect(raw.frameworks.sort()).toEqual([
        'CoreGraphics',
        'Foundation',
        'UIKit',
      ]);
    } finally {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  it('collects multiple s.dependency lines in declaration order', () => {
    const {file, dir} = writeFixture('simple.podspec', SIMPLE_LIB_PODSPEC);
    try {
      const raw = regexPodspec(file);
      expect(raw.dependencies).toEqual(['React-Core', 'React-jsi']);
    } finally {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  it('extracts pod_target_xcconfig HEADER_SEARCH_PATHS (string form), preserving the $(PODS_TARGET_SRCROOT) token', () => {
    const {file, dir} = writeFixture(
      'hsp.podspec',
      HEADER_SEARCH_PATHS_PODSPEC,
    );
    try {
      const raw = regexPodspec(file);
      const hsp = raw.pod_target_xcconfig.HEADER_SEARCH_PATHS;
      expect(hsp).toContain('$(PODS_TARGET_SRCROOT)/common/cpp');
    } finally {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  it('warns on subspec blocks and install_modules_dependencies() so callers know coverage is partial', () => {
    const {file, dir} = writeFixture(
      'subspec.podspec',
      REANIMATED_LIKE_PODSPEC,
    );
    try {
      const raw = regexPodspec(file);
      expect(raw.__warnings__.some(w => /Subspecs detected/.test(w))).toBe(
        true,
      );
      expect(
        raw.__warnings__.some(w => /install_modules_dependencies/.test(w)),
      ).toBe(true);
      expect(raw.__regex_partial__).toBe(true);
    } finally {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  it('marks output as partial so flattenSubspecs can propagate to the PodspecModel', () => {
    const {file, dir} = writeFixture('simple.podspec', SIMPLE_LIB_PODSPEC);
    try {
      const raw = regexPodspec(file);
      expect(raw.__regex_partial__).toBe(true);
    } finally {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });
});

// ---------------------------------------------------------------------------
// flattenSubspecs — merges default_subspecs (or all subspecs) into a single
// logical PodspecModel. Tested with pod-ipc-shaped objects directly, since
// that's the shape that exercises the merging logic (regex doesn't extract
// subspec bodies).
// ---------------------------------------------------------------------------

describe('flattenSubspecs', () => {
  it('returns a model from a top-level-only spec without touching subspecs', () => {
    const raw = {
      name: 'react-native-foo',
      version: '1.0',
      source_files: 'ios/**/*.{h,m,mm}',
      dependencies: {'React-Core': []},
    };
    const model = flattenSubspecs(raw);
    expect(model.name).toBe('react-native-foo');
    expect(model.version).toBe('1.0');
    expect(model.sourceFiles).toEqual(['ios/**/*.{h,m,mm}']);
    expect(model.dependencies).toEqual(['React-Core']);
    expect(model.partial).toBe(false);
  });

  it('lifts preprocessor defines from OTHER_CFLAGS + GCC_PREPROCESSOR_DEFINITIONS (worklets shape)', () => {
    const raw = {
      name: 'RNWorklets',
      version: '0.9.2',
      pod_target_xcconfig: {
        OTHER_CFLAGS:
          '$(inherited) -DWORKLETS_FEATURE_FLAGS="[A:false][B:true]" -DWORKLETS_VERSION=0.9.2    ',
        'GCC_PREPROCESSOR_DEFINITIONS[config=*Debug*]':
          '$(inherited) HERMES_ENABLE_DEBUGGER=1',
        'GCC_PREPROCESSOR_DEFINITIONS[config=*Release*]': '$(inherited)',
      },
    };
    const model = flattenSubspecs(raw);
    const byName = Object.fromEntries(
      model.preprocessorDefines.map(d => [d.name, d]),
    );
    // Quoted string-literal value kept intact (incl. its quotes).
    expect(byName.WORKLETS_FEATURE_FLAGS).toEqual({
      name: 'WORKLETS_FEATURE_FLAGS',
      value: '"[A:false][B:true]"',
      config: null,
    });
    expect(byName.WORKLETS_VERSION).toEqual({
      name: 'WORKLETS_VERSION',
      value: '0.9.2',
      config: null,
    });
    // Per-config define scoped to debug; $(inherited) dropped.
    expect(byName.HERMES_ENABLE_DEBUGGER).toEqual({
      name: 'HERMES_ENABLE_DEBUGGER',
      value: '1',
      config: 'debug',
    });
    expect(model.preprocessorDefines).toHaveLength(3);
  });

  it('parses a multi-path HEADER_SEARCH_PATHS string with embedded quotes + recursive /** (skia shape)', () => {
    const raw = {
      name: 'react-native-skia',
      version: '1.0',
      pod_target_xcconfig: {
        HEADER_SEARCH_PATHS:
          '"$(PODS_TARGET_SRCROOT)/cpp/"/** "$(PODS_TARGET_SRCROOT)/cpp" "$(PODS_TARGET_SRCROOT)/cpp/skia" "$(PODS_TARGET_SRCROOT)/cpp/dawn/include"',
      },
    };
    const model = flattenSubspecs(raw);
    // Each space-separated, individually-quoted path becomes its own entry
    // (quotes stripped); the `/**` recursive marker is preserved for translate.
    expect(model.headerSearchPaths).toEqual([
      '$(PODS_TARGET_SRCROOT)/cpp//**',
      '$(PODS_TARGET_SRCROOT)/cpp',
      '$(PODS_TARGET_SRCROOT)/cpp/skia',
      '$(PODS_TARGET_SRCROOT)/cpp/dawn/include',
    ]);
  });

  it('lifts defines from s.xcconfig too, not just pod_target_xcconfig (reanimated shape)', () => {
    const raw = {
      name: 'RNReanimated',
      version: '4.4.1',
      // reanimated declares its version define in `s.xcconfig`, not
      // pod_target_xcconfig (where worklets puts it).
      xcconfig: {
        OTHER_CFLAGS: '$(inherited) -DREANIMATED_VERSION=4.4.1',
      },
      pod_target_xcconfig: {
        'GCC_PREPROCESSOR_DEFINITIONS[config=*Debug*]':
          '$(inherited) HERMES_ENABLE_DEBUGGER=1',
      },
    };
    const model = flattenSubspecs(raw);
    const byName = Object.fromEntries(
      model.preprocessorDefines.map(d => [d.name, d]),
    );
    expect(byName.REANIMATED_VERSION).toEqual({
      name: 'REANIMATED_VERSION',
      value: '4.4.1',
      config: null,
    });
    expect(byName.HERMES_ENABLE_DEBUGGER.config).toBe('debug');
  });

  it('drops non-define flags and unresolved tokens from OTHER_CFLAGS', () => {
    const raw = {
      name: 'foo',
      version: '1',
      pod_target_xcconfig: {
        OTHER_CFLAGS:
          '-Wno-comma -gen-cdb-fragment-path build/cdb -DGOOD=1 -D$(BAD_TOKEN)=x -DALSO_GOOD',
      },
    };
    const model = flattenSubspecs(raw);
    const names = model.preprocessorDefines.map(d => d.name).sort();
    // Only the two valid -D defines survive; -W / -gen-cdb-fragment-path and
    // the unresolved $(...) token are dropped.
    expect(names).toEqual(['ALSO_GOOD', 'GOOD']);
    expect(
      model.preprocessorDefines.find(d => d.name === 'ALSO_GOOD').value,
    ).toBe(null);
  });

  it('unions source_files across selected subspecs', () => {
    const raw = {
      name: 'foo',
      version: '1',
      source_files: 'top/**/*.h',
      subspecs: [
        {name: 'common', source_files: 'Common/cpp/**/*.cpp'},
        {name: 'apple', source_files: 'apple/**/*.mm'},
      ],
      default_subspecs: ['common', 'apple'],
    };
    const model = flattenSubspecs(raw);
    expect(model.sourceFiles.sort()).toEqual([
      'Common/cpp/**/*.cpp',
      'apple/**/*.mm',
      'top/**/*.h',
    ]);
  });

  it('selects ALL subspecs when default_subspecs is unset (matches CocoaPods behavior)', () => {
    const raw = {
      name: 'foo',
      version: '1',
      subspecs: [
        {name: 'a', source_files: 'a/**/*.h'},
        {name: 'b', source_files: 'b/**/*.h'},
      ],
    };
    const model = flattenSubspecs(raw);
    expect(model.sourceFiles.sort()).toEqual(['a/**/*.h', 'b/**/*.h']);
  });

  it('honors default_subspecs by name — non-default subspecs are excluded', () => {
    const raw = {
      name: 'foo',
      version: '1',
      subspecs: [
        {name: 'core', source_files: 'core/**/*.h'},
        {name: 'optional', source_files: 'optional/**/*.h'},
      ],
      default_subspecs: ['core'],
    };
    const model = flattenSubspecs(raw);
    expect(model.sourceFiles).toEqual(['core/**/*.h']);
    expect(model.sourceFiles).not.toContain('optional/**/*.h');
  });

  it('merges pod_target_xcconfig HEADER_SEARCH_PATHS across subspecs and dedupes', () => {
    const raw = {
      name: 'foo',
      version: '1',
      subspecs: [
        {
          name: 'a',
          pod_target_xcconfig: {
            HEADER_SEARCH_PATHS:
              '"$(PODS_TARGET_SRCROOT)/a/cpp" "$(PODS_TARGET_SRCROOT)/shared"',
          },
        },
        {
          name: 'b',
          pod_target_xcconfig: {
            HEADER_SEARCH_PATHS: ['"$(PODS_TARGET_SRCROOT)/shared"'],
          },
        },
      ],
    };
    const model = flattenSubspecs(raw);
    expect(model.headerSearchPaths).toEqual(
      expect.arrayContaining([
        '$(PODS_TARGET_SRCROOT)/a/cpp',
        '$(PODS_TARGET_SRCROOT)/shared',
      ]),
    );
    // dedup
    const sharedCount = model.headerSearchPaths.filter(
      p => p === '$(PODS_TARGET_SRCROOT)/shared',
    ).length;
    expect(sharedCount).toBe(1);
  });

  it('takes the first non-null header_mappings_dir (subspec layer-walk order)', () => {
    const raw = {
      name: 'foo',
      version: '1',
      // top-level has no mappings_dir
      subspecs: [
        {name: 'common', header_mappings_dir: 'Common/cpp/foo'},
        {name: 'apple', header_mappings_dir: 'apple/foo'},
      ],
    };
    const model = flattenSubspecs(raw);
    expect(model.headerMappingsDir).toBe('Common/cpp/foo');
  });

  it('accepts dependencies as a pod-ipc hash {name: [version]} OR as an array (regex fallback shape)', () => {
    const fromIpc = flattenSubspecs({
      name: 'foo',
      version: '1',
      dependencies: {'React-Core': [], 'React-jsi': ['1.0']},
    });
    expect(fromIpc.dependencies.sort()).toEqual(['React-Core', 'React-jsi']);

    const fromRegex = flattenSubspecs({
      name: 'foo',
      version: '1',
      dependencies: ['React-Core', 'React-jsi'],
    });
    expect(fromRegex.dependencies.sort()).toEqual(['React-Core', 'React-jsi']);
  });

  it('tokenizes compiler_flags from either string ("a b c") or array form', () => {
    const a = flattenSubspecs({
      name: 'foo',
      version: '1',
      compiler_flags: '-Wno-documentation -fno-rtti',
    });
    expect(a.compilerFlags).toEqual(['-Wno-documentation', '-fno-rtti']);

    const b = flattenSubspecs({
      name: 'foo',
      version: '1',
      compiler_flags: ['-Wno-documentation', '-fno-rtti'],
    });
    expect(b.compilerFlags).toEqual(['-Wno-documentation', '-fno-rtti']);
  });

  it('propagates __regex_partial__ + __warnings__ from the regex fallback into the PodspecModel', () => {
    const raw = {
      name: 'foo',
      version: '1',
      __regex_partial__: true,
      __warnings__: [
        'Subspecs detected',
        'install_modules_dependencies detected',
      ],
    };
    const model = flattenSubspecs(raw);
    expect(model.partial).toBe(true);
    expect(model.warnings.length).toBe(2);
  });

  it('defaults requires_arc to true; explicit false is honored', () => {
    expect(flattenSubspecs({name: 'a', version: '1'}).requiresArc).toBe(true);
    expect(
      flattenSubspecs({name: 'a', version: '1', requires_arc: false})
        .requiresArc,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// readPodspec — orchestrator. We can't easily test the pod-ipc branch (would
// require either CocoaPods on the test runner or invasive child-process
// mocking), so we exercise the fallback path: when `pod` isn't on PATH, the
// regex parser kicks in transparently.
// ---------------------------------------------------------------------------

describe('readPodspec', () => {
  it('throws a clear error when the file does not exist', () => {
    expect(() => readPodspec('/no/such/file.podspec')).toThrow(
      /does not exist/,
    );
  });

  it('returns a flattened PodspecModel for a simple podspec (regex fallback path)', () => {
    const {file, dir} = writeFixture('simple.podspec', SIMPLE_LIB_PODSPEC);
    try {
      // We can't force pod-ipc to fail without mocking, but the regex
      // parser produces a complete enough model that the test assertions
      // hold regardless of which branch ran.
      const model = readPodspec(file);
      expect(model.name).toBe('react-native-foo');
      expect(model.version).toBe('1.2.3');
      expect(model.sourceFiles).toContain('ios/**/*.{h,m,mm}');
      expect(model.dependencies).toEqual(
        expect.arrayContaining(['React-Core', 'React-jsi']),
      );
    } finally {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });
});

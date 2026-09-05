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
  flattenSubspecs,
  readPodspec,
  readPodspecNames,
  regexPodspec,
} = require('../read-podspec');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

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

const SCREENS_LIKE_PODSPEC = `
Pod::Spec.new do |s|
  s.name         = "RNScreens"
  s.version      = "4.0.0"
  s.source_files = ["ios/**/*.{h,m,mm}"]

  s.subspec "common" do |ss|
    ss.source_files        = ["common/cpp/**/*.{cpp,h}"]
    ss.header_mappings_dir = "common/cpp"
    ss.header_dir          = "rnscreens"
  end
end
`;

const SVG_LIKE_PODSPEC = `
Pod::Spec.new do |s|
  s.name = "RNSVG"
  s.version = "15.0.0"
  s.source_files = "apple/**/*.{h,m,mm}"

  s.subspec "common" do |ss|
    ss.source_files = "common/cpp/**/*.{cpp,h}"
    ss.header_dir   = "rnsvg"
  end
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

const MAPS_LIKE_PODSPEC = `
Pod::Spec.new do |s|
  s.name        = "react-native-maps"
  s.module_name = 'ReactNativeMaps'
  s.version     = "1.20.0"
  s.source_files = "ios/**/*.{h,m,mm}"
end
`;

// A subspec that reuses the parent's block variable instead of taking its own:
// inside the block, `s` is the CHILD, so a regex anchored on the receiver
// spelling reads the child's fields as the library's.
const SHADOWING_SUBSPEC_PODSPEC = `
Pod::Spec.new do |s|
  s.name = "ParentPod"
  s.module_name = "ParentModule"
  s.version = "1.0.0"
  s.source_files = "ios/**/*.{h,m,mm}"

  s.subspec "common" do |s|
    s.source_files = "common/cpp/**/*.{cpp,h}"
    s.header_mappings_dir = "common/cpp"
    s.header_dir = "child_prefix"
  end
end
`;

// The same library with the subspec taking its own variable — the unambiguous
// shape, which must keep naming the parent.
const OWN_VARIABLE_SUBSPEC_PODSPEC = `
Pod::Spec.new do |s|
  s.name = "ParentPod"
  s.module_name = "ParentModule"
  s.version = "1.0.0"
  s.source_files = "ios/**/*.{h,m,mm}"

  s.subspec "common" do |ss|
    ss.source_files = "common/cpp/**/*.{cpp,h}"
    ss.header_mappings_dir = "common/cpp"
    ss.header_dir = "child_prefix"
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
  it('reads past comments: a commented-out field never wins, a `#` in a string is not one', () => {
    const {file, dir} = writeFixture(
      'commented.podspec',
      [
        'Pod::Spec.new do |s|',
        '  s.name = "RNSVG" # the pod everyone imports',
        '  s.summary = "# not a comment"',
        '  # s.header_dir = "OldPrefix"',
        '  s.header_dir = "rnsvg"',
        '  # s.header_mappings_dir = "Old/Mappings"',
        'end',
        '',
      ].join('\n'),
    );
    try {
      const raw = regexPodspec(file);
      expect(raw.name).toBe('RNSVG');
      expect(raw.header_dir).toBe('rnsvg');
      // Commented out with no live counterpart: absent, not "Old/Mappings".
      expect(raw.header_mappings_dir).toBeNull();
    } finally {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  it.each([
    ['RNScreens', () => SCREENS_LIKE_PODSPEC],
    ['RNSVG', () => SVG_LIKE_PODSPEC],
  ])(
    'reads no spec-level header_dir when only a subspec declares one (%s)',
    (podName, source) => {
      const {file, dir} = writeFixture(`${podName}.podspec`, source());
      try {
        const raw = regexPodspec(file);
        expect(raw.name).toBe(podName);
        // `ss.header_dir` belongs to that subspec, not to the library.
        expect(raw.header_dir).toBeNull();
      } finally {
        fs.rmSync(dir, {recursive: true, force: true});
      }
    },
  );

  it('reports no identity fields when a subspec rebinds the spec variable', () => {
    const {file, dir} = writeFixture(
      'shadowing.podspec',
      SHADOWING_SUBSPEC_PODSPEC,
    );
    try {
      const raw = regexPodspec(file);
      // The child's `header_dir` is what a receiver-anchored regex would read
      // as the library's own — and the parent's literal fields are no more
      // trustworthy, since the same shadowing hides which scope declared them.
      expect(raw.header_dir).toBeNull();
      expect(raw.module_name).toBeNull();
      expect(raw.name).toBeNull();
      // The fields subspecs are MEANT to contribute to still merge.
      expect(raw.source_files).toEqual(['ios/**/*.{h,m,mm}']);
      expect(raw.header_mappings_dir).toBe('common/cpp');
      expect(raw.__warnings__.join('\n')).toMatch(
        /subspec rebinds the spec variable/,
      );
    } finally {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  it('leaves the flattened model without an identity to name the library by', () => {
    // The pod-unavailable path: these three fields are what the name resolver
    // reads, so nulling them is what makes it fall back to the npm name.
    const {file, dir} = writeFixture(
      'shadowing.podspec',
      SHADOWING_SUBSPEC_PODSPEC,
    );
    try {
      const model = flattenSubspecs(regexPodspec(file));
      expect(model.name).toBe('');
      expect(model.moduleName).toBeNull();
      expect(model.headerDir).toBeNull();
      expect(model.sourceFiles).toEqual(['ios/**/*.{h,m,mm}']);
      expect(model.headerMappingsDirs).toEqual(['common/cpp']);
    } finally {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  it('reads the parent identity when a subspec takes its own variable', () => {
    const {file, dir} = writeFixture(
      'own-variable.podspec',
      OWN_VARIABLE_SUBSPEC_PODSPEC,
    );
    try {
      const raw = regexPodspec(file);
      expect(raw.name).toBe('ParentPod');
      expect(raw.module_name).toBe('ParentModule');
      expect(raw.header_dir).toBeNull();
    } finally {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  it("still reads a subspec's header_mappings_dir, which feeds the search paths", () => {
    const {file, dir} = writeFixture('RNScreens.podspec', SCREENS_LIKE_PODSPEC);
    try {
      const raw = regexPodspec(file);
      expect(raw.header_mappings_dir).toBe('common/cpp');
      expect(raw.source_files).toEqual(['ios/**/*.{h,m,mm}']);
    } finally {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  it('reads a spec-level header_dir even when a subspec declares its own', () => {
    const {file, dir} = writeFixture(
      'core.podspec',
      [
        'Pod::Spec.new do |s|',
        '  s.name = "React-Core"',
        '  s.header_dir = "React"',
        '  s.subspec "cxx" do |ss|',
        '    ss.header_dir = "reactcxx"',
        '  end',
        'end',
        '',
      ].join('\n'),
    );
    try {
      expect(regexPodspec(file).header_dir).toBe('React');
    } finally {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  it('reads a spec-level field written on the block-argument line', () => {
    const {file, dir} = writeFixture(
      'oneline.podspec',
      'Pod::Spec.new do |spec| spec.name = "OneLine"\n  spec.header_dir = "oneline"\nend\n',
    );
    try {
      const raw = regexPodspec(file);
      expect(raw.name).toBe('OneLine');
      expect(raw.header_dir).toBe('oneline');
    } finally {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

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

describe('flattenSubspecs (spec-level identity)', () => {
  it("does not take a subspec's header_dir as the library's", () => {
    const model = flattenSubspecs({
      name: 'RNScreens',
      version: '4.0.0',
      subspecs: [
        {
          name: 'RNScreens/common',
          header_dir: 'rnscreens',
          header_mappings_dir: 'common/cpp',
          source_files: ['common/cpp/**/*.{cpp,h}'],
        },
      ],
    });
    expect(model.name).toBe('RNScreens');
    expect(model.headerDir).toBeNull();
    // Still merged: these drive the header search paths, not the target name.
    expect(model.headerMappingsDirs).toEqual(['common/cpp']);
    expect(model.sourceFiles).toEqual(['common/cpp/**/*.{cpp,h}']);
  });

  it("keeps the spec's own module_name, not a subspec's", () => {
    const model = flattenSubspecs({
      name: 'react-native-maps',
      version: '1.20.0',
      module_name: 'ReactNativeMaps',
      subspecs: [{name: 'react-native-maps/cxx', module_name: 'MapsCxx'}],
    });
    expect(model.moduleName).toBe('ReactNativeMaps');
  });

  it('reports a missing module_name as null', () => {
    const model = flattenSubspecs({name: 'RNSVG', version: '15.0.0'});
    expect(model.moduleName).toBeNull();
  });

  it('keeps a spec-level header_dir', () => {
    const model = flattenSubspecs({
      name: 'React-Core',
      version: '1000.0.0',
      header_dir: 'React',
      subspecs: [{name: 'React-Core/cxx', header_dir: 'reactcxx'}],
    });
    expect(model.headerDir).toBe('React');
  });
});

describe('readPodspecNames', () => {
  it('reads the pod name, and no header_dir the subspecs kept to themselves', () => {
    const {file, dir} = writeFixture(
      'reanimated.podspec',
      REANIMATED_LIKE_PODSPEC,
    );
    try {
      expect(readPodspecNames(file)).toEqual({
        name: 'RNReanimated',
        moduleName: null,
        headerDir: null,
      });
    } finally {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  it.each([
    ['RNScreens', () => SCREENS_LIKE_PODSPEC],
    ['RNSVG', () => SVG_LIKE_PODSPEC],
  ])(
    'names %s from its pod name when only a subspec declares a header_dir',
    (podName, source) => {
      const {file, dir} = writeFixture(`${podName}.podspec`, source());
      try {
        expect(readPodspecNames(file)).toEqual({
          name: podName,
          moduleName: null,
          headerDir: null,
        });
      } finally {
        fs.rmSync(dir, {recursive: true, force: true});
      }
    },
  );

  it('declines when a subspec rebinds the spec variable', () => {
    // `do |s|` puts the child's `header_dir` where the parent's would be, and a
    // regex over flat text cannot see the block scope — so `pod ipc spec`, which
    // evaluates the real Ruby, has to answer instead.
    const {file, dir} = writeFixture(
      'shadowing.podspec',
      SHADOWING_SUBSPEC_PODSPEC,
    );
    try {
      expect(readPodspecNames(file)).toBeNull();
    } finally {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  it('names the parent when a subspec takes its own variable', () => {
    const {file, dir} = writeFixture(
      'own-variable.podspec',
      OWN_VARIABLE_SUBSPEC_PODSPEC,
    );
    try {
      expect(readPodspecNames(file)).toEqual({
        name: 'ParentPod',
        moduleName: 'ParentModule',
        headerDir: null,
      });
    } finally {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  it('reports a missing header_dir as null', () => {
    const {file, dir} = writeFixture('simple.podspec', SIMPLE_LIB_PODSPEC);
    try {
      expect(readPodspecNames(file)).toEqual({
        name: 'react-native-foo',
        moduleName: null,
        headerDir: null,
      });
    } finally {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  it('reads a module_name the pod name alone would lose (react-native-maps)', () => {
    // Without this field the fast path answers with the dashed pod name and
    // `pod ipc spec` never runs, so nothing downstream can see `module_name`.
    const {file, dir} = writeFixture('rnmaps.podspec', MAPS_LIKE_PODSPEC);
    try {
      expect(readPodspecNames(file)).toEqual({
        name: 'react-native-maps',
        moduleName: 'ReactNativeMaps',
        headerDir: null,
      });
    } finally {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  it.each([
    ['interpolation', 's.module_name = "#{package[\'name\']}"'],
    ['a Ruby call', 's.module_name = File.basename(__dir__)'],
  ])(
    'reports nothing when the podspec computes its module_name with %s',
    (_label, declaration) => {
      // Same trap as a computed header_dir: the pod name is literal, but naming
      // from it would ignore the module_name only Ruby can produce.
      const {file, dir} = writeFixture(
        'computed-module-name.podspec',
        [
          'Pod::Spec.new do |s|',
          '  s.name = "react-native-maps"',
          `  ${declaration}`,
          'end',
          '',
        ].join('\n'),
      );
      try {
        expect(readPodspecNames(file)).toBeNull();
      } finally {
        fs.rmSync(dir, {recursive: true, force: true});
      }
    },
  );

  it('reports nothing when the podspec computes its header_dir in Ruby', () => {
    // The literal name must not satisfy the fast path: `header_dir` outranks it,
    // so resolving without it would pick the wrong prefix — and the scaffolder
    // would then write that wrong name into the library's package.json.
    const {file, dir} = writeFixture(
      'computed-header-dir.podspec',
      [
        'Pod::Spec.new do |s|',
        '  s.name = "RNSVG"',
        '  s.version = "1.0"',
        '  s.header_dir = "#{s.name}Headers"',
        'end',
        '',
      ].join('\n'),
    );
    try {
      expect(readPodspecNames(file)).toBeNull();
    } finally {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  it('reports nothing when header_dir is computed by a Ruby call', () => {
    const {file, dir} = writeFixture(
      'ruby-header-dir.podspec',
      [
        'Pod::Spec.new do |s|',
        '  s.name = "RNSVG"',
        '  s.header_dir = File.basename(__dir__)',
        'end',
        '',
      ].join('\n'),
    );
    try {
      expect(readPodspecNames(file)).toBeNull();
    } finally {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  it('treats an interpolated name as unparsed', () => {
    const {file, dir} = writeFixture(
      'interpolated-name.podspec',
      [
        'Pod::Spec.new do |s|',
        '  s.name = "#{package[\'name\']}"',
        '  s.version = "1.0"',
        'end',
        '',
      ].join('\n'),
    );
    try {
      expect(readPodspecNames(file)).toBeNull();
    } finally {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  it('reports nothing when the podspec computes its name in Ruby', () => {
    const {file, dir} = writeFixture(
      'interpolated.podspec',
      [
        'Pod::Spec.new do |s|',
        '  s.name = package["name"]',
        '  s.version = "1.0"',
        'end',
        '',
      ].join('\n'),
    );
    try {
      expect(readPodspecNames(file)).toBeNull();
    } finally {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });
});

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

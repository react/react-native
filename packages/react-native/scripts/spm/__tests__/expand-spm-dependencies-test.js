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

/**
 * Red tests for the transitive dependency expander.
 *
 * Library authors declare transitive native deps in their react-native.config.js:
 *
 *   module.exports = {
 *     dependency: { platforms: { ios: {} } },
 *     spm: { dependencies: ['react-native-test-library-common'] },
 *   };
 *
 * The expander takes the directly-autolinked deps (from autolinking.json) and
 * follows each one's spm.dependencies recursively, resolving names to package
 * roots via Node module resolution. Behavior mirrors podspec `s.dependency`:
 *
 *   - Transitive deps with iOS native code → added as autolinked targets
 *   - Transitive deps without iOS native code → silently skipped
 *   - Deduped by package name (first occurrence wins)
 *   - Cycles are detected (visited set keyed on name)
 *   - Unresolvable names throw with a clear message
 *
 * I/O is injected (readConfig, resolveDep) so the tests stay pure.
 */

const {
  SpmNameCollisionError,
  defaultReadConfig,
  defaultReadPodspec,
  expandSpmDependencies,
  resolveSwiftName,
} = require('../expand-spm-dependencies');
const {
  REACT_HEADERS_TARGET_DIR,
  RESERVED_SWIFT_NAMES,
  toSwiftName,
} = require('../spm-utils');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function makeReadConfig(configs /*: {[string]: ?Object} */) {
  return (root /*: string */) =>
    Object.prototype.hasOwnProperty.call(configs, root) ? configs[root] : null;
}

// The two config readers, from one set of fixtures. Injected so these cases stay
// pure; readSwiftpmConfig itself is covered in swiftpm-config-test.js.
function fixtures(configs /*: {[string]: ?Object} */) {
  const readConfig = makeReadConfig(configs);
  return {readConfig, readSwiftpmConfig: root => readConfig(root)?.spm ?? null};
}

function makeResolveDep(resolutions /*: {[string]: ?string} */) {
  return (name /*: string */) =>
    Object.prototype.hasOwnProperty.call(resolutions, name)
      ? resolutions[name]
      : null;
}

// Keyed by dep root, valued with the podspec facts the reader would return.
function makeReadPodspec(podspecs /*: {[string]: ?Object} */) {
  return (root /*: string */) =>
    Object.prototype.hasOwnProperty.call(podspecs, root)
      ? podspecs[root]
      : null;
}

// ---------------------------------------------------------------------------
// expandSpmDependencies
// ---------------------------------------------------------------------------

describe('expandSpmDependencies', () => {
  it('returns direct deps with auto-derived swiftName when none declare spm.dependencies', () => {
    const direct = [{name: 'a', root: '/a', platforms: {ios: {}}}];
    const result = expandSpmDependencies(direct, {
      ...fixtures({'/a': {}}),
      resolveDep: makeResolveDep({}),
    });
    expect(result).toEqual([
      {
        ...direct[0],
        swiftName: toSwiftName('a'),
        swiftNameSource: 'npm',
        spmDependencies: [],
      },
    ]);
  });

  it('pulls in one transitive dep declared by a direct dep', () => {
    const direct = [{name: 'apple', root: '/apple', platforms: {ios: {}}}];
    const result = expandSpmDependencies(direct, {
      ...fixtures({
        '/apple': {spm: {dependencies: ['common']}},
        '/common': {dependency: {platforms: {ios: {}}}},
      }),
      resolveDep: makeResolveDep({common: '/common'}),
    });
    expect(result.map(d => d.name)).toEqual(['apple', 'common']);
    expect(result[1].root).toBe('/common');
    expect(result[1].platforms.ios).toBeDefined();
  });

  it('recurses through a chain (A → B → C)', () => {
    const direct = [{name: 'a', root: '/a', platforms: {ios: {}}}];
    const result = expandSpmDependencies(direct, {
      ...fixtures({
        '/a': {spm: {dependencies: ['b']}},
        '/b': {
          dependency: {platforms: {ios: {}}},
          spm: {dependencies: ['c']},
        },
        '/c': {dependency: {platforms: {ios: {}}}},
      }),
      resolveDep: makeResolveDep({b: '/b', c: '/c'}),
    });
    expect(result.map(d => d.name)).toEqual(['a', 'b', 'c']);
  });

  it('handles cycles without infinite recursion (A → B → A)', () => {
    const direct = [{name: 'a', root: '/a', platforms: {ios: {}}}];
    const result = expandSpmDependencies(direct, {
      ...fixtures({
        '/a': {
          dependency: {platforms: {ios: {}}},
          spm: {dependencies: ['b']},
        },
        '/b': {
          dependency: {platforms: {ios: {}}},
          spm: {dependencies: ['a']},
        },
      }),
      resolveDep: makeResolveDep({a: '/a', b: '/b'}),
    });
    expect(result.map(d => d.name).sort()).toEqual(['a', 'b']);
  });

  it('dedups a diamond (A → X, B → X) — X appears exactly once', () => {
    const direct = [
      {name: 'a', root: '/a', platforms: {ios: {}}},
      {name: 'b', root: '/b', platforms: {ios: {}}},
    ];
    const result = expandSpmDependencies(direct, {
      ...fixtures({
        '/a': {spm: {dependencies: ['x']}},
        '/b': {spm: {dependencies: ['x']}},
        '/x': {dependency: {platforms: {ios: {}}}},
      }),
      resolveDep: makeResolveDep({x: '/x'}),
    });
    expect(result.filter(d => d.name === 'x')).toHaveLength(1);
    expect(result.map(d => d.name).sort()).toEqual(['a', 'b', 'x']);
  });

  it('throws with a clear message when a declared transitive cannot be resolved', () => {
    const direct = [{name: 'apple', root: '/apple', platforms: {ios: {}}}];
    expect(() =>
      expandSpmDependencies(direct, {
        ...fixtures({
          '/apple': {spm: {dependencies: ['ghost']}},
        }),
        resolveDep: makeResolveDep({}),
      }),
    ).toThrow(/ghost.*apple|apple.*ghost/i);
  });

  it('silently skips transitives that have no iOS native code (matches autolinkingDepToSpmTarget behavior)', () => {
    const direct = [{name: 'apple', root: '/apple', platforms: {ios: {}}}];
    const result = expandSpmDependencies(direct, {
      ...fixtures({
        '/apple': {spm: {dependencies: ['js-only']}},
        // js-only has no dependency.platforms.ios — pure JS package
        '/js-only': {},
      }),
      resolveDep: makeResolveDep({'js-only': '/js-only'}),
    });
    expect(result.map(d => d.name)).toEqual(['apple']);
  });

  it('does not re-add a transitive that is already a direct dep (first occurrence wins)', () => {
    const direct = [
      {name: 'apple', root: '/apple', platforms: {ios: {}}},
      {name: 'common', root: '/common-direct', platforms: {ios: {}}},
    ];
    const result = expandSpmDependencies(direct, {
      ...fixtures({
        '/apple': {spm: {dependencies: ['common']}},
        '/common-other': {dependency: {platforms: {ios: {}}}},
      }),
      resolveDep: makeResolveDep({common: '/common-other'}),
    });
    expect(result.filter(d => d.name === 'common')).toHaveLength(1);
    // The direct-dep entry should be preserved, not overwritten by the transitive
    expect(result.find(d => d.name === 'common').root).toBe('/common-direct');
  });

  // -------------------------------------------------------------------------
  // spmDependencies field: each entry should carry the names of its iOS-native
  // transitive deps, so the downstream emitter can wire SPM target-level deps
  // (e.g. apple's .target(dependencies: [.target(name: "...Common")])).
  // -------------------------------------------------------------------------

  it('attaches spmDependencies: [] when the dep declares none', () => {
    const direct = [{name: 'a', root: '/a', platforms: {ios: {}}}];
    const [a] = expandSpmDependencies(direct, {
      ...fixtures({'/a': {}}),
      resolveDep: makeResolveDep({}),
    });
    expect(a.spmDependencies).toEqual([]);
  });

  it('attaches spmDependencies with the declared transitive names (preserving declaration order)', () => {
    const direct = [{name: 'apple', root: '/apple', platforms: {ios: {}}}];
    const [apple, common] = expandSpmDependencies(direct, {
      ...fixtures({
        '/apple': {spm: {dependencies: ['common', 'extra']}},
        '/common': {dependency: {platforms: {ios: {}}}},
        '/extra': {dependency: {platforms: {ios: {}}}},
      }),
      resolveDep: makeResolveDep({common: '/common', extra: '/extra'}),
    });
    expect(apple.spmDependencies).toEqual(['common', 'extra']);
    expect(common.spmDependencies).toEqual([]);
  });

  it('omits JS-only transitives from spmDependencies (only iOS-native names appear)', () => {
    const direct = [{name: 'apple', root: '/apple', platforms: {ios: {}}}];
    const [apple] = expandSpmDependencies(direct, {
      ...fixtures({
        '/apple': {spm: {dependencies: ['js-only', 'common']}},
        '/js-only': {},
        '/common': {dependency: {platforms: {ios: {}}}},
      }),
      resolveDep: makeResolveDep({'js-only': '/js-only', common: '/common'}),
    });
    expect(apple.spmDependencies).toEqual(['common']);
  });

  it('records spmDependencies on both sides of a diamond (A→X, B→X)', () => {
    const direct = [
      {name: 'a', root: '/a', platforms: {ios: {}}},
      {name: 'b', root: '/b', platforms: {ios: {}}},
    ];
    const result = expandSpmDependencies(direct, {
      ...fixtures({
        '/a': {spm: {dependencies: ['x']}},
        '/b': {spm: {dependencies: ['x']}},
        '/x': {dependency: {platforms: {ios: {}}}},
      }),
      resolveDep: makeResolveDep({x: '/x'}),
    });
    const a = result.find(d => d.name === 'a');
    const b = result.find(d => d.name === 'b');
    expect(a.spmDependencies).toEqual(['x']);
    expect(b.spmDependencies).toEqual(['x']);
  });

  it('passes the declaring dep root as the second argument to resolveDep (for Node resolution paths)', () => {
    const direct = [{name: 'apple', root: '/apple', platforms: {ios: {}}}];
    let receivedFromRoot /*: ?string */ = null;
    expandSpmDependencies(direct, {
      ...fixtures({
        '/apple': {spm: {dependencies: ['common']}},
        '/common': {dependency: {platforms: {ios: {}}}},
      }),
      resolveDep: (name, fromRoot) => {
        if (name === 'common') {
          receivedFromRoot = fromRoot;
          return '/common';
        }
        return null;
      },
    });
    expect(receivedFromRoot).toBe('/apple');
  });

  // -------------------------------------------------------------------------
  // swiftName resolution: each dep gets a Swift target name on the way out.
  // Default is toSwiftName(npmName); the dep's react-native.config.js
  // `spm.name` overrides it. Required for libraries whose import prefix
  // differs from the auto-derived name (e.g. `react-native-worklets`
  // publishes headers under `<worklets/...>`).
  // -------------------------------------------------------------------------

  it('populates swiftName via toSwiftName when no spm.name override is set', () => {
    const direct = [
      {name: 'react-native-foo', root: '/foo', platforms: {ios: {}}},
    ];
    const [foo] = expandSpmDependencies(direct, {
      ...fixtures({'/foo': {}}),
      resolveDep: makeResolveDep({}),
    });
    expect(foo.swiftName).toBe(toSwiftName('react-native-foo'));
    expect(foo.swiftName).toBe('ReactNativeFoo');
  });

  it('uses spm.name as swiftName when the direct dep declares one', () => {
    const direct = [
      {name: 'react-native-worklets', root: '/w', platforms: {ios: {}}},
    ];
    const [w] = expandSpmDependencies(direct, {
      ...fixtures({'/w': {spm: {name: 'worklets'}}}),
      resolveDep: makeResolveDep({}),
    });
    expect(w.swiftName).toBe('worklets');
  });

  it('applies spm.name override to transitive deps too', () => {
    const direct = [
      {name: 'react-native-reanimated', root: '/r', platforms: {ios: {}}},
    ];
    const result = expandSpmDependencies(direct, {
      ...fixtures({
        '/r': {
          dependency: {platforms: {ios: {}}},
          spm: {name: 'reanimated', dependencies: ['react-native-worklets']},
        },
        '/w': {
          dependency: {platforms: {ios: {}}},
          spm: {name: 'worklets'},
        },
      }),
      resolveDep: makeResolveDep({'react-native-worklets': '/w'}),
    });
    const reanimated = result.find(d => d.name === 'react-native-reanimated');
    const worklets = result.find(d => d.name === 'react-native-worklets');
    expect(reanimated.swiftName).toBe('reanimated');
    expect(worklets.swiftName).toBe('worklets');
  });

  it('throws on swiftName collision between two deps (override vs auto-derived)', () => {
    // 'react-native-worklets' would auto-derive to 'ReactNativeWorklets', but
    // here a second dep overrides its spm.name to that same value.
    const direct = [
      {name: 'react-native-worklets', root: '/w', platforms: {ios: {}}},
      {name: 'other-package', root: '/o', platforms: {ios: {}}},
    ];
    expect(() =>
      expandSpmDependencies(direct, {
        ...fixtures({
          '/w': {},
          '/o': {spm: {name: 'ReactNativeWorklets'}},
        }),
        resolveDep: makeResolveDep({}),
      }),
    ).toThrow(/ReactNativeWorklets/);
  });

  it('throws SpmNameCollisionError on a dep-vs-dep collision too', () => {
    const direct = [
      {name: 'react-native-worklets', root: '/w', platforms: {ios: {}}},
      {name: 'other-package', root: '/o', platforms: {ios: {}}},
    ];
    expect(() =>
      expandSpmDependencies(direct, {
        ...fixtures({
          '/w': {},
          '/o': {spm: {name: 'ReactNativeWorklets'}},
        }),
        resolveDep: makeResolveDep({}),
      }),
    ).toThrow(SpmNameCollisionError);
  });

  it('throws on a CASE-INSENSITIVE swiftName collision (worklets vs Worklets)', () => {
    // Distinct as exact strings, but collide as directories on the default
    // case-insensitive macOS filesystem.
    const direct = [
      {name: 'react-native-worklets', root: '/w', platforms: {ios: {}}},
      {name: 'other-worklets', root: '/o', platforms: {ios: {}}},
    ];
    expect(() =>
      expandSpmDependencies(direct, {
        ...fixtures({
          '/w': {spm: {name: 'worklets'}},
          '/o': {spm: {name: 'Worklets'}},
        }),
        resolveDep: makeResolveDep({}),
      }),
    ).toThrow(/case/i);
  });

  it('rejects an empty declared name with a clear error citing the npm name', () => {
    const direct = [{name: 'a', root: '/a', platforms: {ios: {}}}];
    expect(() =>
      expandSpmDependencies(direct, {
        ...fixtures({'/a': {spm: {name: ''}}}),
        resolveDep: makeResolveDep({}),
      }),
    ).toThrow(/'a' declares an invalid SwiftPM name/);
  });

  it('rejects a non-string declared name (e.g. number, object) with a clear error', () => {
    const direct = [{name: 'a', root: '/a', platforms: {ios: {}}}];
    expect(() =>
      expandSpmDependencies(direct, {
        ...fixtures({'/a': {spm: {name: 42}}}),
        resolveDep: makeResolveDep({}),
      }),
    ).toThrow(/declares an invalid SwiftPM name/);
  });

  it('rejects a declared name with disallowed characters (spaces, slashes, dots)', () => {
    const resolve = name => () => resolveSwiftName('a', {name}, null);
    expect(resolve('foo bar')).toThrow(/declares an invalid SwiftPM name/);
    expect(resolve('foo/bar')).toThrow(/declares an invalid SwiftPM name/);
    expect(resolve('foo.bar')).toThrow(/declares an invalid SwiftPM name/);
  });

  it('accepts lowercase-with-hyphen and CamelCase declared names', () => {
    const resolve = name => resolveSwiftName('a', {name}, null).name;
    expect(resolve('reanimated')).toBe('reanimated');
    expect(resolve('hermes-engine')).toBe('hermes-engine');
    expect(resolve('RNWorklets')).toBe('RNWorklets');
    expect(resolve('react_native_foo')).toBe('react_native_foo');
  });
});

// ---------------------------------------------------------------------------
// Podspec-derived names. A dep's Swift name is also its header prefix
// (`#import <Name/Header.h>`), and the podspec is where that prefix is
// declared: `spm.name` → `header_dir` → `module_name` → podspec name →
// toSwiftName(npm name).
// ---------------------------------------------------------------------------

describe('expandSpmDependencies (podspec-derived names)', () => {
  function expand(direct, {configs, podspecs, ...options} = {}) {
    return expandSpmDependencies(direct, {
      ...fixtures(configs ?? {}),
      resolveDep: makeResolveDep({}),
      readPodspec: makeReadPodspec(podspecs ?? {}),
      ...options,
    });
  }

  const dep = (name, root) => ({name, root, platforms: {ios: {}}});

  it("prefers the podspec's header_dir over its name", () => {
    const [core] = expand([dep('react-native-core-thing', '/rc')], {
      podspecs: {'/rc': {name: 'React-Core', headerDir: 'React'}},
    });
    expect(core.swiftName).toBe('React');
  });

  it('uses the podspec name when it declares no header_dir', () => {
    const [svg] = expand([dep('react-native-svg', '/svg')], {
      podspecs: {'/svg': {name: 'RNSVG', headerDir: null}},
    });
    expect(svg.swiftName).toBe('RNSVG');
  });

  it("uses the podspec's module_name over its pod name (react-native-maps)", () => {
    // `s.name = "react-native-maps"` with `s.module_name = 'ReactNativeMaps'`:
    // the pod name is a legal SwiftPM target name, so nothing normalizes it —
    // but every `import ReactNativeMaps` in the ecosystem is written against
    // the module name.
    const [maps] = expand([dep('react-native-maps', '/maps')], {
      podspecs: {
        '/maps': {
          name: 'react-native-maps',
          moduleName: 'ReactNativeMaps',
          headerDir: null,
        },
      },
    });
    expect(maps.swiftName).toBe('ReactNativeMaps');
    expect(maps.swiftNameSource).toBe('podspec');
  });

  it("prefers the podspec's header_dir over its module_name", () => {
    const [core] = expand([dep('react-native-core-thing', '/rc')], {
      podspecs: {
        '/rc': {
          name: 'React-Core',
          moduleName: 'ReactCore',
          headerDir: 'React',
        },
      },
    });
    expect(core.swiftName).toBe('React');
  });

  it('takes a lowercase header_dir verbatim (worklets ships <worklets/…>)', () => {
    const [worklets] = expand([dep('react-native-worklets', '/w')], {
      podspecs: {'/w': {name: 'RNWorklets', headerDir: 'worklets'}},
    });
    expect(worklets.swiftName).toBe('worklets');
  });

  it.each([
    ['header_dir', {name: 'React-Core', headerDir: 'React'}, 'React'],
    [
      'module_name',
      {name: 'react-native-maps', moduleName: 'ReactNativeMaps'},
      'ReactNativeMaps',
    ],
    ['name', {name: 'RNSVG'}, 'RNSVG'],
  ])('reports %s as the podspec key the name came from', (key, facts, name) => {
    // `spm scaffold` persists the winner as the library's name, so which key
    // won is part of the decision it has to be able to report.
    expect(resolveSwiftName('react-native-thing', null, facts)).toEqual({
      name,
      source: 'podspec',
      podspecKey: key,
    });
  });

  it('reports no podspec key for a declared or guessed name', () => {
    expect(resolveSwiftName('react-native-foo', {name: 'RNFoo'}, null)).toEqual(
      {name: 'RNFoo', source: 'config'},
    );
    expect(resolveSwiftName('react-native-foo', null, null)).toEqual({
      name: 'ReactNativeFoo',
      source: 'npm',
    });
  });

  it('carries the podspec key onto every expanded dep', () => {
    const [maps] = expand([dep('react-native-maps', '/maps')], {
      podspecs: {
        '/maps': {name: 'react-native-maps', moduleName: 'ReactNativeMaps'},
      },
    });
    expect(maps.swiftNamePodspecKey).toBe('module_name');
  });

  it('lets spm.name beat both', () => {
    const [svg] = expand([dep('react-native-svg', '/svg')], {
      configs: {'/svg': {spm: {name: 'MySvg'}}},
      podspecs: {'/svg': {name: 'RNSVG', headerDir: 'rnsvg'}},
    });
    expect(svg.swiftName).toBe('MySvg');
  });

  it('falls back to the npm name when the dep ships no podspec (self-managed libraries)', () => {
    const [svg] = expand([dep('react-native-svg', '/svg')]);
    expect(svg.swiftName).toBe('ReactNativeSvg');
  });

  it('falls through to the npm name when reading the podspec throws', () => {
    const [svg] = expand([dep('react-native-svg', '/svg')], {
      readPodspec: () => {
        throw new Error('unparseable');
      },
    });
    expect(svg.swiftName).toBe('ReactNativeSvg');
  });

  it('falls through when the podspec yields no name (partial parse)', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const [svg] = expand([dep('react-native-svg', '/svg')], {
        podspecs: {'/svg': {name: '', headerDir: null}},
      });
      expect(svg.swiftName).toBe('ReactNativeSvg');
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('warns that a podspec it could not read makes the name machine-dependent', () => {
    // The shape create-react-native-library generates: `s.name = package["name"]`
    // reads as nothing without CocoaPods, so the npm name answers here and the
    // pod name would answer on a machine that has `pod`.
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const [foo] = expand([dep('react-native-foo', '/foo')], {
        podspecs: {'/foo': {name: '', headerDir: null}},
      });
      expect(foo.swiftName).toBe('ReactNativeFoo');
      expect(foo.swiftNameSource).toBe('npm');
      const message = warnSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(message).toContain('react-native-foo');
      expect(message).toContain('CocoaPods');
      expect(message).toContain('swiftpmConfig.name');
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('says nothing when the dep ships no podspec at all', () => {
    // Nothing is machine-dependent about a self-managed library: there is no
    // podspec for another machine to read differently.
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expand([dep('react-native-svg', '/svg')]);
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('normalizes a podspec name Swift cannot spell, and says what it did', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const [svg] = expand([dep('react-native-svg', '/svg')], {
        podspecs: {'/svg': {name: 'Some.Pod', headerDir: null}},
      });
      expect(svg.swiftName).toBe('Some_Pod');
      const message = warnSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(message).toContain('react-native-svg');
      expect(message).toContain('Some.Pod');
      expect(message).toContain('Some_Pod');
      expect(message).toContain('swiftpmConfig.name');
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('refuses to name a library from a header_dir Ruby has not evaluated', () => {
    // Without CocoaPods the regex parser hands back the template verbatim.
    // Naming from it would freeze `__s_name_Headers` into the header prefix —
    // and, being podspec-derived, into the library's package.json.
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const [svg] = expand([dep('react-native-svg', '/svg')], {
        podspecs: {'/svg': {name: 'RNSVG', headerDir: '#{s.name}Headers'}},
      });
      expect(svg.swiftName).toBe('ReactNativeSvg');
      expect(svg.swiftNameSource).toBe('npm');
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('normalizes an unspellable header_dir rather than falling back to the podspec name', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const [svg] = expand([dep('react-native-svg', '/svg')], {
        podspecs: {'/svg': {name: 'RNSVG', headerDir: 'rn.svg'}},
      });
      expect(svg.swiftName).toBe('rn_svg');
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('says nothing when the podspec name needs no normalizing', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expand([dep('react-native-svg', '/svg')], {
        podspecs: {'/svg': {name: 'RNSVG'}},
      });
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('reads the podspec autolinking.json recorded for the dep', () => {
    const readPodspec = jest.fn(() => ({name: 'RNSVG'}));
    expandSpmDependencies(
      [
        {
          name: 'react-native-svg',
          root: '/svg',
          platforms: {ios: {podspecPath: '/svg/apple/RNSVG.podspec'}},
        },
      ],
      {
        ...fixtures({}),
        resolveDep: makeResolveDep({}),
        readPodspec,
      },
    );
    expect(readPodspec).toHaveBeenCalledWith(
      '/svg',
      '/svg/apple/RNSVG.podspec',
    );
  });

  it('names a transitive dep from its own podspec', () => {
    const result = expandSpmDependencies(
      [dep('react-native-reanimated', '/r')],
      {
        ...fixtures({
          '/r': {spm: {dependencies: ['react-native-worklets']}},
          '/w': {dependency: {platforms: {ios: {}}}},
        }),
        resolveDep: makeResolveDep({'react-native-worklets': '/w'}),
        readPodspec: makeReadPodspec({
          '/r': {name: 'RNReanimated', headerDir: 'reanimated'},
          '/w': {name: 'RNWorklets', headerDir: 'worklets'},
        }),
      },
    );
    expect(result.map(d => d.swiftName)).toEqual(['reanimated', 'worklets']);
  });

  it('throws instead of correcting a podspec name React Native reserves', () => {
    const run = () =>
      expand([dep('some-lib', '/s')], {
        podspecs: {'/s': {name: 'ReactHeaders'}},
      });
    expect(run).toThrow(SpmNameCollisionError);
    expect(run).toThrow(
      /'some-lib' resolves to 'ReactHeaders', which React Native reserves/,
    );
    expect(run).toThrow(/Set a different 'swiftpmConfig\.name'/);
  });

  it('throws instead of borrowing the npm scope when the derived name is reserved', () => {
    const run = () => expand([dep('@powersync/react-native', '/ps')]);
    expect(run).toThrow(SpmNameCollisionError);
    expect(run).toThrow(/React Native reserves/);
  });

  it('throws when two deps land on the same podspec name', () => {
    const run = () =>
      expand([dep('@a/svg', '/a'), dep('@b/svg', '/b')], {
        podspecs: {'/a': {name: 'RNSVG'}, '/b': {name: 'RNSVG'}},
      });
    expect(run).toThrow(SpmNameCollisionError);
    expect(run).toThrow(/both resolve to 'RNSVG'/);
    expect(run).toThrow(/Set a distinct 'swiftpmConfig\.name'/);
  });

  it('throws when two podspec names differ only in punctuation — SwiftPM compiles one module', () => {
    const run = () =>
      expand([dep('@a/foo', '/a'), dep('@b/foo', '/b')], {
        podspecs: {'/a': {name: 'foo-bar'}, '/b': {name: 'foo_bar'}},
      });
    expect(run).toThrow(SpmNameCollisionError);
    // Both spellings the authors wrote, plus the module they share.
    expect(run).toThrow(/'foo-bar'/);
    expect(run).toThrow(/'foo_bar'/);
    expect(run).toThrow(/module 'foo_bar'/);
  });
});

// ---------------------------------------------------------------------------
// Reserved React Native names — terminal, whatever the name was resolved from.
// ---------------------------------------------------------------------------

describe('expandSpmDependencies (reserved React Native names)', () => {
  function expand(direct, configs, options) {
    return expandSpmDependencies(direct, {
      ...fixtures(configs),
      resolveDep: makeResolveDep({}),
      ...options,
    });
  }

  it('throws when an unscoped dep auto-derives a reserved product name', () => {
    const run = () =>
      expand([{name: 'react-headers', root: '/rh', platforms: {ios: {}}}], {
        '/rh': {},
      });
    expect(run).toThrow(SpmNameCollisionError);
    expect(run).toThrow(
      /'react-headers' resolves to 'ReactHeaders', which React Native reserves/,
    );
    expect(run).toThrow(
      /Set a different 'swiftpmConfig\.name' in react-headers's package\.json\./,
    );
  });

  it('throws when an explicit spm.name override lands on a reserved name', () => {
    expect(() =>
      expand([{name: 'some-lib', root: '/s', platforms: {ios: {}}}], {
        '/s': {spm: {name: 'ReactAppHeaders'}},
      }),
    ).toThrow(
      /'some-lib' resolves to 'ReactAppHeaders', which React Native reserves/,
    );
  });

  it('throws when a transitive dep lands on a reserved name', () => {
    expect(() =>
      expandSpmDependencies(
        [{name: 'top', root: '/top', platforms: {ios: {}}}],
        {
          ...fixtures({
            '/top': {spm: {dependencies: ['react-native-headers']}},
            '/rnh': {dependency: {platforms: {ios: {}}}},
          }),
          resolveDep: makeResolveDep({'react-native-headers': '/rnh'}),
        },
      ),
    ).toThrow(
      /'react-native-headers' resolves to 'ReactNativeHeaders', which React Native reserves/,
    );
  });

  it('reserves the caller-supplied extraReservedNames (remote package identity)', () => {
    const direct = [{name: 'my-fork', root: '/f', platforms: {ios: {}}}];
    expect(() =>
      expand(direct, {'/f': {}}, {extraReservedNames: ['MyFork']}),
    ).toThrow(/'my-fork' resolves to 'MyFork', which React Native reserves/);
  });

  it('accepts that same name when no extraReservedNames are supplied', () => {
    const [dep] = expand(
      [{name: 'my-fork', root: '/f', platforms: {ios: {}}}],
      {
        '/f': {},
      },
    );
    expect(dep.swiftName).toBe('MyFork');
  });

  it('leaves a non-colliding dep untouched', () => {
    const [dep] = expand(
      [{name: 'react-native-worklets', root: '/w', platforms: {ios: {}}}],
      {'/w': {spm: {name: 'worklets'}}},
      {extraReservedNames: ['SomeRemoteIdentity']},
    );
    expect(dep.swiftName).toBe('worklets');
  });

  it('reports the reserved-name diagnosis in preference to the dep-vs-dep one', () => {
    // Both unscoped deps derive 'ReactNative', so neither can borrow a scope.
    expect(() =>
      expand(
        [
          {name: 'react-native', root: '/a', platforms: {ios: {}}},
          {name: 'react_native', root: '/b', platforms: {ios: {}}},
        ],
        {'/a': {}, '/b': {}},
      ),
    ).toThrow(/React Native reserves/);
  });

  it('rejects every name in RESERVED_SWIFT_NAMES', () => {
    expect(RESERVED_SWIFT_NAMES.length).toBeGreaterThan(0);
    for (const reserved of RESERVED_SWIFT_NAMES) {
      expect(() =>
        expand([{name: 'some-lib', root: '/s', platforms: {ios: {}}}], {
          '/s': {spm: {name: reserved}},
        }),
      ).toThrow(/React Native reserves/);
    }
  });

  it('rejects the autolinking aggregator package name', () => {
    expect(() =>
      expand([{name: 'autolinked', root: '/a', platforms: {ios: {}}}], {
        '/a': {},
      }),
    ).toThrow(
      /'autolinked' resolves to 'Autolinked', which React Native reserves/,
    );
  });

  it('accepts the React headers TARGET dir name — it is not a package or product, so nothing collides', () => {
    const [dep] = expand(
      [{name: 'some-lib', root: '/s', platforms: {ios: {}}}],
      {
        '/s': {spm: {name: REACT_HEADERS_TARGET_DIR}},
      },
    );
    expect(dep.swiftName).toBe(REACT_HEADERS_TARGET_DIR);
  });

  it('reports a punctuation-only match against a reserved name, naming both spellings', () => {
    // 'React_GeneratedCode' and RN's 'React-GeneratedCode' are distinct strings
    // and distinct directories, but SwiftPM compiles them as one module.
    const run = () =>
      expand(
        [{name: 'some-lib', root: '/s', platforms: {ios: {}}}],
        {'/s': {}},
        {
          readPodspec: () => ({name: 'React_GeneratedCode'}),
        },
      );
    expect(run).toThrow(SpmNameCollisionError);
    expect(run).toThrow(
      /'some-lib' resolves to 'React_GeneratedCode', which compiles as the same module as React Native's reserved 'React-GeneratedCode'/,
    );
    expect(run).toThrow(/swiftpmConfig\.name/);
  });

  it('reports a case-only match against a reserved name, naming both spellings', () => {
    const run = () =>
      expand([{name: 'some-lib', root: '/s', platforms: {ios: {}}}], {
        '/s': {spm: {name: 'reactnative'}},
      });
    expect(run).toThrow(SpmNameCollisionError);
    expect(run).toThrow(
      /'some-lib' resolves to 'reactnative', which differs from React Native's reserved 'ReactNative' only in case/,
    );
    expect(run).toThrow(/swiftpmConfig\.name/);
  });
});

// ---------------------------------------------------------------------------
// swiftpmConfig — the declared home for a library's SwiftPM settings, and the
// step of the precedence that lets a library stop shipping a podspec.
// ---------------------------------------------------------------------------

describe('expandSpmDependencies (swiftpmConfig)', () => {
  let tmpRoot;
  let roots = 0;

  beforeAll(() => {
    tmpRoot = fs.mkdtempSync(
      path.join(fs.realpathSync(os.tmpdir()), 'spm-expand-config-'),
    );
  });

  afterAll(() => {
    fs.rmSync(tmpRoot, {recursive: true, force: true});
  });

  function makeRoot(pkgJson) {
    const root = path.join(tmpRoot, `pkg-${roots++}`);
    fs.mkdirSync(root, {recursive: true});
    fs.writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify(pkgJson, null, 2),
    );
    return root;
  }

  function expand(direct, {configs, podspecs} = {}) {
    return expandSpmDependencies(direct, {
      readConfig: makeReadConfig(configs ?? {}),
      resolveDep: makeResolveDep({}),
      readPodspec: makeReadPodspec(podspecs ?? {}),
    });
  }

  it('takes the name from package.json, ahead of the podspec', () => {
    const root = makeRoot({
      name: 'react-native-svg',
      swiftpmConfig: {name: 'MySvg'},
    });
    const [svg] = expand(
      [{name: 'react-native-svg', root, platforms: {ios: {}}}],
      {podspecs: {[root]: {name: 'RNSVG'}}},
    );
    expect(svg.swiftName).toBe('MySvg');
  });

  it('records where each name came from, so the scaffolder can tell a derived name from a declared one', () => {
    const declared = makeRoot({
      name: 'react-native-svg',
      swiftpmConfig: {name: 'MySvg'},
    });
    const derived = makeRoot({name: 'react-native-screens'});
    const guessed = makeRoot({name: 'react-native-blur'});
    const result = expand(
      [
        {name: 'react-native-svg', root: declared, platforms: {ios: {}}},
        {name: 'react-native-screens', root: derived, platforms: {ios: {}}},
        {name: 'react-native-blur', root: guessed, platforms: {ios: {}}},
      ],
      {podspecs: {[derived]: {name: 'RNScreens'}}},
    );
    expect(result.map(d => d.swiftNameSource)).toEqual([
      'config',
      'podspec',
      'npm',
    ]);
  });

  it('expands dependencies declared in package.json', () => {
    const root = makeRoot({
      name: 'react-native-reanimated',
      swiftpmConfig: {dependencies: ['react-native-worklets']},
    });
    const result = expandSpmDependencies(
      [{name: 'react-native-reanimated', root, platforms: {ios: {}}}],
      {
        readConfig: makeReadConfig({
          '/w': {dependency: {platforms: {ios: {}}}},
        }),
        resolveDep: makeResolveDep({'react-native-worklets': '/w'}),
      },
    );
    expect(result.map(d => d.name)).toEqual([
      'react-native-reanimated',
      'react-native-worklets',
    ]);
  });

  it('still honours a name in the deprecated spm block', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const root = makeRoot({name: 'react-native-svg'});
      const [svg] = expand(
        [{name: 'react-native-svg', root, platforms: {ios: {}}}],
        {configs: {[root]: {spm: {name: 'MySvg'}}}},
      );
      expect(svg.swiftName).toBe('MySvg');
      expect(warnSpy).toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });
});

// ---------------------------------------------------------------------------
// defaultReadPodspec — only autolinking.json records a podspecPath, so deps
// synthesized from `spm.dependencies` rely on the dep-root search.
// ---------------------------------------------------------------------------

describe('defaultReadPodspec', () => {
  let root;

  beforeEach(() => {
    root = fs.mkdtempSync(
      path.join(fs.realpathSync(os.tmpdir()), 'spm-read-podspec-'),
    );
  });

  afterEach(() => {
    fs.rmSync(root, {recursive: true, force: true});
  });

  function writePodspec(name, body) {
    fs.writeFileSync(
      path.join(root, `${name}.podspec`),
      ['Pod::Spec.new do |s|', `  s.name = "${name}"`, ...body, 'end', ''].join(
        '\n',
      ),
    );
  }

  it('finds the podspec at the dep root when no path was recorded', () => {
    writePodspec('RNSVG', [
      '  s.version = "1.0.0"',
      '  s.header_dir = "rnsvg"',
    ]);
    const model = defaultReadPodspec(root, null);
    expect(model?.name).toBe('RNSVG');
    expect(model?.headerDir).toBe('rnsvg');
  });

  it('names a screens-shaped library from its pod name, not its subspec prefix', () => {
    // react-native-screens and react-native-svg both declare their C++ prefix
    // on a subspec; the library's ObjC headers are imported under the pod name,
    // and the subspec prefix resolves through the header search paths instead.
    writePodspec('RNScreens', [
      '  s.version = "4.0.0"',
      '  s.subspec "common" do |ss|',
      '    ss.header_mappings_dir = "common/cpp"',
      '    ss.header_dir = "rnscreens"',
      '  end',
    ]);
    const [screens] = expandSpmDependencies(
      [{name: 'react-native-screens', root, platforms: {ios: {}}}],
      {
        readConfig: () => null,
        resolveDep: makeResolveDep({}),
        readPodspec: defaultReadPodspec,
      },
    );
    expect(screens.swiftName).toBe('RNScreens');
    expect(screens.swiftNameSource).toBe('podspec');
  });

  it("skips a crashed run's leftover patched copy", () => {
    writePodspec('RNSVG', ['  s.version = "1.0.0"']);
    fs.writeFileSync(
      path.join(root, '.spm-scaffold-1-Leftover.podspec'),
      'Pod::Spec.new do |s|\n  s.name = "Leftover"\nend\n',
    );
    expect(defaultReadPodspec(root, null)?.name).toBe('RNSVG');
  });

  it('returns null when the dep ships no podspec', () => {
    expect(defaultReadPodspec(root, null)).toBeNull();
  });

  it('returns null when the recorded path is gone', () => {
    expect(
      defaultReadPodspec(root, path.join(root, 'Gone.podspec')),
    ).toBeNull();
  });
});

// defaultReadConfig
//
// The community CLI's own loaders disagree — sync reads named exports, async
// reads the default one — so a config that sets only `export default` must not
// be invisible here. Fixtures are transpiled by babel, so they present the
// `__esModule`/`default` interop shape; a Node namespace object from
// `require(ESM)` has no `__esModule` but exposes `.default` alongside
// enumerable named keys the same way, which is what the merge reads.
// ---------------------------------------------------------------------------

describe('defaultReadConfig', () => {
  let tmpRoot;

  beforeAll(() => {
    tmpRoot = fs.mkdtempSync(
      path.join(fs.realpathSync(os.tmpdir()), 'spm-read-config-'),
    );
  });

  afterAll(() => {
    fs.rmSync(tmpRoot, {recursive: true, force: true});
  });

  function writeConfig(name, source) {
    const root = path.join(tmpRoot, name);
    fs.mkdirSync(root, {recursive: true});
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({name}));
    fs.writeFileSync(path.join(root, 'react-native.config.js'), source);
    return root;
  }

  it('returns null when the library ships no config', () => {
    const root = path.join(tmpRoot, 'no-config');
    fs.mkdirSync(root, {recursive: true});
    expect(defaultReadConfig(root)).toBeNull();
  });

  it('reads a CommonJS config', () => {
    const root = writeConfig('cjs', "module.exports = {spm: {name: 'Cjs'}};\n");
    expect(defaultReadConfig(root).spm.name).toBe('Cjs');
  });

  it('unwraps an ESM config that only has a default export', () => {
    const root = writeConfig(
      'esm-default',
      "export default {spm: {name: 'EsmDefault'}};\n",
    );
    expect(defaultReadConfig(root).spm.name).toBe('EsmDefault');
  });

  it('reads an ESM config that only has named exports', () => {
    const root = writeConfig(
      'esm-named',
      "export const spm = {name: 'EsmNamed'};\n",
    );
    expect(defaultReadConfig(root).spm.name).toBe('EsmNamed');
  });

  it('prefers the named export when a config ships both (the PowerSync shape)', () => {
    const root = writeConfig(
      'esm-both',
      "export const spm = {name: 'Named'};\n" +
        "export default {spm: {name: 'Default'}, dependency: {platforms: {ios: {}}}};\n",
    );
    const config = defaultReadConfig(root);
    expect(config.spm.name).toBe('Named');
    // Only the merge satisfies this: `dependency` exists on the default export
    // alone, so reading the module raw would miss it.
    expect(config.dependency.platforms.ios).toEqual({});
  });

  it('keeps sibling keys of the default export (dependency.platforms.ios)', () => {
    const root = writeConfig(
      'esm-siblings',
      "export default {dependency: {platforms: {ios: {}}}, spm: {name: 'Siblings'}};\n",
    );
    const config = defaultReadConfig(root);
    expect(config.dependency.platforms.ios).toEqual({});
    expect(config.spm.name).toBe('Siblings');
  });

  it('passes a function-style config through unchanged (module.exports = () => ({...}))', () => {
    const root = writeConfig(
      'fn-style',
      "module.exports = () => ({spm: {name: 'FnStyle'}});\n",
    );
    const config = defaultReadConfig(root);
    expect(typeof config).toBe('function');
    expect(config().spm.name).toBe('FnStyle');
  });

  it('warns with the config path and the reason when the config fails to load, and returns null', () => {
    const root = writeConfig(
      'broken',
      "require('a-dev-dependency-that-is-not-installed');\n",
    );
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(defaultReadConfig(root)).toBeNull();
      const message = warnSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(message).toContain(path.join(root, 'react-native.config.js'));
      expect(message).toContain('a-dev-dependency-that-is-not-installed');
    } finally {
      warnSpy.mockRestore();
    }
  });
});

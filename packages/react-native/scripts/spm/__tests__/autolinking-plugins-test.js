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

const {discoverPlugins, invokePlugins} = require('../autolinking-plugins');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

describe('discoverPlugins', () => {
  let tmp;
  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-plugins-'));
  });
  afterEach(() => {
    fs.rmSync(tmp, {recursive: true, force: true});
  });

  // Writes a dep dir with a plugin module and returns its {name, root}.
  function makeDep(name, pluginBody /*: ?string */) {
    const root = path.join(tmp, name);
    fs.mkdirSync(root, {recursive: true});
    if (pluginBody != null) {
      fs.writeFileSync(path.join(root, 'plugin.js'), pluginBody, 'utf8');
    }
    return {name, root};
  }

  // readConfig fake: a dep opts in when opted[name] is truthy.
  const readConfigFor = opted => root => {
    const name = path.basename(root);
    return opted[name] ? {spm: {autolinkingPlugin: './plugin.js'}} : null;
  };

  it('discovers a plugin declared via react-native.config.js', () => {
    const dep = makeDep('expo', 'module.exports = () => ({});');
    const found = discoverPlugins([dep], readConfigFor({expo: true}));
    expect(found).toHaveLength(1);
    expect(found[0].depName).toBe('expo');
    expect(typeof found[0].plugin).toBe('function');
  });

  it('skips deps that do not declare a plugin', () => {
    const dep = makeDep('react-native-svg', null);
    expect(discoverPlugins([dep], readConfigFor({}))).toHaveLength(0);
  });

  it('honors the app deny-list (opt-out, no allowlist needed)', () => {
    const dep = makeDep('expo', 'module.exports = () => ({});');
    const found = discoverPlugins([dep], readConfigFor({expo: true}), ['expo']);
    expect(found).toHaveLength(0);
  });

  it('accepts default/plugin export interop', () => {
    const a = makeDep('a', 'module.exports.default = () => ({});');
    const b = makeDep('b', 'module.exports.plugin = () => ({});');
    const found = discoverPlugins([a, b], readConfigFor({a: true, b: true}));
    expect(found.map(f => f.depName).sort()).toEqual(['a', 'b']);
  });

  it('fails closed when the plugin module is missing', () => {
    const dep = makeDep('expo', null); // opted in below but no plugin.js
    expect(() => discoverPlugins([dep], readConfigFor({expo: true}))).toThrow(
      /failed to load the autolinking plugin for 'expo'/,
    );
  });

  it('fails closed when the module does not export a function', () => {
    const dep = makeDep('expo', 'module.exports = {nope: 1};');
    expect(() => discoverPlugins([dep], readConfigFor({expo: true}))).toThrow(
      /does not export a function/,
    );
  });
});

describe('invokePlugins', () => {
  const ctx = {
    appRoot: '/app/ios',
    projectRoot: '/app',
    reactNativeRoot: '/app/node_modules/react-native',
    autolinking: {},
    outputDir: '/app/ios/build/generated/autolinking',
    react: {
      packageRef: {name: 'ReactNative', path: '../build/xcframeworks'},
      products: [{name: 'ReactHeaders', package: 'ReactNative'}],
    },
  };
  const mk = (depName, fn) => ({
    depName,
    pluginPath: `/x/${depName}.js`,
    plugin: fn,
  });

  it('merges package/product/generated contributions', () => {
    const res = invokePlugins(
      [
        mk('expo', () => ({
          packageDependencies: [{name: 'ExpoModulesCore', path: '../expo'}],
          productDependencies: [
            {name: 'ExpoModulesCore', package: 'ExpoModulesCore'},
          ],
          generatedSources: [{path: 'ExpoModulesProvider.swift'}],
        })),
      ],
      ctx,
    );
    expect(res.packageDependencies).toEqual([
      {name: 'ExpoModulesCore', path: '../expo'},
    ]);
    expect(res.productDependencies).toEqual([
      {name: 'ExpoModulesCore', package: 'ExpoModulesCore'},
    ]);
    expect(res.generatedSources).toEqual([{path: 'ExpoModulesProvider.swift'}]);
  });

  it('passes the invariant React descriptor without a flavor', () => {
    let seen;
    invokePlugins(
      [
        mk('expo', c => {
          seen = c;
          return {};
        }),
      ],
      ctx,
    );
    expect(seen.flavor).toBeUndefined();
    expect(seen.projectRoot).toBe('/app');
    expect(seen.autolinking).toBe(ctx.autolinking);
    // react descriptor is forwarded so plugins depend on React via one source.
    expect(seen.react.packageRef).toEqual({
      name: 'ReactNative',
      path: '../build/xcframeworks',
    });
  });

  it('dedupes packages and products by name across plugins', () => {
    const res = invokePlugins(
      [
        mk('a', () => ({
          packageDependencies: [{name: 'Dup', path: './a'}],
          productDependencies: [{name: 'P', package: 'Dup'}],
        })),
        mk('b', () => ({
          packageDependencies: [{name: 'Dup', path: './b'}],
          productDependencies: [{name: 'P', package: 'Dup'}],
        })),
      ],
      ctx,
    );
    expect(res.packageDependencies).toHaveLength(1);
    expect(res.productDependencies).toHaveLength(1);
  });

  it('tolerates a plugin returning null/undefined', () => {
    const res = invokePlugins([mk('a', () => undefined)], ctx);
    expect(res.packageDependencies).toEqual([]);
  });

  it('fails closed and names the plugin when it throws', () => {
    expect(() =>
      invokePlugins(
        [
          mk('expo', () => {
            throw new Error('boom');
          }),
        ],
        ctx,
      ),
    ).toThrow(/plugin for 'expo'.*threw: boom/);
  });

  it('rejects a package dep without a path or url+version', () => {
    expect(() =>
      invokePlugins(
        [mk('expo', () => ({packageDependencies: [{name: 'X'}]}))],
        ctx,
      ),
    ).toThrow(/needs either a path or a url\+version/);
  });

  it('rejects a product dep missing name or package', () => {
    expect(() =>
      invokePlugins(
        [mk('expo', () => ({productDependencies: [{name: 'X'}]}))],
        ctx,
      ),
    ).toThrow(/productDependency needing name \+ package/);
  });

  it('merges valid flavoredFrameworks', () => {
    const res = invokePlugins(
      [
        mk('expo', () => ({
          flavoredFrameworks: [
            {
              id: 'expo-modules-core',
              frameworkName: 'ExpoModulesCore',
              linkage: 'dynamic',
              flavors: {
                debug: '/o/debug/ExpoModulesCore.xcframework',
                release: '/o/release/ExpoModulesCore.xcframework',
              },
            },
          ],
        })),
      ],
      ctx,
    );
    expect(res.flavoredFrameworks).toEqual([
      {
        id: 'expo-modules-core',
        frameworkName: 'ExpoModulesCore',
        linkage: 'dynamic',
        flavors: {
          debug: '/o/debug/ExpoModulesCore.xcframework',
          release: '/o/release/ExpoModulesCore.xcframework',
        },
      },
    ]);
  });

  it.each([
    [{id: 'a', frameworkName: 'A', linkage: 'dynamic', flavors: {debug: '/d'}}],
    [
      {
        id: 'a',
        frameworkName: 'A',
        linkage: 'static',
        flavors: {debug: '/d', release: '/r'},
      },
    ],
    [
      {
        id: 'a',
        frameworkName: 'A',
        linkage: 'dynamic',
        flavors: {debug: 'relative', release: '/r'},
      },
    ],
  ])('rejects malformed or incomplete flavoredFrameworks', entry => {
    expect(() =>
      invokePlugins([mk('expo', () => ({flavoredFrameworks: [entry]}))], ctx),
    ).toThrow(/invalid flavoredFramework/);
  });

  it('rejects duplicate embedded framework destinations', () => {
    const makeFramework = id => ({
      id,
      frameworkName: 'Dup',
      linkage: 'dynamic',
      flavors: {debug: `/a/${id}`, release: `/b/${id}`},
    });
    expect(() =>
      invokePlugins(
        [
          mk('a', () => ({flavoredFrameworks: [makeFramework('a')]})),
          mk('b', () => ({flavoredFrameworks: [makeFramework('b')]})),
        ],
        ctx,
      ),
    ).toThrow(/multiple plugins embed 'Dup\.framework'/);
  });

  it('defaults flavoredFrameworks to [] when no plugin declares any', () => {
    const res = invokePlugins([mk('a', () => ({}))], ctx);
    expect(res.flavoredFrameworks).toEqual([]);
  });

  it('rejects a non-array flavoredFrameworks declaration', () => {
    expect(() =>
      invokePlugins([mk('expo', () => ({flavoredFrameworks: {id: 'X'}}))], ctx),
    ).toThrow(/non-array flavoredFrameworks/);
  });

  it('keeps valid absolute watchPaths (dirs or files) across plugins', () => {
    const res = invokePlugins(
      [
        mk('expo', () => ({
          watchPaths: [
            '/app/node_modules/expo/Package.swift',
            '/app/node_modules/expo/expo-module.config.json',
          ],
        })),
        mk('b', () => ({watchPaths: ['/app/node_modules/b']})),
      ],
      ctx,
    );
    expect(res.watchPaths).toEqual([
      '/app/node_modules/expo/Package.swift',
      '/app/node_modules/expo/expo-module.config.json',
      '/app/node_modules/b',
    ]);
  });

  it('defaults watchPaths to [] when no plugin declares any', () => {
    const res = invokePlugins([mk('a', () => ({}))], ctx);
    expect(res.watchPaths).toEqual([]);
  });

  it('drops relative / empty / non-string watchPaths with a per-entry warning', () => {
    const warnings = [];
    const res = invokePlugins(
      [
        mk('expo', () => ({
          watchPaths: [
            '/app/node_modules/expo/Package.swift', // kept
            'relative/Package.swift', // relative → dropped
            '', // empty → dropped
            42, // non-string → dropped
          ],
        })),
      ],
      ctx,
      {warn: m => warnings.push(m)},
    );
    expect(res.watchPaths).toEqual(['/app/node_modules/expo/Package.swift']);
    expect(warnings).toHaveLength(3);
    expect(warnings.every(w => /invalid watchPath/.test(w))).toBe(true);
  });

  it('ignores a non-array watchPaths with a warning (never throws)', () => {
    const warnings = [];
    let res;
    expect(() => {
      res = invokePlugins(
        [mk('expo', () => ({watchPaths: '/app/x'}))], // string, not array
        ctx,
        {warn: m => warnings.push(m)},
      );
    }).not.toThrow();
    expect(res.watchPaths).toEqual([]);
    expect(warnings.some(w => /non-array watchPaths/.test(w))).toBe(true);
  });

  it('merges scriptPhases across plugins, preserving optional fields', () => {
    const res = invokePlugins(
      [
        mk('expo-constants', () => ({
          scriptPhases: [
            {
              id: 'expo-constants.generate-app-config',
              name: 'Generate Expo App Config',
              script: 'node ./write-app-config.js',
              position: 'beforeCompile',
              inputPaths: ['$(SRCROOT)/../app.config.js'],
              outputPaths: ['$(DERIVED_FILE_DIR)/app.config'],
              alwaysOutOfDate: true,
            },
          ],
        })),
        mk('b', () => ({
          scriptPhases: [{id: 'b.stamp', name: 'Stamp', script: 'echo hi'}],
        })),
      ],
      ctx,
    );
    expect(res.scriptPhases).toEqual([
      {
        id: 'expo-constants.generate-app-config',
        name: 'Generate Expo App Config',
        script: 'node ./write-app-config.js',
        position: 'beforeCompile',
        inputPaths: ['$(SRCROOT)/../app.config.js'],
        outputPaths: ['$(DERIVED_FILE_DIR)/app.config'],
        alwaysOutOfDate: true,
      },
      {id: 'b.stamp', name: 'Stamp', script: 'echo hi', position: 'end'},
    ]);
  });

  // A package's own npm name is the obvious stable id, and the scoped form is
  // the common one (`@expo/log-box` is a named consumer).
  it.each([['@expo/log-box'], ['@expo/ui']])(
    'accepts the scoped npm name %s as a scriptPhase id',
    id => {
      const res = invokePlugins(
        [mk('expo', () => ({scriptPhases: [{id, name: 'X', script: 'echo'}]}))],
        ctx,
      );
      expect(res.scriptPhases).toEqual([
        {id, name: 'X', script: 'echo', position: 'end'},
      ]);
    },
  );

  it('defaults scriptPhases to [] when no plugin declares any', () => {
    const res = invokePlugins([mk('a', () => ({}))], ctx);
    expect(res.scriptPhases).toEqual([]);
  });

  it('rejects a non-array scriptPhases declaration', () => {
    expect(() =>
      invokePlugins(
        [mk('expo', () => ({scriptPhases: {id: 'x', name: 'X', script: 'y'}}))],
        ctx,
      ),
    ).toThrow(/non-array scriptPhases/);
  });

  it.each([
    ['missing id', {name: 'X', script: 'echo'}],
    ['empty id', {id: '', name: 'X', script: 'echo'}],
    ['non-string id', {id: 7, name: 'X', script: 'echo'}],
    ['an id containing a space', {id: 'a b', name: 'X', script: 'echo'}],
    // `:` is excluded so the `plugin:<id>` UUID seed stays unambiguous.
    ['an id containing a colon', {id: 'expo:phase', name: 'X', script: 'echo'}],
    ['missing name', {id: 'a', script: 'echo'}],
    ['empty name', {id: 'a', name: '', script: 'echo'}],
    ['missing script', {id: 'a', name: 'X'}],
    ['empty script', {id: 'a', name: 'X', script: ''}],
    [
      'unknown position',
      {id: 'a', name: 'X', script: 'echo', position: 'afterLink'},
    ],
    [
      'non-array inputPaths',
      {id: 'a', name: 'X', script: 'echo', inputPaths: '/in'},
    ],
    [
      'non-string inputPaths entry',
      {id: 'a', name: 'X', script: 'echo', inputPaths: [7]},
    ],
    [
      'empty inputPaths entry',
      {id: 'a', name: 'X', script: 'echo', inputPaths: ['']},
    ],
    [
      'non-array outputPaths',
      {id: 'a', name: 'X', script: 'echo', outputPaths: '/out'},
    ],
    [
      'non-string outputPaths entry',
      {id: 'a', name: 'X', script: 'echo', outputPaths: [null]},
    ],
    [
      'non-boolean alwaysOutOfDate',
      {id: 'a', name: 'X', script: 'echo', alwaysOutOfDate: 'yes'},
    ],
    ['null entry', null],
    ['a number instead of an entry', 42],
    ['a string instead of an entry', 'echo'],
    ['the reserved id __proto__', {id: '__proto__', name: 'X', script: 'echo'}],
    [
      'the reserved id constructor',
      {id: 'constructor', name: 'X', script: 'echo'},
    ],
    ['the reserved id prototype', {id: 'prototype', name: 'X', script: 'echo'}],
  ])('rejects a scriptPhase with %s', (_label, entry) => {
    expect(() =>
      invokePlugins([mk('expo', () => ({scriptPhases: [entry]}))], ctx),
    ).toThrow(/invalid scriptPhase/);
  });

  it('names the offending id in the invalid-scriptPhase error', () => {
    expect(() =>
      invokePlugins(
        [
          mk('expo', () => ({
            scriptPhases: [
              {id: 'ok.phase', name: 'Fine', script: 'echo'},
              {id: 'bad:phase', name: 'Bad', script: 'echo'},
            ],
          })),
        ],
        ctx,
      ),
    ).toThrow(/invalid scriptPhase 'bad:phase'/);
  });

  it('rejects a duplicate scriptPhase id within a single plugin', () => {
    expect(() =>
      invokePlugins(
        [
          mk('expo', () => ({
            scriptPhases: [
              {id: 'dup.phase', name: 'One', script: 'echo one'},
              {id: 'dup.phase', name: 'Two', script: 'echo two'},
            ],
          })),
        ],
        ctx,
      ),
    ).toThrow(/duplicate script phase id 'dup\.phase'/);
  });

  it('rejects a duplicate scriptPhase id across plugins, naming it', () => {
    const phase = () => ({id: 'dup.phase', name: 'Dup', script: 'echo'});
    expect(() =>
      invokePlugins(
        [
          mk('a', () => ({scriptPhases: [phase()]})),
          mk('b', () => ({scriptPhases: [phase()]})),
        ],
        ctx,
      ),
    ).toThrow(/duplicate script phase id 'dup\.phase'/);
  });

  // A line break is the one thing an Xcode phase display name can never carry.
  // Every other hostile character is safe by construction: the injector
  // normalizes the name for the `/* … */` comments and escapes it in the `name`
  // field, so nothing structural reaches the project text.
  it.each([
    ['a newline', 'Line one\nLine two'],
    ['a carriage return', 'Line one\rLine two'],
  ])('rejects a scriptPhase name containing %s', (_label, name) => {
    expect(() =>
      invokePlugins(
        [
          mk('expo', () => ({
            scriptPhases: [{id: 'expo.phase', name, script: 'echo'}],
          })),
        ],
        ctx,
      ),
    ).toThrow(/invalid scriptPhase name for 'expo\.phase'/);
  });

  it.each([
    ['pbxproj quoting', 'Bundle "app.config"'],
    ['a comment terminator', 'Bad */ = { x'],
    ['a comment opener', 'Bad /* opener'],
  ])('keeps a scriptPhase name needing %s verbatim', (_label, name) => {
    const res = invokePlugins(
      [
        mk('expo', () => ({
          scriptPhases: [{id: 'expo.phase', name, script: 'echo'}],
        })),
      ],
      ctx,
    );
    expect(res.scriptPhases[0].name).toBe(name);
  });
});

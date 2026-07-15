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
const fs = require('fs');
const os = require('os');
const path = require('path');

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
});

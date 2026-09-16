/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const generate = require('@babel/generator').default;
const path = require('node:path');

const PROJECT_ROOT = path.sep === '/' ? '/my/project' : 'C:\\my\\project';
const RN_ROOT = path.join(PROJECT_ROOT, 'node_modules', 'react-native');

// The transformer memoizes its resolved Babel config in a module-level
// closure, keyed on nothing - so a fresh module instance is required for every
// distinct `options` shape, or later variants silently reuse the first
// variant's config.
beforeEach(() => {
  jest.resetModules();
});

function transformToCode(
  src: string,
  {
    filename = path.join(PROJECT_ROOT, 'App.js'),
    platform = 'ios',
    experimentalImportSupport = false,
    inlinePlatform = true,
  }: {
    filename?: string,
    platform?: ?string,
    experimentalImportSupport?: boolean,
    inlinePlatform?: boolean,
  } = {},
): string {
  const {transform} = require('../index.js');
  const {ast} = transform({
    filename,
    src,
    plugins: [],
    options: {
      dev: true,
      enableBabelRuntime: false,
      enableBabelRCLookup: false,
      experimentalImportSupport,
      globalPrefix: '__metro__',
      hot: false,
      inlinePlatform,
      minify: false,
      platform,
      publicPath: 'test',
      projectRoot: PROJECT_ROOT,
    },
  });
  return generate(ast).code;
}

// Each of these must inline during RN's own Babel pass, before ESM lowering
// destroys the evidence that the value came from React Native.
const IMPORT_FORMS = [
  {
    name: 'named import from react-native',
    src: "import {Platform} from 'react-native';\nconst os = Platform.OS;",
  },
  {
    name: 'aliased named import from react-native',
    src: "import {Platform as P} from 'react-native';\nconst os = P.OS;",
  },
  {
    name: 'namespace import from react-native',
    src: "import * as RN from 'react-native';\nconst os = RN.Platform.OS;",
  },
  {
    name: 'public deep default import',
    src: "import P from 'react-native/Libraries/Utilities/Platform';\nconst os = P.OS;",
  },
  {
    name: 'destructured require of react-native',
    src: "const {Platform} = require('react-native');\nconst os = Platform.OS;",
  },
];

describe.each([false, true])(
  'with experimentalImportSupport=%s',
  experimentalImportSupport => {
    test.each(IMPORT_FORMS)('inlines Platform.OS for a $name', ({src}) => {
      const code = transformToCode(src, {experimentalImportSupport});

      expect(code).toContain('"ios"');
      expect(code).not.toMatch(/\.OS\b/);
    });

    test('inlines Platform.select', () => {
      const code = transformToCode(
        "import {Platform} from 'react-native';\n" +
          'const value = Platform.select({ios: 1, android: 2});',
        {experimentalImportSupport},
      );

      expect(code).not.toContain('select');
      expect(code).toMatch(/[=]\s*1/);
    });

    test('inlines an RN-internal relative import', () => {
      const code = transformToCode(
        "import Platform from '../../Utilities/Platform';\nconst os = Platform.OS;",
        {
          filename: path.join(
            RN_ROOT,
            'Libraries',
            'Components',
            'ScrollView',
            'ScrollView.js',
          ),
          experimentalImportSupport,
        },
      );

      expect(code).toContain('"ios"');
      expect(code).not.toMatch(/\.OS\b/);
    });

    test('leaves the import in place after inlining', () => {
      // Removing it would change dependency collection; that is out of scope
      // here and handled by a separate opt-in pass.
      const code = transformToCode(
        "import {Platform} from 'react-native';\nconst os = Platform.OS;",
        {experimentalImportSupport},
      );

      expect(code).toContain('react-native');
    });

    test('does not inline a same-named import from another package', () => {
      const code = transformToCode(
        "import Platform from 'other-package';\nconst os = Platform.OS;",
        {experimentalImportSupport},
      );

      expect(code).toMatch(/\.OS\b/);
      expect(code).not.toContain('"ios"');
    });

    test('does not inline when no platform is given', () => {
      const code = transformToCode(
        "import {Platform} from 'react-native';\nconst os = Platform.OS;",
        {platform: null, experimentalImportSupport},
      );

      expect(code).toMatch(/\.OS\b/);
    });

    test('does not inline without the inlinePlatform opt-in', () => {
      // Metro sets this per build; consumers that only need platform-correct
      // resolution (Jest) pass a platform without it and must keep `Platform`
      // observable so it can be mocked.
      const code = transformToCode(
        "import {Platform} from 'react-native';\nconst os = Platform.OS;",
        {inlinePlatform: false, experimentalImportSupport},
      );

      expect(code).toMatch(/\.OS\b/);
      expect(code).not.toContain('"ios"');
    });
  },
);

test('the two import-support modes really do produce different output', () => {
  // Guards the test setup itself: without a module reset between variants the
  // memoized config leaks and the parameterized suite above would silently run
  // the same configuration twice.
  const src = "import {Platform} from 'react-native';\nconst x = Other.thing;";

  const lowered = transformToCode(src, {experimentalImportSupport: false});
  jest.resetModules();
  const preserved = transformToCode(src, {experimentalImportSupport: true});

  expect(lowered).toContain('require');
  expect(preserved).toContain('import');
  expect(preserved).not.toContain('require');
});

test('inlines before the preset lowers ESM to CommonJS interop', () => {
  // Guards the ordering contract: if the plugin ran after the RN preset's
  // import transform, it would see `_reactNative.Platform.OS` and the
  // specifier proving RN provenance would be gone.
  const code = transformToCode(
    "import {Platform} from 'react-native';\nconst os = Platform.OS;",
    {experimentalImportSupport: false},
  );

  expect(code).toContain('require');
  expect(code).toContain('"ios"');
  expect(code).not.toMatch(/_reactNative\.Platform/);
});

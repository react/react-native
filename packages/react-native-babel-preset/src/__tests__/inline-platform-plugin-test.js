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

const inlinePlatformPlugin = require('../inline-platform-plugin.js');
const {transformSync} = require('@babel/core');
const path = require('node:path');

const RN_ROOT = '/app/node_modules/react-native';
const APP_FILE = '/app/src/App.js';

function transform(
  code: string,
  {
    filename = APP_FILE,
    platform = 'ios',
  }: {filename?: string, platform?: ?string} = {},
): string {
  const result = transformSync(code, {
    babelrc: false,
    configFile: false,
    compact: true,
    filename,
    plugins: [
      // $FlowFixMe[untyped-import]
      require('@babel/plugin-syntax-flow'),
      [inlinePlatformPlugin, {platform}],
    ],
    sourceType: 'module',
  });
  return result.code;
}

// Asserts the code is unchanged by the plugin, modulo formatting.
function expectUnchanged(
  code: string,
  options?: {filename?: string, platform?: ?string},
) {
  expect(transform(code, options)).toBe(
    transform(code, {...options, platform: null}),
  );
}

describe('Platform.OS from an ESM import', () => {
  test('inlines a named import from react-native', () => {
    expect(
      transform(`
        import {Platform} from 'react-native';
        const os = Platform.OS;
      `),
    ).toMatchInlineSnapshot(
      `"import{Platform}from'react-native';const os=\\"ios\\";"`,
    );
  });

  test('inlines an aliased named import', () => {
    expect(
      transform(`
        import {Platform as P} from 'react-native';
        const os = P.OS;
      `),
    ).toMatchInlineSnapshot(
      `"import{Platform as P}from'react-native';const os=\\"ios\\";"`,
    );
  });

  test('inlines through a namespace import', () => {
    expect(
      transform(`
        import * as RN from 'react-native';
        const os = RN.Platform.OS;
      `),
    ).toMatchInlineSnapshot(
      `"import*as RN from'react-native';const os=\\"ios\\";"`,
    );
  });

  test('inlines a public deep default import', () => {
    expect(
      transform(`
        import P from 'react-native/Libraries/Utilities/Platform';
        const os = P.OS;
      `),
    ).toMatchInlineSnapshot(
      `"import P from'react-native/Libraries/Utilities/Platform';const os=\\"ios\\";"`,
    );
  });

  test('inlines a default import from the react-native barrel', () => {
    // `react-native` is CommonJS, so the default import is the barrel object.
    expect(
      transform(`
        import ReactNative from 'react-native';
        const os = ReactNative.Platform.OS;
      `),
    ).toMatchInlineSnapshot(
      `"import ReactNative from'react-native';const os=\\"ios\\";"`,
    );
  });

  test('respects the requested platform', () => {
    expect(
      transform(
        `
          import {Platform} from 'react-native';
          const os = Platform.OS;
        `,
        {platform: 'android'},
      ),
    ).toContain('"android"');
  });

  test('does not inline a type-only import', () => {
    expectUnchanged(`
      import type {Platform} from 'react-native';
      const os = Platform.OS;
    `);
  });
});

describe('Platform.OS from CommonJS', () => {
  test('inlines a direct require of the barrel', () => {
    expect(
      transform(`
        const os = require('react-native').Platform.OS;
      `),
    ).toMatchInlineSnapshot(`"const os=\\"ios\\";"`);
  });

  test('inlines a bound require of the barrel', () => {
    expect(
      transform(`
        const RN = require('react-native');
        const os = RN.Platform.OS;
      `),
    ).toMatchInlineSnapshot(
      `"const RN=require('react-native');const os=\\"ios\\";"`,
    );
  });

  test('inlines a deep require with .default', () => {
    expect(
      transform(`
        const P = require('react-native/Libraries/Utilities/Platform').default;
        const os = P.OS;
      `),
    ).toMatchInlineSnapshot(
      `"const P=require('react-native/Libraries/Utilities/Platform').default;const os=\\"ios\\";"`,
    );
  });

  test('inlines a destructured require', () => {
    expect(
      transform(`
        const {Platform} = require('react-native');
        const os = Platform.OS;
      `),
    ).toMatchInlineSnapshot(
      `"const{Platform}=require('react-native');const os=\\"ios\\";"`,
    );
  });

  test('inlines a renamed destructured require', () => {
    expect(
      transform(`
        const {Platform: P} = require('react-native');
        const os = P.OS;
      `),
    ).toMatchInlineSnapshot(
      `"const{Platform:P}=require('react-native');const os=\\"ios\\";"`,
    );
  });

  test('follows an immutable alias', () => {
    expect(
      transform(`
        const {Platform} = require('react-native');
        const P = Platform;
        const os = P.OS;
      `),
    ).toMatchInlineSnapshot(
      `"const{Platform}=require('react-native');const P=Platform;const os=\\"ios\\";"`,
    );
  });

  test('does not inline when require is shadowed', () => {
    expectUnchanged(`
      function f(require) {
        const P = require('react-native').Platform;
        return P.OS;
      }
    `);
  });

  test('does not follow a reassigned binding', () => {
    expectUnchanged(`
      let P = require('react-native').Platform;
      P = somethingElse;
      const os = P.OS;
    `);
  });

  test('does not inline a require with a non-literal specifier', () => {
    expectUnchanged(`
      const os = require(dynamicName).Platform.OS;
    `);
  });
});

describe('provenance is required', () => {
  test('does not inline a bare global Platform', () => {
    // Metro's late pass still handles this historical form.
    expectUnchanged('const os = Platform.OS;');
  });

  test('does not inline React.Platform.OS', () => {
    expectUnchanged('const os = React.Platform.OS;');
  });

  test('does not inline a same-named import from another package', () => {
    expectUnchanged(`
      import Platform from 'other-package';
      const os = Platform.OS;
    `);
    expectUnchanged(`
      import {Platform} from 'other-package';
      const os = Platform.OS;
    `);
  });

  test('does not inline a locally declared Platform', () => {
    expectUnchanged(`
      const Platform = {OS: 'web'};
      const os = Platform.OS;
    `);
  });

  test('does not inline a parameter named Platform', () => {
    expectUnchanged(`
      function f(Platform) {
        return Platform.OS;
      }
    `);
  });

  test('does not inline a shadowing local inside a function', () => {
    const code = `
      import {Platform} from 'react-native';
      function f() {
        const Platform = {OS: 'web'};
        return Platform.OS;
      }
      const outer = Platform.OS;
    `;
    const output = transform(code);
    expect(output).toContain('Platform.OS');
    expect(output).toContain('const outer="ios"');
  });

  test('does not inline a non-Platform member of the barrel', () => {
    expectUnchanged(`
      import {View} from 'react-native';
      const os = View.OS;
    `);
  });

  test('does not inline a different module named Platform', () => {
    expectUnchanged(
      `
        import P from '../Utilities/Platform';
        const os = P.OS;
      `,
      {filename: '/app/src/components/Thing.js'},
    );
  });
});

describe('unsafe positions', () => {
  test('does not replace an assignment target', () => {
    const output = transform(`
      import {Platform} from 'react-native';
      Platform.OS = 'web';
    `);
    expect(output).toContain("Platform.OS='web'");
  });

  test('does not replace an update target', () => {
    const output = transform(`
      import {Platform} from 'react-native';
      Platform.OS++;
    `);
    expect(output).toContain('Platform.OS++');
  });

  test('does not replace a delete target', () => {
    const output = transform(`
      import {Platform} from 'react-native';
      delete Platform.OS;
    `);
    expect(output).toContain('delete Platform.OS');
  });

  test('does not inline computed access', () => {
    const output = transform(`
      import {Platform} from 'react-native';
      const os = Platform['OS'];
    `);
    expect(output).toContain("Platform['OS']");
  });
});

describe('React Native internal relative imports', () => {
  test('inlines from Libraries/', () => {
    expect(
      transform(
        `
          import Platform from '../../Utilities/Platform';
          const os = Platform.OS;
        `,
        {
          filename: `${RN_ROOT}/Libraries/Components/ScrollView/ScrollView.js`,
        },
      ),
    ).toContain('"ios"');
  });

  test('inlines from src/private/', () => {
    expect(
      transform(
        `
          import Platform from '../../../Libraries/Utilities/Platform';
          const os = Platform.OS;
        `,
        {
          filename: `/app/packages/react-native/src/private/animated/NativeAnimatedHelper.js`,
        },
      ),
    ).toContain('"ios"');
  });

  test('inlines a relative CommonJS require with .default', () => {
    expect(
      transform(
        `
          const P = require('../../Utilities/Platform').default;
          const os = P.OS;
        `,
        {filename: `${RN_ROOT}/Libraries/Components/View/View.js`},
      ),
    ).toContain('"ios"');
  });

  test('inlines a relative import with an explicit extension', () => {
    expect(
      transform(
        `
          import Platform from '../../Utilities/Platform.js';
          const os = Platform.OS;
        `,
        {filename: `${RN_ROOT}/Libraries/Components/View/View.js`},
      ),
    ).toContain('"ios"');
  });

  test('inlines under a pnpm-style layout', () => {
    expect(
      transform(
        `
          import Platform from '../../Utilities/Platform';
          const os = Platform.OS;
        `,
        {
          filename:
            '/app/node_modules/.pnpm/react-native@0.87.0/node_modules/react-native/Libraries/Components/View/View.js',
        },
      ),
    ).toContain('"ios"');
  });

  test('does not inline when the package root is react-native-something', () => {
    expectUnchanged(
      `
        import Platform from '../../Utilities/Platform';
        const os = Platform.OS;
      `,
      {
        filename:
          '/app/node_modules/react-native-web/Libraries/Components/View/View.js',
      },
    );
  });

  test('does not inline when the importer is outside the resolved RN root', () => {
    // Resolves into react-native, but the importer is not part of it.
    expectUnchanged(
      `
        import Platform from '../node_modules/react-native/Libraries/Utilities/Platform';
        const os = Platform.OS;
      `,
      {filename: '/app/src/App.js'},
    );
  });

  test('does not inline a relative path that escapes into another package', () => {
    expectUnchanged(
      `
        import Platform from '../../../other-package/Libraries/Utilities/Platform';
        const os = Platform.OS;
      `,
      {filename: `${RN_ROOT}/Libraries/Components/View/View.js`},
    );
  });

  if (path.sep === '\\') {
    test('normalizes Windows separators', () => {
      expect(
        transform(
          `
            import Platform from '../../Utilities/Platform';
            const os = Platform.OS;
          `,
          {
            filename:
              'C:\\app\\node_modules\\react-native\\Libraries\\Components\\View\\View.js',
          },
        ),
      ).toContain('"ios"');
    });
  }
});

describe('Platform.select', () => {
  const select = (spec: string, platform: string = 'ios') =>
    transform(
      `
        import {Platform} from 'react-native';
        const value = Platform.select(${spec});
      `,
      {platform},
    );

  test('picks the exact platform', () => {
    expect(select('{ios: 1, android: 2}')).toContain('const value=1');
  });

  test('falls back to native', () => {
    expect(select('{ios: 1, native: 2}', 'android')).toContain('const value=2');
  });

  test('falls back to default', () => {
    expect(select('{ios: 1, default: 3}', 'android')).toContain(
      'const value=3',
    );
  });

  test('prefers native over default', () => {
    expect(select('{ios: 1, native: 2, default: 3}', 'android')).toContain(
      'const value=2',
    );
  });

  test('yields undefined when nothing matches', () => {
    expect(select('{ios: 1}', 'android')).toContain('const value=undefined');
  });

  test('accepts string keys', () => {
    expect(select("{'ios': 1, 'android': 2}")).toContain('const value=1');
  });

  test('accepts object methods', () => {
    expect(select('{ios() { return 1; }}')).toContain('function');
  });

  test('does not inline computed keys', () => {
    expect(select('{[key]: 1, default: 2}')).toContain('Platform.select');
  });

  test('does not inline spreads', () => {
    expect(select('{...rest, default: 2}')).toContain('Platform.select');
  });

  test('does not inline getters', () => {
    expect(select('{get ios() { return 1; }}')).toContain('Platform.select');
  });

  test('does not inline a non-object argument', () => {
    expect(select('spec')).toContain('Platform.select');
  });

  test('does not inline an unproven Platform.select', () => {
    expectUnchanged('const value = Platform.select({ios: 1});');
  });
});

describe('platform option', () => {
  const code = `
    import {Platform} from 'react-native';
    const os = Platform.OS;
    const value = Platform.select({ios: 1});
  `;

  test('is a no-op when platform is null', () => {
    const output = transform(code, {platform: null});
    expect(output).toContain('Platform.OS');
    expect(output).toContain('Platform.select');
  });

  test('is a no-op when platform is the empty string', () => {
    // React Native's Jest preprocessor passes `platform: ''` for every file it
    // transforms; inlining `Platform.OS` to `""` there would break the RN test
    // suite wholesale.
    const output = transform(code, {platform: ''});
    expect(output).toContain('Platform.OS');
    expect(output).toContain('Platform.select');
    expect(output).not.toContain('""');
  });
});

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

import fs from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';

const RN_ISSUE = 'https://github.com/react/react-native/issues/56641';

const presetDir = path.resolve(__dirname, '..', '..');
const presetRequire = createRequire(path.join(presetDir, 'package.json'));

describe(`preset transform survives strict isolation (${RN_ISSUE})`, () => {
  const preset = require('../../jest-preset');

  test('JS transformer resolves from the preset scope', () => {
    const jsTransform = preset.transform['^.+\\.(js|ts|tsx)$'];
    // A bare 'babel-jest' specifier only resolves by hoisting or a consumer
    // devDependency. Under pnpm / Yarn pnpm-mode the consumer scope does not
    // see the preset's dependencies, so the transformer must resolve from
    // the preset's own scope.
    expect(jsTransform).toBe(presetRequire.resolve('babel-jest'));
    expect(fs.existsSync(jsTransform)).toBe(true);
  });

  test('transformIgnorePatterns covers pnpm/Yarn layouts without widening', () => {
    const re = new RegExp(preset.transformIgnorePatterns[0]);
    // [path, shouldBeIgnored]. pnpm (.pnpm/<id>/node_modules) and Yarn
    // pnpm-mode (.store/<flat>-npm-<version>-<hash>/package, with a scoped
    // package's slash flattened to a dash) layouts must transform preset and
    // react-native sources; everything else must stay ignored exactly as
    // before — in particular scoped third-party packages whose unscoped name
    // is exactly react-native, and nested directories literally named
    // react-native inside unrelated packages.
    const cases: Array<[string, boolean]> = [
      ['/app/node_modules/@react-native/jest-preset/jest/setup.js', false],
      ['/app/node_modules/react-native/Libraries/AppState/AppState.js', false],
      ['/app/node_modules/lodash/lodash.js', true],
      ['/app/node_modules/react-native-reanimated/lib/index.js', true],
      ['/app/node_modules/react-native-svg/lib/index.js', true],
      [
        '/app/node_modules/@react-native-async-storage/async-storage/lib/index.js',
        true,
      ],
      ['/app/node_modules/react-native-virtualized-view/lib/index.js', true],
      ['/app/node_modules/react-native-virtual-joystick/lib/index.js', true],
      ['/app/node_modules/react-native-virtual-keyboard/lib/index.js', true],
      ['/app/node_modules/react-native-virtual-list/lib/index.js', true],
      // `-virtual-<hash>` is a Yarn *store* convention, so it must not be
      // honoured in a classic layout: these are ordinary third-party packages
      // that happen to end in a hex-looking segment, and a hex `[0-9a-f]+`
      // matches short words like `beef`, `dead` and `cafe`.
      [
        '/app/node_modules/react-native-reanimated-virtual-beef/lib/index.js',
        true,
      ],
      ['/app/node_modules/react-native-virtual-dead/index.js', true],
      ['/app/node_modules/react-native-svg-virtual-cafe/index.js', true],
      // A path ending at the package directory itself, with no trailing
      // separator, is not a source file and must not be transformed.
      ['/app/node_modules/react-native', true],
      ['/app/node_modules/@sentry/react-native/lib/index.js', true],
      ['/app/node_modules/@notifee/react-native/lib/index.js', true],
      ['/app/node_modules/some-pkg/react-native/patch.js', true],
      [
        '/tmp/x/node_modules/.pnpm/@react-native+jest-preset@file+preset_abc/node_modules/@react-native/jest-preset/jest/setup.js',
        false,
      ],
      [
        '/tmp/x/node_modules/.pnpm/react-native@1000.0.0/node_modules/react-native/Libraries/AppState/AppState.js',
        false,
      ],
      [
        '/tmp/x/node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/lodash.js',
        true,
      ],
      [
        '/tmp/x/node_modules/.pnpm/react-native-reanimated@1.0.0/node_modules/react-native-reanimated/lib/index.js',
        true,
      ],
      [
        '/tmp/x/node_modules/.pnpm/react-native-svg@1.0.0/node_modules/react-native-svg/lib/index.js',
        true,
      ],
      [
        '/tmp/x/node_modules/.pnpm/@react-native-async-storage+async-storage@1.0.0/node_modules/@react-native-async-storage/async-storage/lib/index.js',
        true,
      ],
      [
        '/tmp/x/node_modules/.pnpm/@sentry+react-native@6.1.0/node_modules/@sentry/react-native/lib/index.js',
        true,
      ],
      [
        '/tmp/x/node_modules/.pnpm/some-pkg@1.0.0/node_modules/some-pkg/react-native/patch.js',
        true,
      ],
      [
        '/tmp/x/node_modules/.store/react-native-npm-1000.0.0-abc123def4/package/Libraries/AppState/AppState.js',
        false,
      ],
      [
        '/tmp/x/node_modules/.store/@react-native-jest-preset-npm-0.87.1-abc123def4/package/jest/mock.js',
        false,
      ],
      [
        '/tmp/x/node_modules/.store/@react-native-community-cli-npm-15.0.0-abc123def4/package/build/index.js',
        false,
      ],
      [
        '/tmp/x/node_modules/.store/lodash-npm-4.17.21-abc123def4/package/lodash.js',
        true,
      ],
      [
        '/tmp/x/node_modules/.store/react-native-reanimated-npm-1.0.0-abc123def4/package/lib/index.js',
        true,
      ],
      [
        '/tmp/x/node_modules/.store/react-native-virtualized-view-npm-1.0.0-abc123def4/package/lib/index.js',
        true,
      ],
      [
        '/tmp/x/node_modules/.store/@sentry-react-native-npm-6.1.0-abc123def4/package/lib/index.js',
        true,
      ],
      [
        '/tmp/x/node_modules/.store/@notifee-react-native-npm-9.1.0-abc123def4/package/lib/index.js',
        true,
      ],
      // Yarn emits -virtual-<hash> entries (no version) for packages that
      // declare peer dependencies — both store forms must behave the same.
      [
        '/tmp/x/node_modules/.store/@react-native-jest-preset-virtual-1fd1f8fd8f/package/jest/setup.js',
        false,
      ],
      [
        '/tmp/x/node_modules/.store/react-native-virtual-abc123def4/package/Libraries/AppState/AppState.js',
        false,
      ],
      [
        '/tmp/x/node_modules/.store/@sentry-react-native-virtual-abc123def4/package/lib/index.js',
        true,
      ],
      [
        '/tmp/x/node_modules/.store/react-native-reanimated-virtual-abc123def4/package/lib/index.js',
        true,
      ],
      [
        '/tmp/x/node_modules/.store/@react-native-async-storage-async-storage-virtual-abc123def4/package/lib/index.js',
        false,
      ],
      // Flattening erases the scope boundary, so a third-party
      // @react-native-<scope>/* package is indistinguishable from a genuine
      // @react-native/* one here; transforming is the safe direction (a miss
      // would ship untransformed sources), at performance-only cost.
      [
        '/tmp/x/node_modules/.store/@react-native-async-storage-async-storage-npm-1.0.0-abc123def4/package/lib/index.js',
        false,
      ],
      // A store entry records the protocol the package was resolved through,
      // not just `npm`/`virtual`. These paths are verbatim from a Yarn 4.18
      // pnpm-mode install, and must transform like any other react-native
      // source — `yarn patch react-native` is a common thing to do.
      [
        '/tmp/x/node_modules/.store/react-native-file-d30a842e27/package/Libraries/AppState/AppState.js',
        false,
      ],
      [
        '/tmp/x/node_modules/.store/react-native-patch-cfbe751c88/package/Libraries/AppState/AppState.js',
        false,
      ],
      [
        '/tmp/x/node_modules/.store/@react-native-jest-preset-file-508aaadafa/package/jest/setup.js',
        false,
      ],
      // The protocol list is explicit so that a package whose name merely
      // continues past `react-native` cannot put its own name in the protocol
      // position and be transformed.
      [
        '/tmp/x/node_modules/.store/react-native-filedep-file-d9baa55f6d/package/index.js',
        true,
      ],
      ['/tmp/x/packages/app/__tests__/App.test.js', false],
    ];
    for (const [file, shouldIgnore] of cases) {
      expect(re.test(file)).toBe(shouldIgnore);
    }
  });
});

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
    // [path, shouldBeIgnored]. pnpm (.pnpm/<hash>/node_modules) and Yarn
    // pnpm-mode (.store/<virtual>/package) layouts must transform preset and
    // react-native sources; real `-suffix` packages must stay ignored exactly
    // as before.
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
        '/tmp/x/node_modules/.store/@react-native-jest-preset-virtual-abc123/package/jest/mock.js',
        false,
      ],
      ['/tmp/x/packages/app/__tests__/App.test.js', false],
    ];
    for (const [file, shouldIgnore] of cases) {
      expect(re.test(file)).toBe(shouldIgnore);
    }
  });
});

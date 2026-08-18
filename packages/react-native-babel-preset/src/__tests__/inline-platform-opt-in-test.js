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

// $FlowExpectedError[untyped-import] - Preset is untyped
const preset = require('../index');
const babel = require('@babel/core');

const FILENAME = '/app/src/App.js';
const SRC = "import {Platform} from 'react-native';\nconst os = Platform.OS;";

type PresetOptions = {
  platform?: ?string,
  inlinePlatform?: boolean,
};

type CallerOptions = {
  platform?: ?string,
  inlinePlatform?: boolean,
};

function transform({
  presetOptions = {},
  caller = {},
}: {
  presetOptions?: PresetOptions,
  caller?: CallerOptions,
} = {}): string {
  const result = babel.transformSync(SRC, {
    babelrc: false,
    caller: {name: 'test', ...caller},
    compact: false,
    configFile: false,
    filename: FILENAME,
    presets: [[preset, {dev: false, ...presetOptions}]],
    sourceMaps: false,
  });
  const code = result?.code;
  if (code == null) {
    throw new Error('Expected the transform to produce code');
  }
  return code;
}

function isInlined(code: string): boolean {
  return code.includes('"ios"') && !/\.OS\b/.test(code);
}

describe('Platform inlining is opt-in', () => {
  test('does not inline when only a platform is given', () => {
    // A platform on its own says which platform we are compiling *for*. It is
    // also set by consumers that need platform-correct module resolution but
    // must keep `Platform` observable at runtime - Jest mocks it.
    expect(isInlined(transform({presetOptions: {platform: 'ios'}}))).toBe(
      false,
    );
  });

  test('does not inline when only the Babel caller gives a platform', () => {
    expect(isInlined(transform({caller: {platform: 'ios'}}))).toBe(false);
  });

  test('inlines when opted in via preset options', () => {
    expect(
      isInlined(
        transform({presetOptions: {platform: 'ios', inlinePlatform: true}}),
      ),
    ).toBe(true);
  });

  test('inlines when opted in via the Babel caller', () => {
    // The only channel available when the preset is named in a babel.config.js,
    // where Babel supplies no preset options.
    expect(
      isInlined(transform({caller: {platform: 'ios', inlinePlatform: true}})),
    ).toBe(true);
  });

  test('preset options take precedence over the caller', () => {
    expect(
      isInlined(
        transform({
          presetOptions: {inlinePlatform: false},
          caller: {platform: 'ios', inlinePlatform: true},
        }),
      ),
    ).toBe(false);
  });

  test('opting in without a platform is still a no-op', () => {
    expect(isInlined(transform({presetOptions: {inlinePlatform: true}}))).toBe(
      false,
    );
  });
});

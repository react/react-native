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
const SRC = "import foo from './foo';\nexport const bar = foo;";

type PresetOptions = {
  disableImportExportTransform?: boolean,
};

type CallerOptions = {
  experimentalImportSupport?: boolean,
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

function isLowered(code: string): boolean {
  return code.includes('require(') && !/^import\b/m.test(code);
}

describe('import/export lowering is skipped when the caller lowers it', () => {
  test('lowers by default', () => {
    expect(isLowered(transform())).toBe(true);
  });

  test('keeps ESM when opted out via preset options', () => {
    expect(
      isLowered(
        transform({presetOptions: {disableImportExportTransform: true}}),
      ),
    ).toBe(false);
  });

  test('keeps ESM when the Babel caller lowers imports itself', () => {
    // The only channel available when the preset is named in a babel.config.js,
    // where Babel supplies no preset options. Metro's transformer sets this from
    // its `experimentalImportSupport` transform option.
    expect(
      isLowered(transform({caller: {experimentalImportSupport: true}})),
    ).toBe(false);
  });

  test('lowers when the Babel caller does not lower imports', () => {
    expect(
      isLowered(transform({caller: {experimentalImportSupport: false}})),
    ).toBe(true);
  });

  test('preset options take precedence over the caller', () => {
    expect(
      isLowered(
        transform({
          presetOptions: {disableImportExportTransform: false},
          caller: {experimentalImportSupport: true},
        }),
      ),
    ).toBe(true);
  });
});

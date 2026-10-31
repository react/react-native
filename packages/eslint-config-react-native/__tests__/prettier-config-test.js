/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

import eslintConfigReactNative from '..';
import eslintConfigReactNativeFlat from '../flat';
import eslintConfigPrettier from 'eslint-config-prettier';

test('eslint-config-prettier is not globally overridden', () => {
  expect(Object.keys(eslintConfigPrettier.rules)).not.toHaveLength(0);
  expect(Object.keys(eslintConfigReactNative.rules)).not.toHaveLength(0);

  const overriddenRules = [];

  for (const ruleName of Object.keys(eslintConfigPrettier.rules)) {
    if (Object.hasOwn(eslintConfigReactNative.rules, ruleName)) {
      overriddenRules.push(ruleName);
    }
  }

  expect(overriddenRules).toEqual([]);
});

const {overrides = []} = eslintConfigReactNative;

for (const override of overrides) {
  if (override.rules == null) {
    continue;
  }
  const overrideIdentifier = JSON.stringify(override.files);

  test(`eslint-config-prettier is not overridden for ${overrideIdentifier}"`, () => {
    const overriddenRules = [];

    for (const ruleName of Object.keys(eslintConfigPrettier.rules)) {
      if (Object.hasOwn(override.rules, ruleName)) {
        overriddenRules.push(ruleName);
      }
    }

    expect(overriddenRules).toEqual([]);
  });

  // Technically, `overrides` can contain more `overrides`. Since we don't
  // currently use that and it is less common, we don't worry about it.
}

for (const config of eslintConfigReactNativeFlat) {
  if (config === eslintConfigPrettier || config.rules == null) {
    continue;
  }
  const configIdentifier = JSON.stringify(config.files ?? '<all files>');

  test(`eslint-config-prettier is not overridden in flat config for ${configIdentifier}`, () => {
    const overriddenRules = [];

    for (const ruleName of Object.keys(eslintConfigPrettier.rules)) {
      if (Object.hasOwn(config.rules, ruleName)) {
        overriddenRules.push(ruleName);
      }
    }

    expect(overriddenRules).toEqual([]);
  });
}

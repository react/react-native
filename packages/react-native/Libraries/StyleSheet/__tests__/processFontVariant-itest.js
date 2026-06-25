/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

const processFontVariant = require('../processFontVariant').default;

describe('processFontVariant', () => {
  it('should accept arrays', () => {
    expect(processFontVariant([])).toEqual([]);
    expect(processFontVariant(['oldstyle-nums'])).toEqual(['oldstyle-nums']);
    expect(processFontVariant(['proportional-nums', 'lining-nums'])).toEqual([
      'proportional-nums',
      'lining-nums',
    ]);
  });

  it('should accept string values', () => {
    expect(processFontVariant('oldstyle-nums')).toEqual(['oldstyle-nums']);
    expect(processFontVariant('lining-nums  ')).toEqual(['lining-nums']);
    expect(processFontVariant('   tabular-nums')).toEqual(['tabular-nums']);
  });

  it('should accept string with multiple values', () => {
    expect(processFontVariant('oldstyle-nums lining-nums')).toEqual([
      'oldstyle-nums',
      'lining-nums',
    ]);
    expect(
      processFontVariant('proportional-nums  oldstyle-nums   lining-nums'),
    ).toEqual(['proportional-nums', 'oldstyle-nums', 'lining-nums']);
    expect(
      processFontVariant(
        '   small-caps proportional-nums  oldstyle-nums lining-nums',
      ),
    ).toEqual([
      'small-caps',
      'proportional-nums',
      'oldstyle-nums',
      'lining-nums',
    ]);
  });
});

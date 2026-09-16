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

import processFontVariationSettings from '../processFontVariationSettings';

describe('processFontVariationSettings', () => {
  it('passes string settings through unchanged', () => {
    expect(processFontVariationSettings("'wght' 550, 'opsz' 18")).toBe(
      "'wght' 550, 'opsz' 18",
    );
  });

  it('serializes object settings in deterministic axis order', () => {
    expect(processFontVariationSettings({wght: 552.5, opsz: 17.25})).toBe(
      "'opsz' 17.25, 'wght' 552.5",
    );
  });

  it('serializes an empty object as an explicit clear', () => {
    expect(processFontVariationSettings({})).toBe('');
  });

  it('supports printable four-character tags containing a single quote', () => {
    expect(processFontVariationSettings({["a'b "]: 1})).toBe('"a\'b " 1');
  });

  it('preserves backslashes in printable four-character tags', () => {
    expect(processFontVariationSettings({['a\\bc']: 1})).toBe("'a\\bc' 1");
  });

  it('rejects tags that cannot be delimited without escaping', () => {
    expect(() => processFontVariationSettings({[`a'"b`]: 1})).toThrow(
      'Font variation axis tags containing both quote characters must use the string form: "a\'\\"b"',
    );
  });

  it('rejects invalid axis tags', () => {
    expect(() => processFontVariationSettings({weight: 550})).toThrow(
      'Font variation axis tags must be exactly four printable ASCII characters: "weight"',
    );
    expect(() => processFontVariationSettings({['a\nbc']: 1})).toThrow(
      'Font variation axis tags must be exactly four printable ASCII characters: "a\\nbc"',
    );
  });

  it('rejects non-finite axis values', () => {
    expect(() => processFontVariationSettings({wght: NaN})).toThrow(
      'Font variation axis values must be finite numbers: NaN',
    );
    expect(() => processFontVariationSettings({wght: Infinity})).toThrow(
      'Font variation axis values must be finite numbers: Infinity',
    );
  });
});

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
import processBackgroundRepeat from '../processBackgroundRepeat';

describe('processBackgroundRepeat', () => {
  // Test null/undefined input
  it('should handle null input', () => {
    expect(processBackgroundRepeat(null)).toEqual([]);
  });

  it('should handle undefined input', () => {
    expect(processBackgroundRepeat(undefined)).toEqual([]);
  });

  // Test empty string input
  it('should handle empty string', () => {
    expect(processBackgroundRepeat('')).toEqual([]);
  });

  // Test array input
  it('should handle array input', () => {
    expect(processBackgroundRepeat([{x: 'repeat', y: 'space'}])).toEqual([
      {x: 'repeat', y: 'space'},
    ]);
  });

  // Test single keyword values
  it('should parse repeat', () => {
    expect(processBackgroundRepeat('repeat')).toEqual([
      {x: 'repeat', y: 'repeat'},
    ]);
  });

  it('should parse no-repeat', () => {
    expect(processBackgroundRepeat('no-repeat')).toEqual([
      {x: 'no-repeat', y: 'no-repeat'},
    ]);
  });

  it('should parse space', () => {
    expect(processBackgroundRepeat('space')).toEqual([
      {x: 'space', y: 'space'},
    ]);
  });

  it('should parse round', () => {
    expect(processBackgroundRepeat('round')).toEqual([
      {x: 'round', y: 'round'},
    ]);
  });

  it('should parse repeat-x', () => {
    expect(processBackgroundRepeat('repeat-x')).toEqual([
      {x: 'repeat', y: 'no-repeat'},
    ]);
  });

  it('should parse repeat-y', () => {
    expect(processBackgroundRepeat('repeat-y')).toEqual([
      {x: 'no-repeat', y: 'repeat'},
    ]);
  });

  // Test two-value syntax
  it('should parse two repeat values', () => {
    expect(processBackgroundRepeat('repeat repeat')).toEqual([
      {x: 'repeat', y: 'repeat'},
    ]);
  });

  it('should parse repeat no-repeat', () => {
    expect(processBackgroundRepeat('repeat no-repeat')).toEqual([
      {x: 'repeat', y: 'no-repeat'},
    ]);
  });

  it('should parse round space', () => {
    expect(processBackgroundRepeat('round space')).toEqual([
      {x: 'round', y: 'space'},
    ]);
  });

  // Test multiple background repeats (comma-separated)
  it('should parse multiple background repeats', () => {
    expect(processBackgroundRepeat('repeat, no-repeat')).toEqual([
      {x: 'repeat', y: 'repeat'},
      {x: 'no-repeat', y: 'no-repeat'},
    ]);
  });

  it('should parse multiple background repeats with two values', () => {
    expect(processBackgroundRepeat('repeat no-repeat, space round')).toEqual([
      {x: 'repeat', y: 'no-repeat'},
      {x: 'space', y: 'round'},
    ]);
  });

  it('should parse multiple background repeats with mixed syntax', () => {
    expect(processBackgroundRepeat('repeat-x, space round, no-repeat')).toEqual(
      [
        {x: 'repeat', y: 'no-repeat'},
        {x: 'space', y: 'round'},
        {x: 'no-repeat', y: 'no-repeat'},
      ],
    );
  });

  it('should parse multiple background repeats with newlines', () => {
    expect(processBackgroundRepeat('repeat,\nno-repeat')).toEqual([
      {x: 'repeat', y: 'repeat'},
      {x: 'no-repeat', y: 'no-repeat'},
    ]);
  });

  it('should parse multiple background repeats with extra whitespace', () => {
    expect(processBackgroundRepeat('  repeat  ,  no-repeat  ')).toEqual([
      {x: 'repeat', y: 'repeat'},
      {x: 'no-repeat', y: 'no-repeat'},
    ]);
  });

  // Test case sensitivity
  it('should handle mixed case keywords', () => {
    expect(processBackgroundRepeat('REPEAT')).toEqual([
      {x: 'repeat', y: 'repeat'},
    ]);
  });

  it('should handle mixed case keywords with spaces', () => {
    expect(processBackgroundRepeat('  Repeat  ')).toEqual([
      {x: 'repeat', y: 'repeat'},
    ]);
  });

  it('should handle mixed case in two values', () => {
    expect(processBackgroundRepeat('REPEAT NO-REPEAT')).toEqual([
      {x: 'repeat', y: 'no-repeat'},
    ]);
  });

  it('should handle mixed case in repeat-x', () => {
    expect(processBackgroundRepeat('REPEAT-X')).toEqual([
      {x: 'repeat', y: 'no-repeat'},
    ]);
  });

  // Test whitespace handling
  it('should handle extra spaces between values', () => {
    expect(processBackgroundRepeat('repeat    no-repeat')).toEqual([
      {x: 'repeat', y: 'no-repeat'},
    ]);
  });

  it('should handle tabs and newlines', () => {
    expect(processBackgroundRepeat('repeat\tno-repeat\n')).toEqual([
      {x: 'repeat', y: 'no-repeat'},
    ]);
  });

  // Test edge cases and invalid inputs
  it('should handle invalid single value', () => {
    expect(processBackgroundRepeat('invalid')).toEqual([]);
  });

  it('should handle invalid two values', () => {
    expect(processBackgroundRepeat('repeat invalid')).toEqual([]);
  });

  it('should handle too many values', () => {
    expect(processBackgroundRepeat('repeat no-repeat space')).toEqual([]);
  });

  it('should handle empty values in comma-separated list', () => {
    expect(processBackgroundRepeat('repeat,')).toEqual([]);
  });

  it('should handle only comma', () => {
    expect(processBackgroundRepeat(',')).toEqual([]);
  });

  it('should handle multiple commas', () => {
    expect(processBackgroundRepeat('repeat,,no-repeat')).toEqual([]);
  });

  it('should handle invalid mixed values in multiple backgrounds', () => {
    expect(processBackgroundRepeat('repeat, invalid')).toEqual([]);
  });

  it('should handle invalid mixed values in multiple backgrounds with two values', () => {
    expect(processBackgroundRepeat('repeat no-repeat, invalid round')).toEqual(
      [],
    );
  });

  // Test complex scenarios
  it('should handle all valid two value combinations', () => {
    expect(
      processBackgroundRepeat(
        'repeat repeat, repeat no-repeat, repeat space, repeat round, no-repeat repeat, no-repeat no-repeat, no-repeat space, no-repeat round, space repeat, space no-repeat, space space, space round, round repeat, round no-repeat, round space, round round',
      ),
    ).toEqual([
      {x: 'repeat', y: 'repeat'},
      {x: 'repeat', y: 'no-repeat'},
      {x: 'repeat', y: 'space'},
      {x: 'repeat', y: 'round'},
      {x: 'no-repeat', y: 'repeat'},
      {x: 'no-repeat', y: 'no-repeat'},
      {x: 'no-repeat', y: 'space'},
      {x: 'no-repeat', y: 'round'},
      {x: 'space', y: 'repeat'},
      {x: 'space', y: 'no-repeat'},
      {x: 'space', y: 'space'},
      {x: 'space', y: 'round'},
      {x: 'round', y: 'repeat'},
      {x: 'round', y: 'no-repeat'},
      {x: 'round', y: 'space'},
      {x: 'round', y: 'round'},
    ]);
  });

  // Test specific edge cases
  it('should handle single space character', () => {
    expect(processBackgroundRepeat(' ')).toEqual([]);
  });

  it('should handle multiple space characters', () => {
    expect(processBackgroundRepeat('   ')).toEqual([]);
  });

  it('should handle comma with spaces', () => {
    expect(processBackgroundRepeat(' , ')).toEqual([]);
  });
});

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
import processBackgroundSize from '../processBackgroundSize';

describe('processBackgroundSize', () => {
  // Test null/undefined input
  it('should handle null input', () => {
    expect(processBackgroundSize(null)).toEqual([]);
  });

  it('should handle undefined input', () => {
    expect(processBackgroundSize(undefined)).toEqual([]);
  });

  // Test empty string input
  it('should handle empty string', () => {
    expect(processBackgroundSize('')).toEqual([]);
  });

  // Test array input
  it('should handle array input', () => {
    expect(processBackgroundSize([{x: 100, y: 200}])).toEqual([
      {x: 100, y: 200},
    ]);
  });

  it('should handle array with multiple values', () => {
    expect(
      processBackgroundSize([
        {x: 100, y: 'auto'},
        {x: '50%', y: '50%'},
      ]),
    ).toEqual([
      {x: 100, y: 'auto'},
      {x: '50%', y: '50%'},
    ]);
  });

  // Test string input - single values
  it('should parse single length value', () => {
    expect(processBackgroundSize('100px')).toEqual([{x: 100, y: 'auto'}]);
  });

  it('should parse single percentage value', () => {
    expect(processBackgroundSize('50%')).toEqual([{x: '50%', y: 'auto'}]);
  });

  it('should parse single auto value', () => {
    expect(processBackgroundSize('auto')).toEqual([{x: 'auto', y: 'auto'}]);
  });

  // Test string input - two values
  it('should parse two length values', () => {
    expect(processBackgroundSize('100px 200px')).toEqual([{x: 100, y: 200}]);
  });

  it('should parse two percentage values', () => {
    expect(processBackgroundSize('50% 75%')).toEqual([{x: '50%', y: '75%'}]);
  });

  it('should parse length and percentage', () => {
    expect(processBackgroundSize('100px 50%')).toEqual([{x: 100, y: '50%'}]);
  });

  it('should parse percentage and length', () => {
    expect(processBackgroundSize('50% 200px')).toEqual([{x: '50%', y: 200}]);
  });

  it('should parse length and auto', () => {
    expect(processBackgroundSize('100px auto')).toEqual([{x: 100, y: 'auto'}]);
  });

  it('should parse auto and length', () => {
    expect(processBackgroundSize('auto 200px')).toEqual([{x: 'auto', y: 200}]);
  });

  it('should parse percentage and auto', () => {
    expect(processBackgroundSize('50% auto')).toEqual([{x: '50%', y: 'auto'}]);
  });

  it('should parse auto and percentage', () => {
    expect(processBackgroundSize('auto 75%')).toEqual([{x: 'auto', y: '75%'}]);
  });

  it('should parse two auto values', () => {
    expect(processBackgroundSize('auto auto')).toEqual([
      {x: 'auto', y: 'auto'},
    ]);
  });

  // Test multiple background sizes (comma-separated)
  it('should parse multiple background sizes', () => {
    expect(processBackgroundSize('100px 200px, 50%')).toEqual([
      {x: 100, y: 200},
      {x: '50%', y: 'auto'},
    ]);
  });

  it('should parse multiple background sizes with spaces', () => {
    expect(processBackgroundSize('100px 200px, 50% 75%')).toEqual([
      {x: 100, y: 200},
      {x: '50%', y: '75%'},
    ]);
  });

  it('should parse multiple background sizes with newlines', () => {
    expect(processBackgroundSize('100px 200px,\n50%')).toEqual([
      {x: 100, y: 200},
      {x: '50%', y: 'auto'},
    ]);
  });

  it('should parse multiple background sizes with extra whitespace', () => {
    expect(processBackgroundSize('  100px  200px  ,  50%  ')).toEqual([
      {x: 100, y: 200},
      {x: '50%', y: 'auto'},
    ]);
  });

  // Test edge cases and invalid inputs
  it('should handle negative length values', () => {
    expect(processBackgroundSize('-100px')).toEqual([]);
  });

  it('should handle negative percentage values', () => {
    expect(processBackgroundSize('-50%')).toEqual([]);
  });

  it('should handle zero length values', () => {
    expect(processBackgroundSize('0px')).toEqual([{x: 0, y: 'auto'}]);
  });

  it('should handle zero percentage values', () => {
    expect(processBackgroundSize('0%')).toEqual([{x: '0%', y: 'auto'}]);
  });

  it('should handle decimal length values', () => {
    expect(processBackgroundSize('100.5px')).toEqual([{x: 100.5, y: 'auto'}]);
  });

  it('should handle decimal percentage values', () => {
    expect(processBackgroundSize('50.5%')).toEqual([{x: '50.5%', y: 'auto'}]);
  });

  it('should handle invalid units', () => {
    expect(processBackgroundSize('100em')).toEqual([]);
  });

  it('should handle invalid percentage format', () => {
    expect(processBackgroundSize('50')).toEqual([]);
  });

  it('should handle mixed case keywords', () => {
    expect(processBackgroundSize('AUTO')).toEqual([{x: 'auto', y: 'auto'}]);
  });

  it('should handle mixed case keywords with spaces', () => {
    expect(processBackgroundSize('  Auto  ')).toEqual([{x: 'auto', y: 'auto'}]);
  });

  it('should handle invalid mixed values', () => {
    expect(processBackgroundSize('100px invalid')).toEqual([]);
  });

  it('should handle invalid mixed values in multiple backgrounds', () => {
    expect(processBackgroundSize('100px 200px, invalid')).toEqual([]);
  });

  it('should handle too many values', () => {
    expect(processBackgroundSize('100px 200px 300px')).toEqual([]);
  });

  it('should handle empty values in comma-separated list', () => {
    expect(processBackgroundSize('100px 200px,')).toEqual([]);
  });

  it('should handle only comma', () => {
    expect(processBackgroundSize(',')).toEqual([]);
  });

  it('should handle multiple commas', () => {
    expect(processBackgroundSize('100px 200px,,cover')).toEqual([]);
  });

  // Test whitespace handling
  it('should handle extra spaces between values', () => {
    expect(processBackgroundSize('100px    200px')).toEqual([{x: 100, y: 200}]);
  });

  it('should handle tabs and newlines', () => {
    expect(processBackgroundSize('100px\t200px\n')).toEqual([{x: 100, y: 200}]);
  });

  // Test complex scenarios
  it('should handle complex multiple background scenario', () => {
    expect(processBackgroundSize('100px 200px, 50% auto, auto')).toEqual([
      {x: 100, y: 200},
      {x: '50%', y: 'auto'},
      {x: 'auto', y: 'auto'},
    ]);
  });

  it('should handle all valid single value combinations', () => {
    expect(processBackgroundSize('100px, 50%, auto')).toEqual([
      {x: 100, y: 'auto'},
      {x: '50%', y: 'auto'},
      {x: 'auto', y: 'auto'},
    ]);
  });

  it('should return empty array for unsupported cover keyword', () => {
    expect(processBackgroundSize('cover')).toEqual([]);
  });

  it('should return empty array for unsupported contain keyword', () => {
    expect(processBackgroundSize('contain')).toEqual([]);
  });
});

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

  // Test cover and contain keywords
  it('should parse cover', () => {
    expect(processBackgroundSize('cover')).toEqual(['cover']);
  });

  it('should parse contain', () => {
    expect(processBackgroundSize('contain')).toEqual(['contain']);
  });

  it('should parse mixed case cover and contain', () => {
    expect(processBackgroundSize('  COVER  , Contain')).toEqual([
      'cover',
      'contain',
    ]);
  });

  it('should keep other layers next to cover and contain', () => {
    expect(processBackgroundSize('10px auto, cover, 50%, contain')).toEqual([
      {x: 10, y: 'auto'},
      'cover',
      {x: '50%', y: 'auto'},
      'contain',
    ]);
  });

  it('should match the array form for cover', () => {
    expect(processBackgroundSize('10px auto, cover')).toEqual(
      processBackgroundSize([{x: 10, y: 'auto'}, 'cover']),
    );
  });

  it('should handle array with cover and contain', () => {
    expect(processBackgroundSize([{x: 100, y: 'auto'}, 'contain'])).toEqual([
      {x: 100, y: 'auto'},
      'contain',
    ]);
  });

  it('should reject cover or contain combined with a size', () => {
    expect(processBackgroundSize('cover 10px')).toEqual([]);
    expect(processBackgroundSize('10px contain')).toEqual([]);
    expect(processBackgroundSize('auto cover')).toEqual([]);
  });

  it('should reject cover and contain in one layer', () => {
    expect(processBackgroundSize('cover contain')).toEqual([]);
    expect(processBackgroundSize('cover cover')).toEqual([]);
  });

  it('should reject every layer when a cover layer is invalid', () => {
    expect(processBackgroundSize('10px auto, cover 10px')).toEqual([]);
  });

  it('should reject every layer when a layer has more than two values', () => {
    expect(
      processBackgroundSize('40px 40px, cover 10px auto, contain'),
    ).toEqual([]);
    expect(processBackgroundSize('10px, 10px 20px 30px, 50%')).toEqual([]);
  });
});

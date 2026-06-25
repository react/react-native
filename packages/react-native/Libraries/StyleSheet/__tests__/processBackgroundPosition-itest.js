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
import processBackgroundPosition from '../processBackgroundPosition';

describe('processBackgroundPosition', () => {
  // Test null/undefined input
  it('should handle null input', () => {
    expect(processBackgroundPosition(null)).toEqual([]);
  });

  it('should handle undefined input', () => {
    expect(processBackgroundPosition(undefined)).toEqual([]);
  });

  // Test empty string input
  it('should handle empty string', () => {
    expect(processBackgroundPosition('')).toEqual([]);
  });

  // Test array input
  it('should handle array input', () => {
    expect(processBackgroundPosition([{top: '50%', left: '50%'}])).toEqual([
      {top: '50%', left: '50%'},
    ]);
  });

  it('should handle array with multiple positions', () => {
    expect(
      processBackgroundPosition([{bottom: '100%', right: '100%'}]),
    ).toEqual([{bottom: '100%', right: '100%'}]);
  });

  // Test single keyword values
  it('should parse left', () => {
    expect(processBackgroundPosition('left')).toEqual([
      {top: '50%', left: '0%'},
    ]);
  });

  it('should parse center', () => {
    expect(processBackgroundPosition('center')).toEqual([
      {top: '50%', left: '50%'},
    ]);
  });

  it('should parse right', () => {
    expect(processBackgroundPosition('right')).toEqual([
      {top: '50%', left: '100%'},
    ]);
  });

  it('should parse top', () => {
    expect(processBackgroundPosition('top')).toEqual([
      {top: '0%', left: '50%'},
    ]);
  });

  it('should parse bottom', () => {
    expect(processBackgroundPosition('bottom')).toEqual([
      {top: '100%', left: '50%'},
    ]);
  });

  // Test single length/percentage values
  it('should parse single px value', () => {
    expect(processBackgroundPosition('100px')).toEqual([
      {top: '50%', left: 100},
    ]);
  });

  it('should parse single percentage value', () => {
    expect(processBackgroundPosition('25%')).toEqual([
      {top: '50%', left: '25%'},
    ]);
  });

  it('should parse single decimal px value', () => {
    expect(processBackgroundPosition('100.5px')).toEqual([
      {top: '50%', left: 100.5},
    ]);
  });

  it('should parse single decimal percentage value', () => {
    expect(processBackgroundPosition('25.5%')).toEqual([
      {top: '50%', left: '25.5%'},
    ]);
  });

  // Test two-value syntax
  it('should parse left top', () => {
    expect(processBackgroundPosition('left top')).toEqual([
      {top: '0%', left: '0%'},
    ]);
  });

  it('should parse left center', () => {
    expect(processBackgroundPosition('left center')).toEqual([
      {top: '50%', left: '0%'},
    ]);
  });

  it('should parse center top', () => {
    expect(processBackgroundPosition('center top')).toEqual([
      {top: '0%', left: '50%'},
    ]);
  });

  it('should parse center center', () => {
    expect(processBackgroundPosition('center center')).toEqual([
      {top: '50%', left: '50%'},
    ]);
  });

  it('should parse center bottom', () => {
    expect(processBackgroundPosition('center bottom')).toEqual([
      {top: '100%', left: '50%'},
    ]);
  });

  it('should parse right center', () => {
    expect(processBackgroundPosition('right center')).toEqual([
      {top: '50%', left: '100%'},
    ]);
  });

  it('should parse right bottom', () => {
    expect(processBackgroundPosition('right bottom')).toEqual([
      {top: '100%', left: '100%'},
    ]);
  });

  // Test keyword with length/percentage
  it('should parse left with px', () => {
    expect(processBackgroundPosition('left 100px')).toEqual([
      {top: 100, left: '0%'},
    ]);
  });

  it('should parse left with percentage', () => {
    expect(processBackgroundPosition('left 25%')).toEqual([
      {top: '25%', left: '0%'},
    ]);
  });

  it('should parse right with px', () => {
    expect(processBackgroundPosition('right 100px')).toEqual([
      {top: 100, left: '100%'},
    ]);
  });

  it('should parse right with percentage', () => {
    expect(processBackgroundPosition('right 25%')).toEqual([
      {top: '25%', left: '100%'},
    ]);
  });

  // Test length/percentage with keyword
  it('should parse px with top', () => {
    expect(processBackgroundPosition('100px top')).toEqual([
      {top: '0%', left: 100},
    ]);
  });

  it('should parse px with bottom', () => {
    expect(processBackgroundPosition('100px bottom')).toEqual([
      {top: '100%', left: 100},
    ]);
  });

  it('should parse percentage with top', () => {
    expect(processBackgroundPosition('25% top')).toEqual([
      {top: '0%', left: '25%'},
    ]);
  });

  it('should parse percentage with bottom', () => {
    expect(processBackgroundPosition('25% bottom')).toEqual([
      {top: '100%', left: '25%'},
    ]);
  });

  // Test two length/percentage values
  it('should parse px px', () => {
    expect(processBackgroundPosition('100px 200px')).toEqual([
      {top: 200, left: 100},
    ]);
  });

  it('should parse percentage percentage', () => {
    expect(processBackgroundPosition('25% 75%')).toEqual([
      {top: '75%', left: '25%'},
    ]);
  });

  it('should parse px percentage', () => {
    expect(processBackgroundPosition('100px 75%')).toEqual([
      {top: '75%', left: 100},
    ]);
  });

  it('should parse percentage px', () => {
    expect(processBackgroundPosition('25% 200px')).toEqual([
      {top: 200, left: '25%'},
    ]);
  });

  // Test three-value syntax
  it('should parse center top with percentage', () => {
    expect(processBackgroundPosition('center top 25%')).toEqual([
      {top: '25%', left: '50%'},
    ]);
  });

  it('should parse center bottom with percentage', () => {
    expect(processBackgroundPosition('center bottom 25%')).toEqual([
      {bottom: '25%', left: '50%'},
    ]);
  });

  it('should parse left center with percentage', () => {
    expect(processBackgroundPosition('left 25% center')).toEqual([
      {top: '50%', left: '25%'},
    ]);
  });

  it('should parse right center with percentage', () => {
    expect(processBackgroundPosition('right 25% center')).toEqual([
      {top: '50%', right: '25%'},
    ]);
  });

  it('should parse left with percentage top', () => {
    expect(processBackgroundPosition('left 25% top')).toEqual([
      {top: '0%', left: '25%'},
    ]);
  });

  it('should parse left with percentage bottom', () => {
    expect(processBackgroundPosition('left 25% bottom')).toEqual([
      {bottom: '0%', left: '25%'},
    ]);
  });

  it('should parse right with percentage top', () => {
    expect(processBackgroundPosition('right 25% top')).toEqual([
      {top: '0%', right: '25%'},
    ]);
  });

  it('should parse right with percentage bottom', () => {
    expect(processBackgroundPosition('right 25% bottom')).toEqual([
      {bottom: '0%', right: '25%'},
    ]);
  });

  // Test four-value syntax
  it('should parse left percentage top percentage', () => {
    expect(processBackgroundPosition('left 25% top 75%')).toEqual([
      {top: '75%', left: '25%'},
    ]);
  });

  it('should parse right percentage top percentage', () => {
    expect(processBackgroundPosition('right 25% top 75%')).toEqual([
      {top: '75%', right: '25%'},
    ]);
  });

  it('should parse left percentage bottom percentage', () => {
    expect(processBackgroundPosition('left 25% bottom 75%')).toEqual([
      {bottom: '75%', left: '25%'},
    ]);
  });

  it('should parse right percentage bottom percentage', () => {
    expect(processBackgroundPosition('right 25% bottom 75%')).toEqual([
      {bottom: '75%', right: '25%'},
    ]);
  });

  // Test multiple background positions (comma-separated)
  it('should parse multiple background positions', () => {
    expect(processBackgroundPosition('left top, right bottom')).toEqual([
      {top: '0%', left: '0%'},
      {top: '100%', left: '100%'},
    ]);
  });

  it('should parse multiple background positions with values', () => {
    expect(
      processBackgroundPosition('left 25% top 75%, center center'),
    ).toEqual([
      {top: '75%', left: '25%'},
      {top: '50%', left: '50%'},
    ]);
  });

  it('should parse multiple background positions with newlines', () => {
    expect(processBackgroundPosition('left top,\nright bottom')).toEqual([
      {top: '0%', left: '0%'},
      {top: '100%', left: '100%'},
    ]);
  });

  it('should parse multiple background positions with extra whitespace', () => {
    expect(processBackgroundPosition('  left top  ,  right bottom  ')).toEqual([
      {top: '0%', left: '0%'},
      {top: '100%', left: '100%'},
    ]);
  });

  // Test case sensitivity
  it('should handle mixed case keywords', () => {
    expect(processBackgroundPosition('LEFT')).toEqual([
      {top: '50%', left: '0%'},
    ]);
  });

  it('should handle mixed case keywords with spaces', () => {
    expect(processBackgroundPosition('  Left  ')).toEqual([
      {top: '50%', left: '0%'},
    ]);
  });

  it('should handle mixed case in two values', () => {
    expect(processBackgroundPosition('LEFT TOP')).toEqual([
      {top: '0%', left: '0%'},
    ]);
  });

  it('should handle mixed case in unit values', () => {
    expect(processBackgroundPosition('LEFT 100PX')).toEqual([
      {top: 100, left: '0%'},
    ]);
  });

  // Test whitespace handling
  it('should handle extra spaces between values', () => {
    expect(processBackgroundPosition('left    top')).toEqual([
      {top: '0%', left: '0%'},
    ]);
  });

  it('should handle tabs and newlines', () => {
    expect(processBackgroundPosition('left\ttop\n')).toEqual([
      {top: '0%', left: '0%'},
    ]);
  });

  // Test edge cases and invalid inputs
  it('should handle invalid single value', () => {
    expect(processBackgroundPosition('invalid')).toEqual([]);
  });

  it('should handle invalid two values', () => {
    expect(processBackgroundPosition('left invalid')).toEqual([]);
  });

  it('should handle invalid first value', () => {
    expect(processBackgroundPosition('invalid top')).toEqual([]);
  });

  it('should handle too many values', () => {
    expect(processBackgroundPosition('left top center')).toEqual([]);
  });

  it('should handle empty values in comma-separated list', () => {
    expect(processBackgroundPosition('left top,')).toEqual([]);
  });

  it('should handle only comma', () => {
    expect(processBackgroundPosition(',')).toEqual([]);
  });

  it('should handle multiple commas', () => {
    expect(processBackgroundPosition('left top,,right bottom')).toEqual([]);
  });

  it('should handle invalid mixed values in multiple backgrounds', () => {
    expect(processBackgroundPosition('left top, invalid')).toEqual([]);
  });

  it('should handle negative px values', () => {
    expect(processBackgroundPosition('-100px')).toEqual([
      {top: '50%', left: -100},
    ]);
  });

  it('should handle negative percentage values', () => {
    expect(processBackgroundPosition('-25%')).toEqual([
      {top: '50%', left: '-25%'},
    ]);
  });

  it('should handle zero px values', () => {
    expect(processBackgroundPosition('0px')).toEqual([{top: '50%', left: 0}]);
  });

  it('should handle zero percentage values', () => {
    expect(processBackgroundPosition('0%')).toEqual([{top: '50%', left: '0%'}]);
  });

  it('should handle invalid units', () => {
    expect(processBackgroundPosition('100em')).toEqual([]);
  });

  it('should handle invalid percentage format', () => {
    expect(processBackgroundPosition('50')).toEqual([]);
  });

  it('should handle partial invalid values', () => {
    expect(processBackgroundPosition('left-')).toEqual([]);
  });

  it('should handle partial invalid values with valid ones', () => {
    expect(processBackgroundPosition('left-, top')).toEqual([]);
  });

  // Test complex scenarios
  it('should handle complex multiple background scenario', () => {
    expect(
      processBackgroundPosition(
        'left top, center center, right 25% bottom 75%',
      ),
    ).toEqual([
      {top: '0%', left: '0%'},
      {top: '50%', left: '50%'},
      {bottom: '75%', right: '25%'},
    ]);
  });

  it('should handle all valid single keyword combinations', () => {
    expect(
      processBackgroundPosition('left, center, right, top, bottom'),
    ).toEqual([
      {top: '50%', left: '0%'},
      {top: '50%', left: '50%'},
      {top: '50%', left: '100%'},
      {top: '0%', left: '50%'},
      {top: '100%', left: '50%'},
    ]);
  });

  // Test specific edge cases
  it('should handle single space character', () => {
    expect(processBackgroundPosition(' ')).toEqual([]);
  });

  it('should handle multiple space characters', () => {
    expect(processBackgroundPosition('   ')).toEqual([]);
  });

  it('should handle comma with spaces', () => {
    expect(processBackgroundPosition(' , ')).toEqual([]);
  });

  it('should handle invalid three value syntax', () => {
    expect(processBackgroundPosition('left top invalid')).toEqual([]);
  });

  it('should handle invalid four value syntax', () => {
    expect(processBackgroundPosition('left 25% top invalid')).toEqual([]);
  });

  it('should handle 0 as a valid position', () => {
    expect(processBackgroundPosition('0 0')).toEqual([{top: 0, left: 0}]);
  });
});

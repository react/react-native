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

import processBoxShadow from '../processBoxShadow';
import processColor from '../processColor';

describe('processBoxShadow', () => {
  describe('string parsing', () => {
    it('should parse basic string', () => {
      expect(processBoxShadow('10px 5px')).toEqual([
        {
          offsetX: 10,
          offsetY: 5,
        },
      ]);
    });

    it('should parse basic string with unitless zero length', () => {
      expect(processBoxShadow('10px 0')).toEqual([
        {
          offsetX: 10,
          offsetY: 0,
        },
      ]);
    });

    it('should parse basic string with multiple whitespaces', () => {
      expect(processBoxShadow('10px    5px')).toEqual([
        {
          offsetX: 10,
          offsetY: 5,
        },
      ]);
    });

    it('should parse string with color', () => {
      expect(processBoxShadow('red 10px 5px')).toEqual([
        {
          color: processColor('red'),
          offsetX: 10,
          offsetY: 5,
        },
      ]);
    });

    it('should parse string with color function rgba', () => {
      expect(processBoxShadow('rgba(255, 255, 255, 0.5) 10px 5px')).toEqual([
        {
          color: processColor('rgba(255, 255, 255, 0.5)'),
          offsetX: 10,
          offsetY: 5,
        },
      ]);
    });

    it('should parse string with color function hsl', () => {
      expect(processBoxShadow('hsl(318, 69%, 55%) 10px 5px')).toEqual([
        {
          color: processColor('hsl(318, 69%, 55%)'),
          offsetX: 10,
          offsetY: 5,
        },
      ]);
    });

    it('should parse string with hex color', () => {
      expect(processBoxShadow('#FFFFFF 10px 5px')).toEqual([
        {
          color: processColor('#FFFFFF'),
          offsetX: 10,
          offsetY: 5,
        },
      ]);
    });

    it('should parse string with blurRadius', () => {
      expect(processBoxShadow('red 10px 5px 2px')).toEqual([
        {
          color: processColor('red'),
          blurRadius: 2,
          offsetX: 10,
          offsetY: 5,
        },
      ]);
    });

    it('should parse string with spreadDistance', () => {
      expect(processBoxShadow('red 10px 5px 2px 3px')).toEqual([
        {
          color: processColor('red'),
          blurRadius: 2,
          offsetX: 10,
          offsetY: 5,
          spreadDistance: 3,
        },
      ]);
    });

    it('should parse string arguments with units', () => {
      expect(processBoxShadow('5px 2px')).toEqual([
        {
          offsetX: 5,
          offsetY: 2,
        },
      ]);
    });

    it('should parse string with inset', () => {
      expect(processBoxShadow('5px 2px inset')).toEqual([
        {
          offsetX: 5,
          offsetY: 2,
          inset: true,
        },
      ]);
    });

    it('should parse string with inset and color before and after lengths', () => {
      expect(processBoxShadow('red 10px 10px inset')).toEqual([
        {
          color: processColor('red'),
          offsetX: 10,
          offsetY: 10,
          inset: true,
        },
      ]);
    });

    it('should parse multiple box shadow strings', () => {
      expect(
        processBoxShadow(
          '10px 5px red, 5px 12px inset, inset 10px 45px 13px red',
        ),
      ).toEqual([
        {
          offsetX: 10,
          offsetY: 5,
          color: processColor('red'),
        },
        {
          offsetX: 5,
          offsetY: 12,
          inset: true,
        },
        {
          offsetX: 10,
          offsetY: 45,
          blurRadius: 13,
          inset: true,
          color: processColor('red'),
        },
      ]);
    });

    it('should parse multiple box shadow strings with newlines', () => {
      expect(
        processBoxShadow(
          '10px 5px red, 5px 12px inset,\n  inset 10px 45px 13px red',
        ),
      ).toEqual([
        {
          offsetX: 10,
          offsetY: 5,
          color: processColor('red'),
        },
        {
          offsetX: 5,
          offsetY: 12,
          inset: true,
        },
        {
          offsetX: 10,
          offsetY: 45,
          blurRadius: 13,
          inset: true,
          color: processColor('red'),
        },
      ]);
    });

    it('should parse string with leading dot decimal', () => {
      expect(processBoxShadow('.5px 2px')).toEqual([
        {
          offsetX: 0.5,
          offsetY: 2,
        },
      ]);
    });

    it('should parse string with explicit positive sign', () => {
      expect(processBoxShadow('+5px 2px')).toEqual([
        {
          offsetX: 5,
          offsetY: 2,
        },
      ]);
    });
  });

  describe('string parsing failures', () => {
    it('should fail to parse string with invalid units', () => {
      expect(processBoxShadow('red 10em 5$ 2| 3rp')).toEqual([]);
    });

    it('should fail to parse too many lengths', () => {
      expect(processBoxShadow('10px 5px 2px 3px 10px 10px')).toEqual([]);
    });

    it('should fail to parse inset between lengths', () => {
      expect(processBoxShadow('10px inset 5px 2px 3px,')).toEqual([]);
    });

    it('should fail to parse double color', () => {
      expect(processBoxShadow('red red 10px 5px')).toEqual([]);
    });

    it('should fail to parse double inset', () => {
      expect(processBoxShadow('10px 5px inset inset')).toEqual([]);
    });

    it('should fail to parse color between lengths', () => {
      expect(processBoxShadow('10px red 5px 2px 3px,')).toEqual([]);
    });

    it('should fail to parse invalid unit', () => {
      expect(processBoxShadow('red 10foo 5px 2px 3px,')).toEqual([]);
    });

    it('should fail to parse decimal number with invalid unit', () => {
      expect(processBoxShadow('1.5dog 2px')).toEqual([]);
    });

    it('should fail to parse invalid argument', () => {
      expect(processBoxShadow('red asf 5px 2px 3px')).toEqual([]);
    });

    it('should fail to parse trailing dot without fractional digits', () => {
      expect(processBoxShadow('10.px 5px')).toEqual([]);
    });

    it('should fail to parse negative blur', () => {
      expect(processBoxShadow('red 5px 2px -3px')).toEqual([]);
    });

    it('should fail to parse missing unit', () => {
      expect(processBoxShadow('10px 5')).toEqual([]);
    });
  });

  describe('object parsing', () => {
    it('should parse simple object', () => {
      expect(
        processBoxShadow([
          {
            offsetX: 10,
            offsetY: 5,
          },
        ]),
      ).toEqual([
        {
          offsetX: 10,
          offsetY: 5,
        },
      ]);
    });

    it('should parse object with color', () => {
      expect(
        processBoxShadow([
          {
            offsetX: 10,
            offsetY: 5,
            color: 'red',
          },
        ]),
      ).toEqual([
        {
          offsetX: 10,
          offsetY: 5,
          color: processColor('red'),
        },
      ]);
    });

    it('should parse complex box shadow', () => {
      expect(
        processBoxShadow([
          {
            offsetX: '10px',
            offsetY: 5,
            blurRadius: 2,
            spreadDistance: 3,
            inset: true,
            color: '#FFFFFF',
          },
        ]),
      ).toEqual([
        {
          offsetX: 10,
          offsetY: 5,
          blurRadius: 2,
          spreadDistance: 3,
          inset: true,
          color: processColor('#FFFFFF'),
        },
      ]);
    });

    it('should fail to parse object with negative blur', () => {
      expect(
        processBoxShadow([
          {
            offsetX: 10,
            offsetY: 5,
            color: 'red',
            blurRadius: -3,
          },
        ]),
      ).toEqual([]);
    });

    it('should fail to parse object with invalid argument', () => {
      expect(
        processBoxShadow([
          {
            offsetX: 10,
            offsetY: 'asdf',
          },
        ]),
      ).toEqual([]);
    });

    it('should fail to parse object with unitless non-zero string', () => {
      expect(
        processBoxShadow([
          {
            offsetX: '5',
            offsetY: 10,
          },
        ]),
      ).toEqual([]);
    });
  });
});

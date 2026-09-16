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

const {OS} = require('../../Utilities/Platform').default;
const PlatformColorAndroid =
  // $FlowFixMe[missing-platform-support]
  require('../PlatformColorValueTypes.android').PlatformColor;
const PlatformColorIOS =
  // $FlowFixMe[missing-platform-support]
  require('../PlatformColorValueTypes.ios').PlatformColor;
const DynamicColorIOS =
  // $FlowFixMe[missing-platform-support]
  require('../PlatformColorValueTypesIOS.ios').DynamicColorIOS;
const processColor = require('../processColor').default;

const platformSpecific =
  OS === 'android'
    ? (unsigned: number) => unsigned | 0 // eslint-disable-line no-bitwise
    : x => x;

describe('processColor', () => {
  describe('predefined color names', () => {
    it('should convert red', () => {
      const colorFromString = processColor('red');
      const expectedInt = 0xffff0000;
      expect(colorFromString).toEqual(platformSpecific(expectedInt));
    });

    it('should convert white', () => {
      const colorFromString = processColor('white');
      const expectedInt = 0xffffffff;
      expect(colorFromString).toEqual(platformSpecific(expectedInt));
    });

    it('should convert black', () => {
      const colorFromString = processColor('black');
      const expectedInt = 0xff000000;
      expect(colorFromString).toEqual(platformSpecific(expectedInt));
    });

    it('should convert transparent', () => {
      const colorFromString = processColor('transparent');
      const expectedInt = 0x00000000;
      expect(colorFromString).toEqual(platformSpecific(expectedInt));
    });
  });

  describe('RGB strings', () => {
    it('should convert rgb(x, y, z)', () => {
      const colorFromString = processColor('rgb(10, 20, 30)');
      const expectedInt = 0xff0a141e;
      expect(colorFromString).toEqual(platformSpecific(expectedInt));
    });
  });

  describe('RGBA strings', () => {
    it('should convert rgba(x, y, z, a)', () => {
      const colorFromString = processColor('rgba(10, 20, 30, 0.4)');
      const expectedInt = 0x660a141e;
      expect(colorFromString).toEqual(platformSpecific(expectedInt));
    });
  });

  describe('HSL strings', () => {
    it('should convert hsl(x, y%, z%)', () => {
      const colorFromString = processColor('hsl(318, 69%, 55%)');
      const expectedInt = 0xffdb3dac;
      expect(colorFromString).toEqual(platformSpecific(expectedInt));
    });
  });

  describe('HSLA strings', () => {
    it('should convert hsla(x, y%, z%, a)', () => {
      const colorFromString = processColor('hsla(318, 69%, 55%, 0.25)');
      const expectedInt = 0x40db3dac;
      expect(colorFromString).toEqual(platformSpecific(expectedInt));
    });
  });

  describe('hex strings', () => {
    it('should convert #xxxxxx', () => {
      const colorFromString = processColor('#1e83c9');
      const expectedInt = 0xff1e83c9;
      expect(colorFromString).toEqual(platformSpecific(expectedInt));
    });
  });

  describe('iOS', () => {
    if (OS === 'ios') {
      it('should process iOS PlatformColor colors', () => {
        const color = PlatformColorIOS('systemRedColor');
        const processedColor = processColor(color);
        const expectedColor = {semantic: ['systemRedColor']};
        expect(processedColor).toEqual(expectedColor);
      });

      it('should process iOS Dynamic colors', () => {
        const color = DynamicColorIOS({light: 'black', dark: 'white'});
        const processedColor = processColor(color);
        const expectedColor = {dynamic: {light: 0xff000000, dark: 0xffffffff}};
        expect(processedColor).toEqual(expectedColor);
      });

      // The macOS and Windows PlatformColor entry points carry the fallback with
      // the same trailing-{fallback} detection as iOS and Android. This
      // integration test harness only executes as iOS and Android, so that
      // shared behavior is exercised by the iOS and Android cases here rather
      // than duplicated for platforms the harness cannot run.
      it('should carry an unprocessed fallback on iOS PlatformColor colors', () => {
        const color = PlatformColorIOS('systemRedColor', {fallback: '#ff0000'});
        const processedColor = processColor(color);
        const expectedColor = {
          semantic: ['systemRedColor'],
          fallback: '#ff0000',
        };
        expect(processedColor).toEqual(expectedColor);
      });
    }
  });

  describe('Android', () => {
    if (OS === 'android') {
      it('should process Android PlatformColor colors', () => {
        const color = PlatformColorAndroid('?attr/colorPrimary');
        const processedColor = processColor(color);
        const expectedColor = {resource_paths: ['?attr/colorPrimary']};
        expect(processedColor).toEqual(expectedColor);
      });

      it('should carry an unprocessed fallback on Android PlatformColor colors', () => {
        const color = PlatformColorAndroid('?attr/colorPrimary', {
          fallback: '#000000',
        });
        const processedColor = processColor(color);
        const expectedColor = {
          resource_paths: ['?attr/colorPrimary'],
          fallback: '#000000',
        };
        expect(processedColor).toEqual(expectedColor);
      });
    }
  });
});

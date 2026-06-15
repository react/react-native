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

jest.mock('../../Utilities/NativePlatformConstantsAndroid', () => ({
  __esModule: true,
  default: {
    getConstants: () => ({
      reactNativeVersion: {
        major: 1000,
        minor: 0,
        patch: 0,
        prerelease: undefined,
      },
    }),
  },
}));

jest.mock('../../Utilities/NativePlatformConstantsIOS', () => ({
  __esModule: true,
  default: {
    getConstants: () => ({
      forceTouchAvailable: false,
      interfaceIdiom: 'phone',
      isTesting: true,
      osVersion: '1.0',
      reactNativeVersion: {
        major: 1000,
        minor: 0,
        patch: 0,
        prerelease: undefined,
      },
      systemName: 'iOS',
    }),
  },
}));

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
    }
  });

  describe('primitive color cache', () => {
    afterEach(() => {
      jest.dontMock('@react-native/normalize-colors');
      jest.resetModules();
    });

    it('should cache processed primitive colors', () => {
      jest.resetModules();

      const normalizeColorMock = jest.fn(() => 0xff0000ff);
      jest.doMock('@react-native/normalize-colors', () => normalizeColorMock);

      const cachedProcessColor = require('../processColor').default;

      expect(cachedProcessColor('cached-red')).toEqual(
        platformSpecific(0xffff0000),
      );
      expect(cachedProcessColor('cached-red')).toEqual(
        platformSpecific(0xffff0000),
      );
      expect(normalizeColorMock).toHaveBeenCalledTimes(1);
    });

    it('should cache invalid primitive colors', () => {
      jest.resetModules();

      const normalizeColorMock = jest.fn(() => undefined);
      jest.doMock('@react-native/normalize-colors', () => normalizeColorMock);

      const cachedProcessColor = require('../processColor').default;

      expect(cachedProcessColor('not-a-color')).toBeUndefined();
      expect(cachedProcessColor('not-a-color')).toBeUndefined();
      expect(normalizeColorMock).toHaveBeenCalledTimes(1);
    });

    it('should stop admitting primitive colors after reaching the cache bound', () => {
      jest.resetModules();

      const normalizeColorMock = jest.fn(() => 0xff0000ff);
      jest.doMock('@react-native/normalize-colors', () => normalizeColorMock);

      const cachedProcessColor = require('../processColor').default;

      for (let i = 0; i < 1024; i++) {
        cachedProcessColor(`cached-color-${i.toString()}`);
      }
      expect(normalizeColorMock).toHaveBeenCalledTimes(1024);

      cachedProcessColor('cached-color-0');
      expect(normalizeColorMock).toHaveBeenCalledTimes(1024);

      cachedProcessColor('cached-color-1024');
      expect(normalizeColorMock).toHaveBeenCalledTimes(1025);

      cachedProcessColor('cached-color-1024');
      expect(normalizeColorMock).toHaveBeenCalledTimes(1026);

      cachedProcessColor('cached-color-0');
      expect(normalizeColorMock).toHaveBeenCalledTimes(1026);
    });
  });
});

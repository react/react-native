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

describe('Settings', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should not throw due to circular dependency during Platform initialization', () => {
    // Intercept NativePlatformConstantsIOS (which Platform.ios requires during
    // load) to simulate another module requiring Settings during Platform's
    // initialization phase.
    jest.mock('../../Utilities/NativePlatformConstantsIOS', () => {
      // Accessing Settings while Platform is loading
      require('../Settings.js');
      return {
        getConstants() {
          return {
            interfaceIdiom: 'phone',
            isTesting: true,
            osVersion: '16.0',
            systemName: 'iOS',
          };
        },
      };
    });

    expect(() => {
      require('../../Utilities/Platform');
    }).not.toThrow();
  });

  it('defers accessing Platform until a method is first invoked', () => {
    let platformAccessCount = 0;
    jest.doMock('../../Utilities/Platform', () => ({
      __esModule: true,
      get default() {
        platformAccessCount++;
        return {OS: 'android'};
      },
    }));

    const Settings = require('../Settings.js').default;
    expect(platformAccessCount).toBe(0);

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    Settings.get('any');
    expect(platformAccessCount).toBeGreaterThan(0);
    warnSpy.mockRestore();
  });

  it('delegates get/set/watchKeys/clearWatch to the iOS implementation', () => {
    const setValues = jest.fn();
    jest.doMock('../../Utilities/Platform', () => ({
      __esModule: true,
      default: {OS: 'ios'},
    }));
    jest.doMock('../NativeSettingsManager', () => ({
      __esModule: true,
      default: {
        getConstants: () => ({settings: {existing: 'initial'}}),
        setValues,
      },
    }));

    const Settings = require('../Settings.js').default;

    expect(Settings.get('existing')).toBe('initial');
    Settings.set({added: 'value'});
    expect(Settings.get('added')).toBe('value');
    expect(setValues).toHaveBeenCalledWith({added: 'value'});

    const watchId = Settings.watchKeys('key', () => {});
    expect(typeof watchId).toBe('number');
    expect(() => Settings.clearWatch(watchId)).not.toThrow();
  });

  it('uses the fallback implementation on non-iOS platforms', () => {
    jest.doMock('../../Utilities/Platform', () => ({
      __esModule: true,
      default: {OS: 'android'},
    }));

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const Settings = require('../Settings.js').default;

    expect(Settings.get('foo')).toBeNull();
    expect(Settings.watchKeys('foo', () => {})).toBe(-1);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import typeof RCTDeviceEventEmitterType from '../../../EventEmitter/RCTDeviceEventEmitter';
import typeof AccessibilityInfoType from '../AccessibilityInfo';

const invariant = require('invariant');

jest.unmock('../AccessibilityInfo');

type LoadedModules = {
  AccessibilityInfo: AccessibilityInfoType,
  RCTDeviceEventEmitter: RCTDeviceEventEmitterType,
};

// `AccessibilityInfo` picks its native event names when it is first loaded,
// so each platform needs a fresh module registry.
function loadForPlatform(os: 'android' | 'ios'): LoadedModules {
  let modules: ?LoadedModules = null;
  jest.isolateModules(() => {
    const Platform = require('../../../Utilities/Platform').default;
    /* $FlowFixMe[incompatible-type] */
    Platform.OS = os;
    modules = {
      AccessibilityInfo: require('../AccessibilityInfo').default,
      RCTDeviceEventEmitter:
        require('../../../EventEmitter/RCTDeviceEventEmitter').default,
    };
  });
  invariant(modules != null, 'Expected modules to load');
  return modules;
}

describe('AccessibilityInfo events', () => {
  describe('Android', () => {
    it('delivers boldTextDidChange as boldTextChanged', () => {
      const {AccessibilityInfo, RCTDeviceEventEmitter} =
        loadForPlatform('android');
      const handler = jest.fn();

      const subscription = AccessibilityInfo.addEventListener(
        'boldTextChanged',
        handler,
      );
      RCTDeviceEventEmitter.emit('boldTextDidChange', true);
      subscription.remove();
      RCTDeviceEventEmitter.emit('boldTextDidChange', false);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(true);
    });
  });

  describe('iOS', () => {
    it('delivers boldTextChanged as boldTextChanged', () => {
      const {AccessibilityInfo, RCTDeviceEventEmitter} = loadForPlatform('ios');
      const handler = jest.fn();

      const subscription = AccessibilityInfo.addEventListener(
        'boldTextChanged',
        handler,
      );
      RCTDeviceEventEmitter.emit('boldTextChanged', true);
      subscription.remove();
      RCTDeviceEventEmitter.emit('boldTextChanged', false);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(true);
    });
  });
});

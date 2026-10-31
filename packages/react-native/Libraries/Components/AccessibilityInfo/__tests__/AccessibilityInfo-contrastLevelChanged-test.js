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

describe('AccessibilityInfo contrastLevelChanged', () => {
  it('delivers contrastLevelDidChange as contrastLevelChanged on Android', () => {
    const {AccessibilityInfo, RCTDeviceEventEmitter} =
      loadForPlatform('android');
    const handler = jest.fn();

    const subscription = AccessibilityInfo.addEventListener(
      'contrastLevelChanged',
      handler,
    );
    RCTDeviceEventEmitter.emit('contrastLevelDidChange', 0.5);
    RCTDeviceEventEmitter.emit('contrastLevelDidChange', -0.25);
    subscription.remove();
    RCTDeviceEventEmitter.emit('contrastLevelDidChange', 1);

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenNthCalledWith(1, 0.5);
    expect(handler).toHaveBeenNthCalledWith(2, -0.25);
  });

  it('does not subscribe on iOS', () => {
    const {AccessibilityInfo, RCTDeviceEventEmitter} = loadForPlatform('ios');
    const handler = jest.fn();

    const subscription = AccessibilityInfo.addEventListener(
      'contrastLevelChanged',
      handler,
    );
    // Neither the Android name nor the public name reaches the handler.
    RCTDeviceEventEmitter.emit('contrastLevelDidChange', 0.5);
    RCTDeviceEventEmitter.emit('contrastLevelChanged', 0.5);
    subscription.remove();

    expect(handler).not.toHaveBeenCalled();
  });
});

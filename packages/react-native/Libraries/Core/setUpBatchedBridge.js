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

import registerModule from './registerCallableModule';

registerModule('Systrace', () => require('../Performance/Systrace'));
if (!(global.RN$Bridgeless === true)) {
  registerModule('JSTimers', () => require('./Timers/JSTimers').default);
}
registerModule('RCTLog', () => require('../Utilities/RCTLog').default);
registerModule(
  'RCTDeviceEventEmitter',
  () => require('../EventEmitter/RCTDeviceEventEmitter').default,
);
registerModule(
  'RCTNativeAppEventEmitter',
  () => require('../EventEmitter/RCTNativeAppEventEmitter').default,
);
registerModule(
  'GlobalPerformanceLogger',
  () => require('../ReactNative/DeprecatedPerformanceLoggerStub').default,
);

if (__DEV__) {
  registerModule('HMRClient', () => require('../Utilities/HMRClient').default);
} else {
  registerModule(
    'HMRClient',
    () => require('../Utilities/HMRClientProdShim').default,
  );
}

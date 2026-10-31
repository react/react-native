/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HardwareBackPressEvent} from './HardwareBackPressEvent';

type BackPressEventName = 'backPress' | 'hardwareBackPress';
type BackPressHandler = (event: HardwareBackPressEvent) => ?boolean;

function emptyFunction(): void {}

type TBackHandler = {
  exitApp(): void,
  setNativeNavigationEnabled(enabled: boolean): void,
  addEventListener(
    eventName: BackPressEventName,
    handler: BackPressHandler,
    options?: {nativeNavigationFallback?: boolean, ...},
  ): {
    remove: () => void,
    setNativeNavigationFallback: (enabled: boolean) => void,
    ...
  },
};

const BackHandler: TBackHandler = {
  exitApp: emptyFunction,
  setNativeNavigationEnabled: emptyFunction,
  addEventListener(_eventName: BackPressEventName, _handler: BackPressHandler) {
    return {
      remove: emptyFunction,
      setNativeNavigationFallback: emptyFunction,
    };
  },
};

export default BackHandler;

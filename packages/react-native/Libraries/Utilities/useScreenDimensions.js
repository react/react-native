/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import Dimensions from './Dimensions';
import {
  type DisplayMetrics,
  type DisplayMetricsAndroid,
} from './NativeDeviceInfo';
import {useSyncExternalStore} from 'react';

const subscribe = (onStoreChange: () => void) => {
  const subscription = Dimensions.addEventListener('change', onStoreChange);
  return () => subscription.remove();
};

let cachedScreen: DisplayMetrics | DisplayMetricsAndroid | void;

function getSnapshot(): DisplayMetrics | DisplayMetricsAndroid {
  const screen = Dimensions.get('screen');
  // Dimensions can emit a new screen object without changing its metrics.
  // Preserve snapshot identity so those events do not trigger a render.
  if (
    cachedScreen == null ||
    cachedScreen.width !== screen.width ||
    cachedScreen.height !== screen.height ||
    cachedScreen.scale !== screen.scale ||
    cachedScreen.fontScale !== screen.fontScale
  ) {
    cachedScreen = screen;
  }
  return cachedScreen;
}

/**
 * React hook that provides the screen's width, height, scale, and
 * font scale. Automatically updates when screen size or font scale changes.
 *
 * Width and height are reported in logical pixels, as in `Dimensions.get('screen')`.
 */
export default function useScreenDimensions():
  DisplayMetrics | DisplayMetricsAndroid {
  return useSyncExternalStore(subscribe, getSnapshot);
}

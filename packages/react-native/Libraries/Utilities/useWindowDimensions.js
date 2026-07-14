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
import {useEffect, useState} from 'react';

/**
 * React hook that provides the application window's width, height, scale, and
 * font scale. Automatically updates when screen size or font scale changes.
 *
 * @see https://reactnative.dev/docs/usewindowdimensions
 */
export default function useWindowDimensions():
  DisplayMetrics | DisplayMetricsAndroid {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  useEffect(() => {
    function handleChange({
      window,
    }: {
      window: DisplayMetrics | DisplayMetricsAndroid,
    }) {
      if (
        dimensions.width !== window.width ||
        dimensions.height !== window.height ||
        dimensions.scale !== window.scale ||
        dimensions.fontScale !== window.fontScale
      ) {
        setDimensions(window);
      }
    }
    const subscription = Dimensions.addEventListener('change', handleChange);
    // We might have missed an update between calling `get` in render and
    // `addEventListener` in this handler, so we set it here. If there was
    // no change, React will filter out this update as a no-op.
    handleChange({window: Dimensions.get('window')});
    return () => {
      subscription.remove();
    };
  }, [dimensions]);
  return dimensions;
}

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
 * React hook that provides the screen's width, height, scale, and
 * font scale. Automatically updates when screen size or font scale changes.
 *
 * Width and height are reported in logical pixels, as in `Dimensions.get('screen')`.
 */
export default function useScreenDimensions():
  DisplayMetrics | DisplayMetricsAndroid {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('screen'));
  useEffect(() => {
    function handleChange({
      screen,
    }: Readonly<{
      screen: DisplayMetrics | DisplayMetricsAndroid,
      ...
    }>) {
      if (
        dimensions.width !== screen.width ||
        dimensions.height !== screen.height ||
        dimensions.scale !== screen.scale ||
        dimensions.fontScale !== screen.fontScale
      ) {
        setDimensions(screen);
      }
    }
    const subscription = Dimensions.addEventListener('change', handleChange);
    // We might have missed an update between calling `get` in render and
    // `addEventListener` in this handler, so we set it here. If there was
    // no change, React will filter out this update as a no-op.
    handleChange({screen: Dimensions.get('screen')});
    return () => {
      subscription.remove();
    };
  }, [dimensions]);
  return dimensions;
}

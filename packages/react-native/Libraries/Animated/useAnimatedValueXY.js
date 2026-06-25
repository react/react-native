/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import Animated from './Animated';
import {useRef} from 'react';

export default function useAnimatedValueXY(
  initialValue: {
    x: number,
    y: number,
  },
  config?: ?Animated.AnimatedConfig,
): Animated.ValueXY {
  const ref = useRef<null | Animated.ValueXY>(null);
  if (ref.current == null) {
    ref.current = new Animated.ValueXY(initialValue, config);
  }
  return ref.current;
}

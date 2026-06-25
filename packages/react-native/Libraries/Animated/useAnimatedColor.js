/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {AnimatedColorConfig, InputValue} from './nodes/AnimatedColor';

import Animated from './Animated';
import {useRef} from 'react';

export default function useAnimatedColor(
  inputValue?: InputValue,
  config?: ?AnimatedColorConfig,
): Animated.Color {
  const ref = useRef<null | Animated.Color>(null);
  if (ref.current == null) {
    ref.current = new Animated.Color(inputValue, config);
  }
  return ref.current;
}

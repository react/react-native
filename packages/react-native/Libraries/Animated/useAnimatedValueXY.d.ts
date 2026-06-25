/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {Animated} from './Animated';

export function useAnimatedValueXY(
  initialValue: {x: number; y: number},
  config?: Animated.AnimatedConfig | null | undefined,
): Animated.ValueXY;

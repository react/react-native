/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  InterpolationConfigSupportedOutputType,
  InterpolationConfigType,
} from '../../../Libraries/Animated/nodes/AnimatedInterpolation';

import {
  isSupportedInterpolationParam,
  isSupportedStyleProp,
  isSupportedTransformProp,
} from '../../../Libraries/Animated/NativeAnimatedAllowlist';

export function validateInterpolation<
  OutputT extends InterpolationConfigSupportedOutputType,
>(config: InterpolationConfigType<OutputT>): void {
  for (const key in config) {
    if (key !== 'debugID' && !isSupportedInterpolationParam(key)) {
      console.error(
        `Interpolation property '${key}' is not supported by native animated module`,
      );
    }
  }
}

export function validateStyles(styles: {[key: string]: ?number, ...}): void {
  for (const key in styles) {
    if (!isSupportedStyleProp(key)) {
      console.error(
        `Style property '${key}' is not supported by native animated module`,
      );
    }
  }
}

export function validateTransform(
  configs: Array<
    | {
        type: 'animated',
        property: string,
        nodeTag: ?number,
        ...
      }
    | {
        type: 'static',
        property: string,
        value: number | string,
        ...
      },
  >,
): void {
  configs.forEach(config => {
    if (!isSupportedTransformProp(config.property)) {
      console.error(
        `Property '${config.property}' is not supported by native animated module`,
      );
    }
  });
}

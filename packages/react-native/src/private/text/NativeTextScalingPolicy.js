/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TextProps} from '../../../Libraries/Text/TextProps';
import type {NativeTextRole} from './NativeTextScalingTypes';

import {getNativeUIAccessibilityAdapter} from '../accessibility/NativeUIAccessibilityPlatform';
import {isNativeUIAccessibilityEnabled} from '../accessibility/NativeUIAccessibilityPolicy';

export function isNativeTextScalingEnabled(): boolean {
  return isNativeUIAccessibilityEnabled();
}

export function getNativeTextScalingRamp(
  role?: NativeTextRole,
): ?NonNullable<TextProps['dynamicTypeRamp']> {
  return isNativeTextScalingEnabled()
    ? getNativeUIAccessibilityAdapter().getDynamicTypeRamp(role)
    : undefined;
}

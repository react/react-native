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
import type {NativeTextRole} from '../text/NativeTextScalingTypes';

import Platform from '../../../Libraries/Utilities/Platform';

export type NativeUIAccessibilityAdapter = Readonly<{
  supportsSystemAccessibility: boolean,
  getDynamicTypeRamp: (
    role?: NativeTextRole,
  ) => ?NonNullable<TextProps['dynamicTypeRamp']>,
}>;

const appleTVRamps = {
  body: 'body',
  caption: 'caption1',
  label: 'callout',
  heading1: 'title1',
  heading2: 'title2',
  heading3: 'title3',
} as const;

const appleTVAdapter: NativeUIAccessibilityAdapter = {
  supportsSystemAccessibility: true,
  getDynamicTypeRamp: (role?: NativeTextRole) => appleTVRamps[role ?? 'body'],
};

const legacyAdapter: NativeUIAccessibilityAdapter = {
  supportsSystemAccessibility: false,
  getDynamicTypeRamp: () => undefined,
};

/**
 * The capability gate is intentionally limited to validated platforms.
 * Native scaling support does not require an Apple Dynamic Type ramp.
 */
export function getNativeUIAccessibilityAdapter(): NativeUIAccessibilityAdapter {
  return Platform.OS === 'ios' && Platform.constants.interfaceIdiom === 'tv'
    ? appleTVAdapter
    : legacyAdapter;
}

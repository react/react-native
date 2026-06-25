/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {HostComponent} from '../../src/private/types/HostComponent';
import type {ProcessedColorValue} from '../StyleSheet/processColor';
import type {GestureResponderEvent} from '../Types/CoreEventTypes';
import type {TextProps} from './TextProps';

import {enablePreparedTextLayout} from '../../src/private/featureflags/ReactNativeFeatureFlags';
import {createViewConfig} from '../NativeComponent/ViewConfig';
import UIManager from '../ReactNative/UIManager';
import createReactNativeComponentClass from '../Renderer/shims/createReactNativeComponentClass';

export type NativeTextProps = Readonly<{
  ...TextProps,
  isHighlighted?: ?boolean,
  selectionColor?: ?ProcessedColorValue,
  onClick?: ?(event: GestureResponderEvent) => unknown,
  // This is only needed for platforms that optimize text hit testing, e.g.,
  // react-native-windows. It can be used to only hit test virtual text spans
  // that have pressable events attached to them.
  isPressable?: ?boolean,
}>;

const textViewConfig = {
  validAttributes: {
    isHighlighted: true,
    isPressable: true,
    numberOfLines: true,
    ellipsizeMode: true,
    allowFontScaling: true,
    dynamicTypeRamp: true,
    maxFontSizeMultiplier: true,
    disabled: true,
    selectable: true,
    selectionColor: true,
    adjustsFontSizeToFit: true,
    minimumFontScale: true,
    textBreakStrategy: true,
    onTextLayout: true,
    dataDetectorType: true,
    android_hyphenationFrequency: true,
    lineBreakStrategyIOS: true,
  },
  directEventTypes: {
    topTextLayout: {
      registrationName: 'onTextLayout',
    },
  },
  uiViewClassName: 'RCTText',
} as const;

const virtualTextViewConfig = {
  validAttributes: {
    isHighlighted: true,
    isPressable: true,
    maxFontSizeMultiplier: true,
  },
  uiViewClassName: 'RCTVirtualText',
} as const;

/**
 * `NativeText` is an internal React Native host component, and is exported to
 * provide lower-level access for libraries.
 *
 * @warning `<unstable_NativeText>` provides no semver guarantees and is not
 *   intended to be used in app code. Please use
 *   [`<Text>`](https://reactnative.dev/docs/text) instead.
 */
// Additional note: Our long term plan is to reduce the overhead of the <Text>
// and <View> wrappers so that we no longer have any reason to export these APIs.
export const NativeText: HostComponent<NativeTextProps> =
  createReactNativeComponentClass('RCTText', () =>
    createViewConfig(textViewConfig),
  ) as any;

export const NativeVirtualText: HostComponent<NativeTextProps> =
  !global.RN$Bridgeless && !UIManager.hasViewManagerConfig('RCTVirtualText')
    ? NativeText
    : (createReactNativeComponentClass('RCTVirtualText', () =>
        createViewConfig(virtualTextViewConfig),
      ) as any);

export const NativeSelectableText: HostComponent<NativeTextProps> =
  enablePreparedTextLayout()
    ? (createReactNativeComponentClass('RCTSelectableText', () =>
        createViewConfig({
          ...textViewConfig,
          uiViewClassName: 'RCTSelectableText',
        }),
      ) as any)
    : NativeText;

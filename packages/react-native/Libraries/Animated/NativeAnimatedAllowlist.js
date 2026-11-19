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
  ____TransformStyle_Internal,
  ImageStyle,
  NativeColorValue,
  TextStyle,
} from '../StyleSheet/StyleSheetTypes';
import type {
  InterpolationConfigSupportedOutputType,
  InterpolationConfigType,
} from './nodes/AnimatedInterpolation';
import type {AnimatedNodeConfig} from './nodes/AnimatedNode';
import type {AnimatedPropsAllowlist} from './nodes/AnimatedProps';

import * as ReactNativeFeatureFlags from '../../src/private/featureflags/ReactNativeFeatureFlags';

type KeyAllowlist<K extends string> = Readonly<Partial<Record<K, true>>>;
type KeyOfUnion<T> = T extends unknown ? keyof T : empty;

type AnimatableStyle = Readonly<{...TextStyle, ...ImageStyle}>;
type StyleKey = keyof AnimatableStyle;
type ColorStyleKey = Values<{
  [K in StyleKey]: NativeColorValue extends NonNullable<AnimatableStyle[K]>
    ? K
    : empty,
}>;

type TransformEntry = Exclude<
  NonNullable<____TransformStyle_Internal['transform']>,
  string,
>[number];
type TransformKey = KeyOfUnion<NonNullable<TransformEntry>>;
type LegacyTransformStyleKey = Extract<
  TransformKey,
  'scaleX' | 'scaleY' | 'translateX' | 'translateY',
>;

type InterpolationParamKey = Exclude<
  keyof InterpolationConfigType<InterpolationConfigSupportedOutputType>,
  keyof AnimatedNodeConfig,
>;

/**
 * Styles allowed by the native animated implementation.
 *
 * In general native animated implementation should support any numeric or color property that
 * doesn't need to be updated through the shadow view hierarchy (all non-layout properties).
 */
const SUPPORTED_COLOR_STYLES = {
  backgroundColor: true,
  borderBottomColor: true,
  borderColor: true,
  borderEndColor: true,
  borderLeftColor: true,
  borderRightColor: true,
  borderStartColor: true,
  borderTopColor: true,
  color: true,
  tintColor: true,
} as const satisfies KeyAllowlist<ColorStyleKey>;

const SUPPORTED_STYLES = {
  ...SUPPORTED_COLOR_STYLES,
  borderBottomEndRadius: true,
  borderBottomLeftRadius: true,
  borderBottomRightRadius: true,
  borderBottomStartRadius: true,
  borderEndEndRadius: true,
  borderEndStartRadius: true,
  borderRadius: true,
  borderTopEndRadius: true,
  borderTopLeftRadius: true,
  borderTopRightRadius: true,
  borderTopStartRadius: true,
  borderStartEndRadius: true,
  borderStartStartRadius: true,
  elevation: true,
  opacity: true,
  filter: true,
  transform: true,
  zIndex: true,
  /* ios styles */
  shadowOpacity: true,
  shadowRadius: true,
  /* legacy android transform properties */
  scaleX: true,
  scaleY: true,
  translateX: true,
  translateY: true,
  // eslint-disable-next-line react-hooks/rules-of-hooks
  ...(ReactNativeFeatureFlags.useSharedAnimatedBackend()
    ? ({
        /* dimension */
        height: true,
        maxHeight: true,
        maxWidth: true,
        minHeight: true,
        minWidth: true,
        width: true,
        /* position */
        bottom: true,
        end: true,
        left: true,
        right: true,
        start: true,
        top: true,
        /* flex */
        flex: true,
        flexGrow: true,
        flexShrink: true,
        flexBasis: true,
        aspectRatio: true,
        /* margin */
        margin: true,
        marginLeft: true,
        marginRight: true,
        marginTop: true,
        marginBottom: true,
        marginStart: true,
        marginEnd: true,
        marginHorizontal: true,
        marginVertical: true,
        /* padding */
        padding: true,
        paddingLeft: true,
        paddingRight: true,
        paddingTop: true,
        paddingBottom: true,
        paddingStart: true,
        paddingEnd: true,
        paddingHorizontal: true,
        paddingVertical: true,
        /* border width */
        borderWidth: true,
        borderLeftWidth: true,
        borderRightWidth: true,
        borderTopWidth: true,
        borderBottomWidth: true,
        borderStartWidth: true,
        borderEndWidth: true,
        /* gap */
        gap: true,
        rowGap: true,
        columnGap: true,
      } as const)
    : {}),
} as const satisfies KeyAllowlist<StyleKey | LegacyTransformStyleKey>;

const SUPPORTED_TRANSFORMS = {
  translateX: true,
  translateY: true,
  scale: true,
  scaleX: true,
  scaleY: true,
  rotate: true,
  rotateX: true,
  rotateY: true,
  rotateZ: true,
  perspective: true,
  skewX: true,
  skewY: true,
  ...(ReactNativeFeatureFlags.shouldUseAnimatedObjectForTransform()
    ? ({matrix: true} as const)
    : {}),
} as const satisfies KeyAllowlist<TransformKey>;

const SUPPORTED_INTERPOLATION_PARAMS = {
  inputRange: true,
  outputRange: true,
  extrapolate: true,
  extrapolateRight: true,
  extrapolateLeft: true,
  easing: true,
} as const satisfies KeyAllowlist<InterpolationParamKey>;

/**
 * Default allowlist for component props that support native animated values.
 */
export default {
  style: SUPPORTED_STYLES,
} as AnimatedPropsAllowlist;

export function isSupportedColorStyleProp(prop: string): boolean {
  return SUPPORTED_COLOR_STYLES.hasOwnProperty(prop);
}

export function isSupportedInterpolationParam(param: string): boolean {
  return SUPPORTED_INTERPOLATION_PARAMS.hasOwnProperty(param);
}

export function isSupportedStyleProp(prop: string): boolean {
  return SUPPORTED_STYLES.hasOwnProperty(prop);
}

export function isSupportedTransformProp(prop: string): boolean {
  return SUPPORTED_TRANSFORMS.hasOwnProperty(prop);
}

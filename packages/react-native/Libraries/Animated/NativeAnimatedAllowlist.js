/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {AnimatedPropsAllowlist} from './nodes/AnimatedProps';

import * as ReactNativeFeatureFlags from '../../src/private/featureflags/ReactNativeFeatureFlags';

/**
 * Styles allowed by the native animated implementation.
 *
 * In general native animated implementation should support any numeric or color property that
 * doesn't need to be updated through the shadow view hierarchy (all non-layout properties).
 */
const SUPPORTED_COLOR_STYLES: {[string]: true} = {
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
};

const SUPPORTED_STYLES: {[string]: true} = {
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
    ? {
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
      }
    : {}),
};

const SUPPORTED_TRANSFORMS: {[string]: true} = {
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
    ? {matrix: true}
    : {}),
};

const SUPPORTED_INTERPOLATION_PARAMS: {[string]: true} = {
  inputRange: true,
  outputRange: true,
  extrapolate: true,
  extrapolateRight: true,
  extrapolateLeft: true,
};

/**
 * Default allowlist for component props that support native animated values.
 */
export default {
  style: SUPPORTED_STYLES,
} as AnimatedPropsAllowlist;

export function allowInterpolationParam(param: string): void {
  SUPPORTED_INTERPOLATION_PARAMS[param] = true;
}

export function allowStyleProp(prop: string): void {
  SUPPORTED_STYLES[prop] = true;
}

export function allowTransformProp(prop: string): void {
  SUPPORTED_TRANSFORMS[prop] = true;
}

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

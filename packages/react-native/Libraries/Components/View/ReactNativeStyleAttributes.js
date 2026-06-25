/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format strict-local
 */

import type {AnyAttributeType} from '../../Renderer/shims/ReactNativeTypes';

import * as ReactNativeFeatureFlags from '../../../src/private/featureflags/ReactNativeFeatureFlags';
import processAspectRatio from '../../StyleSheet/processAspectRatio';
import processBackgroundImage from '../../StyleSheet/processBackgroundImage';
import processBackgroundPosition from '../../StyleSheet/processBackgroundPosition';
import processBackgroundRepeat from '../../StyleSheet/processBackgroundRepeat';
import processBackgroundSize from '../../StyleSheet/processBackgroundSize';
import processBoxShadow from '../../StyleSheet/processBoxShadow';
import processColor from '../../StyleSheet/processColor';
import processFilter from '../../StyleSheet/processFilter';
import processFontVariant from '../../StyleSheet/processFontVariant';
import processTransform from '../../StyleSheet/processTransform';
import processTransformOrigin from '../../StyleSheet/processTransformOrigin';
import sizesDiffer from '../../Utilities/differ/sizesDiffer';

const nativeCSSParsing = ReactNativeFeatureFlags.enableNativeCSSParsing();

/**
 * Gated style attribute types. When native CSS parsing is enabled, the JS
 * processor is bypassed and the raw value is sent directly to native.
 * These are exported so that other ViewConfigs can reuse them.
 */
export const colorAttribute: AnyAttributeType = nativeCSSParsing
  ? true
  : {process: processColor};

export const filterAttribute: AnyAttributeType = nativeCSSParsing
  ? true
  : {process: processFilter};

export const boxShadowAttribute: AnyAttributeType = nativeCSSParsing
  ? true
  : {process: processBoxShadow};

export const backgroundImageAttribute: AnyAttributeType = nativeCSSParsing
  ? true
  : {process: processBackgroundImage};

export const backgroundSizeAttribute: AnyAttributeType = nativeCSSParsing
  ? true
  : {process: processBackgroundSize};

export const backgroundPositionAttribute: AnyAttributeType = nativeCSSParsing
  ? true
  : {process: processBackgroundPosition};

export const backgroundRepeatAttribute: AnyAttributeType = nativeCSSParsing
  ? true
  : {process: processBackgroundRepeat};

export const transformAttribute: AnyAttributeType = nativeCSSParsing
  ? true
  : {process: processTransform};

export const transformOriginAttribute: AnyAttributeType = nativeCSSParsing
  ? true
  : {process: processTransformOrigin};

export const fontVariantAttribute: AnyAttributeType = nativeCSSParsing
  ? true
  : {process: processFontVariant};

export const aspectRatioAttribute: AnyAttributeType = nativeCSSParsing
  ? true
  : {process: processAspectRatio};

const ReactNativeStyleAttributes: {[string]: AnyAttributeType, ...} = {
  /**
   * Layout
   */
  alignContent: true,
  alignItems: true,
  alignSelf: true,
  aspectRatio: aspectRatioAttribute,
  borderBottomWidth: true,
  borderEndWidth: true,
  borderLeftWidth: true,
  borderRightWidth: true,
  borderStartWidth: true,
  borderTopWidth: true,
  boxSizing: true,
  columnGap: true,
  borderWidth: true,
  bottom: true,
  direction: true,
  display: true,
  end: true,
  flex: true,
  flexBasis: true,
  flexDirection: true,
  flexGrow: true,
  flexShrink: true,
  flexWrap: true,
  gap: true,
  height: true,
  inset: true,
  insetBlock: true,
  insetBlockEnd: true,
  insetBlockStart: true,
  insetInline: true,
  insetInlineEnd: true,
  insetInlineStart: true,
  justifyContent: true,
  left: true,
  margin: true,
  marginBlock: true,
  marginBlockEnd: true,
  marginBlockStart: true,
  marginBottom: true,
  marginEnd: true,
  marginHorizontal: true,
  marginInline: true,
  marginInlineEnd: true,
  marginInlineStart: true,
  marginLeft: true,
  marginRight: true,
  marginStart: true,
  marginTop: true,
  marginVertical: true,
  maxHeight: true,
  maxWidth: true,
  minHeight: true,
  minWidth: true,
  overflow: true,
  padding: true,
  paddingBlock: true,
  paddingBlockEnd: true,
  paddingBlockStart: true,
  paddingBottom: true,
  paddingEnd: true,
  paddingHorizontal: true,
  paddingInline: true,
  paddingInlineEnd: true,
  paddingInlineStart: true,
  paddingLeft: true,
  paddingRight: true,
  paddingStart: true,
  paddingTop: true,
  paddingVertical: true,
  position: true,
  right: true,
  rowGap: true,
  start: true,
  top: true,
  width: true,
  zIndex: true,

  /**
   * Shadow
   */
  elevation: true,
  shadowColor: colorAttribute,
  shadowOffset: {diff: sizesDiffer},
  shadowOpacity: true,
  shadowRadius: true,

  /**
   * Transform
   */
  transform: transformAttribute,
  transformOrigin: transformOriginAttribute,

  /**
   * Filter
   */
  filter: filterAttribute,

  /**
   * MixBlendMode
   */
  mixBlendMode: true,

  /**
   * Isolation
   */
  isolation: true,

  /*
   * BoxShadow
   */
  boxShadow: boxShadowAttribute,

  /**
   * BackgroundImage
   */
  backgroundImage: backgroundImageAttribute,
  experimental_backgroundImage: backgroundImageAttribute,

  /**
   * BackgroundSize
   */
  experimental_backgroundSize: backgroundSizeAttribute,

  /**
   * BackgroundPosition
   */
  experimental_backgroundPosition: backgroundPositionAttribute,

  /**
   * BackgroundRepeat
   */
  experimental_backgroundRepeat: backgroundRepeatAttribute,

  /**
   * View
   */
  backfaceVisibility: true,
  backgroundColor: colorAttribute,
  borderBlockColor: colorAttribute,
  borderBlockEndColor: colorAttribute,
  borderBlockStartColor: colorAttribute,
  borderBottomColor: colorAttribute,
  borderBottomEndRadius: true,
  borderBottomLeftRadius: true,
  borderBottomRightRadius: true,
  borderBottomStartRadius: true,
  borderColor: colorAttribute,
  borderCurve: true,
  borderEndColor: colorAttribute,
  borderEndEndRadius: true,
  borderEndStartRadius: true,
  borderLeftColor: colorAttribute,
  borderRadius: true,
  borderRightColor: colorAttribute,
  borderStartColor: colorAttribute,
  borderStartEndRadius: true,
  borderStartStartRadius: true,
  borderStyle: true,
  borderTopColor: colorAttribute,
  borderTopEndRadius: true,
  borderTopLeftRadius: true,
  borderTopRightRadius: true,
  borderTopStartRadius: true,
  cursor: true,
  opacity: true,
  outlineColor: colorAttribute,
  outlineOffset: true,
  outlineStyle: true,
  outlineWidth: true,
  pointerEvents: true,

  /**
   * Text
   */
  color: colorAttribute,
  fontFamily: true,
  fontSize: true,
  fontStyle: true,
  fontVariant: fontVariantAttribute,
  fontWeight: true,
  includeFontPadding: true,
  letterSpacing: true,
  lineHeight: true,
  textAlign: true,
  textAlignVertical: true,
  textDecorationColor: colorAttribute,
  textDecorationLine: true,
  textDecorationStyle: true,
  textShadowColor: colorAttribute,
  textShadowOffset: true,
  textShadowRadius: true,
  textTransform: true,
  userSelect: true,
  verticalAlign: true,
  writingDirection: true,

  /**
   * Image
   */
  overlayColor: colorAttribute,
  resizeMode: true,
  tintColor: colorAttribute,
  objectFit: true,
};

export default ReactNativeStyleAttributes;

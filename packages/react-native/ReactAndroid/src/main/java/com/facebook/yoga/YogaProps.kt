/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga

public interface YogaProps {

  /* Width properties */

  public fun setWidth(width: Float)

  public fun setWidthPercent(percent: Float)

  public fun setWidthAuto()

  public fun setWidthMaxContent()

  public fun setWidthFitContent()

  public fun setWidthStretch()

  public fun setMinWidth(minWidth: Float)

  public fun setMinWidthPercent(percent: Float)

  public fun setMinWidthMaxContent()

  public fun setMinWidthFitContent()

  public fun setMinWidthStretch()

  public fun setMaxWidth(maxWidth: Float)

  public fun setMaxWidthPercent(percent: Float)

  public fun setMaxWidthMaxContent()

  public fun setMaxWidthFitContent()

  public fun setMaxWidthStretch()

  /* Height properties */

  public fun setHeight(height: Float)

  public fun setHeightPercent(percent: Float)

  public fun setHeightAuto()

  public fun setHeightMaxContent()

  public fun setHeightFitContent()

  public fun setHeightStretch()

  public fun setMinHeight(minHeight: Float)

  public fun setMinHeightPercent(percent: Float)

  public fun setMinHeightMaxContent()

  public fun setMinHeightFitContent()

  public fun setMinHeightStretch()

  public fun setMaxHeight(maxHeight: Float)

  public fun setMaxHeightPercent(percent: Float)

  public fun setMaxHeightMaxContent()

  public fun setMaxHeightFitContent()

  public fun setMaxHeightStretch()

  /* Margin properties */

  public fun setMargin(edge: YogaEdge, margin: Float)

  public fun setMarginPercent(edge: YogaEdge, percent: Float)

  public fun setMarginAuto(edge: YogaEdge)

  /* Padding properties */

  public fun setPadding(edge: YogaEdge, padding: Float)

  public fun setPaddingPercent(edge: YogaEdge, percent: Float)

  /* Position properties */

  public fun setPosition(edge: YogaEdge, position: Float)

  public fun setPositionPercent(edge: YogaEdge, percent: Float)

  /* Border properties */

  public fun setBorder(edge: YogaEdge, value: Float)

  /* Flex basis properties */

  public fun setFlexBasisAuto()

  public fun setFlexBasisPercent(percent: Float)

  public fun setFlexBasis(flexBasis: Float)

  public fun setFlexBasisMaxContent()

  public fun setFlexBasisFitContent()

  public fun setFlexBasisStretch()

  /* Direction property - setter has different name than getter */

  public fun setDirection(direction: YogaDirection)

  /* Other functions */

  public fun setIsReferenceBaseline(isReferenceBaseline: Boolean)

  public fun setMeasureFunction(measureFunction: YogaMeasureFunction?)

  public fun setMinContentMeasureFunction(measureFunction: YogaMeasureFunction?)

  /**
   * Sets the static min-content width used by the CSS Flexbox §4.5 automatic minimum sizing probe.
   * Pass `YogaConstants.UNDEFINED` to clear. See `YGNodeSetMinContentWidth` in the Yoga C API for
   * full precedence rules.
   */
  public fun setMinContentWidth(minContentWidth: Float)

  /**
   * Sets the static min-content height used by the CSS Flexbox §4.5 automatic minimum sizing probe.
   * Pass `YogaConstants.UNDEFINED` to clear. See `YGNodeSetMinContentHeight` in the Yoga C API for
   * full precedence rules.
   */
  public fun setMinContentHeight(minContentHeight: Float)

  /** Returns the static min-content width, or `YogaConstants.UNDEFINED` if not set. */
  public fun getMinContentWidth(): Float

  /** Returns the static min-content height, or `YogaConstants.UNDEFINED` if not set. */
  public fun getMinContentHeight(): Float

  public fun setBaselineFunction(yogaBaselineFunction: YogaBaselineFunction?)

  /* Mutable properties - getter and setter with matching types */

  public var flexDirection: YogaFlexDirection

  public var justifyContent: YogaJustify

  public var alignItems: YogaAlign

  public var alignSelf: YogaAlign

  public var alignContent: YogaAlign

  public var positionType: YogaPositionType

  public var flexGrow: Float

  public var flexShrink: Float

  public var flex: Float

  public var aspectRatio: Float

  public var wrap: YogaWrap

  public var boxSizing: YogaBoxSizing

  /* Read-only properties - getter only, or setter has different type/name */

  public val styleDirection: YogaDirection

  public val width: YogaValue

  public val minWidth: YogaValue

  public val maxWidth: YogaValue

  public val height: YogaValue

  public val minHeight: YogaValue

  public val maxHeight: YogaValue

  public val flexBasis: YogaValue

  /* Functions with parameters */

  public fun getMargin(edge: YogaEdge): YogaValue

  public fun getPadding(edge: YogaEdge): YogaValue

  public fun getPosition(edge: YogaEdge): YogaValue

  public fun getBorder(edge: YogaEdge): Float
}

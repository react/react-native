/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga

public abstract class YogaNode : YogaProps {
  /** The interface the [getData] object can optionally implement. */
  public fun interface Inputs {
    /** Requests the data object to disable mutations of its inputs. */
    public fun freeze(node: YogaNode, parent: YogaNode?)
  }

  public abstract fun reset()

  public abstract val childCount: Int

  public abstract fun getChildAt(i: Int): YogaNode

  public abstract fun addChildAt(child: YogaNode, i: Int)

  abstract override fun setIsReferenceBaseline(isReferenceBaseline: Boolean)

  public abstract val isReferenceBaseline: Boolean

  public abstract fun removeChildAt(i: Int): YogaNode

  /**
   * @returns the [YogaNode] that owns this [YogaNode]. The owner is used to identify the YogaTree
   *   that a [YogaNode] belongs to. This method will return the parent of the [YogaNode] when the
   *   [YogaNode] only belongs to one YogaTree or null when the [YogaNode] is shared between two or
   *   more YogaTrees.
   */
  public abstract fun getOwner(): YogaNode?

  @Deprecated(
      "Use getOwner() instead. This will be removed in the next version. ",
      replaceWith = ReplaceWith("getOwner()"),
  )
  public abstract fun getParent(): YogaNode?

  public abstract fun indexOf(child: YogaNode): Int

  public abstract fun calculateLayout(width: Float, height: Float)

  public abstract fun hasNewLayout(): Boolean

  public abstract fun dirty()

  public abstract fun isDirty(): Boolean

  public abstract fun copyStyle(srcNode: YogaNode)

  public abstract fun markLayoutSeen()

  abstract override val styleDirection: YogaDirection

  abstract override fun setDirection(direction: YogaDirection)

  abstract override var flexDirection: YogaFlexDirection

  abstract override var justifyContent: YogaJustify

  abstract override var alignItems: YogaAlign

  abstract override var alignSelf: YogaAlign

  abstract override var alignContent: YogaAlign

  abstract override var positionType: YogaPositionType

  abstract override var boxSizing: YogaBoxSizing

  abstract override var wrap: YogaWrap

  public abstract var overflow: YogaOverflow?

  public abstract var display: YogaDisplay?

  abstract override var flex: Float

  abstract override var flexGrow: Float

  abstract override var flexShrink: Float

  abstract override val flexBasis: YogaValue

  abstract override fun setFlexBasis(flexBasis: Float)

  abstract override fun setFlexBasisPercent(percent: Float)

  abstract override fun setFlexBasisAuto()

  abstract override fun setFlexBasisMaxContent()

  abstract override fun setFlexBasisFitContent()

  abstract override fun setFlexBasisStretch()

  abstract override fun getMargin(edge: YogaEdge): YogaValue

  abstract override fun setMargin(edge: YogaEdge, margin: Float)

  abstract override fun setMarginPercent(edge: YogaEdge, percent: Float)

  abstract override fun setMarginAuto(edge: YogaEdge)

  abstract override fun getPadding(edge: YogaEdge): YogaValue

  abstract override fun setPadding(edge: YogaEdge, padding: Float)

  abstract override fun setPaddingPercent(edge: YogaEdge, percent: Float)

  abstract override fun getBorder(edge: YogaEdge): Float

  abstract override fun setBorder(edge: YogaEdge, value: Float)

  abstract override fun getPosition(edge: YogaEdge): YogaValue

  abstract override fun setPosition(edge: YogaEdge, position: Float)

  abstract override fun setPositionPercent(edge: YogaEdge, percent: Float)

  public abstract fun setPositionAuto(edge: YogaEdge)

  abstract override val width: YogaValue

  abstract override fun setWidth(width: Float)

  abstract override fun setWidthPercent(percent: Float)

  abstract override fun setWidthAuto()

  abstract override fun setWidthMaxContent()

  abstract override fun setWidthFitContent()

  abstract override fun setWidthStretch()

  abstract override val height: YogaValue

  abstract override fun setHeight(height: Float)

  abstract override fun setHeightPercent(percent: Float)

  abstract override fun setHeightAuto()

  abstract override fun setHeightMaxContent()

  abstract override fun setHeightFitContent()

  abstract override fun setHeightStretch()

  abstract override val minWidth: YogaValue

  abstract override fun setMinWidth(minWidth: Float)

  abstract override fun setMinWidthPercent(percent: Float)

  abstract override fun setMinWidthMaxContent()

  abstract override fun setMinWidthFitContent()

  abstract override fun setMinWidthStretch()

  abstract override val minHeight: YogaValue

  abstract override fun setMinHeight(minHeight: Float)

  abstract override fun setMinHeightPercent(percent: Float)

  abstract override fun setMinHeightMaxContent()

  abstract override fun setMinHeightFitContent()

  abstract override fun setMinHeightStretch()

  abstract override val maxWidth: YogaValue

  abstract override fun setMaxWidth(maxWidth: Float)

  abstract override fun setMaxWidthPercent(percent: Float)

  abstract override fun setMaxWidthMaxContent()

  abstract override fun setMaxWidthFitContent()

  abstract override fun setMaxWidthStretch()

  abstract override val maxHeight: YogaValue

  abstract override fun setMaxHeight(maxHeight: Float)

  abstract override fun setMaxHeightPercent(percent: Float)

  abstract override fun setMaxHeightMaxContent()

  abstract override fun setMaxHeightFitContent()

  abstract override fun setMaxHeightStretch()

  abstract override var aspectRatio: Float

  public abstract fun getGap(gutter: YogaGutter): YogaValue

  public abstract fun setGap(gutter: YogaGutter, gapLength: Float)

  public abstract fun setGapPercent(gutter: YogaGutter, gapLength: Float)

  public abstract val layoutX: Float

  public abstract val layoutY: Float

  public abstract val layoutWidth: Float

  public abstract val layoutHeight: Float

  public abstract fun getLayoutMargin(edge: YogaEdge): Float

  public abstract fun getLayoutPadding(edge: YogaEdge): Float

  public abstract fun getLayoutBorder(edge: YogaEdge): Float

  public abstract val layoutDirection: YogaDirection

  abstract override fun setMeasureFunction(measureFunction: YogaMeasureFunction?)

  abstract override fun setMinContentMeasureFunction(measureFunction: YogaMeasureFunction?)

  abstract override fun setMinContentWidth(minContentWidth: Float)

  abstract override fun setMinContentHeight(minContentHeight: Float)

  abstract override fun getMinContentWidth(): Float

  abstract override fun getMinContentHeight(): Float

  abstract override fun setBaselineFunction(yogaBaselineFunction: YogaBaselineFunction?)

  public abstract val isMeasureDefined: Boolean

  public abstract val isBaselineDefined: Boolean

  public abstract var data: Any?

  public abstract fun cloneWithoutChildren(): YogaNode

  public abstract fun cloneWithChildren(): YogaNode

  public abstract fun setAlwaysFormsContainingBlock(alwaysFormsContainingBlock: Boolean)
}

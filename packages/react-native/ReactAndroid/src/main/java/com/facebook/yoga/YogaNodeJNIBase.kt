/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga

import com.facebook.yoga.annotations.DoNotStrip

@DoNotStrip
public abstract class YogaNodeJNIBase : YogaNode, Cloneable {

  private var owner: YogaNodeJNIBase? = null
  private var config: YogaConfig? = null
  private var children: MutableList<YogaNodeJNIBase>? = null
  private var measureFunction: YogaMeasureFunction? = null
  private var minContentMeasureFunction: YogaMeasureFunction? = null
  private var baselineFunction: YogaBaselineFunction? = null
  protected var nativePointer: Long = 0

  // JNI-accessed field name — do not rename (see YGJNIVanilla.cpp)
  @DoNotStrip private var arr: FloatArray? = null

  // JNI-accessed field name — do not rename (see YGJNIVanilla.cpp)
  @DoNotStrip private var mLayoutDirection: Int = 0

  private var hasNewLayoutField: Boolean = true

  private constructor(nativePtr: Long) {
    if (nativePtr == 0L) {
      throw IllegalStateException("Failed to allocate native memory")
    }
    nativePointer = nativePtr
  }

  internal constructor() : this(YogaNative.jni_YGNodeNewJNI())

  internal constructor(
      yogaConfig: YogaConfig
  ) : this(
      YogaNative.jni_YGNodeNewWithConfigJNI((yogaConfig as YogaConfigJNIBase).getNativePointer())
  ) {
    config = yogaConfig
  }

  override fun reset() {
    measureFunction = null
    minContentMeasureFunction = null
    baselineFunction = null
    data = null
    arr = null
    hasNewLayoutField = true
    mLayoutDirection = 0

    YogaNative.jni_YGNodeResetJNI(nativePointer)
  }

  override val childCount: Int
    get() = children?.size ?: 0

  override fun getChildAt(i: Int): YogaNodeJNIBase {
    return children?.get(i) ?: throw IllegalStateException("YogaNode does not have children")
  }

  override fun addChildAt(child: YogaNode, i: Int) {
    if (child !is YogaNodeJNIBase) {
      return
    }
    if (child.owner != null) {
      throw IllegalStateException("Child already has a parent, it must be removed first.")
    }

    val list = children ?: ArrayList<YogaNodeJNIBase>(4).also { children = it }
    list.add(i, child)
    child.owner = this
    YogaNative.jni_YGNodeInsertChildJNI(nativePointer, child.nativePointer, i)
  }

  override fun setIsReferenceBaseline(isReferenceBaseline: Boolean) {
    YogaNative.jni_YGNodeSetIsReferenceBaselineJNI(nativePointer, isReferenceBaseline)
  }

  override val isReferenceBaseline: Boolean
    get() = YogaNative.jni_YGNodeIsReferenceBaselineJNI(nativePointer)

  public fun swapChildAt(newChild: YogaNode, position: Int) {
    if (newChild !is YogaNodeJNIBase) {
      return
    }
    val list = checkNotNull(children) { "YogaNode does not have children" }
    list.removeAt(position)
    list.add(position, newChild)
    newChild.owner = this
    YogaNative.jni_YGNodeSwapChildJNI(nativePointer, newChild.nativePointer, position)
  }

  override fun cloneWithChildren(): YogaNodeJNIBase {
    try {
      val clonedYogaNode = super.clone() as YogaNodeJNIBase
      clonedYogaNode.children?.let { clonedYogaNode.children = ArrayList(it) }
      val clonedNativePointer = YogaNative.jni_YGNodeCloneJNI(nativePointer)
      clonedYogaNode.owner = null
      clonedYogaNode.nativePointer = clonedNativePointer
      for (i in 0 until clonedYogaNode.childCount) {
        clonedYogaNode.swapChildAt(clonedYogaNode.getChildAt(i).cloneWithChildren(), i)
      }
      return clonedYogaNode
    } catch (ex: CloneNotSupportedException) {
      throw RuntimeException(ex)
    }
  }

  override fun cloneWithoutChildren(): YogaNodeJNIBase {
    try {
      val clonedYogaNode = super.clone() as YogaNodeJNIBase
      val clonedNativePointer = YogaNative.jni_YGNodeCloneJNI(nativePointer)
      clonedYogaNode.owner = null
      clonedYogaNode.nativePointer = clonedNativePointer
      clonedYogaNode.clearChildren()
      return clonedYogaNode
    } catch (ex: CloneNotSupportedException) {
      throw RuntimeException(ex)
    }
  }

  private fun clearChildren() {
    children = null
    YogaNative.jni_YGNodeRemoveAllChildrenJNI(nativePointer)
  }

  override fun removeChildAt(i: Int): YogaNodeJNIBase {
    val childList =
        children
            ?: throw IllegalStateException(
                "Trying to remove a child of a YogaNode that does not have children"
            )
    val child = childList.removeAt(i)
    child.owner = null
    YogaNative.jni_YGNodeRemoveChildJNI(nativePointer, child.nativePointer)
    return child
  }

  /**
   * The owner is used to identify the YogaTree that a [YogaNode] belongs to. This method will
   * return the parent of the [YogaNode] when the [YogaNode] only belongs to one YogaTree or null
   * when the [YogaNode] is shared between two or more YogaTrees.
   *
   * @return the [YogaNode] that owns this [YogaNode].
   */
  override fun getOwner(): YogaNodeJNIBase? = owner

  @Deprecated("Use getOwner() instead. This will be removed in the next version.")
  override fun getParent(): YogaNodeJNIBase? = getOwner()

  override fun indexOf(child: YogaNode): Int = children?.indexOf(child) ?: -1

  override fun calculateLayout(width: Float, height: Float) {
    freeze(null)

    val n = ArrayList<YogaNodeJNIBase>()
    n.add(this)
    var i = 0
    while (i < n.size) {
      val parent = n[i]
      val children = parent.children
      if (children != null) {
        for (child in children) {
          child.freeze(parent)
          n.add(child)
        }
      }
      ++i
    }

    val nodes = n.toTypedArray()
    val nativePointers = LongArray(nodes.size)
    for (j in nodes.indices) {
      nativePointers[j] = nodes[j].nativePointer
    }

    YogaNative.jni_YGNodeCalculateLayoutJNI(nativePointer, width, height, nativePointers, nodes)
  }

  private fun freeze(parent: YogaNode?) {
    val d = data
    if (d is Inputs) {
      d.freeze(this, parent)
    }
  }

  override fun dirty() {
    YogaNative.jni_YGNodeMarkDirtyJNI(nativePointer)
  }

  override fun isDirty(): Boolean = YogaNative.jni_YGNodeIsDirtyJNI(nativePointer)

  override fun copyStyle(srcNode: YogaNode) {
    if (srcNode !is YogaNodeJNIBase) {
      return
    }
    YogaNative.jni_YGNodeCopyStyleJNI(nativePointer, srcNode.nativePointer)
  }

  override val styleDirection: YogaDirection
    get() = YogaDirection.fromInt(YogaNative.jni_YGNodeStyleGetDirectionJNI(nativePointer))

  override fun setDirection(direction: YogaDirection) {
    YogaNative.jni_YGNodeStyleSetDirectionJNI(nativePointer, direction.intValue())
  }

  override var flexDirection: YogaFlexDirection
    get() = YogaFlexDirection.fromInt(YogaNative.jni_YGNodeStyleGetFlexDirectionJNI(nativePointer))
    set(value) {
      YogaNative.jni_YGNodeStyleSetFlexDirectionJNI(nativePointer, value.intValue())
    }

  override var justifyContent: YogaJustify
    get() = YogaJustify.fromInt(YogaNative.jni_YGNodeStyleGetJustifyContentJNI(nativePointer))
    set(value) {
      YogaNative.jni_YGNodeStyleSetJustifyContentJNI(nativePointer, value.intValue())
    }

  override var alignItems: YogaAlign
    get() = YogaAlign.fromInt(YogaNative.jni_YGNodeStyleGetAlignItemsJNI(nativePointer))
    set(value) {
      YogaNative.jni_YGNodeStyleSetAlignItemsJNI(nativePointer, value.intValue())
    }

  override var alignSelf: YogaAlign
    get() = YogaAlign.fromInt(YogaNative.jni_YGNodeStyleGetAlignSelfJNI(nativePointer))
    set(value) {
      YogaNative.jni_YGNodeStyleSetAlignSelfJNI(nativePointer, value.intValue())
    }

  override var alignContent: YogaAlign
    get() = YogaAlign.fromInt(YogaNative.jni_YGNodeStyleGetAlignContentJNI(nativePointer))
    set(value) {
      YogaNative.jni_YGNodeStyleSetAlignContentJNI(nativePointer, value.intValue())
    }

  override var positionType: YogaPositionType
    get() = YogaPositionType.fromInt(YogaNative.jni_YGNodeStyleGetPositionTypeJNI(nativePointer))
    set(value) {
      YogaNative.jni_YGNodeStyleSetPositionTypeJNI(nativePointer, value.intValue())
    }

  override var boxSizing: YogaBoxSizing
    get() = YogaBoxSizing.fromInt(YogaNative.jni_YGNodeStyleGetBoxSizingJNI(nativePointer))
    set(value) {
      YogaNative.jni_YGNodeStyleSetBoxSizingJNI(nativePointer, value.intValue())
    }

  override var wrap: YogaWrap
    get() = YogaWrap.fromInt(YogaNative.jni_YGNodeStyleGetFlexWrapJNI(nativePointer))
    set(value) {
      YogaNative.jni_YGNodeStyleSetFlexWrapJNI(nativePointer, value.intValue())
    }

  override var overflow: YogaOverflow?
    get() = YogaOverflow.fromInt(YogaNative.jni_YGNodeStyleGetOverflowJNI(nativePointer))
    set(value) {
      YogaNative.jni_YGNodeStyleSetOverflowJNI(
          nativePointer,
          requireNotNull(value) { "overflow must not be null" }.intValue(),
      )
    }

  override var display: YogaDisplay?
    get() = YogaDisplay.fromInt(YogaNative.jni_YGNodeStyleGetDisplayJNI(nativePointer))
    set(value) {
      YogaNative.jni_YGNodeStyleSetDisplayJNI(
          nativePointer,
          requireNotNull(value) { "display must not be null" }.intValue(),
      )
    }

  override var flex: Float
    get() = YogaNative.jni_YGNodeStyleGetFlexJNI(nativePointer)
    set(value) {
      YogaNative.jni_YGNodeStyleSetFlexJNI(nativePointer, value)
    }

  override var flexGrow: Float
    get() = YogaNative.jni_YGNodeStyleGetFlexGrowJNI(nativePointer)
    set(value) {
      YogaNative.jni_YGNodeStyleSetFlexGrowJNI(nativePointer, value)
    }

  override var flexShrink: Float
    get() = YogaNative.jni_YGNodeStyleGetFlexShrinkJNI(nativePointer)
    set(value) {
      YogaNative.jni_YGNodeStyleSetFlexShrinkJNI(nativePointer, value)
    }

  override val flexBasis: YogaValue
    get() = valueFromLong(YogaNative.jni_YGNodeStyleGetFlexBasisJNI(nativePointer))

  override fun setFlexBasis(flexBasis: Float) {
    YogaNative.jni_YGNodeStyleSetFlexBasisJNI(nativePointer, flexBasis)
  }

  override fun setFlexBasisPercent(percent: Float) {
    YogaNative.jni_YGNodeStyleSetFlexBasisPercentJNI(nativePointer, percent)
  }

  override fun setFlexBasisAuto() {
    YogaNative.jni_YGNodeStyleSetFlexBasisAutoJNI(nativePointer)
  }

  override fun setFlexBasisMaxContent() {
    YogaNative.jni_YGNodeStyleSetFlexBasisMaxContentJNI(nativePointer)
  }

  override fun setFlexBasisFitContent() {
    YogaNative.jni_YGNodeStyleSetFlexBasisFitContentJNI(nativePointer)
  }

  override fun setFlexBasisStretch() {
    YogaNative.jni_YGNodeStyleSetFlexBasisStretchJNI(nativePointer)
  }

  override fun getMargin(edge: YogaEdge): YogaValue =
      valueFromLong(YogaNative.jni_YGNodeStyleGetMarginJNI(nativePointer, edge.intValue()))

  override fun setMargin(edge: YogaEdge, margin: Float) {
    YogaNative.jni_YGNodeStyleSetMarginJNI(nativePointer, edge.intValue(), margin)
  }

  override fun setMarginPercent(edge: YogaEdge, percent: Float) {
    YogaNative.jni_YGNodeStyleSetMarginPercentJNI(nativePointer, edge.intValue(), percent)
  }

  override fun setMarginAuto(edge: YogaEdge) {
    YogaNative.jni_YGNodeStyleSetMarginAutoJNI(nativePointer, edge.intValue())
  }

  override fun getPadding(edge: YogaEdge): YogaValue =
      valueFromLong(YogaNative.jni_YGNodeStyleGetPaddingJNI(nativePointer, edge.intValue()))

  override fun setPadding(edge: YogaEdge, padding: Float) {
    YogaNative.jni_YGNodeStyleSetPaddingJNI(nativePointer, edge.intValue(), padding)
  }

  override fun setPaddingPercent(edge: YogaEdge, percent: Float) {
    YogaNative.jni_YGNodeStyleSetPaddingPercentJNI(nativePointer, edge.intValue(), percent)
  }

  override fun getBorder(edge: YogaEdge): Float =
      YogaNative.jni_YGNodeStyleGetBorderJNI(nativePointer, edge.intValue())

  override fun setBorder(edge: YogaEdge, value: Float) {
    YogaNative.jni_YGNodeStyleSetBorderJNI(nativePointer, edge.intValue(), value)
  }

  override fun getPosition(edge: YogaEdge): YogaValue =
      valueFromLong(YogaNative.jni_YGNodeStyleGetPositionJNI(nativePointer, edge.intValue()))

  override fun setPosition(edge: YogaEdge, position: Float) {
    YogaNative.jni_YGNodeStyleSetPositionJNI(nativePointer, edge.intValue(), position)
  }

  override fun setPositionPercent(edge: YogaEdge, percent: Float) {
    YogaNative.jni_YGNodeStyleSetPositionPercentJNI(nativePointer, edge.intValue(), percent)
  }

  override fun setPositionAuto(edge: YogaEdge) {
    YogaNative.jni_YGNodeStyleSetPositionAutoJNI(nativePointer, edge.intValue())
  }

  override val width: YogaValue
    get() = valueFromLong(YogaNative.jni_YGNodeStyleGetWidthJNI(nativePointer))

  override fun setWidth(width: Float) {
    YogaNative.jni_YGNodeStyleSetWidthJNI(nativePointer, width)
  }

  override fun setWidthPercent(percent: Float) {
    YogaNative.jni_YGNodeStyleSetWidthPercentJNI(nativePointer, percent)
  }

  override fun setWidthAuto() {
    YogaNative.jni_YGNodeStyleSetWidthAutoJNI(nativePointer)
  }

  override fun setWidthMaxContent() {
    YogaNative.jni_YGNodeStyleSetWidthMaxContentJNI(nativePointer)
  }

  override fun setWidthFitContent() {
    YogaNative.jni_YGNodeStyleSetWidthFitContentJNI(nativePointer)
  }

  override fun setWidthStretch() {
    YogaNative.jni_YGNodeStyleSetWidthStretchJNI(nativePointer)
  }

  override val height: YogaValue
    get() = valueFromLong(YogaNative.jni_YGNodeStyleGetHeightJNI(nativePointer))

  override fun setHeight(height: Float) {
    YogaNative.jni_YGNodeStyleSetHeightJNI(nativePointer, height)
  }

  override fun setHeightPercent(percent: Float) {
    YogaNative.jni_YGNodeStyleSetHeightPercentJNI(nativePointer, percent)
  }

  override fun setHeightAuto() {
    YogaNative.jni_YGNodeStyleSetHeightAutoJNI(nativePointer)
  }

  override fun setHeightMaxContent() {
    YogaNative.jni_YGNodeStyleSetHeightMaxContentJNI(nativePointer)
  }

  override fun setHeightFitContent() {
    YogaNative.jni_YGNodeStyleSetHeightFitContentJNI(nativePointer)
  }

  override fun setHeightStretch() {
    YogaNative.jni_YGNodeStyleSetHeightStretchJNI(nativePointer)
  }

  override val minWidth: YogaValue
    get() = valueFromLong(YogaNative.jni_YGNodeStyleGetMinWidthJNI(nativePointer))

  override fun setMinWidth(minWidth: Float) {
    YogaNative.jni_YGNodeStyleSetMinWidthJNI(nativePointer, minWidth)
  }

  override fun setMinWidthPercent(percent: Float) {
    YogaNative.jni_YGNodeStyleSetMinWidthPercentJNI(nativePointer, percent)
  }

  override fun setMinWidthMaxContent() {
    YogaNative.jni_YGNodeStyleSetMinWidthMaxContentJNI(nativePointer)
  }

  override fun setMinWidthFitContent() {
    YogaNative.jni_YGNodeStyleSetMinWidthFitContentJNI(nativePointer)
  }

  override fun setMinWidthStretch() {
    YogaNative.jni_YGNodeStyleSetMinWidthStretchJNI(nativePointer)
  }

  override val minHeight: YogaValue
    get() = valueFromLong(YogaNative.jni_YGNodeStyleGetMinHeightJNI(nativePointer))

  override fun setMinHeight(minHeight: Float) {
    YogaNative.jni_YGNodeStyleSetMinHeightJNI(nativePointer, minHeight)
  }

  override fun setMinHeightPercent(percent: Float) {
    YogaNative.jni_YGNodeStyleSetMinHeightPercentJNI(nativePointer, percent)
  }

  override fun setMinHeightMaxContent() {
    YogaNative.jni_YGNodeStyleSetMinHeightMaxContentJNI(nativePointer)
  }

  override fun setMinHeightFitContent() {
    YogaNative.jni_YGNodeStyleSetMinHeightFitContentJNI(nativePointer)
  }

  override fun setMinHeightStretch() {
    YogaNative.jni_YGNodeStyleSetMinHeightStretchJNI(nativePointer)
  }

  override val maxWidth: YogaValue
    get() = valueFromLong(YogaNative.jni_YGNodeStyleGetMaxWidthJNI(nativePointer))

  override fun setMaxWidth(maxWidth: Float) {
    YogaNative.jni_YGNodeStyleSetMaxWidthJNI(nativePointer, maxWidth)
  }

  override fun setMaxWidthPercent(percent: Float) {
    YogaNative.jni_YGNodeStyleSetMaxWidthPercentJNI(nativePointer, percent)
  }

  override fun setMaxWidthMaxContent() {
    YogaNative.jni_YGNodeStyleSetMaxWidthMaxContentJNI(nativePointer)
  }

  override fun setMaxWidthFitContent() {
    YogaNative.jni_YGNodeStyleSetMaxWidthFitContentJNI(nativePointer)
  }

  override fun setMaxWidthStretch() {
    YogaNative.jni_YGNodeStyleSetMaxWidthStretchJNI(nativePointer)
  }

  override val maxHeight: YogaValue
    get() = valueFromLong(YogaNative.jni_YGNodeStyleGetMaxHeightJNI(nativePointer))

  override fun setMaxHeight(maxHeight: Float) {
    YogaNative.jni_YGNodeStyleSetMaxHeightJNI(nativePointer, maxHeight)
  }

  override fun setMaxHeightPercent(percent: Float) {
    YogaNative.jni_YGNodeStyleSetMaxHeightPercentJNI(nativePointer, percent)
  }

  override fun setMaxHeightMaxContent() {
    YogaNative.jni_YGNodeStyleSetMaxHeightMaxContentJNI(nativePointer)
  }

  override fun setMaxHeightFitContent() {
    YogaNative.jni_YGNodeStyleSetMaxHeightFitContentJNI(nativePointer)
  }

  override fun setMaxHeightStretch() {
    YogaNative.jni_YGNodeStyleSetMaxHeightStretchJNI(nativePointer)
  }

  override var aspectRatio: Float
    get() = YogaNative.jni_YGNodeStyleGetAspectRatioJNI(nativePointer)
    set(value) {
      YogaNative.jni_YGNodeStyleSetAspectRatioJNI(nativePointer, value)
    }

  override fun setMeasureFunction(measureFunction: YogaMeasureFunction?) {
    this.measureFunction = measureFunction
    YogaNative.jni_YGNodeSetHasMeasureFuncJNI(nativePointer, measureFunction != null)
  }

  override fun setMinContentMeasureFunction(measureFunction: YogaMeasureFunction?) {
    this.minContentMeasureFunction = measureFunction
    YogaNative.jni_YGNodeSetHasMinContentMeasureFuncJNI(nativePointer, measureFunction != null)
  }

  override fun setMinContentWidth(minContentWidth: Float) {
    YogaNative.jni_YGNodeSetMinContentWidthJNI(nativePointer, minContentWidth)
  }

  override fun setMinContentHeight(minContentHeight: Float) {
    YogaNative.jni_YGNodeSetMinContentHeightJNI(nativePointer, minContentHeight)
  }

  override fun getMinContentWidth(): Float =
      YogaNative.jni_YGNodeGetMinContentWidthJNI(nativePointer)

  override fun getMinContentHeight(): Float =
      YogaNative.jni_YGNodeGetMinContentHeightJNI(nativePointer)

  override fun setAlwaysFormsContainingBlock(alwaysFormsContainingBlock: Boolean) {
    YogaNative.jni_YGNodeSetAlwaysFormsContainingBlockJNI(
        nativePointer,
        alwaysFormsContainingBlock,
    )
  }

  // This method must not be overridden: we cache the jmethodid for it in native Yoga code.
  // Even if a subclass overrides measure, we'd still call this implementation from layout
  // code since the overriding method will have a different jmethodid. In Kotlin, non-open
  // methods are final by default, which enforces this constraint.
  @DoNotStrip
  public fun measure(width: Float, widthMode: Int, height: Float, heightMode: Int): Long {
    val mf = checkNotNull(measureFunction) { "Measure function isn't defined!" }
    return mf.measure(
        this,
        width,
        YogaMeasureMode.fromInt(widthMode),
        height,
        YogaMeasureMode.fromInt(heightMode),
    )
  }

  // Native callback invoked by Yoga during the CSS Flexbox §4.5 auto-min
  // probe when a min-content measure function is registered. Mirrors
  // [measure]; see that method's note on non-overridability.
  @DoNotStrip
  public fun measureMinContent(
      width: Float,
      widthMode: Int,
      height: Float,
      heightMode: Int,
  ): Long {
    val mf =
        checkNotNull(minContentMeasureFunction) { "Min-content measure function isn't defined!" }
    return mf.measure(
        this,
        width,
        YogaMeasureMode.fromInt(widthMode),
        height,
        YogaMeasureMode.fromInt(heightMode),
    )
  }

  override fun setBaselineFunction(yogaBaselineFunction: YogaBaselineFunction?) {
    baselineFunction = yogaBaselineFunction
    YogaNative.jni_YGNodeSetHasBaselineFuncJNI(nativePointer, yogaBaselineFunction != null)
  }

  // Same JNI jmethodid caching concern as measure() — must not be overridden.
  @DoNotStrip
  public fun baseline(width: Float, height: Float): Float {
    val bf = checkNotNull(baselineFunction) { "Baseline function isn't defined!" }
    return bf.baseline(this, width, height)
  }

  override val isMeasureDefined: Boolean
    get() = measureFunction != null

  override val isBaselineDefined: Boolean
    get() = baselineFunction != null

  override var data: Any? = null

  /**
   * Replaces the child at [childIndex] with [newNode]. This is different than calling
   * [removeChildAt] and [addChildAt] because this method ONLY replaces the child in the children
   * data structure. Called from JNI.
   *
   * @return the nativePointer of the [newNode].
   */
  @DoNotStrip
  private fun replaceChild(newNode: YogaNodeJNIBase, childIndex: Int): Long {
    val childList =
        children
            ?: throw IllegalStateException("Cannot replace child. YogaNode does not have children")
    childList.removeAt(childIndex)
    childList.add(childIndex, newNode)
    newNode.owner = this
    return newNode.nativePointer
  }

  override val layoutX: Float
    get() = arr?.get(LAYOUT_LEFT_INDEX) ?: 0f

  override val layoutY: Float
    get() = arr?.get(LAYOUT_TOP_INDEX) ?: 0f

  override val layoutWidth: Float
    get() = arr?.get(LAYOUT_WIDTH_INDEX) ?: 0f

  override val layoutHeight: Float
    get() = arr?.get(LAYOUT_HEIGHT_INDEX) ?: 0f

  override fun getLayoutMargin(edge: YogaEdge): Float {
    val a = arr
    if (a != null && (a[LAYOUT_EDGE_SET_FLAG_INDEX].toInt() and MARGIN) == MARGIN) {
      return when (edge) {
        YogaEdge.LEFT -> a[LAYOUT_MARGIN_START_INDEX]
        YogaEdge.TOP -> a[LAYOUT_MARGIN_START_INDEX + 1]
        YogaEdge.RIGHT -> a[LAYOUT_MARGIN_START_INDEX + 2]
        YogaEdge.BOTTOM -> a[LAYOUT_MARGIN_START_INDEX + 3]
        YogaEdge.START ->
            if (layoutDirection == YogaDirection.RTL) a[LAYOUT_MARGIN_START_INDEX + 2]
            else a[LAYOUT_MARGIN_START_INDEX]
        YogaEdge.END ->
            if (layoutDirection == YogaDirection.RTL) a[LAYOUT_MARGIN_START_INDEX]
            else a[LAYOUT_MARGIN_START_INDEX + 2]
        else -> throw IllegalArgumentException("Cannot get layout margins of multi-edge shorthands")
      }
    }
    return 0f
  }

  override fun getLayoutPadding(edge: YogaEdge): Float {
    val a = arr
    if (a != null && (a[LAYOUT_EDGE_SET_FLAG_INDEX].toInt() and PADDING) == PADDING) {
      val paddingStartIndex =
          LAYOUT_PADDING_START_INDEX -
              (if ((a[LAYOUT_EDGE_SET_FLAG_INDEX].toInt() and MARGIN) == MARGIN) 0 else 4)
      return when (edge) {
        YogaEdge.LEFT -> a[paddingStartIndex]
        YogaEdge.TOP -> a[paddingStartIndex + 1]
        YogaEdge.RIGHT -> a[paddingStartIndex + 2]
        YogaEdge.BOTTOM -> a[paddingStartIndex + 3]
        YogaEdge.START ->
            if (layoutDirection == YogaDirection.RTL) a[paddingStartIndex + 2]
            else a[paddingStartIndex]
        YogaEdge.END ->
            if (layoutDirection == YogaDirection.RTL) a[paddingStartIndex]
            else a[paddingStartIndex + 2]
        else ->
            throw IllegalArgumentException("Cannot get layout paddings of multi-edge shorthands")
      }
    }
    return 0f
  }

  override fun getLayoutBorder(edge: YogaEdge): Float {
    val a = arr
    if (a != null && (a[LAYOUT_EDGE_SET_FLAG_INDEX].toInt() and BORDER) == BORDER) {
      val borderStartIndex =
          LAYOUT_BORDER_START_INDEX -
              (if ((a[LAYOUT_EDGE_SET_FLAG_INDEX].toInt() and MARGIN) == MARGIN) 0 else 4) -
              (if ((a[LAYOUT_EDGE_SET_FLAG_INDEX].toInt() and PADDING) == PADDING) 0 else 4)
      return when (edge) {
        YogaEdge.LEFT -> a[borderStartIndex]
        YogaEdge.TOP -> a[borderStartIndex + 1]
        YogaEdge.RIGHT -> a[borderStartIndex + 2]
        YogaEdge.BOTTOM -> a[borderStartIndex + 3]
        YogaEdge.START ->
            if (layoutDirection == YogaDirection.RTL) a[borderStartIndex + 2]
            else a[borderStartIndex]
        YogaEdge.END ->
            if (layoutDirection == YogaDirection.RTL) a[borderStartIndex]
            else a[borderStartIndex + 2]
        else -> throw IllegalArgumentException("Cannot get layout border of multi-edge shorthands")
      }
    }
    return 0f
  }

  override val layoutDirection: YogaDirection
    get() = YogaDirection.fromInt(arr?.get(LAYOUT_DIRECTION_INDEX)?.toInt() ?: mLayoutDirection)

  override fun hasNewLayout(): Boolean {
    val a = arr
    return if (a != null) {
      (a[LAYOUT_EDGE_SET_FLAG_INDEX].toInt() and HAS_NEW_LAYOUT) == HAS_NEW_LAYOUT
    } else {
      hasNewLayoutField
    }
  }

  override fun markLayoutSeen() {
    val a = arr
    if (a != null) {
      a[LAYOUT_EDGE_SET_FLAG_INDEX] =
          (a[LAYOUT_EDGE_SET_FLAG_INDEX].toInt() and HAS_NEW_LAYOUT.inv()).toFloat()
    }
    hasNewLayoutField = false
  }

  override fun getGap(gutter: YogaGutter): YogaValue =
      valueFromLong(YogaNative.jni_YGNodeStyleGetGapJNI(nativePointer, gutter.intValue()))

  override fun setGap(gutter: YogaGutter, gapLength: Float) {
    YogaNative.jni_YGNodeStyleSetGapJNI(nativePointer, gutter.intValue(), gapLength)
  }

  override fun setGapPercent(gutter: YogaGutter, gapLength: Float) {
    YogaNative.jni_YGNodeStyleSetGapPercentJNI(nativePointer, gutter.intValue(), gapLength)
  }

  public companion object {
    private const val MARGIN: Int = 1
    private const val PADDING: Int = 2
    private const val BORDER: Int = 4
    private const val HAS_NEW_LAYOUT: Int = 16

    private const val LAYOUT_EDGE_SET_FLAG_INDEX: Int = 0
    private const val LAYOUT_WIDTH_INDEX: Int = 1
    private const val LAYOUT_HEIGHT_INDEX: Int = 2
    private const val LAYOUT_LEFT_INDEX: Int = 3
    private const val LAYOUT_TOP_INDEX: Int = 4
    private const val LAYOUT_DIRECTION_INDEX: Int = 5
    private const val LAYOUT_MARGIN_START_INDEX: Int = 6
    private const val LAYOUT_PADDING_START_INDEX: Int = 10
    private const val LAYOUT_BORDER_START_INDEX: Int = 14

    @JvmStatic
    private fun valueFromLong(raw: Long): YogaValue =
        YogaValue(Float.fromBits(raw.toInt()), YogaUnit.fromInt((raw shr 32).toInt()))
  }
}

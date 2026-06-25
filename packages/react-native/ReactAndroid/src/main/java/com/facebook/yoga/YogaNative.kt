/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga

import com.facebook.soloader.SoLoader
import com.facebook.yoga.annotations.DoNotStrip

@DoNotStrip
public object YogaNative {
  init {
    SoLoader.loadLibrary("yoga")
  }

  // JNI methods that use Vanilla JNI
  // YGConfig related
  @JvmStatic public external fun jni_YGConfigNewJNI(): Long

  @JvmStatic public external fun jni_YGConfigFreeJNI(nativePointer: Long)

  @JvmStatic
  public external fun jni_YGConfigSetExperimentalFeatureEnabledJNI(
      nativePointer: Long,
      feature: Int,
      enabled: Boolean,
  )

  @JvmStatic
  public external fun jni_YGConfigSetUseWebDefaultsJNI(nativePointer: Long, useWebDefaults: Boolean)

  @JvmStatic
  public external fun jni_YGConfigSetPointScaleFactorJNI(nativePointer: Long, pixelsInPoint: Float)

  @JvmStatic public external fun jni_YGConfigSetErrataJNI(nativePointer: Long, errata: Int)

  @JvmStatic public external fun jni_YGConfigGetErrataJNI(nativePointer: Long): Int

  @JvmStatic public external fun jni_YGConfigSetLoggerJNI(nativePointer: Long, logger: YogaLogger?)

  // YGNode related
  @JvmStatic public external fun jni_YGNodeNewJNI(): Long

  @JvmStatic public external fun jni_YGNodeNewWithConfigJNI(configPointer: Long): Long

  @JvmStatic public external fun jni_YGNodeFinalizeJNI(nativePointer: Long)

  @JvmStatic public external fun jni_YGNodeResetJNI(nativePointer: Long)

  @JvmStatic
  public external fun jni_YGNodeInsertChildJNI(nativePointer: Long, childPointer: Long, index: Int)

  @JvmStatic
  public external fun jni_YGNodeSwapChildJNI(nativePointer: Long, childPointer: Long, index: Int)

  @JvmStatic
  public external fun jni_YGNodeSetIsReferenceBaselineJNI(
      nativePointer: Long,
      isReferenceBaseline: Boolean,
  )

  @JvmStatic public external fun jni_YGNodeIsReferenceBaselineJNI(nativePointer: Long): Boolean

  @JvmStatic public external fun jni_YGNodeRemoveAllChildrenJNI(nativePointer: Long)

  @JvmStatic public external fun jni_YGNodeRemoveChildJNI(nativePointer: Long, childPointer: Long)

  @JvmStatic
  public external fun jni_YGNodeCalculateLayoutJNI(
      nativePointer: Long,
      width: Float,
      height: Float,
      nativePointers: LongArray,
      nodes: Array<YogaNodeJNIBase>,
  )

  @JvmStatic public external fun jni_YGNodeMarkDirtyJNI(nativePointer: Long)

  @JvmStatic public external fun jni_YGNodeIsDirtyJNI(nativePointer: Long): Boolean

  @JvmStatic
  public external fun jni_YGNodeCopyStyleJNI(dstNativePointer: Long, srcNativePointer: Long)

  @JvmStatic public external fun jni_YGNodeStyleGetDirectionJNI(nativePointer: Long): Int

  @JvmStatic public external fun jni_YGNodeStyleSetDirectionJNI(nativePointer: Long, direction: Int)

  @JvmStatic public external fun jni_YGNodeStyleGetFlexDirectionJNI(nativePointer: Long): Int

  @JvmStatic
  public external fun jni_YGNodeStyleSetFlexDirectionJNI(nativePointer: Long, flexDirection: Int)

  @JvmStatic public external fun jni_YGNodeStyleGetJustifyContentJNI(nativePointer: Long): Int

  @JvmStatic
  public external fun jni_YGNodeStyleSetJustifyContentJNI(nativePointer: Long, justifyContent: Int)

  @JvmStatic public external fun jni_YGNodeStyleGetAlignItemsJNI(nativePointer: Long): Int

  @JvmStatic
  public external fun jni_YGNodeStyleSetAlignItemsJNI(nativePointer: Long, alignItems: Int)

  @JvmStatic public external fun jni_YGNodeStyleGetAlignSelfJNI(nativePointer: Long): Int

  @JvmStatic public external fun jni_YGNodeStyleSetAlignSelfJNI(nativePointer: Long, alignSelf: Int)

  @JvmStatic public external fun jni_YGNodeStyleGetAlignContentJNI(nativePointer: Long): Int

  @JvmStatic
  public external fun jni_YGNodeStyleSetAlignContentJNI(nativePointer: Long, alignContent: Int)

  @JvmStatic public external fun jni_YGNodeStyleGetPositionTypeJNI(nativePointer: Long): Int

  @JvmStatic
  public external fun jni_YGNodeStyleSetPositionTypeJNI(nativePointer: Long, positionType: Int)

  @JvmStatic public external fun jni_YGNodeStyleGetBoxSizingJNI(nativePointer: Long): Int

  @JvmStatic public external fun jni_YGNodeStyleSetBoxSizingJNI(nativePointer: Long, boxSizing: Int)

  @JvmStatic public external fun jni_YGNodeStyleGetFlexWrapJNI(nativePointer: Long): Int

  @JvmStatic public external fun jni_YGNodeStyleSetFlexWrapJNI(nativePointer: Long, wrapType: Int)

  @JvmStatic public external fun jni_YGNodeStyleGetOverflowJNI(nativePointer: Long): Int

  @JvmStatic public external fun jni_YGNodeStyleSetOverflowJNI(nativePointer: Long, overflow: Int)

  @JvmStatic public external fun jni_YGNodeStyleGetDisplayJNI(nativePointer: Long): Int

  @JvmStatic public external fun jni_YGNodeStyleSetDisplayJNI(nativePointer: Long, display: Int)

  @JvmStatic public external fun jni_YGNodeStyleGetFlexJNI(nativePointer: Long): Float

  @JvmStatic public external fun jni_YGNodeStyleSetFlexJNI(nativePointer: Long, flex: Float)

  @JvmStatic public external fun jni_YGNodeStyleGetFlexGrowJNI(nativePointer: Long): Float

  @JvmStatic public external fun jni_YGNodeStyleSetFlexGrowJNI(nativePointer: Long, flexGrow: Float)

  @JvmStatic public external fun jni_YGNodeStyleGetFlexShrinkJNI(nativePointer: Long): Float

  @JvmStatic
  public external fun jni_YGNodeStyleSetFlexShrinkJNI(nativePointer: Long, flexShrink: Float)

  @JvmStatic public external fun jni_YGNodeStyleGetFlexBasisJNI(nativePointer: Long): Long

  @JvmStatic
  public external fun jni_YGNodeStyleSetFlexBasisJNI(nativePointer: Long, flexBasis: Float)

  @JvmStatic
  public external fun jni_YGNodeStyleSetFlexBasisPercentJNI(nativePointer: Long, percent: Float)

  @JvmStatic public external fun jni_YGNodeStyleSetFlexBasisAutoJNI(nativePointer: Long)

  @JvmStatic public external fun jni_YGNodeStyleSetFlexBasisMaxContentJNI(nativePointer: Long)

  @JvmStatic public external fun jni_YGNodeStyleSetFlexBasisFitContentJNI(nativePointer: Long)

  @JvmStatic public external fun jni_YGNodeStyleSetFlexBasisStretchJNI(nativePointer: Long)

  @JvmStatic public external fun jni_YGNodeStyleGetMarginJNI(nativePointer: Long, edge: Int): Long

  @JvmStatic
  public external fun jni_YGNodeStyleSetMarginJNI(nativePointer: Long, edge: Int, margin: Float)

  @JvmStatic
  public external fun jni_YGNodeStyleSetMarginPercentJNI(
      nativePointer: Long,
      edge: Int,
      percent: Float,
  )

  @JvmStatic public external fun jni_YGNodeStyleSetMarginAutoJNI(nativePointer: Long, edge: Int)

  @JvmStatic public external fun jni_YGNodeStyleGetPaddingJNI(nativePointer: Long, edge: Int): Long

  @JvmStatic
  public external fun jni_YGNodeStyleSetPaddingJNI(nativePointer: Long, edge: Int, padding: Float)

  @JvmStatic
  public external fun jni_YGNodeStyleSetPaddingPercentJNI(
      nativePointer: Long,
      edge: Int,
      percent: Float,
  )

  @JvmStatic public external fun jni_YGNodeStyleGetBorderJNI(nativePointer: Long, edge: Int): Float

  @JvmStatic
  public external fun jni_YGNodeStyleSetBorderJNI(nativePointer: Long, edge: Int, border: Float)

  @JvmStatic public external fun jni_YGNodeStyleGetPositionJNI(nativePointer: Long, edge: Int): Long

  @JvmStatic
  public external fun jni_YGNodeStyleSetPositionJNI(nativePointer: Long, edge: Int, position: Float)

  @JvmStatic
  public external fun jni_YGNodeStyleSetPositionPercentJNI(
      nativePointer: Long,
      edge: Int,
      percent: Float,
  )

  @JvmStatic public external fun jni_YGNodeStyleSetPositionAutoJNI(nativePointer: Long, edge: Int)

  @JvmStatic public external fun jni_YGNodeStyleGetWidthJNI(nativePointer: Long): Long

  @JvmStatic public external fun jni_YGNodeStyleSetWidthJNI(nativePointer: Long, width: Float)

  @JvmStatic
  public external fun jni_YGNodeStyleSetWidthPercentJNI(nativePointer: Long, percent: Float)

  @JvmStatic public external fun jni_YGNodeStyleSetWidthAutoJNI(nativePointer: Long)

  @JvmStatic public external fun jni_YGNodeStyleSetWidthMaxContentJNI(nativePointer: Long)

  @JvmStatic public external fun jni_YGNodeStyleSetWidthFitContentJNI(nativePointer: Long)

  @JvmStatic public external fun jni_YGNodeStyleSetWidthStretchJNI(nativePointer: Long)

  @JvmStatic public external fun jni_YGNodeStyleGetHeightJNI(nativePointer: Long): Long

  @JvmStatic public external fun jni_YGNodeStyleSetHeightJNI(nativePointer: Long, height: Float)

  @JvmStatic
  public external fun jni_YGNodeStyleSetHeightPercentJNI(nativePointer: Long, percent: Float)

  @JvmStatic public external fun jni_YGNodeStyleSetHeightAutoJNI(nativePointer: Long)

  @JvmStatic public external fun jni_YGNodeStyleSetHeightMaxContentJNI(nativePointer: Long)

  @JvmStatic public external fun jni_YGNodeStyleSetHeightFitContentJNI(nativePointer: Long)

  @JvmStatic public external fun jni_YGNodeStyleSetHeightStretchJNI(nativePointer: Long)

  @JvmStatic public external fun jni_YGNodeStyleGetMinWidthJNI(nativePointer: Long): Long

  @JvmStatic public external fun jni_YGNodeStyleSetMinWidthJNI(nativePointer: Long, minWidth: Float)

  @JvmStatic
  public external fun jni_YGNodeStyleSetMinWidthPercentJNI(nativePointer: Long, percent: Float)

  @JvmStatic public external fun jni_YGNodeStyleSetMinWidthMaxContentJNI(nativePointer: Long)

  @JvmStatic public external fun jni_YGNodeStyleSetMinWidthFitContentJNI(nativePointer: Long)

  @JvmStatic public external fun jni_YGNodeStyleSetMinWidthStretchJNI(nativePointer: Long)

  @JvmStatic public external fun jni_YGNodeStyleGetMinHeightJNI(nativePointer: Long): Long

  @JvmStatic
  public external fun jni_YGNodeStyleSetMinHeightJNI(nativePointer: Long, minHeight: Float)

  @JvmStatic
  public external fun jni_YGNodeStyleSetMinHeightPercentJNI(nativePointer: Long, percent: Float)

  @JvmStatic public external fun jni_YGNodeStyleSetMinHeightMaxContentJNI(nativePointer: Long)

  @JvmStatic public external fun jni_YGNodeStyleSetMinHeightFitContentJNI(nativePointer: Long)

  @JvmStatic public external fun jni_YGNodeStyleSetMinHeightStretchJNI(nativePointer: Long)

  @JvmStatic public external fun jni_YGNodeStyleGetMaxWidthJNI(nativePointer: Long): Long

  @JvmStatic public external fun jni_YGNodeStyleSetMaxWidthJNI(nativePointer: Long, maxWidth: Float)

  @JvmStatic
  public external fun jni_YGNodeStyleSetMaxWidthPercentJNI(nativePointer: Long, percent: Float)

  @JvmStatic public external fun jni_YGNodeStyleSetMaxWidthMaxContentJNI(nativePointer: Long)

  @JvmStatic public external fun jni_YGNodeStyleSetMaxWidthFitContentJNI(nativePointer: Long)

  @JvmStatic public external fun jni_YGNodeStyleSetMaxWidthStretchJNI(nativePointer: Long)

  @JvmStatic public external fun jni_YGNodeStyleGetMaxHeightJNI(nativePointer: Long): Long

  @JvmStatic
  public external fun jni_YGNodeStyleSetMaxHeightJNI(nativePointer: Long, maxheight: Float)

  @JvmStatic
  public external fun jni_YGNodeStyleSetMaxHeightPercentJNI(nativePointer: Long, percent: Float)

  @JvmStatic public external fun jni_YGNodeStyleSetMaxHeightMaxContentJNI(nativePointer: Long)

  @JvmStatic public external fun jni_YGNodeStyleSetMaxHeightFitContentJNI(nativePointer: Long)

  @JvmStatic public external fun jni_YGNodeStyleSetMaxHeightStretchJNI(nativePointer: Long)

  @JvmStatic public external fun jni_YGNodeStyleGetAspectRatioJNI(nativePointer: Long): Float

  @JvmStatic
  public external fun jni_YGNodeStyleSetAspectRatioJNI(nativePointer: Long, aspectRatio: Float)

  @JvmStatic public external fun jni_YGNodeStyleGetGapJNI(nativePointer: Long, gutter: Int): Long

  @JvmStatic
  public external fun jni_YGNodeStyleSetGapJNI(nativePointer: Long, gutter: Int, gapLength: Float)

  @JvmStatic
  public external fun jni_YGNodeStyleSetGapPercentJNI(
      nativePointer: Long,
      gutter: Int,
      gapLength: Float,
  )

  @JvmStatic
  public external fun jni_YGNodeSetHasMeasureFuncJNI(nativePointer: Long, hasMeasureFunc: Boolean)

  @JvmStatic
  public external fun jni_YGNodeSetHasMinContentMeasureFuncJNI(
      nativePointer: Long,
      hasMinContentMeasureFunc: Boolean,
  )

  @JvmStatic
  public external fun jni_YGNodeSetMinContentWidthJNI(nativePointer: Long, minContentWidth: Float)

  @JvmStatic
  public external fun jni_YGNodeSetMinContentHeightJNI(nativePointer: Long, minContentHeight: Float)

  @JvmStatic public external fun jni_YGNodeGetMinContentWidthJNI(nativePointer: Long): Float

  @JvmStatic public external fun jni_YGNodeGetMinContentHeightJNI(nativePointer: Long): Float

  @JvmStatic
  public external fun jni_YGNodeSetHasBaselineFuncJNI(nativePointer: Long, hasMeasureFunc: Boolean)

  @JvmStatic
  public external fun jni_YGNodeSetStyleInputsJNI(
      nativePointer: Long,
      styleInputsArray: FloatArray,
      size: Int,
  )

  @JvmStatic public external fun jni_YGNodeCloneJNI(nativePointer: Long): Long

  @JvmStatic
  public external fun jni_YGNodeSetAlwaysFormsContainingBlockJNI(
      nativePointer: Long,
      alwaysFormContainingBlock: Boolean,
  )
}

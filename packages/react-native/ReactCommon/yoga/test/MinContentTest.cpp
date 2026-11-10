/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <yoga/Yoga.h>

namespace facebook::yoga {
namespace {

struct MeasureCalls {
  YGNodeConstRef original = nullptr;
  int ofOriginal = 0;
  int ofCopies = 0;
};

YGSize measureWord(
    YGNodeConstRef node,
    float /*width*/,
    YGMeasureMode /*widthMode*/,
    float /*height*/,
    YGMeasureMode /*heightMode*/) {
  auto* calls = static_cast<MeasureCalls*>(YGNodeGetContext(node));
  ++(node == calls->original ? calls->ofOriginal : calls->ofCopies);
  return YGSize{.width = 30.0f, .height = 10.0f};
}

YGConfigRef autoMinSizeConfig() {
  YGConfigRef config = YGConfigNew();
  YGConfigSetErrata(config, YGErrataNone);
  return config;
}

YGNodeRef measuredLeaf(YGConfigRef config, MeasureCalls* calls) {
  YGNodeRef leaf = YGNodeNewWithConfig(config);
  YGNodeSetMeasureFunc(leaf, measureWord);
  YGNodeSetContext(leaf, calls);
  calls->original = leaf;
  return leaf;
}

TEST(MinContentTest, testWalkClonesChildrenOfAnotherTree) {
  YGConfigRef config = autoMinSizeConfig();
  MeasureCalls calls;
  YGNodeRef root = YGNodeNewWithConfig(config);
  YGNodeStyleSetWidth(root, 100);
  YGNodeStyleSetHeight(root, 100);
  YGNodeRef item = YGNodeNewWithConfig(config);
  YGNodeStyleSetHeight(item, 30);
  YGNodeStyleSetMinHeight(item, 0);
  YGNodeInsertChild(root, item, 0);
  // Explicit minimum heights keep every min-content walk away from the leaf.
  YGNodeRef leaf = measuredLeaf(config, &calls);
  YGNodeStyleSetMinHeight(leaf, 0);
  YGNodeInsertChild(item, leaf, 0);
  YGNodeCalculateLayout(root, YGUndefined, YGUndefined, YGDirectionLTR);

  // A second tree shares the leaf, under a copy of the item that drops its
  // minimum height, so the walk first reaches the leaf in that tree.
  YGNodeRef rootCopy = YGNodeClone(root);
  YGNodeRef itemCopy = YGNodeClone(item);
  YGNodeSwapChild(rootCopy, itemCopy, 0);
  YGNodeStyleSetMinHeight(itemCopy, YGUndefined);
  calls.ofOriginal = 0;
  calls.ofCopies = 0;
  YGNodeCalculateLayout(rootCopy, YGUndefined, YGUndefined, YGDirectionLTR);

  EXPECT_EQ(0, calls.ofOriginal);
  EXPECT_GT(calls.ofCopies, 0);

  YGNodeFreeRecursive(rootCopy);
  YGNodeFreeRecursive(root);
  YGConfigFree(config);
}

TEST(MinContentTest, testUnchangedItemIsNotMeasuredAgain) {
  YGConfigRef config = autoMinSizeConfig();
  MeasureCalls calls;
  YGNodeRef root = YGNodeNewWithConfig(config);
  YGNodeStyleSetWidth(root, 100);
  YGNodeStyleSetHeight(root, 100);
  YGNodeRef item = YGNodeNewWithConfig(config);
  YGNodeInsertChild(root, item, 0);
  YGNodeInsertChild(item, measuredLeaf(config, &calls), 0);
  YGNodeRef sibling = YGNodeNewWithConfig(config);
  YGNodeStyleSetHeight(sibling, 10);
  YGNodeInsertChild(root, sibling, 1);
  YGNodeCalculateLayout(root, YGUndefined, YGUndefined, YGDirectionLTR);

  YGNodeStyleSetHeight(sibling, 20);
  calls.ofOriginal = 0;
  YGNodeCalculateLayout(root, YGUndefined, YGUndefined, YGDirectionLTR);

  EXPECT_EQ(0, calls.ofOriginal);
  EXPECT_FLOAT_EQ(20.0f, YGNodeLayoutGetHeight(sibling));

  YGNodeFreeRecursive(root);
  YGConfigFree(config);
}

TEST(MinContentTest, testStaticMinContentChangeReachesNextLayout) {
  YGConfigRef config = autoMinSizeConfig();
  YGNodeRef root = YGNodeNewWithConfig(config);
  YGNodeStyleSetFlexDirection(root, YGFlexDirectionRow);
  YGNodeStyleSetWidth(root, 20);
  YGNodeStyleSetHeight(root, 50);
  YGNodeRef item = YGNodeNewWithConfig(config);
  YGNodeStyleSetFlexBasis(item, 90);
  YGNodeStyleSetFlexShrink(item, 1);
  YGNodeInsertChild(root, item, 0);
  YGNodeRef scroller = YGNodeNewWithConfig(config);
  YGNodeSetMinContentWidth(scroller, 10);
  YGNodeInsertChild(item, scroller, 0);
  YGNodeRef spacer = YGNodeNewWithConfig(config);
  YGNodeStyleSetWidth(spacer, 10);
  YGNodeInsertChild(root, spacer, 1);
  YGNodeCalculateLayout(root, YGUndefined, YGUndefined, YGDirectionLTR);
  ASSERT_FLOAT_EQ(10.0f, YGNodeLayoutGetWidth(item));

  YGNodeSetMinContentWidth(scroller, 30);
  YGNodeStyleSetWidth(spacer, 5);
  YGNodeCalculateLayout(root, YGUndefined, YGUndefined, YGDirectionLTR);

  EXPECT_FLOAT_EQ(30.0f, YGNodeLayoutGetWidth(item));

  YGNodeFreeRecursive(root);
  YGConfigFree(config);
}

TEST(MinContentTest, testNewWidthDoesNotCloneItemContent) {
  YGConfigRef config = autoMinSizeConfig();
  MeasureCalls calls;
  YGNodeRef root = YGNodeNewWithConfig(config);
  YGNodeStyleSetAlignItems(root, YGAlignFlexStart);
  YGNodeStyleSetWidth(root, 300);
  YGNodeStyleSetHeight(root, 100);
  YGNodeRef item = YGNodeNewWithConfig(config);
  YGNodeStyleSetWidth(item, 50);
  YGNodeStyleSetHeight(item, 200);
  YGNodeStyleSetFlexShrink(item, 1);
  YGNodeInsertChild(root, item, 0);
  YGNodeRef content = YGNodeNewWithConfig(config);
  YGNodeInsertChild(content, measuredLeaf(config, &calls), 0);
  YGNodeInsertChild(item, content, 0);
  YGNodeRef sibling = YGNodeNewWithConfig(config);
  YGNodeStyleSetHeight(sibling, 200);
  YGNodeStyleSetFlexShrink(sibling, 1);
  YGNodeInsertChild(root, sibling, 1);
  YGNodeCalculateLayout(root, YGUndefined, YGUndefined, YGDirectionLTR);

  // A narrower second tree shares the item's content. The item keeps its
  // size, so its layout comes from cache, and nothing below it resolves a
  // percentage against the new width.
  YGNodeRef rootCopy = YGNodeClone(root);
  YGNodeStyleSetWidth(rootCopy, 290);
  YGNodeCalculateLayout(rootCopy, YGUndefined, YGUndefined, YGDirectionLTR);

  EXPECT_EQ(content, YGNodeGetChild(YGNodeGetChild(rootCopy, 0), 0));
  EXPECT_FLOAT_EQ(50.0f, YGNodeLayoutGetHeight(YGNodeGetChild(rootCopy, 0)));

  YGNodeFreeRecursive(rootCopy);
  YGNodeFreeRecursive(root);
  YGConfigFree(config);
}

TEST(MinContentTest, testPercentagePaddingFollowsNewWidth) {
  YGConfigRef config = autoMinSizeConfig();
  MeasureCalls calls;
  YGNodeRef root = YGNodeNewWithConfig(config);
  YGNodeStyleSetFlexDirection(root, YGFlexDirectionRow);
  YGNodeStyleSetWidth(root, 100);
  YGNodeStyleSetHeight(root, 50);
  YGNodeRef item = YGNodeNewWithConfig(config);
  YGNodeStyleSetFlexBasis(item, 100);
  YGNodeStyleSetFlexShrink(item, 1);
  YGNodeInsertChild(root, item, 0);
  YGNodeRef content = YGNodeNewWithConfig(config);
  YGNodeStyleSetPaddingPercent(content, YGEdgeLeft, 10);
  YGNodeInsertChild(content, measuredLeaf(config, &calls), 0);
  YGNodeInsertChild(item, content, 0);
  YGNodeRef sibling = YGNodeNewWithConfig(config);
  YGNodeStyleSetFlexBasis(sibling, 300);
  YGNodeStyleSetFlexShrink(sibling, 1);
  YGNodeInsertChild(root, sibling, 1);
  YGNodeCalculateLayout(root, YGUndefined, YGUndefined, YGDirectionLTR);
  ASSERT_FLOAT_EQ(40.0f, YGNodeLayoutGetWidth(item));

  YGNodeStyleSetWidth(root, 150);
  YGNodeCalculateLayout(root, YGUndefined, YGUndefined, YGDirectionLTR);

  EXPECT_FLOAT_EQ(45.0f, YGNodeLayoutGetWidth(item));

  YGNodeFreeRecursive(root);
  YGConfigFree(config);
}

} // namespace
} // namespace facebook::yoga

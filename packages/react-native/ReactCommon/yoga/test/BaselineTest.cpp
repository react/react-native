/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <atomic>
#include <cstdint>
#include <initializer_list>
#include <limits>
#include <unordered_set>
#include <vector>

#include <yoga/Yoga.h>
#include <yoga/algorithm/Baseline.h>
#include <yoga/enums/Align.h>
#include <yoga/enums/Dimension.h>
#include <yoga/enums/FlexDirection.h>
#include <yoga/enums/PhysicalEdge.h>
#include <yoga/enums/PositionType.h>
#include <yoga/node/Node.h>

namespace facebook::yoga {

extern std::atomic<uint32_t> gCurrentGenerationCount;

namespace {

TEST(ConfigTest, defaultConfigIsConstexpr) {
#if defined(_WIN32)
  const auto& config = Config::getDefault();
  const auto copy = config;
#else
  constexpr const auto& config = Config::getDefault();
  constexpr auto copy = config;
  static_assert(&config == &Config::getDefault());
#endif

  EXPECT_EQ(&config, YGConfigGetDefault());
  EXPECT_EQ(copy.getPointScaleFactor(), config.getPointScaleFactor());
}

void setMeasuredSize(Node& node, float width, float height) {
  node.setLayoutMeasuredDimension(width, Dimension::Width);
  node.setLayoutMeasuredDimension(height, Dimension::Height);
}

float baselineFromContext(
    YGNodeConstRef node,
    float /*width*/,
    float /*height*/) {
  return *static_cast<const float*>(resolveRef(node)->getContext());
}

TEST(BaselineTest, testCalculateBaselineFallsBackToFirstNonAbsoluteChild) {
  Node root;
  Node absoluteChild;
  Node child;

  setMeasuredSize(root, 100.0f, 200.0f);
  setMeasuredSize(absoluteChild, 10.0f, 7.0f);
  setMeasuredSize(child, 30.0f, 20.0f);
  absoluteChild.style().setPositionType(PositionType::Absolute);
  child.setLayoutPosition(30.0f, PhysicalEdge::Top);
  root.setChildren({&absoluteChild, &child});

  EXPECT_FLOAT_EQ(50.0f, calculateBaseline(&root));
}

TEST(BaselineTest, testCalculateBaselineUsesReferenceBaselineChild) {
  Node root;
  Node firstChild;
  Node referenceChild;
  float referenceBaseline = 17.0f;

  setMeasuredSize(firstChild, 30.0f, 80.0f);
  setMeasuredSize(referenceChild, 30.0f, 40.0f);
  firstChild.setLayoutPosition(5.0f, PhysicalEdge::Top);
  referenceChild.setLayoutPosition(12.0f, PhysicalEdge::Top);
  referenceChild.setContext(&referenceBaseline);
  referenceChild.setBaselineFunc(baselineFromContext);
  referenceChild.setIsReferenceBaseline(true);
  root.setChildren({&firstChild, &referenceChild});

  EXPECT_FLOAT_EQ(29.0f, calculateBaseline(&root));
}

TEST(BaselineTest, testCalculateBaselineIgnoresChildrenAfterFirstLine) {
  Node root;
  Node firstLineChild;
  Node secondLineChild;
  float secondLineBaseline = 3.0f;

  setMeasuredSize(firstLineChild, 30.0f, 20.0f);
  setMeasuredSize(secondLineChild, 30.0f, 10.0f);
  firstLineChild.setLayoutPosition(4.0f, PhysicalEdge::Top);
  secondLineChild.setLayoutPosition(100.0f, PhysicalEdge::Top);
  secondLineChild.setLineIndex(1);
  secondLineChild.setContext(&secondLineBaseline);
  secondLineChild.setBaselineFunc(baselineFromContext);
  secondLineChild.setIsReferenceBaseline(true);
  root.setChildren({&firstLineChild, &secondLineChild});

  EXPECT_FLOAT_EQ(24.0f, calculateBaseline(&root));
}

TEST(BaselineTest, testIsBaselineLayoutRequiresRowAndParticipatingChild) {
  Node root;
  Node child;

  root.style().setFlexDirection(FlexDirection::Row);
  child.style().setAlignSelf(Align::Baseline);
  root.setChildren({&child});

  EXPECT_TRUE(isBaselineLayout(&root));

  child.style().setPositionType(PositionType::Absolute);
  EXPECT_FALSE(isBaselineLayout(&root));

  child.style().setPositionType(PositionType::Relative);
  root.style().setFlexDirection(FlexDirection::Column);
  root.style().setAlignItems(Align::Baseline);
  EXPECT_FALSE(isBaselineLayout(&root));
}

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

YGSize measureUncounted(
    YGNodeConstRef /*node*/,
    float /*width*/,
    YGMeasureMode /*widthMode*/,
    float /*height*/,
    YGMeasureMode /*heightMode*/) {
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

// YGNodeFreeRecursive leaks a node two trees share (react/yoga#2087).
void freeTreesSharingNodes(std::initializer_list<YGNodeRef> roots) {
  std::unordered_set<YGNodeRef> nodes;
  std::vector<YGNodeRef> pending(roots);
  while (!pending.empty()) {
    const YGNodeRef node = pending.back();
    pending.pop_back();
    if (!nodes.insert(node).second) {
      continue;
    }
    for (size_t index = 0; index < YGNodeGetChildCount(node); index++) {
      pending.push_back(YGNodeGetChild(node, index));
    }
  }
  for (const YGNodeRef node : nodes) {
    YGNodeFinalize(node);
  }
}

// Only an item that grows or shrinks gets an automatic minimum size.

TEST(MinContentTest, testWalkClonesChildrenOfAnotherTree) {
  YGConfigRef config = autoMinSizeConfig();
  MeasureCalls calls;
  YGNodeRef root = YGNodeNewWithConfig(config);
  YGNodeStyleSetWidth(root, 100);
  YGNodeStyleSetHeight(root, 100);
  YGNodeRef item = YGNodeNewWithConfig(config);
  YGNodeStyleSetHeight(item, 30);
  YGNodeStyleSetMinHeight(item, 0);
  YGNodeStyleSetFlexGrow(item, 1);
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

  freeTreesSharingNodes({rootCopy, root});
  YGConfigFree(config);
}

TEST(MinContentTest, testUnchangedItemIsNotMeasuredAgain) {
  YGConfigRef config = autoMinSizeConfig();
  MeasureCalls calls;
  YGNodeRef root = YGNodeNewWithConfig(config);
  YGNodeStyleSetWidth(root, 100);
  YGNodeStyleSetHeight(root, 100);
  YGNodeRef item = YGNodeNewWithConfig(config);
  YGNodeStyleSetFlexGrow(item, 1);
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
  // Shrinking to exactly the floor would leave the clamp to rounding.
  YGNodeRef spacer = YGNodeNewWithConfig(config);
  YGNodeStyleSetWidth(spacer, 15);
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

  freeTreesSharingNodes({rootCopy, root});
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

TEST(MinContentTest, testPercentageMarginFollowsNewWidth) {
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
  YGNodeStyleSetMarginPercent(content, YGEdgeLeft, 10);
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

TEST(MinContentTest, testLeafPercentagePaddingFollowsNewWidth) {
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
  YGNodeRef leaf = measuredLeaf(config, &calls);
  YGNodeStyleSetPaddingPercent(leaf, YGEdgeLeft, 10);
  YGNodeInsertChild(item, leaf, 0);
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

TEST(MinContentTest, testOwnPercentageMarginLeavesChildrenShared) {
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
  YGNodeStyleSetMarginPercent(content, YGEdgeLeft, 10);
  YGNodeRef leaf = measuredLeaf(config, &calls);
  YGNodeInsertChild(content, leaf, 0);
  YGNodeInsertChild(item, content, 0);
  YGNodeRef sibling = YGNodeNewWithConfig(config);
  YGNodeStyleSetHeight(sibling, 200);
  YGNodeStyleSetFlexShrink(sibling, 1);
  YGNodeInsertChild(root, sibling, 1);
  YGNodeCalculateLayout(root, YGUndefined, YGUndefined, YGDirectionLTR);

  // The content's own margin keys the item's memo and not the content's, so a
  // narrower second tree walks the item again but only reads the content.
  YGNodeRef rootCopy = YGNodeClone(root);
  YGNodeStyleSetWidth(rootCopy, 290);
  YGNodeCalculateLayout(rootCopy, YGUndefined, YGUndefined, YGDirectionLTR);

  EXPECT_EQ(content, YGNodeGetChild(YGNodeGetChild(rootCopy, 0), 0));
  EXPECT_EQ(
      leaf, YGNodeGetChild(YGNodeGetChild(YGNodeGetChild(rootCopy, 0), 0), 0));

  freeTreesSharingNodes({rootCopy, root});
  YGConfigFree(config);
}

TEST(MinContentTest, testWalkClonesOnlyTheChildrenItWritesTo) {
  YGConfigRef config = autoMinSizeConfig();
  MeasureCalls paddedCalls;
  MeasureCalls stableCalls;
  YGNodeRef root = YGNodeNewWithConfig(config);
  YGNodeStyleSetAlignItems(root, YGAlignFlexStart);
  YGNodeStyleSetWidth(root, 300);
  YGNodeStyleSetHeight(root, 100);
  YGNodeRef item = YGNodeNewWithConfig(config);
  YGNodeStyleSetWidth(item, 50);
  YGNodeStyleSetHeight(item, 200);
  YGNodeStyleSetFlexShrink(item, 1);
  YGNodeInsertChild(root, item, 0);
  YGNodeRef padded = YGNodeNewWithConfig(config);
  YGNodeStyleSetPaddingPercent(padded, YGEdgeLeft, 10);
  YGNodeRef paddedLeaf = measuredLeaf(config, &paddedCalls);
  YGNodeInsertChild(padded, paddedLeaf, 0);
  YGNodeInsertChild(item, padded, 0);
  YGNodeRef stable = measuredLeaf(config, &stableCalls);
  YGNodeInsertChild(item, stable, 1);
  YGNodeRef hidden = YGNodeNewWithConfig(config);
  YGNodeStyleSetDisplay(hidden, YGDisplayNone);
  YGNodeInsertChild(item, hidden, 2);
  YGNodeRef absolute = YGNodeNewWithConfig(config);
  YGNodeStyleSetPositionType(absolute, YGPositionTypeAbsolute);
  YGNodeInsertChild(item, absolute, 3);
  YGNodeRef staticLeaf = YGNodeNewWithConfig(config);
  YGNodeSetMeasureFunc(staticLeaf, measureUncounted);
  YGNodeSetMinContentWidth(staticLeaf, 20);
  YGNodeSetMinContentHeight(staticLeaf, 5);
  YGNodeInsertChild(item, staticLeaf, 4);
  YGNodeRef empty = YGNodeNewWithConfig(config);
  YGNodeInsertChild(item, empty, 5);
  YGNodeRef sibling = YGNodeNewWithConfig(config);
  YGNodeStyleSetHeight(sibling, 200);
  YGNodeStyleSetFlexShrink(sibling, 1);
  YGNodeInsertChild(root, sibling, 1);
  YGNodeCalculateLayout(root, YGUndefined, YGUndefined, YGDirectionLTR);

  // Only `padded`'s memo is keyed on the width, so a narrower second tree walks
  // it again and only reads the item's other children and `padded`'s leaf.
  YGNodeRef rootCopy = YGNodeClone(root);
  YGNodeStyleSetWidth(rootCopy, 290);
  YGNodeCalculateLayout(rootCopy, YGUndefined, YGUndefined, YGDirectionLTR);

  const YGNodeRef itemCopy = YGNodeGetChild(rootCopy, 0);
  EXPECT_NE(padded, YGNodeGetChild(itemCopy, 0));
  EXPECT_EQ(paddedLeaf, YGNodeGetChild(YGNodeGetChild(itemCopy, 0), 0));
  EXPECT_EQ(stable, YGNodeGetChild(itemCopy, 1));
  EXPECT_EQ(hidden, YGNodeGetChild(itemCopy, 2));
  EXPECT_EQ(absolute, YGNodeGetChild(itemCopy, 3));
  EXPECT_EQ(staticLeaf, YGNodeGetChild(itemCopy, 4));
  EXPECT_EQ(empty, YGNodeGetChild(itemCopy, 5));

  freeTreesSharingNodes({rootCopy, root});
  YGConfigFree(config);
}

TEST(MinContentTest, testWalkMeasuresOnTheCloneOnlyTheAxisItCannotRead) {
  YGConfigRef config = autoMinSizeConfig();
  MeasureCalls minContentCalls;
  YGNodeRef root = YGNodeNewWithConfig(config);
  YGNodeStyleSetWidth(root, 100);
  YGNodeStyleSetHeight(root, 100);
  YGNodeRef item = YGNodeNewWithConfig(config);
  YGNodeStyleSetFlexDirection(item, YGFlexDirectionRow);
  YGNodeStyleSetHeight(item, 30);
  YGNodeStyleSetMinHeight(item, 0);
  YGNodeStyleSetFlexGrow(item, 1);
  YGNodeInsertChild(root, item, 0);
  // The walk reads the leaf's static min-content width and has to measure its
  // min-content height, which a row item's height is the maximum of.
  YGNodeRef leaf = YGNodeNewWithConfig(config);
  YGNodeSetMeasureFunc(leaf, measureUncounted);
  YGNodeSetMinContentMeasureFunc(leaf, measureWord);
  YGNodeSetContext(leaf, &minContentCalls);
  minContentCalls.original = leaf;
  YGNodeSetMinContentWidth(leaf, 20);
  YGNodeInsertChild(item, leaf, 0);
  YGNodeCalculateLayout(root, YGUndefined, YGUndefined, YGDirectionLTR);

  // A second tree shares the leaf, under a copy of the item that drops its
  // minimum height, so the walk first reaches the leaf in that tree.
  YGNodeRef rootCopy = YGNodeClone(root);
  YGNodeRef itemCopy = YGNodeClone(item);
  YGNodeSwapChild(rootCopy, itemCopy, 0);
  YGNodeStyleSetMinHeight(itemCopy, YGUndefined);
  YGNodeCalculateLayout(rootCopy, YGUndefined, YGUndefined, YGDirectionLTR);

  EXPECT_EQ(0, minContentCalls.ofOriginal);
  EXPECT_EQ(1, minContentCalls.ofCopies);

  freeTreesSharingNodes({rootCopy, root});
  YGConfigFree(config);
}

TEST(MinContentTest, testLayoutWhereGenerationWrapsMeasuresAsAnyOther) {
  YGConfigRef config = autoMinSizeConfig();
  const auto layOutNestedRow = [config](MeasureCalls* calls) {
    YGNodeRef root = YGNodeNewWithConfig(config);
    YGNodeStyleSetFlexDirection(root, YGFlexDirectionRow);
    YGNodeStyleSetWidth(root, 100);
    YGNodeStyleSetHeight(root, 50);
    YGNodeRef item = YGNodeNewWithConfig(config);
    YGNodeStyleSetFlexBasis(item, 100);
    YGNodeStyleSetFlexShrink(item, 1);
    YGNodeInsertChild(root, item, 0);
    YGNodeRef container = item;
    for (int depth = 0; depth < 4; depth++) {
      YGNodeRef child = YGNodeNewWithConfig(config);
      YGNodeInsertChild(container, child, 0);
      container = child;
    }
    YGNodeInsertChild(container, measuredLeaf(config, calls), 0);
    YGNodeRef sibling = YGNodeNewWithConfig(config);
    YGNodeStyleSetFlexBasis(sibling, 300);
    YGNodeStyleSetFlexShrink(sibling, 1);
    YGNodeInsertChild(root, sibling, 1);
    YGNodeCalculateLayout(root, YGUndefined, YGUndefined, YGDirectionLTR);
    const float itemWidth = YGNodeLayoutGetWidth(item);
    YGNodeFreeRecursive(root);
    return itemWidth;
  };
  MeasureCalls before;
  ASSERT_FLOAT_EQ(30.0f, layOutNestedRow(&before));

  gCurrentGenerationCount = std::numeric_limits<uint32_t>::max();
  MeasureCalls atWrap;
  const float itemWidthAtWrap = layOutNestedRow(&atWrap);

  EXPECT_FLOAT_EQ(30.0f, itemWidthAtWrap);
  EXPECT_EQ(before.ofOriginal, atWrap.ofOriginal);

  YGConfigFree(config);
}

} // namespace
} // namespace facebook::yoga

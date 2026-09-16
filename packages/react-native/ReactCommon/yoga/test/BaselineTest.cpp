/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <yoga/Yoga.h>
#include <yoga/algorithm/Baseline.h>
#include <yoga/enums/Align.h>
#include <yoga/enums/Dimension.h>
#include <yoga/enums/FlexDirection.h>
#include <yoga/enums/PhysicalEdge.h>
#include <yoga/enums/PositionType.h>
#include <yoga/node/Node.h>

namespace facebook::yoga {
namespace {

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

} // namespace
} // namespace facebook::yoga

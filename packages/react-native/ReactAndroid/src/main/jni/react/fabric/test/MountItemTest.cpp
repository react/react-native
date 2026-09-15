/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/fabric/MountItem.h>

#include <gtest/gtest.h>

namespace facebook::react {

namespace {

ShadowView
makeShadowView(ComponentName componentName, SurfaceId surfaceId, Tag tag) {
  auto shadowView = ShadowView{};
  shadowView.componentName = componentName;
  shadowView.surfaceId = surfaceId;
  shadowView.tag = tag;
  return shadowView;
}

void expectSameShadowViewIdentity(
    const ShadowView& expected,
    const ShadowView& actual) {
  EXPECT_EQ(expected.componentName, actual.componentName);
  EXPECT_EQ(expected.surfaceId, actual.surfaceId);
  EXPECT_EQ(expected.tag, actual.tag);
}

void expectEmptyShadowView(const ShadowView& shadowView) {
  EXPECT_EQ(nullptr, shadowView.componentName);
  EXPECT_EQ(SurfaceId{}, shadowView.surfaceId);
  EXPECT_EQ(Tag{}, shadowView.tag);
}

} // namespace

class MountItemTest : public ::testing::Test {};

TEST_F(MountItemTest, testCreateAndDeleteUseOppositeShadowViewSlots) {
  const auto shadowView = makeShadowView("View", /*surfaceId=*/11, /*tag=*/101);

  const auto createItem = CppMountItem::CreateMountItem(shadowView);
  const auto deleteItem = CppMountItem::DeleteMountItem(shadowView);

  EXPECT_EQ(CppMountItem::Type::Create, createItem.type);
  expectSameShadowViewIdentity(shadowView, createItem.newChildShadowView);
  expectEmptyShadowView(createItem.oldChildShadowView);
  EXPECT_EQ(-1, createItem.index);

  EXPECT_EQ(CppMountItem::Type::Delete, deleteItem.type);
  expectSameShadowViewIdentity(shadowView, deleteItem.oldChildShadowView);
  expectEmptyShadowView(deleteItem.newChildShadowView);
  EXPECT_EQ(-1, deleteItem.index);
}

TEST_F(MountItemTest, testInsertAndRemovePreserveParentIndexAndChildSlot) {
  constexpr Tag kParentTag = 501;
  constexpr int kIndex = 3;
  const auto shadowView = makeShadowView("Text", /*surfaceId=*/22, /*tag=*/202);

  const auto insertItem =
      CppMountItem::InsertMountItem(kParentTag, shadowView, kIndex);
  const auto removeItem =
      CppMountItem::RemoveMountItem(kParentTag, shadowView, kIndex);

  EXPECT_EQ(CppMountItem::Type::Insert, insertItem.type);
  EXPECT_EQ(kParentTag, insertItem.parentTag);
  EXPECT_EQ(kIndex, insertItem.index);
  expectSameShadowViewIdentity(shadowView, insertItem.newChildShadowView);
  expectEmptyShadowView(insertItem.oldChildShadowView);

  EXPECT_EQ(CppMountItem::Type::Remove, removeItem.type);
  EXPECT_EQ(kParentTag, removeItem.parentTag);
  EXPECT_EQ(kIndex, removeItem.index);
  expectSameShadowViewIdentity(shadowView, removeItem.oldChildShadowView);
  expectEmptyShadowView(removeItem.newChildShadowView);
}

TEST_F(MountItemTest, testUpdatePropsPreservesOldAndNewShadowViews) {
  const auto oldShadowView =
      makeShadowView("RawText", /*surfaceId=*/33, /*tag=*/303);
  const auto newShadowView =
      makeShadowView("RawText", /*surfaceId=*/33, /*tag=*/404);

  const auto item =
      CppMountItem::UpdatePropsMountItem(oldShadowView, newShadowView);

  EXPECT_EQ(CppMountItem::Type::UpdateProps, item.type);
  expectSameShadowViewIdentity(oldShadowView, item.oldChildShadowView);
  expectSameShadowViewIdentity(newShadowView, item.newChildShadowView);
  EXPECT_EQ(-1, item.index);
}

TEST_F(MountItemTest, testUpdateLayoutPreservesParentTagWithShadowView) {
  constexpr Tag kParentTag = 604;
  const auto shadowView =
      makeShadowView("ScrollView", /*surfaceId=*/44, /*tag=*/404);

  const auto item = CppMountItem::UpdateLayoutMountItem(shadowView, kParentTag);

  EXPECT_EQ(CppMountItem::Type::UpdateLayout, item.type);
  EXPECT_EQ(kParentTag, item.parentTag);
  expectSameShadowViewIdentity(shadowView, item.newChildShadowView);
  expectEmptyShadowView(item.oldChildShadowView);
  EXPECT_EQ(-1, item.index);
}

TEST_F(MountItemTest, testNonLayoutUpdatesTargetNewShadowViewOnly) {
  const auto shadowView =
      makeShadowView("Image", /*surfaceId=*/55, /*tag=*/505);

  const auto stateItem = CppMountItem::UpdateStateMountItem(shadowView);
  const auto eventEmitterItem =
      CppMountItem::UpdateEventEmitterMountItem(shadowView);
  const auto paddingItem = CppMountItem::UpdatePaddingMountItem(shadowView);
  const auto overflowInsetItem =
      CppMountItem::UpdateOverflowInsetMountItem(shadowView);

  EXPECT_EQ(CppMountItem::Type::UpdateState, stateItem.type);
  expectSameShadowViewIdentity(shadowView, stateItem.newChildShadowView);
  expectEmptyShadowView(stateItem.oldChildShadowView);

  EXPECT_EQ(CppMountItem::Type::UpdateEventEmitter, eventEmitterItem.type);
  expectSameShadowViewIdentity(shadowView, eventEmitterItem.newChildShadowView);
  expectEmptyShadowView(eventEmitterItem.oldChildShadowView);

  EXPECT_EQ(CppMountItem::Type::UpdatePadding, paddingItem.type);
  expectSameShadowViewIdentity(shadowView, paddingItem.newChildShadowView);
  expectEmptyShadowView(paddingItem.oldChildShadowView);

  EXPECT_EQ(CppMountItem::Type::UpdateOverflowInset, overflowInsetItem.type);
  expectSameShadowViewIdentity(
      shadowView, overflowInsetItem.newChildShadowView);
  expectEmptyShadowView(overflowInsetItem.oldChildShadowView);
}

} // namespace facebook::react

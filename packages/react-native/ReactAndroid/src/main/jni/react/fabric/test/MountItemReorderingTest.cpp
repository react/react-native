/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/fabric/MountItemReordering.h>
#include <react/renderer/mounting/MountingTransaction.h>

#include <gtest/gtest.h>

namespace facebook::react {
namespace {

ShadowView viewWithTag(Tag tag) {
  ShadowView view;
  view.tag = tag;
  view.layoutMetrics.frame.size = {100, 100};
  return view;
}

} // namespace

TEST(MountItemReorderingTest, emptyAndUpdateOnlyBatchesCanBeReordered) {
  EXPECT_FALSE(requiresStrictMountItemOrder({}));
  auto view = viewWithTag(42);
  EXPECT_FALSE(requiresStrictMountItemOrder(
      {ShadowViewMutation::UpdateMutation(view, view, 1)}));
}

TEST(MountItemReorderingTest, distinctLifetimesCanBeReordered) {
  EXPECT_FALSE(requiresStrictMountItemOrder(
      {ShadowViewMutation::DeleteMutation(viewWithTag(42)),
       ShadowViewMutation::CreateMutation(viewWithTag(43))}));
}

TEST(MountItemReorderingTest, deletionOnlyBatchesCanBeReordered) {
  EXPECT_FALSE(requiresStrictMountItemOrder(
      {ShadowViewMutation::DeleteMutation(viewWithTag(42)),
       ShadowViewMutation::DeleteMutation(viewWithTag(43))}));
}

TEST(MountItemReorderingTest, creationBeforeFinalDeletionCanBeReordered) {
  auto view = viewWithTag(42);
  EXPECT_FALSE(requiresStrictMountItemOrder(
      {ShadowViewMutation::CreateMutation(view),
       ShadowViewMutation::DeleteMutation(view)}));
}

TEST(MountItemReorderingTest, reparentingWithoutDeletionCanBeReordered) {
  auto view = viewWithTag(42);
  EXPECT_FALSE(requiresStrictMountItemOrder(
      {ShadowViewMutation::RemoveMutation(1, view, 0),
       ShadowViewMutation::InsertMutation(2, view, 0)}));
}

TEST(MountItemReorderingTest, recreationRequiresOriginalOrder) {
  auto view = viewWithTag(42);
  EXPECT_TRUE(requiresStrictMountItemOrder(
      {ShadowViewMutation::DeleteMutation(view),
       ShadowViewMutation::CreateMutation(view)}));
}

TEST(MountItemReorderingTest, virtualViewRecreationRequiresOriginalOrder) {
  auto view = viewWithTag(42);
  view.layoutMetrics = EmptyLayoutMetrics;
  EXPECT_TRUE(requiresStrictMountItemOrder(
      {ShadowViewMutation::DeleteMutation(view),
       ShadowViewMutation::CreateMutation(view)}));
}

TEST(MountItemReorderingTest, multipleLifetimesRequireOriginalOrder) {
  auto view = viewWithTag(42);
  EXPECT_TRUE(requiresStrictMountItemOrder(
      {ShadowViewMutation::CreateMutation(view),
       ShadowViewMutation::DeleteMutation(view),
       ShadowViewMutation::CreateMutation(view),
       ShadowViewMutation::DeleteMutation(view)}));
}

TEST(MountItemReorderingTest, interleavedTagsDoNotHideRecreation) {
  EXPECT_TRUE(requiresStrictMountItemOrder(
      {ShadowViewMutation::DeleteMutation(viewWithTag(42)),
       ShadowViewMutation::DeleteMutation(viewWithTag(43)),
       ShadowViewMutation::CreateMutation(viewWithTag(44)),
       ShadowViewMutation::CreateMutation(viewWithTag(42))}));
}

TEST(MountItemReorderingTest, mergedTransactionsRetainLifetimeBoundaries) {
  auto oldView = viewWithTag(42);
  auto newView = viewWithTag(42);
  newView.layoutMetrics.frame.size = {100, 100};
  MountingTransaction transaction{
      1,
      1,
      {ShadowViewMutation::UpdateMutation(oldView, oldView, 1),
       ShadowViewMutation::RemoveMutation(1, oldView, 0),
       ShadowViewMutation::DeleteMutation(oldView)},
      TransactionTelemetry{}};
  transaction.mergeWith(
      MountingTransaction{
          1,
          2,
          {ShadowViewMutation::CreateMutation(newView),
           ShadowViewMutation::InsertMutation(1, newView, 0),
           ShadowViewMutation::UpdateMutation(newView, newView, 1)},
          TransactionTelemetry{}});

  EXPECT_TRUE(requiresStrictMountItemOrder(transaction.getMutations()));
}

} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <react/renderer/mounting/MountingTransaction.h>
#include <react/renderer/mounting/ShadowView.h>
#include <react/renderer/mounting/ShadowViewMutation.h>
#include <react/renderer/telemetry/TransactionTelemetry.h>

namespace facebook::react {

namespace {

ShadowView makeShadowView(Tag tag) {
  ShadowView view;
  view.tag = tag;
  return view;
}

MountingTransaction makeTransaction(
    SurfaceId surfaceId,
    MountingTransaction::Number number,
    const std::vector<Tag>& createTags,
    int telemetryRevision = 0) {
  ShadowViewMutationList mutations;
  mutations.reserve(createTags.size());
  for (auto tag : createTags) {
    mutations.push_back(
        ShadowViewMutation::CreateMutation(makeShadowView(tag)));
  }
  TransactionTelemetry telemetry;
  telemetry.setRevisionNumber(telemetryRevision);
  return MountingTransaction{
      surfaceId, number, std::move(mutations), std::move(telemetry)};
}

} // namespace

// Verifies that `mergeWith` concatenates mutations from the incoming
// transaction after the existing ones, preserving relative order across both.
// Catches regressions where the merged list is reversed, overwrites the
// original, or drops mutations from either side.
TEST(MountingTransactionTest, testMergeWithAppendsMutationsInOrder) {
  auto transaction = makeTransaction(
      /* surfaceId */ 1, /* number */ 1, /* tags */ {10, 11});
  auto incoming = makeTransaction(
      /* surfaceId */ 1, /* number */ 2, /* tags */ {20, 21, 22});

  transaction.mergeWith(std::move(incoming));

  const auto& merged = transaction.getMutations();
  ASSERT_EQ(merged.size(), 5u);
  EXPECT_EQ(merged[0].newChildShadowView.tag, 10);
  EXPECT_EQ(merged[1].newChildShadowView.tag, 11);
  EXPECT_EQ(merged[2].newChildShadowView.tag, 20);
  EXPECT_EQ(merged[3].newChildShadowView.tag, 21);
  EXPECT_EQ(merged[4].newChildShadowView.tag, 22);
}

// Verifies that `mergeWith` advances `number` to that of the incoming
// transaction while leaving `surfaceId` untouched. Catches regressions where
// the number is not updated or the surfaceId is accidentally overwritten.
TEST(MountingTransactionTest, testMergeWithUpdatesNumberButPreservesSurfaceId) {
  auto transaction = makeTransaction(
      /* surfaceId */ 7, /* number */ 3, /* tags */ {100});
  auto incoming = makeTransaction(
      /* surfaceId */ 7, /* number */ 42, /* tags */ {200});

  transaction.mergeWith(std::move(incoming));

  EXPECT_EQ(transaction.getSurfaceId(), 7);
  EXPECT_EQ(transaction.getNumber(), 42);
}

// Verifies that `mergeWith` replaces the existing telemetry with that of the
// incoming transaction (per the documented "use the latest instance"
// behavior). We use a distinguishing revision number so the assertion checks a
// computed value rather than restating a source constant.
TEST(MountingTransactionTest, testMergeWithAdoptsIncomingTelemetry) {
  auto transaction = makeTransaction(
      /* surfaceId */ 1,
      /* number */ 1,
      /* tags */ {},
      /* telemetryRevision */ 5);
  auto incoming = makeTransaction(
      /* surfaceId */ 1,
      /* number */ 2,
      /* tags */ {},
      /* telemetryRevision */ 99);

  transaction.mergeWith(std::move(incoming));

  EXPECT_EQ(transaction.getTelemetry().getRevisionNumber(), 99);
}

// Verifies that merging an empty incoming transaction is a no-op for the
// mutation list — the existing mutations remain intact, just with the number
// bumped. Guards against a naive `= std::move(other.mutations_)` implementation
// that would clobber the original list.
TEST(
    MountingTransactionTest,
    testMergeWithEmptyIncomingPreservesOriginalMutations) {
  auto transaction = makeTransaction(
      /* surfaceId */ 1, /* number */ 1, /* tags */ {10, 11, 12});
  auto incoming = makeTransaction(
      /* surfaceId */ 1, /* number */ 2, /* tags */ {});

  transaction.mergeWith(std::move(incoming));

  const auto& merged = transaction.getMutations();
  ASSERT_EQ(merged.size(), 3u);
  EXPECT_EQ(merged[0].newChildShadowView.tag, 10);
  EXPECT_EQ(merged[1].newChildShadowView.tag, 11);
  EXPECT_EQ(merged[2].newChildShadowView.tag, 12);
  EXPECT_EQ(transaction.getNumber(), 2);
}

} // namespace facebook::react

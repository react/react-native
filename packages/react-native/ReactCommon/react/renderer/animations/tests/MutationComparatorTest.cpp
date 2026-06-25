/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <algorithm>
#include <vector>

#include <gtest/gtest.h>

#include <react/renderer/animations/utils.h>
#include <react/renderer/mounting/ShadowViewMutation.h>

namespace facebook::react {

namespace {

ShadowView makeShadowView(Tag tag) {
  ShadowView sv{};
  sv.tag = tag;
  return sv;
}

} // namespace

// Verify strict weak ordering: irreflexivity
// comp(a, a) must be false
TEST(MutationComparatorTest, Irreflexivity) {
  auto sv1 = makeShadowView(1);
  auto sv2 = makeShadowView(2);

  // Same-type mutations where the fallback path is exercised
  auto update1 = ShadowViewMutation::UpdateMutation(sv1, sv2, /*parentTag=*/10);
  EXPECT_FALSE(shouldFirstComeBeforeSecondMutation(update1, update1));

  auto create1 = ShadowViewMutation::CreateMutation(sv1);
  EXPECT_FALSE(shouldFirstComeBeforeSecondMutation(create1, create1));

  auto insert1 =
      ShadowViewMutation::InsertMutation(/*parentTag=*/10, sv1, /*index=*/0);
  EXPECT_FALSE(shouldFirstComeBeforeSecondMutation(insert1, insert1));

  auto remove1 =
      ShadowViewMutation::RemoveMutation(/*parentTag=*/10, sv1, /*index=*/0);
  EXPECT_FALSE(shouldFirstComeBeforeSecondMutation(remove1, remove1));

  auto del1 = ShadowViewMutation::DeleteMutation(sv1);
  EXPECT_FALSE(shouldFirstComeBeforeSecondMutation(del1, del1));
}

// Verify strict weak ordering: asymmetry
// If comp(a, b) then !comp(b, a)
TEST(MutationComparatorTest, Asymmetry) {
  auto sv1 = makeShadowView(1);
  auto sv2 = makeShadowView(2);
  auto sv3 = makeShadowView(3);

  // Two updates with same type but different parentTags (fallback path)
  auto update1 = ShadowViewMutation::UpdateMutation(sv1, sv2, /*parentTag=*/10);
  auto update2 = ShadowViewMutation::UpdateMutation(sv1, sv3, /*parentTag=*/20);

  bool a_before_b = shouldFirstComeBeforeSecondMutation(update1, update2);
  bool b_before_a = shouldFirstComeBeforeSecondMutation(update2, update1);

  // Exactly one must be true (asymmetry)
  EXPECT_NE(a_before_b, b_before_a);
}

// Verify strict weak ordering: transitivity
// If comp(a, b) and comp(b, c) then comp(a, c)
TEST(MutationComparatorTest, Transitivity) {
  auto sv1 = makeShadowView(1);
  auto sv2 = makeShadowView(2);
  auto sv3 = makeShadowView(3);

  auto update1 = ShadowViewMutation::UpdateMutation(sv1, sv1, /*parentTag=*/10);
  auto update2 = ShadowViewMutation::UpdateMutation(sv1, sv1, /*parentTag=*/20);
  auto update3 = ShadowViewMutation::UpdateMutation(sv1, sv1, /*parentTag=*/30);

  bool a_b = shouldFirstComeBeforeSecondMutation(update1, update2);
  bool b_c = shouldFirstComeBeforeSecondMutation(update2, update3);
  bool a_c = shouldFirstComeBeforeSecondMutation(update1, update3);

  if (a_b && b_c) {
    EXPECT_TRUE(a_c) << "Transitivity violated: a<b and b<c but not a<c";
  }
}

// Verify type-based ordering rules
TEST(MutationComparatorTest, TypeOrdering) {
  auto sv1 = makeShadowView(1);
  auto sv2 = makeShadowView(2);

  auto create = ShadowViewMutation::CreateMutation(sv1);
  auto insert =
      ShadowViewMutation::InsertMutation(/*parentTag=*/10, sv1, /*index=*/0);
  auto remove =
      ShadowViewMutation::RemoveMutation(/*parentTag=*/10, sv1, /*index=*/0);
  auto update = ShadowViewMutation::UpdateMutation(sv1, sv2, /*parentTag=*/10);
  auto del = ShadowViewMutation::DeleteMutation(sv1);

  // Delete always comes last
  EXPECT_FALSE(shouldFirstComeBeforeSecondMutation(del, create));
  EXPECT_FALSE(shouldFirstComeBeforeSecondMutation(del, insert));
  EXPECT_FALSE(shouldFirstComeBeforeSecondMutation(del, remove));
  EXPECT_TRUE(shouldFirstComeBeforeSecondMutation(create, del));
  EXPECT_TRUE(shouldFirstComeBeforeSecondMutation(insert, del));
  EXPECT_TRUE(shouldFirstComeBeforeSecondMutation(remove, del));

  // Remove comes before Insert
  EXPECT_TRUE(shouldFirstComeBeforeSecondMutation(remove, insert));
  EXPECT_FALSE(shouldFirstComeBeforeSecondMutation(insert, remove));

  // Create comes before Insert
  EXPECT_TRUE(shouldFirstComeBeforeSecondMutation(create, insert));
  EXPECT_FALSE(shouldFirstComeBeforeSecondMutation(insert, create));

  // Remove comes before Update
  EXPECT_TRUE(shouldFirstComeBeforeSecondMutation(remove, update));
  EXPECT_FALSE(shouldFirstComeBeforeSecondMutation(update, remove));
}

// Verify removes on same parent are sorted by descending index
TEST(MutationComparatorTest, RemovesSameParentDescendingIndex) {
  auto sv1 = makeShadowView(1);
  auto sv2 = makeShadowView(2);

  auto remove_idx0 =
      ShadowViewMutation::RemoveMutation(/*parentTag=*/10, sv1, /*index=*/0);
  auto remove_idx5 =
      ShadowViewMutation::RemoveMutation(/*parentTag=*/10, sv2, /*index=*/5);

  // Higher index should come first
  EXPECT_TRUE(shouldFirstComeBeforeSecondMutation(remove_idx5, remove_idx0));
  EXPECT_FALSE(shouldFirstComeBeforeSecondMutation(remove_idx0, remove_idx5));
}

// Verify the deterministic fallback uses parentTag, then child tags
TEST(MutationComparatorTest, DeterministicFallbackByParentTag) {
  auto sv1 = makeShadowView(1);
  auto sv2 = makeShadowView(2);

  // Two updates with same type, different parentTags
  auto update_p10 =
      ShadowViewMutation::UpdateMutation(sv1, sv2, /*parentTag=*/10);
  auto update_p20 =
      ShadowViewMutation::UpdateMutation(sv1, sv2, /*parentTag=*/20);

  // Lower parentTag comes first
  EXPECT_TRUE(shouldFirstComeBeforeSecondMutation(update_p10, update_p20));
  EXPECT_FALSE(shouldFirstComeBeforeSecondMutation(update_p20, update_p10));
}

TEST(MutationComparatorTest, DeterministicFallbackByNewChildTag) {
  auto sv1 = makeShadowView(1);
  auto sv2 = makeShadowView(2);
  auto sv3 = makeShadowView(3);

  // Same parentTag, different newChildShadowView tags
  auto update_new2 =
      ShadowViewMutation::UpdateMutation(sv1, sv2, /*parentTag=*/10);
  auto update_new3 =
      ShadowViewMutation::UpdateMutation(sv1, sv3, /*parentTag=*/10);

  EXPECT_TRUE(shouldFirstComeBeforeSecondMutation(update_new2, update_new3));
  EXPECT_FALSE(shouldFirstComeBeforeSecondMutation(update_new3, update_new2));
}

TEST(MutationComparatorTest, DeterministicFallbackByOldChildTag) {
  auto sv1 = makeShadowView(1);
  auto sv2 = makeShadowView(2);
  auto sv3 = makeShadowView(3);

  // Same parentTag, same newChildShadowView tag, different oldChildShadowView
  // tags
  auto update_old1 =
      ShadowViewMutation::UpdateMutation(sv1, sv3, /*parentTag=*/10);
  auto update_old2 =
      ShadowViewMutation::UpdateMutation(sv2, sv3, /*parentTag=*/10);

  EXPECT_TRUE(shouldFirstComeBeforeSecondMutation(update_old1, update_old2));
  EXPECT_FALSE(shouldFirstComeBeforeSecondMutation(update_old2, update_old1));
}

// Verify equal mutations return false (stability)
TEST(MutationComparatorTest, EqualMutationsReturnFalse) {
  auto sv1 = makeShadowView(1);
  auto sv2 = makeShadowView(2);

  auto update_a =
      ShadowViewMutation::UpdateMutation(sv1, sv2, /*parentTag=*/10);
  auto update_b =
      ShadowViewMutation::UpdateMutation(sv1, sv2, /*parentTag=*/10);

  // Two mutations with identical properties should return false (not less-than)
  EXPECT_FALSE(shouldFirstComeBeforeSecondMutation(update_a, update_b));
  EXPECT_FALSE(shouldFirstComeBeforeSecondMutation(update_b, update_a));
}

// Verify std::stable_sort doesn't crash with the comparator
// (the original bug was a SIGSEGV during sort)
TEST(MutationComparatorTest, StableSortDoesNotCrash) {
  ShadowViewMutation::List mutations;

  // Build a list with various mutation types and properties
  for (int parent = 0; parent < 5; parent++) {
    for (int child = 0; child < 10; child++) {
      auto sv_old = makeShadowView(child);
      auto sv_new = makeShadowView(child + 100);

      mutations.push_back(
          ShadowViewMutation::UpdateMutation(
              sv_old, sv_new, /*parentTag=*/parent));
      mutations.push_back(
          ShadowViewMutation::InsertMutation(
              /*parentTag=*/parent, sv_new, /*index=*/child));
      mutations.push_back(
          ShadowViewMutation::RemoveMutation(
              /*parentTag=*/parent, sv_old, /*index=*/child));
    }
  }
  mutations.push_back(ShadowViewMutation::CreateMutation(makeShadowView(999)));
  mutations.push_back(ShadowViewMutation::DeleteMutation(makeShadowView(998)));

  // This should not crash (the original bug was SIGSEGV here)
  EXPECT_NO_FATAL_FAILURE(
      std::stable_sort(
          mutations.begin(),
          mutations.end(),
          &shouldFirstComeBeforeSecondMutation));

  // Verify ordering invariants after sort
  bool seen_delete = false;
  for (const auto& m : mutations) {
    if (m.type == ShadowViewMutation::Type::Delete) {
      seen_delete = true;
    } else if (seen_delete) {
      FAIL() << "Non-delete mutation found after a delete mutation";
    }
  }
}

// Stress test: sort a large list of mutations with duplicates
TEST(MutationComparatorTest, StableSortLargeListWithDuplicates) {
  ShadowViewMutation::List mutations;

  // Create many mutations with overlapping properties to stress the comparator
  for (int i = 0; i < 200; i++) {
    auto sv = makeShadowView(i % 10); // Deliberately create duplicates
    auto sv2 = makeShadowView((i + 1) % 10);
    int parent = i % 5;

    mutations.push_back(ShadowViewMutation::UpdateMutation(sv, sv2, parent));
    if (i % 3 == 0) {
      mutations.push_back(
          ShadowViewMutation::InsertMutation(parent, sv, i % 20));
    }
    if (i % 4 == 0) {
      mutations.push_back(
          ShadowViewMutation::RemoveMutation(parent, sv, i % 20));
    }
  }

  EXPECT_NO_FATAL_FAILURE(
      std::stable_sort(
          mutations.begin(),
          mutations.end(),
          &shouldFirstComeBeforeSecondMutation));
}

} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <algorithm>
#include <type_traits>
#include <vector>

#include "../PerformanceEntry.h"

using namespace facebook::react;

// Verify that PerformanceEntrySorter::operator() is const-qualified.
// Without const, std::stable_sort may fail to compile on toolchains where
// the comparator is passed through a const-qualified code path (e.g.
// libc++ __insertion_sort on NDK 19.x), causing SIGSEGV at runtime on
// others. See T263807207.
TEST(PerformanceEntry, SorterOperatorIsConst) {
  static_assert(
      std::is_invocable_v<
          const PerformanceEntrySorter,
          const PerformanceEntry&,
          const PerformanceEntry&>,
      "PerformanceEntrySorter::operator() must be const-qualified");
}

TEST(PerformanceEntry, SortEntriesByStartTimeThenDuration) {
  auto t0 = HighResTimeStamp::now();
  auto t1 = t0 + HighResDuration::fromMilliseconds(1);
  auto t2 = t0 + HighResDuration::fromMilliseconds(2);

  std::vector<PerformanceEntry> entries = {
      PerformanceMark{{.name = "c", .startTime = t2}},
      PerformanceMark{{.name = "a", .startTime = t0}},
      PerformanceMeasure{
          {.name = "b",
           .startTime = t0,
           .duration = HighResDuration::fromMilliseconds(5)}},
      PerformanceMark{
          {.name = "d", .startTime = t1, .duration = HighResDuration::zero()}},
  };

  std::stable_sort(entries.begin(), entries.end(), PerformanceEntrySorter{});

  // Entries with same startTime are ordered by duration (ascending).
  // "a" (t0, dur=0) < "b" (t0, dur=5) < "d" (t1, dur=0) < "c" (t2, dur=0)
  ASSERT_EQ(4, entries.size());

  auto getName = [](const PerformanceEntry& e) {
    return std::visit([](const auto& x) { return x.name; }, e);
  };

  EXPECT_EQ("a", getName(entries[0]));
  EXPECT_EQ("b", getName(entries[1]));
  EXPECT_EQ("d", getName(entries[2]));
  EXPECT_EQ("c", getName(entries[3]));
}

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <jsinspector-modern/WeakList.h>

#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include <vector>

using namespace ::testing;

namespace facebook::react::jsinspector_modern {

TEST(WeakListTest, Size) {
  WeakList<int> list;
  EXPECT_EQ(list.size(), 0);

  auto p1 = std::make_shared<int>(1);
  list.insert(p1);
  EXPECT_EQ(list.size(), 1);

  auto p2 = std::make_shared<int>(2);
  list.insert(p2);
  EXPECT_EQ(list.size(), 2);

  p1.reset();
  EXPECT_EQ(list.size(), 1);

  p2.reset();
  EXPECT_EQ(list.size(), 0);
}

TEST(WeakListTest, Empty) {
  WeakList<int> list;
  EXPECT_EQ(list.empty(), true);

  auto p1 = std::make_shared<int>(1);
  list.insert(p1);
  EXPECT_EQ(list.empty(), false);

  auto p2 = std::make_shared<int>(2);
  list.insert(p2);
  EXPECT_EQ(list.empty(), false);

  p1.reset();
  EXPECT_EQ(list.empty(), false);

  p2.reset();
  EXPECT_EQ(list.empty(), true);
}

TEST(WeakListTest, ForEach) {
  WeakList<int> list;
  auto p1 = std::make_shared<int>(1);
  list.insert(p1);
  auto p2 = std::make_shared<int>(2);
  list.insert(p2);
  auto p3 = std::make_shared<int>(3);
  list.insert(p3);

  p2.reset();

  std::vector<int> visited;
  list.forEach([&visited](const int& value) { visited.push_back(value); });
  EXPECT_THAT(visited, ElementsAre(1, 3));
}

TEST(WeakListTest, ElementsAreAliveDuringForEachCallback) {
  WeakList<int> list;
  auto p1 = std::make_shared<int>(1);
  // A separate weak_ptr to observe the lifetime of `p1`.
  std::weak_ptr wp1 = p1;
  list.insert(p1);

  std::vector<int> visited;
  list.forEach([&](const int& value) {
    p1.reset();
    EXPECT_FALSE(wp1.expired());
    visited.push_back(value);
  });

  EXPECT_TRUE(wp1.expired());
  EXPECT_THAT(visited, ElementsAre(1));
}

TEST(WeakListTest, AnyOf) {
  WeakList<int> list;
  auto p1 = std::make_shared<int>(1);
  auto p2 = std::make_shared<int>(2);
  auto p3 = std::make_shared<int>(3);
  list.insert(p1);
  list.insert(p2);
  list.insert(p3);

  EXPECT_TRUE(list.anyOf([](const int& value) { return value == 2; }));
  EXPECT_FALSE(list.anyOf([](const int& value) { return value == 4; }));
}

TEST(WeakListTest, ElementsAreAliveDuringAnyOfCallback) {
  WeakList<int> list;
  auto p1 = std::make_shared<int>(42);
  // A separate weak_ptr to observe the lifetime of `p1`.
  std::weak_ptr wp1 = p1;
  list.insert(p1);

  bool result = list.anyOf([&](const int& value) {
    p1.reset();
    EXPECT_FALSE(wp1.expired());
    return value == 42;
  });

  EXPECT_TRUE(result);
  EXPECT_TRUE(wp1.expired());
}

} // namespace facebook::react::jsinspector_modern

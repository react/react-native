/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <limits>

#include <gtest/gtest.h>
#include <react/renderer/debug/DebugStringConvertible.h>

using namespace facebook::react;

TEST(DebugStringConvertibleTest, toStringDoubleWithSuffix) {
  EXPECT_EQ(toString(3.14, '%'), "3.14%");
  EXPECT_EQ(toString(100.0, 'x'), "100x");
}

TEST(DebugStringConvertibleTest, toStringDoubleWithNullSuffix) {
  auto result = toString(42.0, '\0');
  EXPECT_EQ(result, "42");
}

TEST(DebugStringConvertibleTest, toStringDoubleWithSuffixZeroValue) {
  EXPECT_EQ(toString(0.0, '%'), "0%");
}

TEST(DebugStringConvertibleTest, toStringDoubleWithSuffixNegativeValue) {
  EXPECT_EQ(toString(-2.75, '%'), "-2.75%");
}

TEST(DebugStringConvertibleTest, toStringDoubleWithSuffixSpecialValues) {
  EXPECT_EQ(
      toString(std::numeric_limits<double>::infinity(), '%'), "Infinity%");
  EXPECT_EQ(
      toString(-std::numeric_limits<double>::infinity(), '%'), "-Infinity%");
  EXPECT_EQ(toString(std::numeric_limits<double>::quiet_NaN(), 'x'), "NaNx");
}

#if RN_DEBUG_STRING_CONVERTIBLE
#include <memory>

#include <react/renderer/debug/DebugStringConvertibleItem.h>

TEST(DebugStringConvertibleTest, handleSimpleNode) {
  SharedDebugStringConvertibleList empty;
  auto item = std::make_shared<DebugStringConvertibleItem>(
      "View", "hello", empty, empty);

  ASSERT_STREQ(item->getDebugName().c_str(), "View");
  ASSERT_STREQ(item->getDebugValue().c_str(), "hello");
  ASSERT_STREQ(item->getDebugDescription().c_str(), "<View=hello/>");
}

TEST(DebugStringConvertibleTest, handleSimpleNodeWithProps) {
  SharedDebugStringConvertibleList empty;
  SharedDebugStringConvertibleList props = {
      std::make_shared<DebugStringConvertibleItem>("x", "1", empty, empty)};
  auto item = std::make_shared<DebugStringConvertibleItem>(
      "View", "hello", props, empty);

  ASSERT_STREQ(item->getDebugName().c_str(), "View");
  ASSERT_STREQ(item->getDebugValue().c_str(), "hello");
  ASSERT_STREQ(item->getDebugDescription().c_str(), "<View=hello x=1/>");
}

TEST(DebugStringConvertibleTest, handleSimpleNodeWithChildren) {
  SharedDebugStringConvertibleList empty;
  SharedDebugStringConvertibleList children = {
      std::make_shared<DebugStringConvertibleItem>("Child", "a", empty, empty)};
  auto item = std::make_shared<DebugStringConvertibleItem>(
      "View", "hello", empty, children);

  ASSERT_STREQ(item->getDebugName().c_str(), "View");
  ASSERT_STREQ(item->getDebugValue().c_str(), "hello");
  ASSERT_STREQ(
      item->getDebugDescription().c_str(),
      "<View=hello>\n  <Child=a/>\n</View>");
}

TEST(DebugStringConvertibleTest, handleNestedNode) {
  SharedDebugStringConvertibleList empty;
  SharedDebugStringConvertibleList props = {
      std::make_shared<DebugStringConvertibleItem>("x", "1", empty, empty)};
  SharedDebugStringConvertibleList children = {
      std::make_shared<DebugStringConvertibleItem>("Child", "a", props, empty)};
  auto item = std::make_shared<DebugStringConvertibleItem>(
      "View", "hello", props, children);

  ASSERT_STREQ(item->getDebugName().c_str(), "View");
  ASSERT_STREQ(item->getDebugValue().c_str(), "hello");
  ASSERT_STREQ(
      item->getDebugDescription().c_str(),
      "<View=hello x=1>\n  <Child=a x=1/>\n</View>");
}

TEST(DebugStringConvertibleTest, handleNodeWithComplexProps) {
  SharedDebugStringConvertibleList empty;
  SharedDebugStringConvertibleList subProps = {
      std::make_shared<DebugStringConvertibleItem>(
          "height", "100", empty, empty),
      std::make_shared<DebugStringConvertibleItem>(
          "width", "200", empty, empty)};
  SharedDebugStringConvertibleList props = {
      std::make_shared<DebugStringConvertibleItem>("x", "1", subProps, empty)};
  auto item = std::make_shared<DebugStringConvertibleItem>(
      "View", "hello", props, empty);

  ASSERT_STREQ(item->getDebugName().c_str(), "View");
  ASSERT_STREQ(item->getDebugValue().c_str(), "hello");
  ASSERT_STREQ(
      item->getDebugDescription().c_str(),
      "<View=hello x=1(height=100 width=200)/>");
}

#endif

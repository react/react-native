/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/core/RawPropsParser.h>

namespace facebook::react {

namespace {

ViewProps parse(
    const folly::dynamic& rawPropsValue,
    const ViewProps& sourceProps = ViewProps()) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto raw = RawProps(rawPropsValue);
  auto parser = RawPropsParser();
  parser.prepare<ViewProps>();
  raw.parse(parser);

  return {parserContext, sourceProps, raw};
}

} // namespace

TEST(ViewPropsTest, removed_shadow_radius_returns_to_its_default) {
  auto withShadowRadius = parse(folly::dynamic::object("shadowRadius", 8));
  ASSERT_EQ(withShadowRadius.shadowRadius, 8);

  auto removed =
      parse(folly::dynamic::object("shadowRadius", nullptr), withShadowRadius);

  EXPECT_EQ(removed.shadowRadius, ViewProps().shadowRadius);
}

TEST(ViewPropsTest, removed_shadow_offset_returns_to_its_default) {
  auto withShadowOffset = parse(
      folly::dynamic::object(
          "shadowOffset", folly::dynamic::object("width", 2)("height", 4)));
  ASSERT_EQ(withShadowOffset.shadowOffset, (Size{.width = 2, .height = 4}));

  auto removed =
      parse(folly::dynamic::object("shadowOffset", nullptr), withShadowOffset);

  const auto defaultShadowOffset = ViewProps().shadowOffset;
  EXPECT_EQ(removed.shadowOffset.width, defaultShadowOffset.width);
  EXPECT_EQ(removed.shadowOffset.height, defaultShadowOffset.height);
}

} // namespace facebook::react

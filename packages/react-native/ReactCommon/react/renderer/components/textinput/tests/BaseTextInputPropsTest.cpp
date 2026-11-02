/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <react/renderer/components/textinput/BaseTextInputProps.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/core/RawPropsParser.h>

namespace facebook::react {

namespace {

BaseTextInputProps parse(
    const folly::dynamic& rawPropsValue,
    const BaseTextInputProps& sourceProps = BaseTextInputProps()) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto raw = RawProps(rawPropsValue);
  auto parser = RawPropsParser();
  parser.prepare<BaseTextInputProps>();
  raw.parse(parser);

  return {parserContext, sourceProps, raw};
}

} // namespace

TEST(BaseTextInputPropsTest, removed_editable_returns_to_its_default) {
  auto readOnly = parse(folly::dynamic::object("editable", false));
  ASSERT_FALSE(readOnly.editable);

  auto removed = parse(folly::dynamic::object("editable", nullptr), readOnly);

  EXPECT_EQ(removed.editable, BaseTextInputProps().editable);
}

} // namespace facebook::react

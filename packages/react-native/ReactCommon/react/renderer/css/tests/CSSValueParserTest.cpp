/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSDataType.h>
#include <react/renderer/css/CSSNumber.h>
#include <react/renderer/css/CSSValueParser.h>

namespace facebook::react {

struct ConsumeDataType {
  float number{};

  constexpr bool operator==(const ConsumeDataType& other) const = default;
};

template <>
struct CSSDataTypeParser<ConsumeDataType> {
  constexpr static std::optional<ConsumeDataType> consume(
      CSSValueParser& parser) {
    auto val = parser.parseNextValue<CSSNumber>();
    if (std::holds_alternative<CSSNumber>(val)) {
      return ConsumeDataType{std::get<CSSNumber>(val).value};
    }

    return {};
  }
};

static_assert(CSSDataType<ConsumeDataType>);

TEST(CSSValueParser, consume_multiple_with_delimiter) {
  CSSSyntaxParser syntaxParser{"1 2, 3, 4 / 5"};
  CSSValueParser parser{syntaxParser};

  auto next = parser.parseNextValue<ConsumeDataType>();
  EXPECT_TRUE(std::holds_alternative<ConsumeDataType>(next));
  EXPECT_EQ(std::get<ConsumeDataType>(next).number, 1);

  next = parser.parseNextValue<ConsumeDataType>(CSSDelimiter::None);
  EXPECT_FALSE(std::holds_alternative<ConsumeDataType>(next));

  next = parser.parseNextValue<ConsumeDataType>(CSSDelimiter::Whitespace);
  EXPECT_TRUE(std::holds_alternative<ConsumeDataType>(next));
  EXPECT_EQ(std::get<ConsumeDataType>(next).number, 2);

  next = parser.parseNextValue<ConsumeDataType>(CSSDelimiter::Comma);
  EXPECT_TRUE(std::holds_alternative<ConsumeDataType>(next));
  EXPECT_EQ(std::get<ConsumeDataType>(next).number, 3);

  next = parser.parseNextValue<ConsumeDataType>(CSSDelimiter::Comma);
  EXPECT_TRUE(std::holds_alternative<ConsumeDataType>(next));
  EXPECT_EQ(std::get<ConsumeDataType>(next).number, 4);

  next = parser.parseNextValue<ConsumeDataType>(CSSDelimiter::Solidus);
  EXPECT_TRUE(std::holds_alternative<ConsumeDataType>(next));
  EXPECT_EQ(std::get<ConsumeDataType>(next).number, 5);

  next = parser.parseNextValue<ConsumeDataType>();
  EXPECT_FALSE(std::holds_alternative<ConsumeDataType>(next));
}

} // namespace facebook::react

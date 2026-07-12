/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSRatio.h>
#include <react/renderer/css/CSSTransformOrigin.h>

namespace facebook::react {

TEST(CSSTransformOrigin, empty) {
  auto emptyValue = parseCSSProperty<CSSTransformOrigin>("");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(emptyValue));
}

TEST(CSSTransformOrigin, single_keywords) {
  auto left = parseCSSProperty<CSSTransformOrigin>("left");
  EXPECT_TRUE(std::holds_alternative<CSSTransformOrigin>(left));
  auto& leftOrigin = std::get<CSSTransformOrigin>(left);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(leftOrigin.x));
  EXPECT_EQ(std::get<CSSPercentage>(leftOrigin.x).value, 0.0f);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(leftOrigin.y));
  EXPECT_EQ(std::get<CSSPercentage>(leftOrigin.y).value, 50.0f);

  EXPECT_EQ(leftOrigin.z, CSSLength{});

  auto right = parseCSSProperty<CSSTransformOrigin>("right");
  EXPECT_TRUE(std::holds_alternative<CSSTransformOrigin>(right));
  auto& rightOrigin = std::get<CSSTransformOrigin>(right);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(rightOrigin.x));
  EXPECT_EQ(std::get<CSSPercentage>(rightOrigin.x).value, 100.0f);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(rightOrigin.y));
  EXPECT_EQ(std::get<CSSPercentage>(rightOrigin.y).value, 50.0f);

  EXPECT_EQ(rightOrigin.z, CSSLength{});

  auto top = parseCSSProperty<CSSTransformOrigin>("top");
  EXPECT_TRUE(std::holds_alternative<CSSTransformOrigin>(top));
  auto& topOrigin = std::get<CSSTransformOrigin>(top);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(topOrigin.x));
  EXPECT_EQ(std::get<CSSPercentage>(topOrigin.x).value, 50.0f);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(topOrigin.y));
  EXPECT_EQ(std::get<CSSPercentage>(topOrigin.y).value, 0.0f);

  EXPECT_EQ(topOrigin.z, CSSLength{});

  auto bottom = parseCSSProperty<CSSTransformOrigin>("bottom");
  EXPECT_TRUE(std::holds_alternative<CSSTransformOrigin>(bottom));
  auto& bottomOrigin = std::get<CSSTransformOrigin>(bottom);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(bottomOrigin.x));
  EXPECT_EQ(std::get<CSSPercentage>(bottomOrigin.x).value, 50.0f);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(bottomOrigin.y));
  EXPECT_EQ(std::get<CSSPercentage>(bottomOrigin.y).value, 100.0f);

  EXPECT_EQ(bottomOrigin.z, CSSLength{});

  auto center = parseCSSProperty<CSSTransformOrigin>("center");
  EXPECT_TRUE(std::holds_alternative<CSSTransformOrigin>(center));
  auto& centerOrigin = std::get<CSSTransformOrigin>(center);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(centerOrigin.x));
  EXPECT_EQ(std::get<CSSPercentage>(centerOrigin.x).value, 50.0f);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(centerOrigin.y));
  EXPECT_EQ(std::get<CSSPercentage>(centerOrigin.y).value, 50.0f);

  EXPECT_EQ(centerOrigin.z, CSSLength{});
}

TEST(CSSTransformOrigin, single_length) {
  auto val = parseCSSProperty<CSSTransformOrigin>("500px");
  EXPECT_TRUE(std::holds_alternative<CSSTransformOrigin>(val));
  auto& origin = std::get<CSSTransformOrigin>(val);

  EXPECT_TRUE(std::holds_alternative<CSSLength>(origin.x));
  EXPECT_EQ(std::get<CSSLength>(origin.x).value, 500.0f);
  EXPECT_EQ(std::get<CSSLength>(origin.x).unit, CSSLengthUnit::Px);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.y));
  EXPECT_EQ(std::get<CSSPercentage>(origin.y).value, 50.0f);

  EXPECT_EQ(origin.z, CSSLength{});
}

TEST(CSSTransformOrigin, single_percentage) {
  auto val = parseCSSProperty<CSSTransformOrigin>("9000%");
  EXPECT_TRUE(std::holds_alternative<CSSTransformOrigin>(val));
  auto& origin = std::get<CSSTransformOrigin>(val);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.x));
  EXPECT_EQ(std::get<CSSPercentage>(origin.x).value, 9000.0f);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.y));
  EXPECT_EQ(std::get<CSSPercentage>(origin.y).value, 50.0f);

  EXPECT_EQ(origin.z, CSSLength{});
}

TEST(CSSTransformOrigin, left_top) {
  auto val = parseCSSProperty<CSSTransformOrigin>("left top");
  EXPECT_TRUE(std::holds_alternative<CSSTransformOrigin>(val));
  auto& origin = std::get<CSSTransformOrigin>(val);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.x));
  EXPECT_EQ(std::get<CSSPercentage>(origin.x).value, 0.0f);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.y));
  EXPECT_EQ(std::get<CSSPercentage>(origin.y).value, 0.0f);

  EXPECT_EQ(origin.z, CSSLength{});
}

TEST(CSSTransformOrigin, top_left) {
  auto val = parseCSSProperty<CSSTransformOrigin>("top left");
  EXPECT_TRUE(std::holds_alternative<CSSTransformOrigin>(val));
  auto& origin = std::get<CSSTransformOrigin>(val);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.x));
  EXPECT_EQ(std::get<CSSPercentage>(origin.x).value, 0.0f);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.y));
  EXPECT_EQ(std::get<CSSPercentage>(origin.y).value, 0.0f);

  EXPECT_EQ(origin.z, CSSLength{});
}

TEST(CSSTransformOrigin, right_top) {
  auto val = parseCSSProperty<CSSTransformOrigin>("right top");
  EXPECT_TRUE(std::holds_alternative<CSSTransformOrigin>(val));
  auto& origin = std::get<CSSTransformOrigin>(val);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.x));
  EXPECT_EQ(std::get<CSSPercentage>(origin.x).value, 100.0f);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.y));
  EXPECT_EQ(std::get<CSSPercentage>(origin.y).value, 0.0f);

  EXPECT_EQ(origin.z, CSSLength{});
}

TEST(CSSTransformOrigin, center_center) {
  auto val = parseCSSProperty<CSSTransformOrigin>("center center");
  EXPECT_TRUE(std::holds_alternative<CSSTransformOrigin>(val));
  auto& origin = std::get<CSSTransformOrigin>(val);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.x));
  EXPECT_EQ(std::get<CSSPercentage>(origin.x).value, 50.0f);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.y));
  EXPECT_EQ(std::get<CSSPercentage>(origin.y).value, 50.0f);

  EXPECT_EQ(origin.z, CSSLength{});
}

TEST(CSSTransformOrigin, center_left) {
  auto val = parseCSSProperty<CSSTransformOrigin>("center left");
  EXPECT_TRUE(std::holds_alternative<CSSTransformOrigin>(val));
  auto& origin = std::get<CSSTransformOrigin>(val);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.x));
  EXPECT_EQ(std::get<CSSPercentage>(origin.x).value, 0.0f);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.y));
  EXPECT_EQ(std::get<CSSPercentage>(origin.y).value, 50.0f);

  EXPECT_EQ(origin.z, CSSLength{});
}

TEST(CSSTransformOrigin, left_bottom) {
  auto val = parseCSSProperty<CSSTransformOrigin>("left bottom");
  EXPECT_TRUE(std::holds_alternative<CSSTransformOrigin>(val));
  auto& origin = std::get<CSSTransformOrigin>(val);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.x));
  EXPECT_EQ(std::get<CSSPercentage>(origin.x).value, 0.0f);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.y));
  EXPECT_EQ(std::get<CSSPercentage>(origin.y).value, 100.0f);

  EXPECT_EQ(origin.z, CSSLength{});
}

TEST(CSSTransformOrigin, bottom_left) {
  auto val = parseCSSProperty<CSSTransformOrigin>("bottom left");
  EXPECT_TRUE(std::holds_alternative<CSSTransformOrigin>(val));
  auto& origin = std::get<CSSTransformOrigin>(val);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.x));
  EXPECT_EQ(std::get<CSSPercentage>(origin.x).value, 0.0f);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.y));
  EXPECT_EQ(std::get<CSSPercentage>(origin.y).value, 100.0f);

  EXPECT_EQ(origin.z, CSSLength{});
}

TEST(CSSTransformOrigin, bottom_bottom) {
  auto val = parseCSSProperty<CSSTransformOrigin>("bottom bottom");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransformOrigin, right_right) {
  auto val = parseCSSProperty<CSSTransformOrigin>("right right");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransformOrigin, center_left_length) {
  auto val = parseCSSProperty<CSSTransformOrigin>("center left 500px");
  EXPECT_TRUE(std::holds_alternative<CSSTransformOrigin>(val));
  auto& origin = std::get<CSSTransformOrigin>(val);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.x));
  EXPECT_EQ(std::get<CSSPercentage>(origin.x).value, 0.0f);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.y));
  EXPECT_EQ(std::get<CSSPercentage>(origin.y).value, 50.0f);

  EXPECT_EQ(origin.z.value, 500.0f);
  EXPECT_EQ(origin.z.unit, CSSLengthUnit::Px);
}

TEST(CSSTransformOrigin, center_left_percentage) {
  auto val = parseCSSProperty<CSSTransformOrigin>("center left 9000%");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransformOrigin, pct_center) {
  auto val = parseCSSProperty<CSSTransformOrigin>("9000% center");
  EXPECT_TRUE(std::holds_alternative<CSSTransformOrigin>(val));
  auto& origin = std::get<CSSTransformOrigin>(val);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.x));
  EXPECT_EQ(std::get<CSSPercentage>(origin.x).value, 9000.0f);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.y));
  EXPECT_EQ(std::get<CSSPercentage>(origin.y).value, 50.0f);

  EXPECT_EQ(origin.z, CSSLength{});
}

TEST(CSSTransformOrigin, length_center) {
  auto val = parseCSSProperty<CSSTransformOrigin>("500px center");
  EXPECT_TRUE(std::holds_alternative<CSSTransformOrigin>(val));
  auto& origin = std::get<CSSTransformOrigin>(val);

  EXPECT_TRUE(std::holds_alternative<CSSLength>(origin.x));
  EXPECT_EQ(std::get<CSSLength>(origin.x).value, 500.0f);
  EXPECT_EQ(std::get<CSSLength>(origin.x).unit, CSSLengthUnit::Px);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.y));
  EXPECT_EQ(std::get<CSSPercentage>(origin.y).value, 50.0f);

  EXPECT_EQ(origin.z, CSSLength{});
}

TEST(CSSTransformOrigin, length_top) {
  auto val = parseCSSProperty<CSSTransformOrigin>("500px top");
  EXPECT_TRUE(std::holds_alternative<CSSTransformOrigin>(val));
  auto& origin = std::get<CSSTransformOrigin>(val);

  EXPECT_TRUE(std::holds_alternative<CSSLength>(origin.x));
  EXPECT_EQ(std::get<CSSLength>(origin.x).value, 500.0f);
  EXPECT_EQ(std::get<CSSLength>(origin.x).unit, CSSLengthUnit::Px);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.y));
  EXPECT_EQ(std::get<CSSPercentage>(origin.y).value, 0.0f);

  EXPECT_EQ(origin.z, CSSLength{});
}

TEST(CSSTransformOrigin, length_left) {
  auto val = parseCSSProperty<CSSTransformOrigin>("500px left");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransformOrigin, length_bottom_length) {
  auto val = parseCSSProperty<CSSTransformOrigin>("500px bottom 500px");
  EXPECT_TRUE(std::holds_alternative<CSSTransformOrigin>(val));
  auto& origin = std::get<CSSTransformOrigin>(val);

  EXPECT_TRUE(std::holds_alternative<CSSLength>(origin.x));
  EXPECT_EQ(std::get<CSSLength>(origin.x).value, 500.0f);
  EXPECT_EQ(std::get<CSSLength>(origin.x).unit, CSSLengthUnit::Px);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.y));
  EXPECT_EQ(std::get<CSSPercentage>(origin.y).value, 100.0f);

  EXPECT_EQ(origin.z.value, 500.0f);
  EXPECT_EQ(origin.z.unit, CSSLengthUnit::Px);
}

TEST(CSSTransformOrigin, length_right_percentage) {
  auto val = parseCSSProperty<CSSTransformOrigin>("500px right 9000%");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransformOrigin, length_length) {
  auto val = parseCSSProperty<CSSTransformOrigin>("500px 600px");
  EXPECT_TRUE(std::holds_alternative<CSSTransformOrigin>(val));
  auto& origin = std::get<CSSTransformOrigin>(val);

  EXPECT_TRUE(std::holds_alternative<CSSLength>(origin.x));
  EXPECT_EQ(std::get<CSSLength>(origin.x).value, 500.0f);
  EXPECT_EQ(std::get<CSSLength>(origin.x).unit, CSSLengthUnit::Px);

  EXPECT_TRUE(std::holds_alternative<CSSLength>(origin.y));
  EXPECT_EQ(std::get<CSSLength>(origin.y).value, 600.0f);
  EXPECT_EQ(std::get<CSSLength>(origin.y).unit, CSSLengthUnit::Px);

  EXPECT_EQ(origin.z, CSSLength{});
}

TEST(CSSTransformOrigin, length_percentage) {
  auto val = parseCSSProperty<CSSTransformOrigin>("500px 9000%");
  EXPECT_TRUE(std::holds_alternative<CSSTransformOrigin>(val));

  auto& origin = std::get<CSSTransformOrigin>(val);

  EXPECT_TRUE(std::holds_alternative<CSSLength>(origin.x));
  EXPECT_EQ(std::get<CSSLength>(origin.x).value, 500.0f);
  EXPECT_EQ(std::get<CSSLength>(origin.x).unit, CSSLengthUnit::Px);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.y));
  EXPECT_EQ(std::get<CSSPercentage>(origin.y).value, 9000.0f);

  EXPECT_EQ(origin.z, CSSLength{});
}

TEST(CSSTransformOrigin, percentage_length) {
  auto val = parseCSSProperty<CSSTransformOrigin>("9000% 500px");
  EXPECT_TRUE(std::holds_alternative<CSSTransformOrigin>(val));

  auto& origin = std::get<CSSTransformOrigin>(val);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.x));
  EXPECT_EQ(std::get<CSSPercentage>(origin.x).value, 9000.0f);

  EXPECT_TRUE(std::holds_alternative<CSSLength>(origin.y));
  EXPECT_EQ(std::get<CSSLength>(origin.y).value, 500.0f);
  EXPECT_EQ(std::get<CSSLength>(origin.y).unit, CSSLengthUnit::Px);

  EXPECT_EQ(origin.z, CSSLength{});
}

TEST(CSSTransformOrigin, percentage_right) {
  auto val = parseCSSProperty<CSSTransformOrigin>("9000% right");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransformOrigin, percentage_bottom) {
  auto val = parseCSSProperty<CSSTransformOrigin>("9000% bottom");
  EXPECT_TRUE(std::holds_alternative<CSSTransformOrigin>(val));
  auto& origin = std::get<CSSTransformOrigin>(val);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.x));
  EXPECT_EQ(std::get<CSSPercentage>(origin.x).value, 9000.0f);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.y));
  EXPECT_EQ(std::get<CSSPercentage>(origin.y).value, 100.0f);

  EXPECT_EQ(origin.z, CSSLength{});
}

TEST(CSSTransformOrigin, percentage_left) {
  auto val = parseCSSProperty<CSSTransformOrigin>("9000% left");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransformOrigin, bottom_percentage) {
  auto val = parseCSSProperty<CSSTransformOrigin>("bottom 9000%");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransformOrigin, center_percentage) {
  auto val = parseCSSProperty<CSSTransformOrigin>("center 9000%");
  EXPECT_TRUE(std::holds_alternative<CSSTransformOrigin>(val));
  auto& origin = std::get<CSSTransformOrigin>(val);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.x));
  EXPECT_EQ(std::get<CSSPercentage>(origin.x).value, 50.0f);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.y));
  EXPECT_EQ(std::get<CSSPercentage>(origin.y).value, 9000.0f);

  EXPECT_EQ(origin.z, CSSLength{});
}

TEST(CSSTransformOrigin, right_percentage) {
  auto val = parseCSSProperty<CSSTransformOrigin>("right 9000%");
  EXPECT_TRUE(std::holds_alternative<CSSTransformOrigin>(val));
  auto& origin = std::get<CSSTransformOrigin>(val);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.x));
  EXPECT_EQ(std::get<CSSPercentage>(origin.x).value, 100.0f);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.y));
  EXPECT_EQ(std::get<CSSPercentage>(origin.y).value, 9000.0f);

  EXPECT_EQ(origin.z, CSSLength{});
}

TEST(CSSTransformOrigin, percentage_percentage) {
  auto val = parseCSSProperty<CSSTransformOrigin>("9000% 9001%");
  EXPECT_TRUE(std::holds_alternative<CSSTransformOrigin>(val));

  auto& origin = std::get<CSSTransformOrigin>(val);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.x));
  EXPECT_EQ(std::get<CSSPercentage>(origin.x).value, 9000.0f);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.y));
  EXPECT_EQ(std::get<CSSPercentage>(origin.y).value, 9001.0f);

  EXPECT_EQ(origin.z, CSSLength{});
}

TEST(CSSTransformOrigin, decimal_length_length) {
  auto val = parseCSSProperty<CSSTransformOrigin>("12.5px 7.5px");
  EXPECT_TRUE(std::holds_alternative<CSSTransformOrigin>(val));
  auto& origin = std::get<CSSTransformOrigin>(val);

  EXPECT_TRUE(std::holds_alternative<CSSLength>(origin.x));
  EXPECT_EQ(std::get<CSSLength>(origin.x).value, 12.5f);
  EXPECT_EQ(std::get<CSSLength>(origin.x).unit, CSSLengthUnit::Px);

  EXPECT_TRUE(std::holds_alternative<CSSLength>(origin.y));
  EXPECT_EQ(std::get<CSSLength>(origin.y).value, 7.5f);
  EXPECT_EQ(std::get<CSSLength>(origin.y).unit, CSSLengthUnit::Px);

  EXPECT_EQ(origin.z, CSSLength{});
}

TEST(CSSTransformOrigin, decimal_percentage_percentage) {
  auto val = parseCSSProperty<CSSTransformOrigin>("50.5% 30.2%");
  EXPECT_TRUE(std::holds_alternative<CSSTransformOrigin>(val));
  auto& origin = std::get<CSSTransformOrigin>(val);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.x));
  EXPECT_EQ(std::get<CSSPercentage>(origin.x).value, 50.5f);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(origin.y));
  EXPECT_EQ(std::get<CSSPercentage>(origin.y).value, 30.2f);

  EXPECT_EQ(origin.z, CSSLength{});
}

} // namespace facebook::react

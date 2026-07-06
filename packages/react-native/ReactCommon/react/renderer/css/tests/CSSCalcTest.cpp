/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSCalc.h>
#include <react/renderer/css/CSSLengthUnit.h>
#include <react/renderer/css/CSSValueParser.h>

namespace facebook::react {

inline std::optional<CSSCalc> parseCalc(std::string_view css) {
  auto result = parseCSSProperty<CSSCalc>(css);
  if (std::holds_alternative<CSSCalc>(result)) {
    return std::get<CSSCalc>(result);
  }
  return std::nullopt;
}

TEST(CSSCalc, simple_pixel_value) {
  auto result = parseCalc("calc(10px)");
  ASSERT_TRUE(result.has_value());
  EXPECT_FLOAT_EQ(result->px, 10.0f);
  EXPECT_FLOAT_EQ(result->percent, 0.0f);
  EXPECT_FLOAT_EQ(result->vw, 0.0f);
  EXPECT_FLOAT_EQ(result->vh, 0.0f);
}

TEST(CSSCalc, simple_percentage_value) {
  auto result = parseCalc("calc(50%)");
  ASSERT_TRUE(result.has_value());
  EXPECT_FLOAT_EQ(result->px, 0.0f);
  EXPECT_FLOAT_EQ(result->percent, 50.0f);
  EXPECT_FLOAT_EQ(result->vw, 0.0f);
  EXPECT_FLOAT_EQ(result->vh, 0.0f);
}

TEST(CSSCalc, simple_vw_value) {
  auto result = parseCalc("calc(100vw)");
  ASSERT_TRUE(result.has_value());
  EXPECT_FLOAT_EQ(result->px, 0.0f);
  EXPECT_FLOAT_EQ(result->percent, 0.0f);
  EXPECT_FLOAT_EQ(result->vw, 100.0f);
  EXPECT_FLOAT_EQ(result->vh, 0.0f);
}

TEST(CSSCalc, simple_vh_value) {
  auto result = parseCalc("calc(100vh)");
  ASSERT_TRUE(result.has_value());
  EXPECT_FLOAT_EQ(result->px, 0.0f);
  EXPECT_FLOAT_EQ(result->percent, 0.0f);
  EXPECT_FLOAT_EQ(result->vw, 0.0f);
  EXPECT_FLOAT_EQ(result->vh, 100.0f);
}

TEST(CSSCalc, addition_same_units) {
  auto result = parseCalc("calc(10px + 20px)");
  ASSERT_TRUE(result.has_value());
  EXPECT_FLOAT_EQ(result->px, 30.0f);
  EXPECT_FLOAT_EQ(result->percent, 0.0f);
}

TEST(CSSCalc, subtraction_same_units) {
  auto result = parseCalc("calc(50% - 20%)");
  ASSERT_TRUE(result.has_value());
  EXPECT_FLOAT_EQ(result->px, 0.0f);
  EXPECT_FLOAT_EQ(result->percent, 30.0f);
}

TEST(CSSCalc, mixed_units_addition) {
  auto result = parseCalc("calc(100% - 20px)");
  ASSERT_TRUE(result.has_value());
  EXPECT_FLOAT_EQ(result->px, -20.0f);
  EXPECT_FLOAT_EQ(result->percent, 100.0f);
  EXPECT_FLOAT_EQ(result->vw, 0.0f);
  EXPECT_FLOAT_EQ(result->vh, 0.0f);
}

TEST(CSSCalc, mixed_units_complex) {
  auto result = parseCalc("calc(50% + 10px - 5vw + 2vh)");
  ASSERT_TRUE(result.has_value());
  EXPECT_FLOAT_EQ(result->px, 10.0f);
  EXPECT_FLOAT_EQ(result->percent, 50.0f);
  EXPECT_FLOAT_EQ(result->vw, -5.0f);
  EXPECT_FLOAT_EQ(result->vh, 2.0f);
}

TEST(CSSCalc, multiplication_by_number) {
  auto result = parseCalc("calc(50% * 2)");
  ASSERT_TRUE(result.has_value());
  EXPECT_FLOAT_EQ(result->px, 0.0f);
  EXPECT_FLOAT_EQ(result->percent, 100.0f);
}

TEST(CSSCalc, number_times_unit) {
  auto result = parseCalc("calc(2 * 50%)");
  ASSERT_TRUE(result.has_value());
  EXPECT_FLOAT_EQ(result->px, 0.0f);
  EXPECT_FLOAT_EQ(result->percent, 100.0f);
}

TEST(CSSCalc, chained_unitless_products_then_length) {
  auto result = parseCalc("calc(2 * 3 * 10px)");
  ASSERT_TRUE(result.has_value());
  EXPECT_FLOAT_EQ(result->px, 60.0f);
  EXPECT_FLOAT_EQ(result->percent, 0.0f);
}

TEST(CSSCalc, unitless_division_then_length_multiplication) {
  auto result = parseCalc("calc(10 / 2 * 5px)");
  ASSERT_TRUE(result.has_value());
  EXPECT_FLOAT_EQ(result->px, 25.0f);
  EXPECT_FLOAT_EQ(result->percent, 0.0f);
}

TEST(CSSCalc, division_by_number) {
  auto result = parseCalc("calc(100px / 4)");
  ASSERT_TRUE(result.has_value());
  EXPECT_FLOAT_EQ(result->px, 25.0f);
  EXPECT_FLOAT_EQ(result->percent, 0.0f);
}

TEST(CSSCalc, complex_expression_with_precedence) {
  auto result = parseCalc("calc((100% - 20px) * 2)");
  ASSERT_TRUE(result.has_value());
  EXPECT_FLOAT_EQ(result->px, -40.0f);
  EXPECT_FLOAT_EQ(result->percent, 200.0f);
}

TEST(CSSCalc, operator_precedence_mul_before_add) {
  auto result = parseCalc("calc(10px + 20px * 2)");
  ASSERT_TRUE(result.has_value());
  EXPECT_FLOAT_EQ(result->px, 50.0f);
}

TEST(CSSCalc, nested_parentheses) {
  auto result = parseCalc("calc(((10px)))");
  ASSERT_TRUE(result.has_value());
  EXPECT_FLOAT_EQ(result->px, 10.0f);
}

TEST(CSSCalc, negative_values) {
  auto result = parseCalc("calc(-10px)");
  ASSERT_TRUE(result.has_value());
  EXPECT_FLOAT_EQ(result->px, -10.0f);
}

TEST(CSSCalc, unary_plus) {
  auto result = parseCalc("calc(+20px)");
  ASSERT_TRUE(result.has_value());
  EXPECT_FLOAT_EQ(result->px, 20.0f);
}

TEST(CSSCalc, resolve_simple_percentage) {
  auto result = parseCalc("calc(50%)");
  ASSERT_TRUE(result.has_value());
  float resolved = result->resolve(200.0f, 0.0f, 0.0f);
  EXPECT_FLOAT_EQ(resolved, 100.0f);
}

TEST(CSSCalc, resolve_mixed_units) {
  auto result = parseCalc("calc(100% - 20px)");
  ASSERT_TRUE(result.has_value());
  float resolved = result->resolve(200.0f, 0.0f, 0.0f);
  EXPECT_FLOAT_EQ(resolved, 180.0f);
}

TEST(CSSCalc, resolve_with_viewport_units) {
  auto result = parseCalc("calc(50vw + 10vh)");
  ASSERT_TRUE(result.has_value());
  float resolved = result->resolve(0.0f, 400.0f, 800.0f);
  EXPECT_FLOAT_EQ(resolved, 280.0f);
}

TEST(CSSCalc, resolve_all_units) {
  auto result = parseCalc("calc(10px + 25% + 10vw + 5vh)");
  ASSERT_TRUE(result.has_value());
  float resolved = result->resolve(100.0f, 200.0f, 400.0f);
  EXPECT_FLOAT_EQ(resolved, 75.0f);
}

TEST(CSSCalc, invalid_expression_empty) {
  auto result = parseCalc("calc()");
  EXPECT_FALSE(result.has_value());
}

TEST(CSSCalc, invalid_multiplication_of_units) {
  auto result = parseCalc("calc(10px * 20px)");
  EXPECT_FALSE(result.has_value());
}

TEST(CSSCalc, invalid_division_by_unit) {
  auto result = parseCalc("calc(100px / 10px)");
  EXPECT_FALSE(result.has_value());
}

TEST(CSSCalc, division_by_zero) {
  auto result = parseCalc("calc(100px / 0)");
  EXPECT_FALSE(result.has_value());
}

TEST(CSSCalc, invalid_addition_of_number_and_length) {
  auto result = parseCalc("calc(1 + 10px)");
  EXPECT_FALSE(result.has_value());
}

TEST(CSSCalc, invalid_subtraction_of_percent_and_number) {
  auto result = parseCalc("calc(100% - 2)");
  EXPECT_FALSE(result.has_value());
}

TEST(CSSCalc, invalid_trailing_operator) {
  auto result = parseCalc("calc(10px +)");
  EXPECT_FALSE(result.has_value());
}

TEST(CSSCalc, invalid_missing_rhs_in_group) {
  auto result = parseCalc("calc((10px +))");
  EXPECT_FALSE(result.has_value());
}

TEST(CSSCalc, zero_is_parsed_as_number) {
  auto result = parseCalc("calc(0 + 10px)");
  EXPECT_FALSE(result.has_value());
}

TEST(CSSCalc, whitespace_handling) {
  auto result = parseCalc("calc(  100%   -   20px  )");
  ASSERT_TRUE(result.has_value());
  EXPECT_FLOAT_EQ(result->px, -20.0f);
  EXPECT_FLOAT_EQ(result->percent, 100.0f);
}

TEST(CSSCalc, case_insensitive) {
  auto result = parseCalc("CALC(10PX + 5VW)");
  ASSERT_TRUE(result.has_value());
  EXPECT_FLOAT_EQ(result->px, 10.0f);
  EXPECT_FLOAT_EQ(result->vw, 5.0f);
}

TEST(CSSCalc, addition_operator) {
  CSSCalc a{10.0f, 20.0f, 5.0f, 2.0f, false};
  CSSCalc b{5.0f, 10.0f, 3.0f, 1.0f, false};
  auto result = a + b;
  EXPECT_FLOAT_EQ(result.px, 15.0f);
  EXPECT_FLOAT_EQ(result.percent, 30.0f);
  EXPECT_FLOAT_EQ(result.vw, 8.0f);
  EXPECT_FLOAT_EQ(result.vh, 3.0f);
}

TEST(CSSCalc, subtraction_operator) {
  CSSCalc a{10.0f, 20.0f, 5.0f, 2.0f, false};
  CSSCalc b{5.0f, 10.0f, 3.0f, 1.0f, false};
  auto result = a - b;
  EXPECT_FLOAT_EQ(result.px, 5.0f);
  EXPECT_FLOAT_EQ(result.percent, 10.0f);
  EXPECT_FLOAT_EQ(result.vw, 2.0f);
  EXPECT_FLOAT_EQ(result.vh, 1.0f);
}

TEST(CSSCalc, multiplication_operator) {
  CSSCalc a{10.0f, 20.0f, 5.0f, 2.0f, false};
  auto result = a * 2.0f;
  EXPECT_FLOAT_EQ(result.px, 20.0f);
  EXPECT_FLOAT_EQ(result.percent, 40.0f);
  EXPECT_FLOAT_EQ(result.vw, 10.0f);
  EXPECT_FLOAT_EQ(result.vh, 4.0f);
}

TEST(CSSCalc, division_operator) {
  CSSCalc a{20.0f, 40.0f, 10.0f, 4.0f, false};
  auto result = a / 2.0f;
  EXPECT_FLOAT_EQ(result.px, 10.0f);
  EXPECT_FLOAT_EQ(result.percent, 20.0f);
  EXPECT_FLOAT_EQ(result.vw, 5.0f);
  EXPECT_FLOAT_EQ(result.vh, 2.0f);
}

TEST(CSSCalc, negation_operator) {
  CSSCalc a{10.0f, 20.0f, 5.0f, 2.0f, false};
  auto result = -a;
  EXPECT_FLOAT_EQ(result.px, -10.0f);
  EXPECT_FLOAT_EQ(result.percent, -20.0f);
  EXPECT_FLOAT_EQ(result.vw, -5.0f);
  EXPECT_FLOAT_EQ(result.vh, -2.0f);
}

TEST(CSSCalc, is_unitless) {
  auto number = CSSCalc::fromNumber(10.0f);
  EXPECT_TRUE(number.isUnitless());

  auto points = CSSCalc::fromPoints(10.0f);
  EXPECT_FALSE(points.isUnitless());
}

TEST(CSSCalc, is_points_only) {
  auto pointsOnly = CSSCalc::fromPoints(10.0f);
  EXPECT_TRUE(pointsOnly.isPointsOnly());

  CSSCalc withPercent{10.0f, 5.0f, 0.0f, 0.0f, false};
  EXPECT_FALSE(withPercent.isPointsOnly());

  auto number = CSSCalc::fromNumber(10.0f);
  EXPECT_FALSE(number.isPointsOnly());
}

TEST(CSSCalc, is_percent_only) {
  auto percentOnly = CSSCalc::fromPercent(50.0f);
  EXPECT_TRUE(percentOnly.isPercentOnly());

  CSSCalc withPx{10.0f, 50.0f, 0.0f, 0.0f, false};
  EXPECT_FALSE(withPx.isPercentOnly());
}

TEST(CSSCalc, is_zero) {
  CSSCalc zero{0.0f, 0.0f, 0.0f, 0.0f, false};
  EXPECT_TRUE(zero.isZero());

  CSSCalc nonZero{0.1f, 0.0f, 0.0f, 0.0f, false};
  EXPECT_FALSE(nonZero.isZero());
}

TEST(CSSCalc, from_points) {
  auto result = CSSCalc::fromPoints(25.0f);
  EXPECT_FLOAT_EQ(result.px, 25.0f);
  EXPECT_FLOAT_EQ(result.percent, 0.0f);
  EXPECT_FLOAT_EQ(result.vw, 0.0f);
  EXPECT_FLOAT_EQ(result.vh, 0.0f);
}

TEST(CSSCalc, from_percent) {
  auto result = CSSCalc::fromPercent(75.0f);
  EXPECT_FLOAT_EQ(result.px, 0.0f);
  EXPECT_FLOAT_EQ(result.percent, 75.0f);
  EXPECT_FLOAT_EQ(result.vw, 0.0f);
  EXPECT_FLOAT_EQ(result.vh, 0.0f);
}

TEST(CSSCalc, from_vw) {
  auto result = CSSCalc::fromVw(30.0f);
  EXPECT_FLOAT_EQ(result.px, 0.0f);
  EXPECT_FLOAT_EQ(result.percent, 0.0f);
  EXPECT_FLOAT_EQ(result.vw, 30.0f);
  EXPECT_FLOAT_EQ(result.vh, 0.0f);
}

TEST(CSSCalc, from_vh) {
  auto result = CSSCalc::fromVh(45.0f);
  EXPECT_FLOAT_EQ(result.px, 0.0f);
  EXPECT_FLOAT_EQ(result.percent, 0.0f);
  EXPECT_FLOAT_EQ(result.vw, 0.0f);
  EXPECT_FLOAT_EQ(result.vh, 45.0f);
}

TEST(CSSCalc, from_length) {
  auto px = CSSCalc::fromLength(10.0f, CSSLengthUnit::Px);
  ASSERT_TRUE(px.has_value());
  EXPECT_FLOAT_EQ(px->px, 10.0f);
  EXPECT_FLOAT_EQ(px->percent, 0.0f);

  auto vw = CSSCalc::fromLength(50.0f, CSSLengthUnit::Vw);
  ASSERT_TRUE(vw.has_value());
  EXPECT_FLOAT_EQ(vw->vw, 50.0f);

  auto vh = CSSCalc::fromLength(25.0f, CSSLengthUnit::Vh);
  ASSERT_TRUE(vh.has_value());
  EXPECT_FLOAT_EQ(vh->vh, 25.0f);

  auto unsupported = CSSCalc::fromLength(10.0f, CSSLengthUnit::Em);
  EXPECT_FALSE(unsupported.has_value());
}

TEST(CSSCalc, division_by_zero_operator) {
  CSSCalc a{100.0f, 0.0f, 0.0f, 0.0f, false};
  auto result = a / 0.0f;
  EXPECT_TRUE(result.isZero());
}

TEST(CSSCalc, negation_preserves_unitless) {
  auto unitless = CSSCalc::fromNumber(5.0f);
  auto negated = -unitless;
  EXPECT_TRUE(negated.isUnitless());
  EXPECT_FLOAT_EQ(negated.px, -5.0f);
}

TEST(CSSCalc, nested_calc) {
  auto result = parseCalc("calc(calc(10px))");
  ASSERT_TRUE(result.has_value());
  EXPECT_FLOAT_EQ(result->px, 10.0f);
}

TEST(CSSCalc, equality) {
  CSSCalc a{10.0f, 20.0f, 5.0f, 2.0f, false};
  CSSCalc b{10.0f, 20.0f, 5.0f, 2.0f, false};
  CSSCalc c{10.0f, 20.0f, 5.0f, 2.0f, true};
  EXPECT_EQ(a, b);
  EXPECT_NE(a, c);
}

TEST(CSSCalc, invalid_wrong_function) {
  auto result = parseCalc("min(10px)");
  EXPECT_FALSE(result.has_value());
}

TEST(CSSCalc, invalid_missing_calc_function) {
  auto result = parseCalc("10px");
  EXPECT_FALSE(result.has_value());
}

TEST(CSSCalc, is_zero_unitless) {
  auto unitlessZero = CSSCalc::fromNumber(0.0f);
  EXPECT_TRUE(unitlessZero.isZero());
  EXPECT_TRUE(unitlessZero.isUnitless());
}

} // namespace facebook::react

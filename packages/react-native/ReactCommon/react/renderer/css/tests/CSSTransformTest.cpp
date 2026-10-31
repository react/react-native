/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSTransform.h>
#include <react/renderer/css/CSSValueParser.h>

namespace facebook::react {

TEST(CSSTransform, matrix_basic) {
  auto val = parseCSSProperty<CSSTransformFunction>("matrix(1, 2, 3, 4, 5, 6)");
  EXPECT_TRUE(std::holds_alternative<CSSMatrix>(val));
  auto& matrix = std::get<CSSMatrix>(val);

  EXPECT_EQ(matrix.values[0], 1.0f);
  EXPECT_EQ(matrix.values[1], 2.0f);
  EXPECT_EQ(matrix.values[2], 3.0f);
  EXPECT_EQ(matrix.values[3], 4.0f);
  EXPECT_EQ(matrix.values[4], 5.0f);
  EXPECT_EQ(matrix.values[5], 6.0f);
}

TEST(CSSTransform, matrix_leading_dot) {
  auto val =
      parseCSSProperty<CSSTransformFunction>("matrix(.5, 0, 0, -.5, 10, 20)");
  EXPECT_TRUE(std::holds_alternative<CSSMatrix>(val));
  auto& matrix = std::get<CSSMatrix>(val);

  EXPECT_EQ(matrix.values[0], 0.5f);
  EXPECT_EQ(matrix.values[3], -0.5f);
}

TEST(CSSTransform, matrix_funky) {
  auto val =
      parseCSSProperty<CSSTransformFunction>("mAtRiX( 1  , \n2,3, 4, \t5, 6)");
  EXPECT_TRUE(std::holds_alternative<CSSMatrix>(val));
  auto& matrix = std::get<CSSMatrix>(val);

  EXPECT_EQ(matrix.values[0], 1.0f);
  EXPECT_EQ(matrix.values[1], 2.0f);
  EXPECT_EQ(matrix.values[2], 3.0f);
  EXPECT_EQ(matrix.values[3], 4.0f);
  EXPECT_EQ(matrix.values[4], 5.0f);
  EXPECT_EQ(matrix.values[5], 6.0f);
}

TEST(CSSTransform, matrix_missing_elements) {
  auto val = parseCSSProperty<CSSTransformFunction>("matrix(1, 2, 3, 4, 5)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, matrix_extra_elements) {
  auto val =
      parseCSSProperty<CSSTransformFunction>("matrix(1, 2, 3, 4, 5, 6, 7)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, matrix_pct) {
  auto val =
      parseCSSProperty<CSSTransformFunction>("matrix(1, 2%, 3, 4, 5, 6)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, translate_basic) {
  auto val = parseCSSProperty<CSSTransformFunction>("translate(4rem, 20%)");
  EXPECT_TRUE(std::holds_alternative<CSSTranslate>(val));
  auto& translate = std::get<CSSTranslate>(val);

  EXPECT_TRUE(std::holds_alternative<CSSLength>(translate.x));
  EXPECT_EQ(std::get<CSSLength>(translate.x).value, 4.0f);
  EXPECT_EQ(std::get<CSSLength>(translate.x).unit, CSSLengthUnit::Rem);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(translate.y));
  EXPECT_EQ(std::get<CSSPercentage>(translate.y).value, 20.0f);
}

TEST(CSSTransform, translate_funky) {
  auto val =
      parseCSSProperty<CSSTransformFunction>("traNslAte( 4rem, \n20%  )");
  EXPECT_TRUE(std::holds_alternative<CSSTranslate>(val));
  auto& translate = std::get<CSSTranslate>(val);

  EXPECT_TRUE(std::holds_alternative<CSSLength>(translate.x));
  EXPECT_EQ(std::get<CSSLength>(translate.x).value, 4.0f);
  EXPECT_EQ(std::get<CSSLength>(translate.x).unit, CSSLengthUnit::Rem);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(translate.y));
  EXPECT_EQ(std::get<CSSPercentage>(translate.y).value, 20.0f);
}

TEST(CSSTransform, translate_default_y) {
  auto val = parseCSSProperty<CSSTransformFunction>("translate(4rem)");
  EXPECT_TRUE(std::holds_alternative<CSSTranslate>(val));
  auto& translate = std::get<CSSTranslate>(val);

  EXPECT_TRUE(std::holds_alternative<CSSLength>(translate.x));
  EXPECT_EQ(std::get<CSSLength>(translate.x).value, 4.0f);
  EXPECT_EQ(std::get<CSSLength>(translate.x).unit, CSSLengthUnit::Rem);

  EXPECT_TRUE(std::holds_alternative<CSSLength>(translate.y));
  EXPECT_EQ(std::get<CSSLength>(translate.y).value, 0.0f);
  EXPECT_EQ(std::get<CSSLength>(translate.y).unit, CSSLengthUnit::Px);
}

TEST(CSSTransform, translate_missing_value) {
  auto val = parseCSSProperty<CSSTransformFunction>("translate()");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, translate_extra_value) {
  auto val =
      parseCSSProperty<CSSTransformFunction>("translate(10px, 2px, 5px)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, translate_number) {
  auto val = parseCSSProperty<CSSTransformFunction>("translate(5)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, translate3d_basic) {
  auto val =
      parseCSSProperty<CSSTransformFunction>("translate3d(4rem, 20%, 2px)");
  EXPECT_TRUE(std::holds_alternative<CSSTranslate3D>(val));
  auto& translate = std::get<CSSTranslate3D>(val);

  EXPECT_TRUE(std::holds_alternative<CSSLength>(translate.x));
  EXPECT_EQ(std::get<CSSLength>(translate.x).value, 4.0f);
  EXPECT_EQ(std::get<CSSLength>(translate.x).unit, CSSLengthUnit::Rem);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(translate.y));
  EXPECT_EQ(std::get<CSSPercentage>(translate.y).value, 20.0f);

  EXPECT_EQ(translate.z.value, 2.0f);
  EXPECT_EQ(translate.z.unit, CSSLengthUnit::Px);
}

TEST(CSSTransform, translate3d_funky) {
  auto val = parseCSSProperty<CSSTransformFunction>(
      "translAte3D( 4rem   ,   20% ,  2px)");
  EXPECT_TRUE(std::holds_alternative<CSSTranslate3D>(val));
  auto& translate = std::get<CSSTranslate3D>(val);

  EXPECT_TRUE(std::holds_alternative<CSSLength>(translate.x));
  EXPECT_EQ(std::get<CSSLength>(translate.x).value, 4.0f);
  EXPECT_EQ(std::get<CSSLength>(translate.x).unit, CSSLengthUnit::Rem);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(translate.y));
  EXPECT_EQ(std::get<CSSPercentage>(translate.y).value, 20.0f);

  EXPECT_EQ(translate.z.value, 2.0f);
  EXPECT_EQ(translate.z.unit, CSSLengthUnit::Px);
}

TEST(CSSTransform, translate3d_missing_value) {
  auto val = parseCSSProperty<CSSTransformFunction>("translate3d(4rem, 20%)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, translate3d_extra_value) {
  auto val =
      parseCSSProperty<CSSTransformFunction>("ranslate3d(4rem, 20%, 2px, 6in)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, translate3d_numbers) {
  auto val = parseCSSProperty<CSSTransformFunction>("ranslate3d(4, 20, 2)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, translate_x_length) {
  auto val = parseCSSProperty<CSSTransformFunction>("translateX(900pt)");
  EXPECT_TRUE(std::holds_alternative<CSSTranslateX>(val));
  auto& translate = std::get<CSSTranslateX>(val);

  EXPECT_TRUE(std::holds_alternative<CSSLength>(translate.value));
  EXPECT_EQ(std::get<CSSLength>(translate.value).value, 900.0f);
  EXPECT_EQ(std::get<CSSLength>(translate.value).unit, CSSLengthUnit::Pt);
}

TEST(CSSTransform, translate_x_pct) {
  auto val = parseCSSProperty<CSSTransformFunction>("translateX(420%)");
  EXPECT_TRUE(std::holds_alternative<CSSTranslateX>(val));
  auto& translate = std::get<CSSTranslateX>(val);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(translate.value));
  EXPECT_EQ(std::get<CSSPercentage>(translate.value).value, 420.0f);
}

TEST(CSSTransform, translate_x_leading_dot) {
  auto val = parseCSSProperty<CSSTransformFunction>("translateX(.5px)");
  EXPECT_TRUE(std::holds_alternative<CSSTranslateX>(val));
  auto& translate = std::get<CSSTranslateX>(val);

  EXPECT_TRUE(std::holds_alternative<CSSLength>(translate.value));
  EXPECT_EQ(std::get<CSSLength>(translate.value).value, 0.5f);
  EXPECT_EQ(std::get<CSSLength>(translate.value).unit, CSSLengthUnit::Px);
}

TEST(CSSTransform, translate_x_funky) {
  auto val = parseCSSProperty<CSSTransformFunction>("transLaTeX(420%)");
  EXPECT_TRUE(std::holds_alternative<CSSTranslateX>(val));
  auto& translate = std::get<CSSTranslateX>(val);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(translate.value));
  EXPECT_EQ(std::get<CSSPercentage>(translate.value).value, 420.0f);
}

TEST(CSSTransform, translate_x_missing_value) {
  auto val = parseCSSProperty<CSSTransformFunction>("transLaTeX()");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, translate_x_extra_value) {
  auto val = parseCSSProperty<CSSTransformFunction>("transLaTeX(123cm, 45px)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, translate_x_number) {
  auto val = parseCSSProperty<CSSTransformFunction>("transLaTeX(456)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, translate_y_length) {
  auto val = parseCSSProperty<CSSTransformFunction>("translateY(900pt)");
  EXPECT_TRUE(std::holds_alternative<CSSTranslateY>(val));
  auto& translate = std::get<CSSTranslateY>(val);

  EXPECT_TRUE(std::holds_alternative<CSSLength>(translate.value));
  EXPECT_EQ(std::get<CSSLength>(translate.value).value, 900.0f);
  EXPECT_EQ(std::get<CSSLength>(translate.value).unit, CSSLengthUnit::Pt);
}

TEST(CSSTransform, translate_y_pct) {
  auto val = parseCSSProperty<CSSTransformFunction>("translateY(420%)");
  EXPECT_TRUE(std::holds_alternative<CSSTranslateY>(val));
  auto& translate = std::get<CSSTranslateY>(val);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(translate.value));
  EXPECT_EQ(std::get<CSSPercentage>(translate.value).value, 420.0f);
}

TEST(CSSTransform, translate_y_leading_dot) {
  auto val = parseCSSProperty<CSSTransformFunction>("translateY(-.25%)");
  EXPECT_TRUE(std::holds_alternative<CSSTranslateY>(val));
  auto& translate = std::get<CSSTranslateY>(val);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(translate.value));
  EXPECT_EQ(std::get<CSSPercentage>(translate.value).value, -0.25f);
}

TEST(CSSTransform, translate_y_funky) {
  auto val = parseCSSProperty<CSSTransformFunction>("transLaTeY(420%)");
  EXPECT_TRUE(std::holds_alternative<CSSTranslateY>(val));
  auto& translate = std::get<CSSTranslateY>(val);

  EXPECT_TRUE(std::holds_alternative<CSSPercentage>(translate.value));
  EXPECT_EQ(std::get<CSSPercentage>(translate.value).value, 420.0f);
}

TEST(CSSTransform, translate_y_missing_value) {
  auto val = parseCSSProperty<CSSTransformFunction>("transLaTeY()");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, translate_y_eytra_value) {
  auto val = parseCSSProperty<CSSTransformFunction>("transLaTeY(123cm, 45py)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, translate_y_number) {
  auto val = parseCSSProperty<CSSTransformFunction>("transLaTeY(456)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, scale_basic) {
  auto val = parseCSSProperty<CSSTransformFunction>("scale(0.9, 9001%)");
  EXPECT_TRUE(std::holds_alternative<CSSScale>(val));
  auto& scale = std::get<CSSScale>(val);

  EXPECT_EQ(scale.x, 0.9f);
  EXPECT_EQ(scale.y, 90.01f);
}

TEST(CSSTransform, scale_single_value) {
  auto val = parseCSSProperty<CSSTransformFunction>("scale(2.0)");
  EXPECT_TRUE(std::holds_alternative<CSSScale>(val));
  auto& scale = std::get<CSSScale>(val);

  EXPECT_EQ(scale.x, 2.0f);
  EXPECT_EQ(scale.y, 2.0f);
}

TEST(CSSTransform, scale_funky) {
  auto val = parseCSSProperty<CSSTransformFunction>("sCale(  0.9,  9001%)");
  EXPECT_TRUE(std::holds_alternative<CSSScale>(val));
  auto& scale = std::get<CSSScale>(val);

  EXPECT_EQ(scale.x, 0.9f);
  EXPECT_EQ(scale.y, 90.01f);
}

TEST(CSSTransform, scale_missing_value) {
  auto val = parseCSSProperty<CSSTransformFunction>("scale()");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, scale_extra_value) {
  auto val = parseCSSProperty<CSSTransformFunction>("scale(0.9, 9001%, 1.0)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, scale_length) {
  auto val = parseCSSProperty<CSSTransformFunction>("scale(0.9, 9001pt)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, scale_x_number) {
  auto val = parseCSSProperty<CSSTransformFunction>("scaleX(50)");
  EXPECT_TRUE(std::holds_alternative<CSSScaleX>(val));
  auto& scaleX = std::get<CSSScaleX>(val);

  EXPECT_EQ(scaleX.value, 50.0f);
}

TEST(CSSTransform, scale_x_pct) {
  auto val = parseCSSProperty<CSSTransformFunction>("scaleX(50%)");
  EXPECT_TRUE(std::holds_alternative<CSSScaleX>(val));
  auto& scaleX = std::get<CSSScaleX>(val);

  EXPECT_EQ(scaleX.value, 0.5f);
}

TEST(CSSTransform, scale_x_funky) {
  auto val = parseCSSProperty<CSSTransformFunction>("scaLeX(50%)");
  EXPECT_TRUE(std::holds_alternative<CSSScaleX>(val));
  auto& scaleX = std::get<CSSScaleX>(val);

  EXPECT_EQ(scaleX.value, 0.5f);
}

TEST(CSSTransform, scale_x_missing_value) {
  auto val = parseCSSProperty<CSSTransformFunction>("scaLeX()");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, scale_x_extra_value) {
  auto val = parseCSSProperty<CSSTransformFunction>("scaLeX(50%, 50%)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, scale_x_length) {
  auto val = parseCSSProperty<CSSTransformFunction>("scaLeX(50pt)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, scale_y_number) {
  auto val = parseCSSProperty<CSSTransformFunction>("scaleY(50)");
  EXPECT_TRUE(std::holds_alternative<CSSScaleY>(val));
  auto& scaleY = std::get<CSSScaleY>(val);

  EXPECT_EQ(scaleY.value, 50.0f);
}

TEST(CSSTransform, scale_y_pct) {
  auto val = parseCSSProperty<CSSTransformFunction>("scaleY(50%)");
  EXPECT_TRUE(std::holds_alternative<CSSScaleY>(val));
  auto& scaleY = std::get<CSSScaleY>(val);

  EXPECT_EQ(scaleY.value, 0.5f);
}

TEST(CSSTransform, scale_y_funky) {
  auto val = parseCSSProperty<CSSTransformFunction>("scaLeY(50%)");
  EXPECT_TRUE(std::holds_alternative<CSSScaleY>(val));
  auto& scaleY = std::get<CSSScaleY>(val);

  EXPECT_EQ(scaleY.value, 0.5f);
}

TEST(CSSTransform, scale_y_missing_value) {
  auto val = parseCSSProperty<CSSTransformFunction>("scaLeY()");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, scale_y_eytra_value) {
  auto val = parseCSSProperty<CSSTransformFunction>("scaLeY(50%, 50%)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, scale_y_length) {
  auto val = parseCSSProperty<CSSTransformFunction>("scaLeY(50pt)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, rotate_basic) {
  auto val = parseCSSProperty<CSSTransformFunction>("rotate(90deg)");
  EXPECT_TRUE(std::holds_alternative<CSSRotate>(val));
  auto& rotate = std::get<CSSRotate>(val);

  EXPECT_EQ(rotate.degrees, 90.0f);
}

TEST(CSSTransform, rotate_turn) {
  auto val = parseCSSProperty<CSSTransformFunction>("rotate(1turn)");
  EXPECT_TRUE(std::holds_alternative<CSSRotate>(val));
  auto& rotate = std::get<CSSRotate>(val);

  EXPECT_EQ(rotate.degrees, 360.0f);
}

TEST(CSSTransform, rotate_zero) {
  auto val = parseCSSProperty<CSSTransformFunction>("rotate(0)");
  EXPECT_TRUE(std::holds_alternative<CSSRotate>(val));
  auto& rotate = std::get<CSSRotate>(val);

  EXPECT_EQ(rotate.degrees, 0.0f);
}

TEST(CSSTransform, rotate_z) {
  auto val = parseCSSProperty<CSSTransformFunction>("rotateZ(90deg)");
  EXPECT_TRUE(std::holds_alternative<CSSRotateZ>(val));
  auto& rotate = std::get<CSSRotateZ>(val);

  EXPECT_EQ(rotate.degrees, 90.0f);
}

TEST(CSSTransform, rotate_funky) {
  auto val = parseCSSProperty<CSSTransformFunction>("roTate(90deg)");
  EXPECT_TRUE(std::holds_alternative<CSSRotate>(val));
  auto& rotate = std::get<CSSRotate>(val);

  EXPECT_EQ(rotate.degrees, 90.0f);
}

TEST(CSSTransform, rotate_missing_value) {
  auto val = parseCSSProperty<CSSTransformFunction>("roTate()");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, rotate_extra_value) {
  auto val = parseCSSProperty<CSSTransformFunction>("roTate(90deg, 90deg)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, rotate_number) {
  auto val = parseCSSProperty<CSSTransformFunction>("roTate(90)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, rotate_x_basic) {
  auto val = parseCSSProperty<CSSTransformFunction>("rotateX(90deg)");
  EXPECT_TRUE(std::holds_alternative<CSSRotateX>(val));
  auto& rotate = std::get<CSSRotateX>(val);

  EXPECT_EQ(rotate.degrees, 90.0f);
}

TEST(CSSTransform, rotate_x_turn) {
  auto val = parseCSSProperty<CSSTransformFunction>("rotateX(1turn)");
  EXPECT_TRUE(std::holds_alternative<CSSRotateX>(val));
  auto& rotate = std::get<CSSRotateX>(val);

  EXPECT_EQ(rotate.degrees, 360.0f);
}

TEST(CSSTransform, rotate_x_zero) {
  auto val = parseCSSProperty<CSSTransformFunction>("rotateX(0)");
  EXPECT_TRUE(std::holds_alternative<CSSRotateX>(val));
  auto& rotate = std::get<CSSRotateX>(val);

  EXPECT_EQ(rotate.degrees, 0.0f);
}

TEST(CSSTransform, rotate_x_funky) {
  auto val = parseCSSProperty<CSSTransformFunction>("roTateX(90deg)");
  EXPECT_TRUE(std::holds_alternative<CSSRotateX>(val));
  auto& rotate = std::get<CSSRotateX>(val);

  EXPECT_EQ(rotate.degrees, 90.0f);
}

TEST(CSSTransform, rotate_x_missing_value) {
  auto val = parseCSSProperty<CSSTransformFunction>("roTateX()");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, rotate_x_extra_value) {
  auto val = parseCSSProperty<CSSTransformFunction>("roTateX(90deg, 90deg)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, rotate_x_number) {
  auto val = parseCSSProperty<CSSTransformFunction>("roTateX(90)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, rotate_y_basic) {
  auto val = parseCSSProperty<CSSTransformFunction>("rotateY(90deg)");
  EXPECT_TRUE(std::holds_alternative<CSSRotateY>(val));
  auto& rotate = std::get<CSSRotateY>(val);

  EXPECT_EQ(rotate.degrees, 90.0f);
}

TEST(CSSTransform, rotate_y_turn) {
  auto val = parseCSSProperty<CSSTransformFunction>("rotateY(1turn)");
  EXPECT_TRUE(std::holds_alternative<CSSRotateY>(val));
  auto& rotate = std::get<CSSRotateY>(val);

  EXPECT_EQ(rotate.degrees, 360.0f);
}

TEST(CSSTransform, rotate_y_zero) {
  auto val = parseCSSProperty<CSSTransformFunction>("rotateY(0)");
  EXPECT_TRUE(std::holds_alternative<CSSRotateY>(val));
  auto& rotate = std::get<CSSRotateY>(val);

  EXPECT_EQ(rotate.degrees, 0.0f);
}

TEST(CSSTransform, rotate_y_funky) {
  auto val = parseCSSProperty<CSSTransformFunction>("roTateY(90deg)");
  EXPECT_TRUE(std::holds_alternative<CSSRotateY>(val));
  auto& rotate = std::get<CSSRotateY>(val);

  EXPECT_EQ(rotate.degrees, 90.0f);
}

TEST(CSSTransform, rotate_y_missing_value) {
  auto val = parseCSSProperty<CSSTransformFunction>("roTateY()");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, rotate_y_extra_value) {
  auto val = parseCSSProperty<CSSTransformFunction>("roTateY(90deg, 90deg)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, rotate_y_number) {
  auto val = parseCSSProperty<CSSTransformFunction>("roTateY(90)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, skew_x_basic) {
  auto val = parseCSSProperty<CSSTransformFunction>("skewX(90deg)");
  EXPECT_TRUE(std::holds_alternative<CSSSkewX>(val));
  auto& skew = std::get<CSSSkewX>(val);

  EXPECT_EQ(skew.degrees, 90.0f);
}

TEST(CSSTransform, skew_x_turn) {
  auto val = parseCSSProperty<CSSTransformFunction>("skewX(1turn)");
  EXPECT_TRUE(std::holds_alternative<CSSSkewX>(val));
  auto& skew = std::get<CSSSkewX>(val);

  EXPECT_EQ(skew.degrees, 360.0f);
}

TEST(CSSTransform, skew_x_zero) {
  auto val = parseCSSProperty<CSSTransformFunction>("skewX(0)");
  EXPECT_TRUE(std::holds_alternative<CSSSkewX>(val));
  auto& skew = std::get<CSSSkewX>(val);

  EXPECT_EQ(skew.degrees, 0.0f);
}

TEST(CSSTransform, skew_x_funky) {
  auto val = parseCSSProperty<CSSTransformFunction>("skeWx(90deg)");
  EXPECT_TRUE(std::holds_alternative<CSSSkewX>(val));
  auto& skew = std::get<CSSSkewX>(val);

  EXPECT_EQ(skew.degrees, 90.0f);
}

TEST(CSSTransform, skew_x_missing_value) {
  auto val = parseCSSProperty<CSSTransformFunction>("skeWx()");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, skew_x_extra_value) {
  auto val = parseCSSProperty<CSSTransformFunction>("skeWx(90deg, 90deg)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, skew_x_number) {
  auto val = parseCSSProperty<CSSTransformFunction>("skeWx(90)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, skew_y_basic) {
  auto val = parseCSSProperty<CSSTransformFunction>("skewY(90deg)");
  EXPECT_TRUE(std::holds_alternative<CSSSkewY>(val));
  auto& skew = std::get<CSSSkewY>(val);

  EXPECT_EQ(skew.degrees, 90.0f);
}

TEST(CSSTransform, skew_y_turn) {
  auto val = parseCSSProperty<CSSTransformFunction>("skewY(1turn)");
  EXPECT_TRUE(std::holds_alternative<CSSSkewY>(val));
  auto& skew = std::get<CSSSkewY>(val);

  EXPECT_EQ(skew.degrees, 360.0f);
}

TEST(CSSTransform, skew_y_zero) {
  auto val = parseCSSProperty<CSSTransformFunction>("skewY(0)");
  EXPECT_TRUE(std::holds_alternative<CSSSkewY>(val));
  auto& skew = std::get<CSSSkewY>(val);

  EXPECT_EQ(skew.degrees, 0.0f);
}

TEST(CSSTransform, skew_y_funky) {
  auto val = parseCSSProperty<CSSTransformFunction>("skeWy(90deg)");
  EXPECT_TRUE(std::holds_alternative<CSSSkewY>(val));
  auto& skew = std::get<CSSSkewY>(val);

  EXPECT_EQ(skew.degrees, 90.0f);
}

TEST(CSSTransform, skew_y_missing_value) {
  auto val = parseCSSProperty<CSSTransformFunction>("skeWy()");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, skew_y_extra_value) {
  auto val = parseCSSProperty<CSSTransformFunction>("skeWy(90deg, 90deg)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, skew_y_number) {
  auto val = parseCSSProperty<CSSTransformFunction>("skeWy(90)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, perspective_basic) {
  auto val = parseCSSProperty<CSSTransformFunction>("perspective(1000px)");
  EXPECT_TRUE(std::holds_alternative<CSSPerspective>(val));
  auto& perspective = std::get<CSSPerspective>(val);

  EXPECT_EQ(perspective.length.value, 1000.0f);
  EXPECT_EQ(perspective.length.unit, CSSLengthUnit::Px);
}

TEST(CSSTransform, perspective_zero) {
  auto val = parseCSSProperty<CSSTransformFunction>("perspective(0)");
  EXPECT_TRUE(std::holds_alternative<CSSPerspective>(val));
  auto& perspective = std::get<CSSPerspective>(val);

  EXPECT_EQ(perspective.length.value, 0.0f);
  EXPECT_EQ(perspective.length.unit, CSSLengthUnit::Px);
}

TEST(CSSTransform, perspective_negative) {
  auto val = parseCSSProperty<CSSTransformFunction>("perspective(-1000px)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, perspective_funky) {
  auto val = parseCSSProperty<CSSTransformFunction>("perspectivE(1000px)");
  EXPECT_TRUE(std::holds_alternative<CSSPerspective>(val));
  auto& perspective = std::get<CSSPerspective>(val);

  EXPECT_EQ(perspective.length.value, 1000.0f);
  EXPECT_EQ(perspective.length.unit, CSSLengthUnit::Px);
}

TEST(CSSTransform, perspective_missing_value) {
  auto val = parseCSSProperty<CSSTransformFunction>("perspectivE()");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, perspective_extra_value) {
  auto val =
      parseCSSProperty<CSSTransformFunction>("perspectivE(1000px, 1000px)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, perspective_number) {
  auto val = parseCSSProperty<CSSTransformFunction>("perspectivE(1000)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, transform_list) {
  auto val = parseCSSProperty<CSSTransformList>(
      "translate(100px, 200px) rotate(90deg) scale(2)");
  EXPECT_TRUE(std::holds_alternative<CSSTransformList>(val));
  auto& transformList = std::get<CSSTransformList>(val);

  EXPECT_EQ(transformList.size(), 3);
  EXPECT_TRUE(std::holds_alternative<CSSTranslate>(transformList[0]));
  EXPECT_TRUE(std::holds_alternative<CSSRotate>(transformList[1]));
  EXPECT_TRUE(std::holds_alternative<CSSScale>(transformList[2]));

  auto& translate = std::get<CSSTranslate>(transformList[0]);
  EXPECT_TRUE(std::holds_alternative<CSSLength>(translate.x));
  EXPECT_TRUE(std::holds_alternative<CSSLength>(translate.y));

  EXPECT_EQ(std::get<CSSLength>(translate.x).value, 100.0f);
  EXPECT_EQ(std::get<CSSLength>(translate.y).value, 200.0f);
  EXPECT_EQ(std::get<CSSLength>(translate.x).unit, CSSLengthUnit::Px);
  EXPECT_EQ(std::get<CSSLength>(translate.y).unit, CSSLengthUnit::Px);

  auto& rotate = std::get<CSSRotate>(transformList[1]);
  EXPECT_EQ(rotate.degrees, 90.0f);

  auto& scale = std::get<CSSScale>(transformList[2]);
  EXPECT_EQ(scale.x, 2.0f);
  EXPECT_EQ(scale.y, 2.0f);
}

TEST(CSSTransform, transform_list_comma_delimeter) {
  auto val = parseCSSProperty<CSSTransformList>(
      "translate(100px, 200px), rotate(90deg), scale(2)");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

TEST(CSSTransform, transform_list_empty) {
  auto val = parseCSSProperty<CSSTransformList>("");
  EXPECT_TRUE(std::holds_alternative<std::monostate>(val));
}

} // namespace facebook::react

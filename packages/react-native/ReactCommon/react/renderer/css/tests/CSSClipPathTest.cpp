/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/css/CSSClipPath.h>

namespace facebook::react {

class CSSClipPathTest : public ::testing::Test {};

TEST_F(CSSClipPathTest, InsetSingleValue) {
  auto result = parseCSSProperty<CSSClipPath>("inset(10px)");
  decltype(result) expected = CSSClipPath{
      .shape = CSSInsetShape{
          .top = CSSLength{.value = 10.0f, .unit = CSSLengthUnit::Px},
          .right = CSSLength{.value = 10.0f, .unit = CSSLengthUnit::Px},
          .bottom = CSSLength{.value = 10.0f, .unit = CSSLengthUnit::Px},
          .left = CSSLength{.value = 10.0f, .unit = CSSLengthUnit::Px}}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, InsetTwoValues) {
  auto result = parseCSSProperty<CSSClipPath>("inset(10px 20px)");
  decltype(result) expected = CSSClipPath{
      .shape = CSSInsetShape{
          .top = CSSLength{.value = 10.0f, .unit = CSSLengthUnit::Px},
          .right = CSSLength{.value = 20.0f, .unit = CSSLengthUnit::Px},
          .bottom = CSSLength{.value = 10.0f, .unit = CSSLengthUnit::Px},
          .left = CSSLength{.value = 20.0f, .unit = CSSLengthUnit::Px}}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, InsetThreeValues) {
  auto result = parseCSSProperty<CSSClipPath>("inset(10px 20px 30px)");
  decltype(result) expected = CSSClipPath{
      .shape = CSSInsetShape{
          .top = CSSLength{.value = 10.0f, .unit = CSSLengthUnit::Px},
          .right = CSSLength{.value = 20.0f, .unit = CSSLengthUnit::Px},
          .bottom = CSSLength{.value = 30.0f, .unit = CSSLengthUnit::Px},
          .left = CSSLength{.value = 20.0f, .unit = CSSLengthUnit::Px}}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, InsetFourValues) {
  auto result = parseCSSProperty<CSSClipPath>("inset(10px 20px 30px 40px)");
  decltype(result) expected = CSSClipPath{
      .shape = CSSInsetShape{
          .top = CSSLength{.value = 10.0f, .unit = CSSLengthUnit::Px},
          .right = CSSLength{.value = 20.0f, .unit = CSSLengthUnit::Px},
          .bottom = CSSLength{.value = 30.0f, .unit = CSSLengthUnit::Px},
          .left = CSSLength{.value = 40.0f, .unit = CSSLengthUnit::Px}}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, InsetWithPercentage) {
  auto result = parseCSSProperty<CSSClipPath>("inset(10%)");
  decltype(result) expected = CSSClipPath{
      .shape = CSSInsetShape{
          .top = CSSPercentage{.value = 10.0f},
          .right = CSSPercentage{.value = 10.0f},
          .bottom = CSSPercentage{.value = 10.0f},
          .left = CSSPercentage{.value = 10.0f}}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, InsetWithBorderRadius) {
  auto result = parseCSSProperty<CSSClipPath>("inset(10px round 5px)");
  decltype(result) expected = CSSClipPath{
      .shape = CSSInsetShape{
          .top = CSSLength{.value = 10.0f, .unit = CSSLengthUnit::Px},
          .right = CSSLength{.value = 10.0f, .unit = CSSLengthUnit::Px},
          .bottom = CSSLength{.value = 10.0f, .unit = CSSLengthUnit::Px},
          .left = CSSLength{.value = 10.0f, .unit = CSSLengthUnit::Px},
          .borderRadius = CSSLength{.value = 5.0f, .unit = CSSLengthUnit::Px}}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, CircleWithoutRadius) {
  auto result = parseCSSProperty<CSSClipPath>("circle()");
  decltype(result) expected =
      CSSClipPath{.shape = CSSCircleShape{.radius = std::nullopt}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, CircleWithRadius) {
  auto result = parseCSSProperty<CSSClipPath>("circle(50px)");
  decltype(result) expected = CSSClipPath{
      .shape = CSSCircleShape{
          .radius = CSSLength{.value = 50.0f, .unit = CSSLengthUnit::Px}}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, CircleWithPercentageRadius) {
  auto result = parseCSSProperty<CSSClipPath>("circle(25%)");
  decltype(result) expected = CSSClipPath{
      .shape = CSSCircleShape{.radius = CSSPercentage{.value = 25.0f}}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, CircleWithPosition) {
  auto result = parseCSSProperty<CSSClipPath>("circle(50px at 100px 100px)");
  decltype(result) expected = CSSClipPath{
      .shape = CSSCircleShape{
          .radius = CSSLength{.value = 50.0f, .unit = CSSLengthUnit::Px},
          .cx = CSSLength{.value = 100.0f, .unit = CSSLengthUnit::Px},
          .cy = CSSLength{.value = 100.0f, .unit = CSSLengthUnit::Px}}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, CircleWithPercentagePosition) {
  auto result = parseCSSProperty<CSSClipPath>("circle(50px at 25% 75%)");
  decltype(result) expected = CSSClipPath{
      .shape = CSSCircleShape{
          .radius = CSSLength{.value = 50.0f, .unit = CSSLengthUnit::Px},
          .cx = CSSPercentage{.value = 25.0f},
          .cy = CSSPercentage{.value = 75.0f}}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, EllipseWithoutRadii) {
  auto result = parseCSSProperty<CSSClipPath>("ellipse()");
  decltype(result) expected = CSSClipPath{
      .shape = CSSEllipseShape{.rx = std::nullopt, .ry = std::nullopt}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, EllipseWithOneRadius) {
  auto result = parseCSSProperty<CSSClipPath>("ellipse(50px)");
  decltype(result) expected = CSSClipPath{
      .shape = CSSEllipseShape{
          .rx = CSSLength{.value = 50.0f, .unit = CSSLengthUnit::Px},
          .ry = CSSLength{.value = 50.0f, .unit = CSSLengthUnit::Px}}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, EllipseWithTwoRadii) {
  auto result = parseCSSProperty<CSSClipPath>("ellipse(50px 25px)");
  decltype(result) expected = CSSClipPath{
      .shape = CSSEllipseShape{
          .rx = CSSLength{.value = 50.0f, .unit = CSSLengthUnit::Px},
          .ry = CSSLength{.value = 25.0f, .unit = CSSLengthUnit::Px}}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, EllipseWithPosition) {
  auto result = parseCSSProperty<CSSClipPath>("ellipse(50px 25px at 100px 100px)");
  decltype(result) expected = CSSClipPath{
      .shape = CSSEllipseShape{
          .rx = CSSLength{.value = 50.0f, .unit = CSSLengthUnit::Px},
          .ry = CSSLength{.value = 25.0f, .unit = CSSLengthUnit::Px},
          .cx = CSSLength{.value = 100.0f, .unit = CSSLengthUnit::Px},
          .cy = CSSLength{.value = 100.0f, .unit = CSSLengthUnit::Px}}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, EllipseWithPercentagePosition) {
  auto result = parseCSSProperty<CSSClipPath>("ellipse(50px 25px at 10% 20%)");
  decltype(result) expected = CSSClipPath{
      .shape = CSSEllipseShape{
          .rx = CSSLength{.value = 50.0f, .unit = CSSLengthUnit::Px},
          .ry = CSSLength{.value = 25.0f, .unit = CSSLengthUnit::Px},
          .cx = CSSPercentage{.value = 10.0f},
          .cy = CSSPercentage{.value = 20.0f}}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, PolygonBasic) {
  auto result =
      parseCSSProperty<CSSClipPath>("polygon(0px 0px, 100px 0px, 100px 100px)");
  decltype(result) expected = CSSClipPath{
      .shape = CSSPolygonShape{
          .points = {
              {CSSLength{.value = 0.0f, .unit = CSSLengthUnit::Px},
               CSSLength{.value = 0.0f, .unit = CSSLengthUnit::Px}},
              {CSSLength{.value = 100.0f, .unit = CSSLengthUnit::Px},
               CSSLength{.value = 0.0f, .unit = CSSLengthUnit::Px}},
              {CSSLength{.value = 100.0f, .unit = CSSLengthUnit::Px},
               CSSLength{.value = 100.0f, .unit = CSSLengthUnit::Px}},
          }}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, PolygonWithPercentages) {
  auto result = parseCSSProperty<CSSClipPath>(
      "polygon(0% 0%, 100% 0%, 50% 100%) border-box");
  decltype(result) expected = CSSClipPath{
      .shape =
          CSSPolygonShape{
              .points =
                  {
                      {CSSPercentage{.value = 0.0f},
                       CSSPercentage{.value = 0.0f}},
                      {CSSPercentage{.value = 100.0f},
                       CSSPercentage{.value = 0.0f}},
                      {CSSPercentage{.value = 50.0f},
                       CSSPercentage{.value = 100.0f}},
                  }},
      .geometryBox = CSSGeometryBox::BorderBox};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, PolygonWithEvenOdd) {
  auto result = parseCSSProperty<CSSClipPath>(
      "polygon(evenodd, 0px 0px, 100px 0px, 100px 100px)");
  decltype(result) expected = CSSClipPath{
      .shape = CSSPolygonShape{
          .points =
              {
                  {CSSLength{.value = 0.0f, .unit = CSSLengthUnit::Px},
                   CSSLength{.value = 0.0f, .unit = CSSLengthUnit::Px}},
                  {CSSLength{.value = 100.0f, .unit = CSSLengthUnit::Px},
                   CSSLength{.value = 0.0f, .unit = CSSLengthUnit::Px}},
                  {CSSLength{.value = 100.0f, .unit = CSSLengthUnit::Px},
                   CSSLength{.value = 100.0f, .unit = CSSLengthUnit::Px}},
              },
          .fillRule = CSSFillRule::EvenOdd,
      }};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, PolygonWithInvalidFillRule) {
  auto result = parseCSSProperty<CSSClipPath>(
      "polygon(invalid, 0px 0px, 100px 0px, 100px 100px)");
  ASSERT_TRUE(std::holds_alternative<std::monostate>(result));
}
TEST_F(CSSClipPathTest, GeometryBoxBorderBox) {
  auto result = parseCSSProperty<CSSClipPath>("border-box");
  decltype(result) expected =
      CSSClipPath{.geometryBox = CSSGeometryBox::BorderBox};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, GeometryBoxPaddingBox) {
  auto result = parseCSSProperty<CSSClipPath>("padding-box");
  decltype(result) expected =
      CSSClipPath{.geometryBox = CSSGeometryBox::PaddingBox};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, GeometryBoxContentBox) {
  auto result = parseCSSProperty<CSSClipPath>("content-box");
  decltype(result) expected =
      CSSClipPath{.geometryBox = CSSGeometryBox::ContentBox};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, GeometryBoxMarginBox) {
  auto result = parseCSSProperty<CSSClipPath>("margin-box");
  decltype(result) expected =
      CSSClipPath{.geometryBox = CSSGeometryBox::MarginBox};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, GeometryBoxFillBox) {
  auto result = parseCSSProperty<CSSClipPath>("fill-box");
  decltype(result) expected =
      CSSClipPath{.geometryBox = CSSGeometryBox::FillBox};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, GeometryBoxStrokeBox) {
  auto result = parseCSSProperty<CSSClipPath>("stroke-box");
  decltype(result) expected =
      CSSClipPath{.geometryBox = CSSGeometryBox::StrokeBox};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, GeometryBoxViewBox) {
  auto result = parseCSSProperty<CSSClipPath>("view-box");
  decltype(result) expected =
      CSSClipPath{.geometryBox = CSSGeometryBox::ViewBox};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, InvalidInsetTooManyValues) {
  auto result =
      parseCSSProperty<CSSClipPath>("inset(10px 20px 30px 40px 50px)");
  ASSERT_TRUE(std::holds_alternative<std::monostate>(result));
}

TEST_F(CSSClipPathTest, InvalidCircleWithInvalidRadius) {
  auto result = parseCSSProperty<CSSClipPath>("circle(invalid)");
  ASSERT_TRUE(std::holds_alternative<std::monostate>(result));
}

TEST_F(CSSClipPathTest, InvalidPolygonTooFewPoints) {
  auto result = parseCSSProperty<CSSClipPath>("polygon(0px 0px)");
  ASSERT_TRUE(std::holds_alternative<std::monostate>(result));
}

TEST_F(CSSClipPathTest, InvalidPolygonOddValues) {
  auto result = parseCSSProperty<CSSClipPath>("polygon(0px 0px, 100px)");
  ASSERT_TRUE(std::holds_alternative<std::monostate>(result));
}

TEST_F(CSSClipPathTest, RectBasic) {
  auto result = parseCSSProperty<CSSClipPath>("rect(10px 20px 30px 40px)");
  decltype(result) expected = CSSClipPath{
      .shape = CSSRectShape{
          .top = CSSLength{.value = 10.0f, .unit = CSSLengthUnit::Px},
          .right = CSSLength{.value = 20.0f, .unit = CSSLengthUnit::Px},
          .bottom = CSSLength{.value = 30.0f, .unit = CSSLengthUnit::Px},
          .left = CSSLength{.value = 40.0f, .unit = CSSLengthUnit::Px}}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, RectWithBorderRadius) {
  auto result = parseCSSProperty<CSSClipPath>("rect(10px 20px 30px 40px round 5px)");
  decltype(result) expected = CSSClipPath{
      .shape = CSSRectShape{
          .top = CSSLength{.value = 10.0f, .unit = CSSLengthUnit::Px},
          .right = CSSLength{.value = 20.0f, .unit = CSSLengthUnit::Px},
          .bottom = CSSLength{.value = 30.0f, .unit = CSSLengthUnit::Px},
          .left = CSSLength{.value = 40.0f, .unit = CSSLengthUnit::Px},
          .borderRadius = CSSLength{.value = 5.0f, .unit = CSSLengthUnit::Px}}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, RectWithAutoKeyword) {
  auto result = parseCSSProperty<CSSClipPath>("rect(auto auto auto auto)");
  decltype(result) expected = CSSClipPath{
      .shape = CSSRectShape{
          .top = CSSPercentage{.value = 0.0f},
          .right = CSSPercentage{.value = 100.0f},
          .bottom = CSSPercentage{.value = 100.0f},
          .left = CSSPercentage{.value = 0.0f}}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, XywhBasic) {
  auto result = parseCSSProperty<CSSClipPath>("xywh(10px 20px 100px 50px)");
  decltype(result) expected = CSSClipPath{
      .shape = CSSXywhShape{
          .x = CSSLength{.value = 10.0f, .unit = CSSLengthUnit::Px},
          .y = CSSLength{.value = 20.0f, .unit = CSSLengthUnit::Px},
          .width = CSSLength{.value = 100.0f, .unit = CSSLengthUnit::Px},
          .height = CSSLength{.value = 50.0f, .unit = CSSLengthUnit::Px}}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, XywhWithBorderRadius) {
  auto result = parseCSSProperty<CSSClipPath>("xywh(10px 20px 100px 50px round 5px)");
  decltype(result) expected = CSSClipPath{
      .shape = CSSXywhShape{
          .x = CSSLength{.value = 10.0f, .unit = CSSLengthUnit::Px},
          .y = CSSLength{.value = 20.0f, .unit = CSSLengthUnit::Px},
          .width = CSSLength{.value = 100.0f, .unit = CSSLengthUnit::Px},
          .height = CSSLength{.value = 50.0f, .unit = CSSLengthUnit::Px},
          .borderRadius = CSSLength{.value = 5.0f, .unit = CSSLengthUnit::Px}}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, XywhWithPercentages) {
  auto result = parseCSSProperty<CSSClipPath>("xywh(10% 20% 100% 50%)");
  decltype(result) expected = CSSClipPath{
      .shape = CSSXywhShape{
          .x = CSSPercentage{.value = 10.0f},
          .y = CSSPercentage{.value = 20.0f},
          .width = CSSPercentage{.value = 100.0f},
          .height = CSSPercentage{.value = 50.0f}}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, InvalidGeometryBox) {
  auto result = parseCSSProperty<CSSClipPath>("invalid-box");
  ASSERT_TRUE(std::holds_alternative<std::monostate>(result));
}

TEST_F(CSSClipPathTest, InvalidRectWrongNumberOfValues) {
  auto result = parseCSSProperty<CSSClipPath>("rect(10px 20px)");
  ASSERT_TRUE(std::holds_alternative<std::monostate>(result));
}

TEST_F(CSSClipPathTest, InvalidXywhWrongNumberOfValues) {
  auto result = parseCSSProperty<CSSClipPath>("xywh(10px 20px)");
  ASSERT_TRUE(std::holds_alternative<std::monostate>(result));
}

TEST_F(CSSClipPathTest, InvalidEllipseWithInvalidRadii) {
  auto result = parseCSSProperty<CSSClipPath>("ellipse(invalid)");
  ASSERT_TRUE(std::holds_alternative<std::monostate>(result));
}

TEST_F(CSSClipPathTest, CaseInsensitive) {
  auto result = parseCSSProperty<CSSClipPath>("InSeT(10Px)");
  decltype(result) expected = CSSClipPath{
      .shape = CSSInsetShape{
          .top = CSSLength{.value = 10.0f, .unit = CSSLengthUnit::Px},
          .right = CSSLength{.value = 10.0f, .unit = CSSLengthUnit::Px},
          .bottom = CSSLength{.value = 10.0f, .unit = CSSLengthUnit::Px},
          .left = CSSLength{.value = 10.0f, .unit = CSSLengthUnit::Px}}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, WhitespaceHandling) {
  auto result = parseCSSProperty<CSSClipPath>("  inset(  10px   20px   )  ");
  decltype(result) expected = CSSClipPath{
      .shape = CSSInsetShape{
          .top = CSSLength{.value = 10.0f, .unit = CSSLengthUnit::Px},
          .right = CSSLength{.value = 20.0f, .unit = CSSLengthUnit::Px},
          .bottom = CSSLength{.value = 10.0f, .unit = CSSLengthUnit::Px},
          .left = CSSLength{.value = 20.0f, .unit = CSSLengthUnit::Px}}};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, CircleWithGeometryBox) {
  auto result = parseCSSProperty<CSSClipPath>("circle(50px) padding-box");
  decltype(result) expected = CSSClipPath{
      .shape =
          CSSCircleShape{
              .radius = CSSLength{.value = 50.0f, .unit = CSSLengthUnit::Px}},
      .geometryBox = CSSGeometryBox::PaddingBox};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, GeometryBoxThenCircle) {
  auto result = parseCSSProperty<CSSClipPath>("content-box circle(50px)");
  decltype(result) expected = CSSClipPath{
      .shape =
          CSSCircleShape{
              .radius = CSSLength{.value = 50.0f, .unit = CSSLengthUnit::Px}},
      .geometryBox = CSSGeometryBox::ContentBox};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, InsetWithGeometryBox) {
  auto result = parseCSSProperty<CSSClipPath>("inset(10px 20px) border-box");
  decltype(result) expected = CSSClipPath{
      .shape =
          CSSInsetShape{
              .top = CSSLength{.value = 10.0f, .unit = CSSLengthUnit::Px},
              .right = CSSLength{.value = 20.0f, .unit = CSSLengthUnit::Px},
              .bottom = CSSLength{.value = 10.0f, .unit = CSSLengthUnit::Px},
              .left = CSSLength{.value = 20.0f, .unit = CSSLengthUnit::Px}},
      .geometryBox = CSSGeometryBox::BorderBox};
  ASSERT_EQ(result, expected);
}

TEST_F(CSSClipPathTest, GeometryBoxThenInset) {
  auto result = parseCSSProperty<CSSClipPath>("margin-box inset(10px 20px)");
  decltype(result) expected = CSSClipPath{
      .shape =
          CSSInsetShape{
              .top = CSSLength{.value = 10.0f, .unit = CSSLengthUnit::Px},
              .right = CSSLength{.value = 20.0f, .unit = CSSLengthUnit::Px},
              .bottom = CSSLength{.value = 10.0f, .unit = CSSLengthUnit::Px},
              .left = CSSLength{.value = 20.0f, .unit = CSSLengthUnit::Px}},
      .geometryBox = CSSGeometryBox::MarginBox};
  ASSERT_EQ(result, expected);
}

} // namespace facebook::react

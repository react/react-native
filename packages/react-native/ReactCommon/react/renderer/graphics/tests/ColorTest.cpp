/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/graphics/Color.h>

#include <gtest/gtest.h>

TEST(ColorTest, testColorConversion) {
  using namespace facebook::react;
  {
    auto color = colorFromRGBA(255, 0, 15, 17);

    EXPECT_EQ(alphaFromColor(color), 17);
    EXPECT_EQ(redFromColor(color), 255);
    EXPECT_EQ(greenFromColor(color), 0);
    EXPECT_EQ(blueFromColor(color), 15);
  }

  {
    auto color = colorFromComponents(
        {.red = 0.1f, .green = 0.2f, .blue = 0, .alpha = 0.3f});

    EXPECT_EQ(alphaFromColor(color), std::round(255 * 0.3f));
    EXPECT_EQ(redFromColor(color), std::round(255 * 0.1f));
    EXPECT_EQ(greenFromColor(color), 255 * 0.2f);
    EXPECT_EQ(blueFromColor(color), 0.f);

    auto colorComponents = colorComponentsFromColor(color);
    EXPECT_EQ(std::round(colorComponents.alpha * 10) / 10.f, 0.3f);
    EXPECT_EQ(std::round(colorComponents.red * 10) / 10.f, 0.1f);
    EXPECT_EQ(std::round(colorComponents.green * 10) / 10.f, 0.2f);
    EXPECT_EQ(std::round(colorComponents.blue * 10) / 10.f, 0);
  }
}

#ifdef ANDROID
TEST(ColorTest, testTransparentColorIsDistinctFromUndefined) {
  using namespace facebook::react;

  EXPECT_NE(Color{}, Color{0});

  SharedColor undefinedColor;
  auto transparentColor = clearColor();

  EXPECT_FALSE(undefinedColor);
  EXPECT_TRUE(transparentColor);
  EXPECT_NE(undefinedColor, transparentColor);
}
#endif

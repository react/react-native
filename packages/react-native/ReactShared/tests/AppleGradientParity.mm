/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTGradientUtils.h>
#import <react/renderer/graphics/RCTPlatformColorUtils.h>

#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <random>

using namespace facebook::react;

// The test runner compiles the unchanged native path under this class name.
@interface RCTGradientUtilsBaseline : NSObject
+ (std::vector<ProcessedColorStop>)getFixedColorStops:(const std::vector<ColorStop> &)colorStops
                                   gradientLineLength:(CGFloat)gradientLineLength;
@end

static size_t checkedCases = 0;

static void checkParity(const std::vector<ColorStop> &input, CGFloat lineLength = 240)
{
  auto expected = [RCTGradientUtilsBaseline getFixedColorStops:input gradientLineLength:lineLength];
  auto actual = [RCTGradientUtils getFixedColorStops:input gradientLineLength:lineLength];
  if (expected.size() != actual.size()) {
    fprintf(stderr, "Gradient case %zu: expected %zu stops, got %zu\n", checkedCases, expected.size(), actual.size());
    exit(1);
  }
  for (size_t i = 0; i < expected.size(); ++i) {
    if (std::abs(expected[i].position.value() - actual[i].position.value()) > 1e-12 ||
        static_cast<bool>(expected[i].color) != static_cast<bool>(actual[i].color) ||
        (expected[i].color && (*expected[i].color).getColor() != (*actual[i].color).getColor())) {
      fprintf(
          stderr,
          "Gradient case %zu: stop %zu differs (positions %.9g / %.9g, colors %x / %x)\n",
          checkedCases,
          i,
          expected[i].position.value(),
          actual[i].position.value(),
          expected[i].color ? (*expected[i].color).getColor() : 0,
          actual[i].color ? (*actual[i].color).getColor() : 0);
      exit(1);
    }
  }
  ++checkedCases;
}

int main()
{
  @autoreleasepool {
    auto red = colorFromRGBA(255, 0, 0, 255);
    auto blue = colorFromRGBA(0, 0, 255, 127);
    auto green = colorFromRGBA(0, 255, 0, 255);
    checkParity({});
    checkParity({{red, {}}});
    checkParity({{red, {}}, {green, {}}, {blue, {}}});
    checkParity({{red, {75, UnitType::Percent}}, {green, {25, UnitType::Percent}}, {blue, {}}});
    checkParity({{red, {-50, UnitType::Percent}}, {green, {}}, {blue, {150, UnitType::Percent}}});
    checkParity({{red, {10, UnitType::Point}}, {green, {}}, {blue, {220, UnitType::Point}}});
    // CGFloat precision matters here: Float rounding crosses the centered-hint epsilon.
    checkParity({{red, {0, UnitType::Point}}, {{}, {100.5f, UnitType::Point}}, {blue, {200, UnitType::Point}}}, 200);

    // Symmetric, endpoint, near-epsilon and asymmetric transition hints.
    for (float hint : {0.f, 0.49f, 0.51f, 1.f, 20.f, 49.8f, 50.f, 50.2f, 80.f, 99.49f, 99.51f, 100.f}) {
      checkParity({{red, {0, UnitType::Percent}}, {{}, {hint, UnitType::Percent}}, {blue, {100, UnitType::Percent}}});
    }
    checkParity(
        {{red, {0, UnitType::Percent}},
         {{}, {15, UnitType::Percent}},
         {green, {40, UnitType::Percent}},
         {{}, {85, UnitType::Percent}},
         {blue, {100, UnitType::Percent}}});

    // Retaining an original stop must retain its native dynamic color object.
    SharedColor dynamicColor{Color(
        DynamicColor{.lightColor = static_cast<int32_t>(0xffff0000), .darkColor = static_cast<int32_t>(0xff0000ff)})};
    auto dynamicResult = [RCTGradientUtils getFixedColorStops:{
      {dynamicColor, {}},
      {blue, {}}
    }
                                           gradientLineLength:240];
    if ((*dynamicResult[0].color).getUIColor() != (*dynamicColor).getUIColor()) {
      fprintf(stderr, "KMP gradient adapter replaced an original dynamic UIColor\n");
      return 1;
    }
    checkParity({{dynamicColor, {}}, {blue, {}}});

    std::mt19937 random(8675309);
    for (int i = 0; i < 250; ++i) {
      float hint = 1 + random() % 99;
      auto left = colorFromRGBA(random() % 256, random() % 256, random() % 256, random() % 256);
      auto right = colorFromRGBA(random() % 256, random() % 256, random() % 256, random() % 256);
      checkParity({{left, {0, UnitType::Percent}}, {{}, {hint, UnitType::Percent}}, {right, {100, UnitType::Percent}}});
      checkParity(
          {{left, {0, UnitType::Point}}, {{}, {hint * 1.7f, UnitType::Point}}, {right, {170, UnitType::Point}}},
          237.25);
    }
    printf("Apple gradient parity passed: %zu cases; native colors and KMP positions/weights agree.\n", checkedCases);
  }
  return 0;
}

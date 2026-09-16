/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "HostPlatformColor.h"

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <objc/runtime.h>
#import <react/renderer/graphics/RCTPlatformColorUtils.h>
#import <react/utils/ManagedObjectWrapper.h>
#import <string>

using namespace facebook::react;

NS_ASSUME_NONNULL_BEGIN

namespace facebook::react {

namespace {

bool UIColorIsP3ColorSpace(const std::shared_ptr<void> &uiColor)
{
  UIColor *color = unwrapManagedObject(uiColor);
  CGColorSpaceRef colorSpace = CGColorGetColorSpace(color.CGColor);

  if (CGColorSpaceGetModel(colorSpace) == kCGColorSpaceModelRGB) {
    CFStringRef name = CGColorSpaceGetName(colorSpace);
    if (name != NULL && (CFEqual(name, kCGColorSpaceDisplayP3) != 0u)) {
      return true;
    }
  }
  return false;
}

UIColor *_Nullable UIColorFromInt32(int32_t intColor)
{
  CGFloat a = CGFloat((intColor >> 24) & 0xFF) / 255.0;
  CGFloat r = CGFloat((intColor >> 16) & 0xFF) / 255.0;
  CGFloat g = CGFloat((intColor >> 8) & 0xFF) / 255.0;
  CGFloat b = CGFloat(intColor & 0xFF) / 255.0;

  UIColor *color = [UIColor colorWithRed:r green:g blue:b alpha:a];
  return color;
}

UIColor *_Nullable UIColorFromDynamicColor(const facebook::react::DynamicColor &dynamicColor)
{
  int32_t light = dynamicColor.lightColor;
  int32_t dark = dynamicColor.darkColor;
  int32_t highContrastLight = dynamicColor.highContrastLightColor;
  int32_t highContrastDark = dynamicColor.highContrastDarkColor;

  UIColor *lightColor = UIColorFromInt32(light);
  UIColor *darkColor = UIColorFromInt32(dark);
  UIColor *highContrastLightColor = UIColorFromInt32(highContrastLight);
  UIColor *highContrastDarkColor = UIColorFromInt32(highContrastDark);

  if (lightColor != nil && darkColor != nil) {
    UIColor *color = [UIColor colorWithDynamicProvider:^UIColor *_Nonnull(UITraitCollection *_Nonnull collection) {
      if (collection.userInterfaceStyle == UIUserInterfaceStyleDark) {
        if (collection.accessibilityContrast == UIAccessibilityContrastHigh && highContrastDark != 0) {
          return highContrastDarkColor;
        } else {
          return darkColor;
        }
      } else {
        if (collection.accessibilityContrast == UIAccessibilityContrastHigh && highContrastLight != 0) {
          return highContrastLightColor;
        } else {
          return lightColor;
        }
      }
    }];
    return color;
  } else {
    return nil;
  }

  return nil;
}

int32_t ColorFromColorComponents(const facebook::react::ColorComponents &components)
{
  float ratio = 255;
  auto color = ((int32_t)round((float)components.alpha * ratio) & 0xff) << 24 |
      ((int)round((float)components.red * ratio) & 0xff) << 16 |
      ((int)round((float)components.green * ratio) & 0xff) << 8 | ((int)round((float)components.blue * ratio) & 0xff);
  return color;
}

int32_t ColorFromUIColor(UIColor *color)
{
  CGFloat rgba[4];
  [color getRed:&rgba[0] green:&rgba[1] blue:&rgba[2] alpha:&rgba[3]];
  return ColorFromColorComponents(
      {.red = (float)rgba[0], .green = (float)rgba[1], .blue = (float)rgba[2], .alpha = (float)rgba[3]});
}

int32_t ColorFromUIColorForSpecificTraitCollection(
    const std::shared_ptr<void> &uiColor,
    UITraitCollection *traitCollection)
{
  UIColor *color = (UIColor *)unwrapManagedObject(uiColor);
  if (color != nullptr) {
    color = [color resolvedColorWithTraitCollection:traitCollection];
    return ColorFromUIColor(color);
  }

  return 0;
}

int32_t ColorFromUIColor(const std::shared_ptr<void> &uiColor)
{
  return ColorFromUIColorForSpecificTraitCollection(uiColor, [UITraitCollection currentTraitCollection]);
}

UIColor *_Nullable UIColorFromComponentsColor(const facebook::react::ColorComponents &components)
{
  UIColor *uiColor = nil;
  if (components.colorSpace == ColorSpace::DisplayP3) {
    uiColor = [UIColor colorWithDisplayP3Red:components.red
                                       green:components.green
                                        blue:components.blue
                                       alpha:components.alpha];
  } else {
    uiColor = [UIColor colorWithRed:components.red green:components.green blue:components.blue alpha:components.alpha];
  }

  return uiColor;
}

std::size_t hashFromUIColor(const std::shared_ptr<void> &uiColor)
{
  if (uiColor == nullptr) {
    return 0;
  }

  static UITraitCollection *darkModeTraitCollection =
      [UITraitCollection traitCollectionWithUserInterfaceStyle:UIUserInterfaceStyleDark];
  auto darkColor = ColorFromUIColorForSpecificTraitCollection(uiColor, darkModeTraitCollection);

  static UITraitCollection *lightModeTraitCollection =
      [UITraitCollection traitCollectionWithUserInterfaceStyle:UIUserInterfaceStyleLight];
  auto lightColor = ColorFromUIColorForSpecificTraitCollection(uiColor, lightModeTraitCollection);

  static UITraitCollection *darkModeAccessibilityContrastTraitCollection =
      [UITraitCollection traitCollectionWithTraitsFromCollections:@[
        darkModeTraitCollection,
        [UITraitCollection traitCollectionWithAccessibilityContrast:UIAccessibilityContrastHigh]
      ]];
  auto darkAccessibilityContrastColor =
      ColorFromUIColorForSpecificTraitCollection(uiColor, darkModeAccessibilityContrastTraitCollection);

  static UITraitCollection *lightModeAccessibilityContrastTraitCollection =
      [UITraitCollection traitCollectionWithTraitsFromCollections:@[
        lightModeTraitCollection,
        [UITraitCollection traitCollectionWithAccessibilityContrast:UIAccessibilityContrastHigh]
      ]];
  auto lightAccessibilityContrastColor =
      ColorFromUIColorForSpecificTraitCollection(uiColor, lightModeAccessibilityContrastTraitCollection);
  return facebook::react::hash_combine(
      darkColor,
      lightColor,
      darkAccessibilityContrastColor,
      lightAccessibilityContrastColor,
      UIColorIsP3ColorSpace(uiColor));
}

} // anonymous namespace

Color::Color(int32_t color)
{
  uiColor_ = wrapManagedObject(UIColorFromInt32(color));
  uiColorHashValue_ = facebook::react::hash_combine(color, 0);
}

Color::Color(const DynamicColor &dynamicColor)
{
  uiColor_ = wrapManagedObject(UIColorFromDynamicColor(dynamicColor));
  uiColorHashValue_ = facebook::react::hash_combine(
      dynamicColor.darkColor,
      dynamicColor.lightColor,
      dynamicColor.highContrastDarkColor,
      dynamicColor.highContrastLightColor,
      0);
}

Color::Color(const ColorComponents &components)
{
  uiColor_ = wrapManagedObject(UIColorFromComponentsColor(components));
  uiColorHashValue_ = facebook::react::hash_combine(
      ColorFromColorComponents(components), components.colorSpace == ColorSpace::DisplayP3);
}

Color::Color(std::shared_ptr<void> uiColor)
{
  UIColor *color = ((UIColor *)unwrapManagedObject(uiColor));
  if (color != nullptr) {
    auto colorHash = hashFromUIColor(uiColor);
    uiColorHashValue_ = colorHash;
  }
  uiColor_ = std::move(uiColor);
}

bool Color::operator==(const Color &other) const
{
  return (!uiColor_ && !other.uiColor_) ||
      (uiColor_ && other.uiColor_ && (uiColorHashValue_ == other.uiColorHashValue_));
}

bool Color::operator!=(const Color &other) const
{
  return !(*this == other);
}

int32_t Color::getColor() const
{
  return ColorFromUIColor(uiColor_);
}

float Color::getChannel(int channelId) const
{
  CGFloat rgba[4];
  UIColor *color = (__bridge UIColor *)getUIColor().get();
  [color getRed:&rgba[0] green:&rgba[1] blue:&rgba[2] alpha:&rgba[3]];
  return static_cast<float>(rgba[channelId]);
}

std::size_t Color::getUIColorHash() const
{
  return uiColorHashValue_;
}

Color Color::createSemanticColor(std::vector<std::string> &semanticItems)
{
  UIColor *semanticColor = RCTPlatformColorFromSemanticItemsOrNil(semanticItems);
  if (semanticColor == nil) {
    // Undefined-color sentinel on a miss, distinct from a name that resolves to
    // transparent (getColor() is still 0, preserving the old render).
    return HostPlatformColor::UndefinedColor;
  }
  return Color(wrapManagedObject(semanticColor));
}

} // namespace facebook::react

NS_ASSUME_NONNULL_END

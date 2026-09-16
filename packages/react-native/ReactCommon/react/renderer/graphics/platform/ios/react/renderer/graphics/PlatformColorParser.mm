/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "PlatformColorParser.h"

#import <react/renderer/core/RawValue.h>
#import <react/renderer/css/CSSColor.h>
#import <react/renderer/css/CSSValueParser.h>
#import <react/renderer/graphics/Color.h>
#import <react/renderer/graphics/HostPlatformColor.h>
#import <react/renderer/graphics/RCTPlatformColorUtils.h>
#import <react/utils/ManagedObjectWrapper.h>
#import <optional>
#import <string>
#import <unordered_map>

using namespace facebook::react;

NS_ASSUME_NONNULL_BEGIN

namespace facebook::react {

inline facebook::react::SharedColor RCTPlatformColorComponentsFromDynamicItems(
    const facebook::react::ContextContainer &contextContainer,
    int32_t surfaceId,
    std::unordered_map<std::string, facebook::react::RawValue> &dynamicItems)
{
  SharedColor lightSharedColor{};
  SharedColor darkSharedColor{};
  SharedColor highContrastLightSharedColor{};
  SharedColor highContrastDarkSharedColor{};
  if (dynamicItems.count("light") != 0u) {
    fromRawValue(contextContainer, surfaceId, dynamicItems.at("light"), lightSharedColor);
  }
  if (dynamicItems.count("dark") != 0u) {
    fromRawValue(contextContainer, surfaceId, dynamicItems.at("dark"), darkSharedColor);
  }
  if (dynamicItems.count("highContrastLight") != 0u) {
    fromRawValue(contextContainer, surfaceId, dynamicItems.at("highContrastLight"), highContrastLightSharedColor);
  }
  if (dynamicItems.count("highContrastDark") != 0u) {
    fromRawValue(contextContainer, surfaceId, dynamicItems.at("highContrastDark"), highContrastDarkSharedColor);
  }

  Color color = Color(
      DynamicColor{
          .lightColor = (*lightSharedColor).getColor(),
          .darkColor = (*darkSharedColor).getColor(),
          .highContrastLightColor = (*highContrastLightSharedColor).getColor(),
          .highContrastDarkColor = (*highContrastDarkSharedColor).getColor()});
  return SharedColor(color);
}

// nullopt only on a parse failure, so a fallback that resolves to transparent is
// still honored.
static std::optional<SharedColor> fallbackColorFromString(const std::string &fallbackString)
{
  auto cssColor = parseCSSProperty<CSSColor>(fallbackString);
  if (std::holds_alternative<CSSColor>(cssColor)) {
    const auto &c = std::get<CSSColor>(cssColor);
    return colorFromRGBA(c.r, c.g, c.b, c.a);
  }
  return std::nullopt;
}

SharedColor parsePlatformColor(const ContextContainer &contextContainer, int32_t surfaceId, const RawValue &value)
{
  if (value.hasType<std::unordered_map<std::string, RawValue>>()) {
    auto items = (std::unordered_map<std::string, RawValue>)value;
    if (items.find("semantic") != items.end() && items.at("semantic").hasType<std::vector<std::string>>()) {
      auto semanticItems = (std::vector<std::string>)items.at("semantic");
      auto semanticColor = SharedColor(Color::createSemanticColor(semanticItems));
      // The sentinel (null UIColor) means a true miss; apply the fallback only
      // then, not when a name resolves to transparent.
      if (!semanticColor) {
        if (items.find("fallback") != items.end() && items.at("fallback").hasType<std::string>()) {
          auto fallbackColor = fallbackColorFromString((std::string)items.at("fallback"));
          // has_value(), not != 0, so a transparent fallback is kept.
          if (fallbackColor.has_value()) {
            return *fallbackColor;
          }
        }
        // Miss with no usable fallback: clearColor, never leaking the sentinel.
        return clearColor();
      }
      return semanticColor;
    } else if (
        items.find("dynamic") != items.end() &&
        items.at("dynamic").hasType<std::unordered_map<std::string, RawValue>>()) {
      auto dynamicItems = (std::unordered_map<std::string, RawValue>)items.at("dynamic");
      return RCTPlatformColorComponentsFromDynamicItems(contextContainer, surfaceId, dynamicItems);
    }
  }

  return clearColor();
}

} // namespace facebook::react

NS_ASSUME_NONNULL_END

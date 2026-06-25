/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <glog/logging.h>
#include <react/debug/react_native_expect.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/graphics/Float.h>
#include <unordered_map>

namespace facebook::react {

struct NativeDrawable {
  enum class Kind : uint8_t {
    Ripple,
    ThemeAttr,
  };

  struct Ripple {
    std::optional<SharedColor> color{};
    std::optional<std::vector<std::string>> colorResourcePaths{};
    std::optional<Float> rippleRadius{};
    bool borderless{false};
    std::optional<Float> alpha{};

    bool operator==(const Ripple &rhs) const
    {
      return std::tie(this->color, this->colorResourcePaths, this->borderless, this->rippleRadius, this->alpha) ==
          std::tie(rhs.color, rhs.colorResourcePaths, rhs.borderless, rhs.rippleRadius, rhs.alpha);
    }
  };

  std::string themeAttr;
  Ripple ripple;
  Kind kind;

  bool operator==(const NativeDrawable &rhs) const
  {
    if (this->kind != rhs.kind) {
      return false;
    }

    switch (this->kind) {
      case Kind::ThemeAttr:
        return this->themeAttr == rhs.themeAttr;
      case Kind::Ripple:
        return this->ripple == rhs.ripple;
    }
  }

  bool operator!=(const NativeDrawable &rhs) const
  {
    return !(*this == rhs);
  }

  ~NativeDrawable() = default;
};

static inline void fromRawValue(const PropsParserContext &context, const RawValue &rawValue, NativeDrawable &result)
{
  auto map = (std::unordered_map<std::string, RawValue>)rawValue;

  auto typeIterator = map.find("type");
  react_native_expect(typeIterator != map.end() && typeIterator->second.hasType<std::string>());
  std::string type = (std::string)typeIterator->second;

  if (type == "ThemeAttrAndroid") {
    auto attrIterator = map.find("attribute");
    react_native_expect(attrIterator != map.end() && attrIterator->second.hasType<std::string>());

    result = NativeDrawable{
        .themeAttr = (std::string)attrIterator->second,
        .ripple = {},
        .kind = NativeDrawable::Kind::ThemeAttr,
    };
  } else if (type == "RippleAndroid") {
    auto color = map.find("color");
    auto borderless = map.find("borderless");
    auto rippleRadius = map.find("rippleRadius");
    auto alpha = map.find("alpha");

    std::optional<SharedColor> parsedColor{};
    std::optional<std::vector<std::string>> parsedColorResourcePaths{};
    if (color != map.end()) {
      if (color->second.hasType<std::unordered_map<std::string, std::vector<std::string>>>()) {
        auto colorMap = (std::unordered_map<std::string, std::vector<std::string>>)color->second;
        auto pathsIt = colorMap.find("resource_paths");
        if (pathsIt != colorMap.end()) {
          parsedColorResourcePaths = pathsIt->second;
        }
      } else {
        SharedColor resolved;
        fromRawValue(context, color->second, resolved);
        if (resolved) {
          parsedColor = resolved;
        }
      }
    }

    std::optional<Float> parsedAlpha{};
    if (alpha != map.end() && alpha->second.hasType<Float>()) {
      parsedAlpha = (Float)alpha->second;
    }

    result = NativeDrawable{
        .themeAttr = std::string{},
        .ripple =
            NativeDrawable::Ripple{
                .color = parsedColor,
                .colorResourcePaths = parsedColorResourcePaths,
                .rippleRadius = rippleRadius != map.end() && rippleRadius->second.hasType<Float>()
                    ? (Float)rippleRadius->second
                    : std::optional<Float>{},
                .borderless =
                    borderless != map.end() && borderless->second.hasType<bool>() ? (bool)borderless->second : false,
                .alpha = parsedAlpha,
            },
        .kind = NativeDrawable::Kind::Ripple,
    };
  } else {
    LOG(ERROR) << "Unknown native drawable type: " << type;
    react_native_expect(false);
  }
}

} // namespace facebook::react

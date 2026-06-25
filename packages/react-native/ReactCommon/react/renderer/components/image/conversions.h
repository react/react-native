/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <unordered_map>

#include <glog/logging.h>
#include <react/debug/react_native_expect.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/imagemanager/primitives.h>

namespace facebook::react {

inline void fromRawValue(const PropsParserContext & /* context */, const RawValue &value, ImageSource &result)
{
  if (value.hasType<std::string>()) {
    result = {
        /* .type = */ ImageSource::Type::Remote,
        /* .uri = */ (std::string)value,
    };
    return;
  }

  if (value.hasType<std::unordered_map<std::string, RawValue>>()) {
    auto items = (std::unordered_map<std::string, RawValue>)value;
    result = {};

    result.type = ImageSource::Type::Remote;

    if (items.find("__packager_asset") != items.end()) {
      result.type = ImageSource::Type::Local;
    }

    if (items.find("width") != items.end() && items.find("height") != items.end() &&
        // The following checks have to be removed after codegen is shipped.
        // See T45151459.
        items.at("width").hasType<Float>() && items.at("height").hasType<Float>()) {
      result.size = {(Float)items.at("width"), (Float)items.at("height")};
    }

    if (items.find("scale") != items.end() &&
        // The following checks have to be removed after codegen is shipped.
        // See T45151459.
        items.at("scale").hasType<Float>()) {
      result.scale = (Float)items.at("scale");
    } else {
      result.scale = items.find("deprecated") != items.end() ? 0.0f : 1.0f;
    }

    if (items.find("url") != items.end() &&
        // The following should be removed after codegen is shipped.
        // See T45151459.
        items.at("url").hasType<std::string>()) {
      result.uri = (std::string)items.at("url");
    }

    if (items.find("uri") != items.end() &&
        // The following should be removed after codegen is shipped.
        // See T45151459.
        items.at("uri").hasType<std::string>()) {
      result.uri = (std::string)items.at("uri");
    }

    if (items.find("bundle") != items.end() &&
        // The following should be removed after codegen is shipped.
        // See T45151459.
        items.at("bundle").hasType<std::string>()) {
      result.bundle = (std::string)items.at("bundle");
      result.type = ImageSource::Type::Local;
    }

    if (items.find("headers") != items.end() &&
        items.at("headers").hasType<std::unordered_map<std::string, std::string>>()) {
      auto headers = (std::unordered_map<std::string, std::string>)items.at("headers");
      for (const auto &header : headers) {
        result.headers.push_back(header);
      }
    }

    if (items.find("body") != items.end() && items.at("body").hasType<std::string>()) {
      result.body = (std::string)items.at("body");
    }

    if (items.find("method") != items.end() && items.at("method").hasType<std::string>()) {
      result.method = (std::string)items.at("method");
    }

    if (items.find("cache") != items.end() && items.at("cache").hasType<std::string>()) {
      auto cache = (std::string)items.at("cache");
      if (cache == "reload") {
        result.cache = ImageSource::CacheStategy::Reload;
      } else if (cache == "force-cache") {
        result.cache = ImageSource::CacheStategy::ForceCache;
      } else if (cache == "only-if-cached") {
        result.cache = ImageSource::CacheStategy::OnlyIfCached;
      }
    }

    return;
  }

  // The following should be removed after codegen is shipped.
  // See T45151459.
  result = {};
  result.type = ImageSource::Type::Invalid;
}

inline std::string toString(const ImageSource &value)
{
  return "{uri: " + value.uri + "}";
}

inline void fromRawValue(const PropsParserContext & /* context */, const RawValue &value, ImageResizeMode &result)
{
  react_native_expect(value.hasType<std::string>());
  if (!value.hasType<std::string>()) {
    LOG(ERROR) << "Unsupported ImageResizeMode type";
    // "cover" is default in non-Fabric web and iOS
    result = ImageResizeMode::Cover;
    return;
  }

  auto stringValue = (std::string)value;
  if (stringValue == "cover") {
    result = ImageResizeMode::Cover;
  } else if (stringValue == "contain") {
    result = ImageResizeMode::Contain;
  } else if (stringValue == "stretch") {
    result = ImageResizeMode::Stretch;
  } else if (stringValue == "center") {
    result = ImageResizeMode::Center;
  } else if (stringValue == "repeat") {
    result = ImageResizeMode::Repeat;
  } else if (stringValue == "none") {
    result = ImageResizeMode::None;
  } else {
    LOG(ERROR) << "Unsupported ImageResizeMode value: " << stringValue;
    react_native_expect(false);
    // "cover" is default in non-Fabric web and iOS
    result = ImageResizeMode::Cover;
  }
}

inline std::string toString(const ImageResizeMode &value)
{
  switch (value) {
    case ImageResizeMode::Cover:
      return "cover";
    case ImageResizeMode::Contain:
      return "contain";
    case ImageResizeMode::Stretch:
      return "stretch";
    case ImageResizeMode::Center:
      return "center";
    case ImageResizeMode::Repeat:
      return "repeat";
    case ImageResizeMode::None:
      return "none";
    default:
      LOG(ERROR) << "Unsupported ImageResizeMode value: " << (int)value;
      react_native_expect(false);
      // "cover" is default in non-Fabric web and iOS
      return "cover";
  }
}

} // namespace facebook::react

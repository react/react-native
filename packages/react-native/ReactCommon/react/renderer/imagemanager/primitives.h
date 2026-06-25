/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>
#include <vector>

#include <react/debug/react_native_assert.h>
#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/core/propsConversions.h>
#include <react/renderer/debug/debugStringConvertibleUtils.h>
#include <react/renderer/graphics/Float.h>
#include <react/renderer/graphics/Size.h>

namespace facebook::react {

class ImageSource {
 public:
  enum class Type { Invalid, Remote, Local };
  enum class CacheStategy { Default, Reload, ForceCache, OnlyIfCached };

  Type type{};
  std::string uri{};
  std::string bundle{};
  Float scale{3};
  Size size{.width = 0};
  std::string body{};
  std::string method{};
  CacheStategy cache = CacheStategy::Default;
  std::vector<std::pair<std::string, std::string>> headers{};

  bool operator==(const ImageSource &rhs) const
  {
    return std::tie(this->type, this->uri) == std::tie(rhs.type, rhs.uri);
  }

#ifdef RN_SERIALIZABLE_STATE
  folly::dynamic toDynamic() const
  {
    folly::dynamic imageSourceResult = folly::dynamic::object();
    switch (type) {
      case ImageSource::Type::Remote:
        imageSourceResult["type"] = "remote";
        break;
      case ImageSource::Type::Local:
        imageSourceResult["type"] = "local";
        break;
      case ImageSource::Type::Invalid:
      default:
        imageSourceResult["type"] = "invalid";
        break;
    }

    imageSourceResult["uri"] = uri;
    imageSourceResult["bundle"] = bundle;
    imageSourceResult["scale"] = scale;

    folly::dynamic sizeResult = folly::dynamic::object();
    sizeResult["width"] = size.width;
    sizeResult["height"] = size.height;
    imageSourceResult["size"] = sizeResult;

    imageSourceResult["body"] = body;
    imageSourceResult["method"] = method;

    switch (cache) {
      case ImageSource::CacheStategy::Reload:
        imageSourceResult["cache"] = "reload";
        break;
      case ImageSource::CacheStategy::ForceCache:
        imageSourceResult["cache"] = "force-cache";
        break;
      case ImageSource::CacheStategy::OnlyIfCached:
        imageSourceResult["cache"] = "only-if-cached";
        break;
      case ImageSource::CacheStategy::Default:
      default:
        imageSourceResult["cache"] = "default";
        break;
    }

    folly::dynamic headersObject = folly::dynamic::object();
    for (const auto &header : headers) {
      headersObject[header.first] = header.second;
    }
    imageSourceResult["headers"] = headersObject;
    return imageSourceResult;
  }

#endif

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps(const std::string &prefix) const
  {
    ImageSource imageSource{};

    SharedDebugStringConvertibleList headersList;
    for (const auto &header : headers) {
      headersList.push_back(debugStringConvertibleItem(prefix + "-header-" + header.first, header.second));
    }

    return headersList +
        SharedDebugStringConvertibleList{
            debugStringConvertibleItem(prefix + "-type", toString(type), toString(imageSource.type)),
            debugStringConvertibleItem(prefix + "-uri", uri, imageSource.uri),
            debugStringConvertibleItem(prefix + "-bundle", bundle, imageSource.bundle),
            debugStringConvertibleItem(prefix + "-scale", scale, imageSource.scale),
            debugStringConvertibleItem(prefix + "-size", react::toString(size), react::toString(imageSource.size)),
            debugStringConvertibleItem(prefix + "-body", body, imageSource.body),
            debugStringConvertibleItem(prefix + "-method", method, imageSource.method),
            debugStringConvertibleItem(prefix + "-cache", toString(cache), toString(imageSource.cache)),
        };
  }

  std::string toString(const Type &typeValue) const
  {
    switch (typeValue) {
      case ImageSource::Type::Invalid:
        return "invalid";
      case ImageSource::Type::Remote:
        return "remote";
      case ImageSource::Type::Local:
        return "local";
      default:
        react_native_assert(false && "Invalid ImageSource::Type");
        return "";
    }
  }

  std::string toString(const CacheStategy &cacheValue) const
  {
    switch (cacheValue) {
      case ImageSource::CacheStategy::Default:
        return "default";
      case ImageSource::CacheStategy::Reload:
        return "reload";
      case ImageSource::CacheStategy::ForceCache:
        return "force-cache";
      case ImageSource::CacheStategy::OnlyIfCached:
        return "only-if-cached";
      default:
        react_native_assert(false && "Invalid ImageSource::CacheStategy");
        return "";
    }
  }
#endif
};

#ifdef RN_SERIALIZABLE_STATE
inline folly::dynamic toDynamic(const ImageSource &imageSource)
{
  return imageSource.toDynamic();
}
#endif

using ImageSources = std::vector<ImageSource>;

enum class ImageResizeMode : int8_t {
  Cover = 0,
  Contain = 1,
  Stretch = 2,
  Center = 3,
  Repeat = 4,
  None = 5,
};

class ImageErrorInfo {
 public:
  std::string error{};
  int responseCode{};
  std::vector<std::pair<std::string, std::string>> httpResponseHeaders{};
};

} // namespace facebook::react

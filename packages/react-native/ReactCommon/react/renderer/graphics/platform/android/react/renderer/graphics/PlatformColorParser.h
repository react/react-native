/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "configurePlatformColorCacheInvalidationHook.h"

#include <fbjni/fbjni.h>
#include <folly/container/EvictingCacheMap.h>
#include <react/renderer/core/RawValue.h>
#include <react/renderer/css/CSSColor.h>
#include <react/renderer/css/CSSValueParser.h>
#include <react/renderer/graphics/Color.h>
#include <react/renderer/graphics/fromRawValueShared.h>
#include <react/utils/ContextContainer.h>
#include <functional>
#include <mutex>
#include <optional>
#include <string>
#include <unordered_map>
#include <vector>

namespace facebook::react {

inline size_t hashGetColourArguments(int32_t surfaceId, const std::vector<std::string> &resourcePaths)
{
  size_t seed = std::hash<int32_t>{}(surfaceId);
  for (const auto &path : resourcePaths) {
    seed ^= std::hash<std::string>{}(path) + 0x9e3779b9 + (seed << 6) + (seed >> 2);
  }
  return seed;
}

inline SharedColor
parsePlatformColor(const ContextContainer &contextContainer, int32_t surfaceId, const RawValue &value)
{
  Color color = 0;
  if (value.hasType<std::unordered_map<std::string, RawValue>>()) {
    // Mixed array + string values, so read as a map of RawValue (a map of
    // vector<string> would assert on the fallback string).
    auto map = (std::unordered_map<std::string, RawValue>)value;

    std::vector<std::string> resourcePaths;
    auto resourcePathsIt = map.find("resource_paths");
    if (resourcePathsIt != map.end() && resourcePathsIt->second.hasType<std::vector<std::string>>()) {
      resourcePaths = (std::vector<std::string>)resourcePathsIt->second;
    }

    bool resolved = false;
    if (!resourcePaths.empty()) {
      // Cache the (costly) JNI results. A cached nullopt is an explicit miss,
      // distinct from a path that resolves to transparent (ARGB 0).
      static std::mutex getColorCacheMutex;
      static folly::EvictingCacheMap<size_t, std::optional<Color>> getColorCache(64);

      // Listen for appearance changes, which should invalidate the cache
      static std::once_flag setupCacheInvalidation;
      std::call_once(setupCacheInvalidation, configurePlatformColorCacheInvalidationHook, [&] {
        std::scoped_lock lock(getColorCacheMutex);
        getColorCache.clear();
      });

      auto hash = hashGetColourArguments(surfaceId, resourcePaths);
      std::optional<Color> resolvedColor;
      {
        std::scoped_lock lock(getColorCacheMutex);
        auto iterator = getColorCache.find(hash);
        if (iterator != getColorCache.end()) {
          resolvedColor = iterator->second;
        } else {
          const auto &fabricUIManager = contextContainer.at<jni::global_ref<jobject>>("FabricUIManager");
          // Boxed Integer: null is an explicit miss; a non-null value may be 0
          // (transparent black).
          static auto getColorFromJava =
              fabricUIManager->getClass()->getMethod<jni::JInteger::javaobject(jint, jni::JArrayClass<jni::JString>)>(
                  "getColor");
          auto javaResourcePaths = jni::JArrayClass<jni::JString>::newArray(resourcePaths.size());

          for (int i = 0; i < resourcePaths.size(); i++) {
            javaResourcePaths->setElement(i, *jni::make_jstring(resourcePaths[i]));
          }
          auto boxedColor = getColorFromJava(fabricUIManager, surfaceId, *javaResourcePaths);
          if (boxedColor) {
            resolvedColor = static_cast<Color>(boxedColor->value());
          }
          getColorCache.set(hash, resolvedColor);
        }
      }
      if (resolvedColor.has_value()) {
        color = *resolvedColor;
        resolved = true;
      }
    }

    // No path resolved: parse the raw fallback with the shared CSS parser (the
    // same parser iOS Fabric uses).
    if (!resolved) {
      auto fallbackIt = map.find("fallback");
      if (fallbackIt != map.end() && fallbackIt->second.hasType<std::string>()) {
        auto cssColor = parseCSSProperty<CSSColor>((std::string)fallbackIt->second);
        if (std::holds_alternative<CSSColor>(cssColor)) {
          const auto &c = std::get<CSSColor>(cssColor);
          color = hostPlatformColorFromRGBA(c.r, c.g, c.b, c.a);
        }
      }
    }
  }

  return color;
}

inline void
fromRawValue(const ContextContainer &contextContainer, int32_t surfaceId, const RawValue &value, SharedColor &result)
{
  fromRawValueShared(contextContainer, surfaceId, value, result, parsePlatformColor);
}

} // namespace facebook::react

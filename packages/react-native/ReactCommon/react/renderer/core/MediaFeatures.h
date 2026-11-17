/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>

#include <atomic>
#include <cstdint>
#include <memory>

#include <react/utils/ContextContainer.h>

namespace facebook::react {

enum class ColorScheme : uint8_t { Light, Dark };

/*
 * One bit for each media feature.
 */
enum class MediaFeature : uint8_t {
  ColorScheme = 1 << 0,
};

/*
 * A set of `MediaFeature` bits.
 */
using MediaFeatureSet = uint8_t;

/*
 * The values that style conditions are matched against.
 */
struct MediaFeatures {
  ColorScheme colorScheme{ColorScheme::Light};

  bool operator==(const MediaFeatures &other) const = default;

  /*
   * Returns the features that have other values in `other`.
   */
  MediaFeatureSet differences(const MediaFeatures &other) const
  {
    MediaFeatureSet result = 0;
    if (colorScheme != other.colorScheme) {
      result |= static_cast<MediaFeatureSet>(MediaFeature::ColorScheme);
    }
    return result;
  }
};

/*
 * The media features of one React Native instance, which are the same for all
 * its surfaces. Thread-safe.
 */
class MediaFeaturesStore final {
 public:
  MediaFeatures get() const noexcept
  {
    return features_.load();
  }

  void set(MediaFeatures features) noexcept
  {
    features_.store(features);
  }

 private:
  std::atomic<MediaFeatures> features_{MediaFeatures{}};
  // A larger `MediaFeatures` needs a mutex instead.
  static_assert(std::atomic<MediaFeatures>::is_always_lock_free);
};

inline constexpr const char *kMediaFeaturesStoreKey = "MediaFeaturesStore";

/*
 * Returns the media features of the store in `contextContainer`, or the
 * defaults if there is none.
 */
inline MediaFeatures getMediaFeatures(const ContextContainer *contextContainer)
{
  if (contextContainer != nullptr) {
    if (auto store = contextContainer->find<std::shared_ptr<MediaFeaturesStore>>(kMediaFeaturesStoreKey)) {
      return (*store)->get();
    }
  }
  return {};
}

} // namespace facebook::react

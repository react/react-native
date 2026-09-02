/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>

#include <react/renderer/graphics/LinearGradient.h>
#include <react/renderer/graphics/RadialGradient.h>

namespace facebook::react {

class ImageSource;

struct URLBackgroundImage {
  std::string uri{};
  // Natural size in layout units, supplied by the asset registry. Zero when the
  // source is a plain url, in which case the decoded image's size is used.
  Float intrinsicWidth{0};
  Float intrinsicHeight{0};

  bool operator==(const URLBackgroundImage &rhs) const
  {
    return uri == rhs.uri && intrinsicWidth == rhs.intrinsicWidth && intrinsicHeight == rhs.intrinsicHeight;
  }

  bool operator!=(const URLBackgroundImage &rhs) const
  {
    return !(*this == rhs);
  }

#ifdef RN_SERIALIZABLE_STATE
  folly::dynamic toDynamic() const;
#endif

#if RN_DEBUG_STRING_CONVERTIBLE
  void toString(std::stringstream &ss) const
  {
    ss << "url(" << uri << ")";
  }
#endif
};

using BackgroundImage = std::variant<LinearGradient, RadialGradient, URLBackgroundImage>;

#ifdef RN_SERIALIZABLE_STATE
folly::dynamic toDynamic(const BackgroundImage &backgroundImage);
#endif

#if RN_DEBUG_STRING_CONVERTIBLE
inline std::string toString(std::vector<BackgroundImage> &value)
{
  std::stringstream ss;

  ss << "[";
  for (size_t i = 0; i < value.size(); i++) {
    if (i > 0) {
      ss << ", ";
    }

    const auto &backgroundImage = value[i];
    if (std::holds_alternative<LinearGradient>(backgroundImage)) {
      std::get<LinearGradient>(backgroundImage).toString(ss);
    } else if (std::holds_alternative<RadialGradient>(backgroundImage)) {
      std::get<RadialGradient>(backgroundImage).toString(ss);
    } else if (std::holds_alternative<URLBackgroundImage>(backgroundImage)) {
      std::get<URLBackgroundImage>(backgroundImage).toString(ss);
    }
  }
  ss << "]";

  return ss.str();
}
#endif

}; // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/LinearGradient.h>
#include <react/renderer/graphics/RadialGradient.h>

namespace facebook::react {

using BackgroundImage = std::variant<LinearGradient, RadialGradient>;

#ifdef RN_SERIALIZABLE_STATE
folly::dynamic toDynamic(const BackgroundImage& backgroundImage);
#endif

#if RN_DEBUG_STRING_CONVERTIBLE
inline std::string toString(std::vector<BackgroundImage>& value) {
  std::stringstream ss;

  ss << "[";
  for (size_t i = 0; i < value.size(); i++) {
    if (i > 0) {
      ss << ", ";
    }

    const auto& backgroundImage = value[i];
    if (std::holds_alternative<LinearGradient>(backgroundImage)) {
      std::get<LinearGradient>(backgroundImage).toString(ss);
    } else if (std::holds_alternative<RadialGradient>(backgroundImage)) {
      std::get<RadialGradient>(backgroundImage).toString(ss);
    }
  }
  ss << "]";

  return ss.str();
}
#endif

}; // namespace facebook::react

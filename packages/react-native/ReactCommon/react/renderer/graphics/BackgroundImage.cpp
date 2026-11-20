/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BackgroundImage.h"

namespace facebook::react {

#ifdef RN_SERIALIZABLE_STATE
folly::dynamic toDynamic(const BackgroundImage& backgroundImage) {
  if (std::holds_alternative<ConicGradient>(backgroundImage)) {
    return std::get<ConicGradient>(backgroundImage).toDynamic();
  } else if (std::holds_alternative<LinearGradient>(backgroundImage)) {
    return std::get<LinearGradient>(backgroundImage).toDynamic();
  } else if (std::holds_alternative<RadialGradient>(backgroundImage)) {
    return std::get<RadialGradient>(backgroundImage).toDynamic();
  }
  return folly::dynamic(nullptr);
}
#endif

} // namespace facebook::react

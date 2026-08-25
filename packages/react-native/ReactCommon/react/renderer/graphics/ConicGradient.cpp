/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ConicGradient.h"

namespace facebook::react {

#ifdef RN_SERIALIZABLE_STATE
folly::dynamic ConicGradient::toDynamic() const {
  folly::dynamic result = folly::dynamic::object();
  result["type"] = "conic-gradient";
  result["from"] = from;
  result["position"] = position.toDynamic();

  folly::dynamic colorStopsArray = folly::dynamic::array();
  for (const auto& colorStop : colorStops) {
    colorStopsArray.push_back(colorStop.toDynamic());
  }
  result["colorStops"] = colorStopsArray;

  return result;
}
#endif

#if RN_DEBUG_STRING_CONVERTIBLE
void ConicGradient::toString(std::stringstream& ss) const {
  ss << "conic-gradient(from " << from << "deg at ";

  if (position.left.has_value()) {
    ss << position.left->toString() << " ";
  }
  if (position.top.has_value()) {
    ss << position.top->toString() << " ";
  }
  if (position.right.has_value()) {
    ss << position.right->toString() << " ";
  }
  if (position.bottom.has_value()) {
    ss << position.bottom->toString() << " ";
  }

  for (const auto& colorStop : colorStops) {
    ss << ", ";
    colorStop.toString(ss);
  }

  ss << ")";
}
#endif

} // namespace facebook::react

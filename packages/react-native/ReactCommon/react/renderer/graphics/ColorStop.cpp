/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ColorStop.h"

namespace facebook::react {

#ifdef RN_SERIALIZABLE_STATE
folly::dynamic ColorStop::toDynamic() const {
  folly::dynamic result = folly::dynamic::object();
  result["color"] = static_cast<int32_t>(*color);
  result["position"] = position.toDynamic();
  return result;
}
#endif

}; // namespace facebook::react

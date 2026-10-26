/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ReactRootViewTagGenerator.h"

#include <atomic>

namespace facebook::react {

constexpr SurfaceId ROOT_VIEW_TAG_INCREMENT = 10;

SurfaceId getNextRootViewTag() noexcept {
  // Numbering of these tags goes from 11, 21, 31, ..., 100501, ...
  static constinit std::atomic<SurfaceId> nextRootViewTag = 1;
  return nextRootViewTag += ROOT_VIEW_TAG_INCREMENT;
}

} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#ifdef RN_SERIALIZABLE_STATE
#include <folly/dynamic.h>
#endif

namespace facebook::react {

/*
 * Dummy type that is used as a placeholder for state data for nodes that
 * don't have a state.
 */
struct StateData final {
  using Shared = std::shared_ptr<const void>;

#ifdef RN_SERIALIZABLE_STATE
  StateData() = default;
  StateData(const StateData &previousState, folly::dynamic data) {}
  folly::dynamic getDynamic() const
  {
    return {};
  }
#endif
};

} // namespace facebook::react

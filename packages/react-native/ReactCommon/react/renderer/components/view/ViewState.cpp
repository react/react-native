/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ViewState.h"

namespace facebook::react {

const std::vector<BackgroundImageURLRequest>& ViewState::getBackgroundImageRequests()
    const {
  return backgroundImageRequests_;
}

} // namespace facebook::react

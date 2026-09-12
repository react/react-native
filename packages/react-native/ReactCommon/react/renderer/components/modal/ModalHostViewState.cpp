/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ModalHostViewState.h"

namespace facebook::react {

#ifdef RN_SERIALIZABLE_STATE
folly::dynamic ModalHostViewState::getDynamic() const {
  return folly::dynamic::object("screenWidth", screenSize.width)(
      "screenHeight", screenSize.height)(
      "viewportOffsetX", viewportOffset.x)(
      "viewportOffsetY", viewportOffset.y);
}
#endif

} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ModalHostViewState.h"
#include "ModalHostViewUtils.h"

namespace facebook::react {

ModalHostViewState::ModalHostViewState()
    : screenSize(ModalHostViewScreenSize()) {}

#ifdef RN_SERIALIZABLE_STATE
folly::dynamic ModalHostViewState::getDynamic() const {
  return folly::dynamic::object("screenWidth", screenSize.width)(
      "screenHeight", screenSize.height);
}
#endif

} // namespace facebook::react

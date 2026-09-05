/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/graphics/Float.h>
#include "ModalHostViewUtils.h"

#ifdef RN_SERIALIZABLE_STATE
#include <folly/dynamic.h>
#endif

namespace facebook::react {

/*
 * State for <ModalHostView> component.
 */
class ModalHostViewState final {
 public:
  using Shared = std::shared_ptr<const ModalHostViewState>;

  ModalHostViewState() : screenSize(ModalHostViewScreenSize()) {}
  ModalHostViewState(Size screenSize_) : screenSize(screenSize_) {};
  ModalHostViewState(Size screenSize_, Point viewportOffset_)
      : screenSize(screenSize_), viewportOffset(viewportOffset_) {};

#ifdef RN_SERIALIZABLE_STATE
  ModalHostViewState(const ModalHostViewState &previousState, folly::dynamic data)
      : screenSize(
            Size{.width = (Float)data["screenWidth"].getDouble(), .height = (Float)data["screenHeight"].getDouble()}),
        viewportOffset(
            Point{.x = data.count("viewportOffsetX") ? (Float)data["viewportOffsetX"].getDouble() : 0.0f,
                  .y = data.count("viewportOffsetY") ? (Float)data["viewportOffsetY"].getDouble() : 0.0f}) {
        };
#endif

  const Size screenSize{};
  const Point viewportOffset{};

#ifdef RN_SERIALIZABLE_STATE
  folly::dynamic getDynamic() const;
#endif

#pragma mark - Getters
};

} // namespace facebook::react

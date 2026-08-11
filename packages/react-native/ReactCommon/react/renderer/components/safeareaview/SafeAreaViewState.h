/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/RectangleEdges.h>

#ifdef ANDROID
#include <folly/dynamic.h>
#endif

namespace facebook::react {

/*
 * State for <SafeAreaView> component.
 */
class SafeAreaViewState final {
 public:
#ifdef ANDROID
  SafeAreaViewState() = default;

  SafeAreaViewState(
      const SafeAreaViewState& /*previousState*/,
      folly::dynamic data)
      : padding(EdgeInsets{
            (Float)data["left"].getDouble(),
            (Float)data["top"].getDouble(),
            (Float)data["right"].getDouble(),
            (Float)data["bottom"].getDouble(),
        }){};

  folly::dynamic getDynamic() const;
#endif

  EdgeInsets padding{};
};

} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>

namespace facebook::react {

class LayoutAnimationStatusDelegate {
 public:
  /**
   * Called when the LayoutAnimation engine state changes from animation nothing
   * to animating something. This will only be called when you go from 0 to N>0
   * active animations, N to N+1 animations will not result in this being
   * called.
   */
  virtual void onAnimationStarted() = 0;

  /**
   * Called when the LayoutAnimation engine completes all pending animations.
   */
  virtual void onAllAnimationsComplete() = 0;

  virtual ~LayoutAnimationStatusDelegate() = default;
};

} // namespace facebook::react

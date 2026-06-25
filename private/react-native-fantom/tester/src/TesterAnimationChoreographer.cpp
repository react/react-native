/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TesterAnimationChoreographer.h"
#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/runtime/ReactInstanceConfig.h>

namespace facebook::react {

void TesterAnimationChoreographer::resume() {
  isPaused_ = false;
}
void TesterAnimationChoreographer::pause() {
  isPaused_ = true;
}

void TesterAnimationChoreographer::runUITick(AnimationTimestamp timestamp) {
  if (!isPaused_) {
    ShadowNode::setUseRuntimeShadowNodeReferenceUpdateOnThread(false);
    onAnimationFrame(timestamp);
    ShadowNode::setUseRuntimeShadowNodeReferenceUpdateOnThread(true);
  }
}

} // namespace facebook::react

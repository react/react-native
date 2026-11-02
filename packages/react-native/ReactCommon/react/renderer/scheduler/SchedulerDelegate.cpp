/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SchedulerDelegate.h"

#include <react/renderer/animationbackend/AnimatedProps.h>
#include <react/renderer/animationbackend/AnimatedPropsSerializer.h>

namespace facebook::react {

void SchedulerDelegate::schedulerShouldSynchronouslyUpdateAnimatedProps(
    const std::unordered_map<Tag, AnimatedProps>& updates) {
  for (const auto& [tag, props] : updates) {
    schedulerShouldSynchronouslyUpdateViewOnUIThread(
        tag, animationbackend::packAnimatedProps(props));
  }
}

} // namespace facebook::react

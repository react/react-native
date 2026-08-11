/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include "AnimatedProps.h"

namespace facebook::react::animationbackend {

folly::dynamic packAnimatedProps(const AnimatedProps& animatedProps);

} // namespace facebook::react::animationbackend

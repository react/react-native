/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/core/ShadowNodeFamily.h>
#include <memory>
#include <set>
#include <vector>
#include "AnimatedProps.h"

namespace facebook::react {

struct AnimationMutation {
  Tag tag;
  std::shared_ptr<const ShadowNodeFamily> family;
  AnimatedProps props;
  bool hasLayoutUpdates{false};
};

struct AnimationMutations {
  std::vector<AnimationMutation> batch;
  std::set<SurfaceId> asyncFlushSurfaces;
};

} // namespace facebook::react

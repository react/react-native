/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/Rect.h>
#include <react/renderer/graphics/Transform.h>

namespace facebook::react {

struct ShadowViewNodePair;

struct CullingContext {
  Rect frame;
  Transform transform;

  bool shouldConsiderCulling() const;

  CullingContext adjustCullingContextIfNeeded(
      const ShadowViewNodePair& pair) const;

  bool operator==(const CullingContext& rhs) const = default;
};

} // namespace facebook::react

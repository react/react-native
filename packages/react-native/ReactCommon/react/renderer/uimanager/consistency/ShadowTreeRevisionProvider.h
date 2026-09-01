/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/PrivateGuard.h>

#include <react/renderer/components/root/RootShadowNode.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <memory>

namespace facebook::react {

/**
 * This interface is used for UI consistency, indicating the revision of the
 * shadow tree that a caller should have access to.
 */
class ShadowTreeRevisionProvider {
 public:
  virtual ~ShadowTreeRevisionProvider() = default;

  virtual RootShadowNode::Shared getCurrentRevision(SurfaceId surfaceId) = 0;
};

} // namespace facebook::react

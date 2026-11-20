/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/core/ReactPrimitives.h>

namespace facebook::react {

class ContextContainer;

struct FabricUIManagerMeasureArgs {
  SurfaceId surfaceId;
  const char *componentName;
  LayoutConstraints layoutConstraints;
  folly::dynamic localData{nullptr};
  folly::dynamic props{nullptr};
  folly::dynamic state{nullptr};
};

Size measureHostComponent(const ContextContainer *contextContainer, FabricUIManagerMeasureArgs args);

} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AndroidSwitchMeasurementsManager.h"

#include <react/fabric/FabricUIManager.h>

namespace facebook::react {

Size AndroidSwitchMeasurementsManager::measure(
    SurfaceId surfaceId,
    LayoutConstraints layoutConstraints) const {
  return measureHostComponent(
      contextContainer_.get(),
      {
          .surfaceId = surfaceId,
          .componentName = "AndroidSwitch",
          .layoutConstraints = layoutConstraints,
      });
}

} // namespace facebook::react

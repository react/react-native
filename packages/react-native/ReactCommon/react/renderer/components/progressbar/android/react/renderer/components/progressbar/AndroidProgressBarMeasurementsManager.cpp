/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AndroidProgressBarMeasurementsManager.h"

#include <react/fabric/FabricUIManager.h>
#include <react/renderer/components/progressbar/conversions.h>

namespace facebook::react {

Size AndroidProgressBarMeasurementsManager::measure(
    SurfaceId surfaceId,
    const AndroidProgressBarProps& props,
    LayoutConstraints layoutConstraints) const {
  return measureHostComponent(
      contextContainer_.get(),
      {
          .surfaceId = surfaceId,
          .componentName = "AndroidProgressBar",
          .layoutConstraints = layoutConstraints,
          .props = toDynamic(props),
      });
}

} // namespace facebook::react

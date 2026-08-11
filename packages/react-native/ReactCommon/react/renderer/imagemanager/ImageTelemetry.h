/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/ReactPrimitives.h>
#include <react/utils/Telemetry.h>

namespace facebook::react {

/*
 * Represents telemetry data associated with a image request
 * where the willRequestUrlTime is the time at ImageTelemetry's creation.
 */
class ImageTelemetry final {
 public:
  ImageTelemetry(const SurfaceId surfaceId) : surfaceId_(surfaceId) {
    willRequestUrlTime_ = telemetryTimePointNow();
  }

  TelemetryTimePoint getWillRequestUrlTime() const;

  SurfaceId getSurfaceId() const;

 private:
  TelemetryTimePoint willRequestUrlTime_;

  const SurfaceId surfaceId_;
};

} // namespace facebook::react

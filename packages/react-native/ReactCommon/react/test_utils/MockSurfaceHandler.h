/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <gmock/gmock.h>

#include <react/renderer/scheduler/SurfaceHandler.h>

namespace facebook::react {

class MockSurfaceHandler : public SurfaceHandler {
 public:
  MockSurfaceHandler() : SurfaceHandler("moduleName", 0){};

  MOCK_METHOD(void, setDisplayMode, (DisplayMode), (const, noexcept));
  MOCK_METHOD(SurfaceId, getSurfaceId, (), (const, noexcept));
};

} // namespace facebook::react

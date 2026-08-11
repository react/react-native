/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/core/ShadowNodeFamily.h>
#include <react/renderer/leakchecker/WeakFamilyRegistry.h>
#include <vector>

namespace facebook::react {

using GarbageCollectionTrigger = std::function<void()>;

class LeakChecker final {
 public:
  LeakChecker(RuntimeExecutor runtimeExecutor);

  void uiManagerDidCreateShadowNodeFamily(
      const ShadowNodeFamily::Shared& shadowNodeFamily) const;
  void stopSurface(SurfaceId surfaceId);

 private:
  void checkSurfaceForLeaks(SurfaceId surfaceId) const;

  const RuntimeExecutor runtimeExecutor_{};

  WeakFamilyRegistry registry_{};
  SurfaceId previouslyStoppedSurface_{};
};

} // namespace facebook::react

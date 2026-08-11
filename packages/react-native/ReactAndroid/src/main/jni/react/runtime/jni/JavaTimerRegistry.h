/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <fbjni/fbjni.h>
#include <react/runtime/PlatformTimerRegistry.h>

#include "JJavaTimerManager.h"

namespace facebook::react {

/**
 * Call into JavaTimerManager.java to schedule and delete timers
 * with the Platform.
 */
class JavaTimerRegistry : public PlatformTimerRegistry {
 public:
  JavaTimerRegistry(
      jni::global_ref<JJavaTimerManager::javaobject> javaTimerManager);

#pragma mark - PlatformTimerRegistry

  void createTimer(uint32_t timerID, double delayMS) override;
  void createRecurringTimer(uint32_t timerID, double delayMS) override;
  void deleteTimer(uint32_t timerID) override;

 private:
  jni::global_ref<JJavaTimerManager::javaobject> javaTimerManager_;
};

} // namespace facebook::react

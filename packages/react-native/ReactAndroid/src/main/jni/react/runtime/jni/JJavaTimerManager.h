/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstdint>

#include <fbjni/fbjni.h>
#include <jni.h>

namespace facebook::react {

struct JJavaTimerManager : jni::JavaClass<JJavaTimerManager> {
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/modules/core/JavaTimerManager;";

  void createTimer(uint32_t timerID, double duration, bool repeat);

  void deleteTimer(uint32_t timerID);
};

} // namespace facebook::react

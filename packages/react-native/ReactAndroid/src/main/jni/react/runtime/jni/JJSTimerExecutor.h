/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>
#include <fbjni/fbjni.h>
#include <jni.h>
#include <react/jni/WritableNativeArray.h>
#include <react/runtime/TimerManager.h>

namespace facebook::react {

class JJSTimerExecutor : public jni::HybridClass<JJSTimerExecutor> {
 public:
  constexpr static auto kJavaDescriptor =
      "Lcom/facebook/react/runtime/JSTimerExecutor;";

  static void registerNatives();

  static void initHybrid(jni::alias_ref<jhybridobject> jobj);

  void setTimerManager(std::weak_ptr<TimerManager> timerManager);

  void callTimers(WritableNativeArray* timerIDs);

 private:
  JJSTimerExecutor() = default;

  friend HybridBase;

  std::weak_ptr<TimerManager> timerManager_;
};

} // namespace facebook::react

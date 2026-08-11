/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>
#include <react/renderer/runtimescheduler/Task.h>

namespace facebook::react {

inline static jsi::Value valueFromTask(
    jsi::Runtime& runtime,
    std::shared_ptr<Task> task) {
  jsi::Object obj(runtime);
  obj.setNativeState(runtime, std::move(task));
  return obj;
}

inline static std::shared_ptr<Task> taskFromValue(
    jsi::Runtime& runtime,
    const jsi::Value& value) {
  if (value.isNull()) {
    return nullptr;
  }
  return value.getObject(runtime).getNativeState<Task>(runtime);
}

} // namespace facebook::react

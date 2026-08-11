/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>

#include <jsi/jsi.h>

namespace facebook::react {

/*
 * Schedules `runtimeWork` to be executed on the same thread using the
 * `RuntimeExecutor`, and blocks on its completion.
 */
void executeSynchronouslyOnSameThread_CAN_DEADLOCK(
    const RuntimeExecutor& runtimeExecutor,
    std::function<void(jsi::Runtime&)>&& runtimeWork);

template <typename DataT>
inline static DataT executeSynchronouslyOnSameThread_CAN_DEADLOCK(
    const RuntimeExecutor& runtimeExecutor,
    std::function<DataT(jsi::Runtime&)>&& runtimeWork) {
  DataT data;

  executeSynchronouslyOnSameThread_CAN_DEADLOCK(
      runtimeExecutor,
      [&](jsi::Runtime& runtime) { data = runtimeWork(runtime); });

  return data;
}

void unsafeExecuteOnMainThreadSync(std::function<void()> work);

} // namespace facebook::react

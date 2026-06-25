/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JsiIntegrationTestHermesEngineAdapter.h"

namespace facebook::react::jsinspector_modern {

JsiIntegrationTestHermesEngineAdapter::JsiIntegrationTestHermesEngineAdapter(
    folly::Executor& jsExecutor)
    : runtime_{hermes::makeHermesRuntime(
          ::hermes::vm::RuntimeConfig::Builder()
              .withCompilationMode(
                  ::hermes::vm::CompilationMode::ForceLazyCompilation)
              .build())},
      jsExecutor_{jsExecutor},
      runtimeTargetDelegate_{runtime_, *runtime_} {
  // NOTE: In React Native, registerForProfiling is called by
  // HermesInstance::unstable_initializeOnJsThread, called from
  // ReactInstance::initializeRuntime. Ideally, we should figure out how to
  // manages this from inside the CDP backend,
  runtime_->registerForProfiling();
}

RuntimeTargetDelegate&
JsiIntegrationTestHermesEngineAdapter::getRuntimeTargetDelegate() {
  return runtimeTargetDelegate_;
}

jsi::Runtime& JsiIntegrationTestHermesEngineAdapter::getRuntime()
    const noexcept {
  return *runtime_;
}

RuntimeExecutor JsiIntegrationTestHermesEngineAdapter::getRuntimeExecutor()
    const noexcept {
  auto& jsExecutor = jsExecutor_;
  return [runtimeWeak = std::weak_ptr(runtime_), &jsExecutor](auto fn) {
    jsExecutor.add([runtimeWeak, fn]() {
      auto runtime = runtimeWeak.lock();
      if (!runtime) {
        return;
      }
      fn(*runtime);
    });
  };
}

} // namespace facebook::react::jsinspector_modern

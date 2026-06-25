/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HermesInstance.h"

#include <hermes/inspector-modern/chrome/HermesRuntimeTargetDelegate.h>
#include <jsi/jsilib.h>
#include <jsinspector-modern/InspectorFlags.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>

using namespace facebook::hermes;
using namespace facebook::jsi;

namespace facebook::react {

class HermesJSRuntime : public JSRuntime {
 public:
  HermesJSRuntime(
      std::shared_ptr<jsi::Runtime> runtime,
      HermesRuntime& hermesRuntime)
      : runtime_(std::move(runtime)), hermesRuntime_(hermesRuntime) {}

  jsi::Runtime& getRuntime() noexcept override {
    return *runtime_;
  }

  jsinspector_modern::RuntimeTargetDelegate& getRuntimeTargetDelegate()
      override {
    if (!targetDelegate_) {
      targetDelegate_.emplace(runtime_, hermesRuntime_);
    }
    return *targetDelegate_;
  }

  void unstable_initializeOnJsThread() override {
    hermesRuntime_.registerForProfiling();
  }

 private:
  std::shared_ptr<jsi::Runtime> runtime_;
  HermesRuntime& hermesRuntime_;
  std::optional<jsinspector_modern::HermesRuntimeTargetDelegate>
      targetDelegate_;
};

std::unique_ptr<JSRuntime> HermesInstance::createJSRuntime(
    std::shared_ptr<::hermes::vm::CrashManager> crashManager,
    std::shared_ptr<MessageQueueThread> msgQueueThread,
    bool allocInOldGenBeforeTTI) noexcept {
  assert(msgQueueThread != nullptr);

  auto gcConfig = ::hermes::vm::GCConfig::Builder()
                      // Default to 3GB
                      .withMaxHeapSize(3072 << 20)
                      .withName("RNBridgeless");

  if (allocInOldGenBeforeTTI) {
    // For the next two arguments: avoid GC before TTI
    // by initializing the runtime to allocate directly
    // in the old generation, but revert to normal
    // operation when we reach the (first) TTI point.
    gcConfig.withAllocInYoung(false).withRevertToYGAtTTI(true);
  }

  ::hermes::vm::RuntimeConfig::Builder runtimeConfigBuilder =
      ::hermes::vm::RuntimeConfig::Builder()
          .withGCConfig(gcConfig.build())
          .withEnableSampleProfiling(true)
          .withMicrotaskQueue(
              ReactNativeFeatureFlags::enableBridgelessArchitecture());

  if (crashManager) {
    runtimeConfigBuilder.withCrashMgr(crashManager);
  }

  std::unique_ptr<HermesRuntime> hermesRuntime =
      hermes::makeHermesRuntime(runtimeConfigBuilder.build());

  auto errorPrototype = hermesRuntime->global()
                            .getPropertyAsObject(*hermesRuntime, "Error")
                            .getPropertyAsObject(*hermesRuntime, "prototype");
  errorPrototype.setProperty(*hermesRuntime, "jsEngine", "hermes");

  (void)msgQueueThread;

  HermesRuntime& hermesRuntimeRef = *hermesRuntime;
  return std::make_unique<HermesJSRuntime>(
      std::move(hermesRuntime), hermesRuntimeRef);
}

} // namespace facebook::react

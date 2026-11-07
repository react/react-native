/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JHermesInstance.h"

#include <android/log.h>
#include <fbjni/fbjni.h>
#include <hermes/hermes.h>

#include <mutex>

namespace facebook::react {

static void hermesFatalHandler(const std::string& reason) {
  __android_log_assert(nullptr, "Hermes", "%s", reason.c_str());
}

static constinit std::once_flag flag;

jni::local_ref<JHermesInstance::jhybriddata> JHermesInstance::initHybrid(
    jni::alias_ref<jclass> /* unused */,
    bool allocInOldGenBeforeTTI) {
  std::call_once(flag, []() {
    auto* fatalHandlerInterface =
        jsi::castInterface<facebook::hermes::ISetFatalHandler>(
            facebook::hermes::makeHermesRootAPI());
    if (fatalHandlerInterface) {
      fatalHandlerInterface->setFatalHandler(hermesFatalHandler);
    }
  });
  return makeCxxInstance(allocInOldGenBeforeTTI);
}

void JHermesInstance::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", JHermesInstance::initHybrid),
  });
}

std::unique_ptr<JSRuntime> JHermesInstance::createJSRuntime(
    std::shared_ptr<MessageQueueThread> msgQueueThread) noexcept {
  return HermesInstance::createJSRuntime(
      nullptr, msgQueueThread, allocInOldGenBeforeTTI_);
}

} // namespace facebook::react

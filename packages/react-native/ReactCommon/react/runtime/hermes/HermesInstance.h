/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <cxxreact/MessageQueueThread.h>
#include <hermes/hermes.h>
#include <jsi/jsi.h>
#include <react/runtime/JSRuntimeFactory.h>

namespace facebook::react {

class HermesInstance {
 public:
  static std::unique_ptr<JSRuntime> createJSRuntime(
      std::shared_ptr<::hermes::vm::CrashManager> crashManager,
      std::shared_ptr<MessageQueueThread> msgQueueThread,
      bool allocInOldGenBeforeTTI) noexcept;
};

} // namespace facebook::react

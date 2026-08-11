/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef __cplusplus

#include <jsi/jsi.h>
#include <jsinspector-modern/ReactCdp.h>

namespace facebook::react {

class MessageQueueThread;

/**
 * An interface that represents an instance of a JS VM
 */
class JSRuntime {
 public:
  virtual jsi::Runtime& getRuntime() noexcept = 0;

  virtual ~JSRuntime() = default;

  /**
   * Get a reference to the \c RuntimeTargetDelegate owned (or implemented) by
   * this JSRuntime. This reference must remain valid for the duration of the
   * JSRuntime's lifetime.
   */
  virtual jsinspector_modern::RuntimeTargetDelegate& getRuntimeTargetDelegate();

  /**
   * Run initialize work that must happen on the runtime's JS thread. Used for
   * initializing TLS and registering profiling.
   *
   * TODO T194671568 Move the runtime constructor to the JsThread
   */
  virtual void unstable_initializeOnJsThread() {}

 private:
  /**
   * Initialized by \c getRuntimeTargetDelegate if not overridden, and then
   * never changes.
   */
  std::optional<jsinspector_modern::FallbackRuntimeTargetDelegate>
      runtimeTargetDelegate_;
};

/**
 * Interface for a class that creates instances of a JS VM
 */
class JSRuntimeFactory {
 public:
  virtual std::unique_ptr<JSRuntime> createJSRuntime(
      std::shared_ptr<MessageQueueThread> msgQueueThread) noexcept = 0;

  virtual ~JSRuntimeFactory() = default;
};

/**
 * Utility class for creating a JSRuntime from a uniquely owned jsi::Runtime.
 */
class JSIRuntimeHolder : public JSRuntime {
 public:
  jsi::Runtime& getRuntime() noexcept override;

  explicit JSIRuntimeHolder(std::unique_ptr<jsi::Runtime> runtime);

 private:
  std::unique_ptr<jsi::Runtime> runtime_;
};

} // namespace facebook::react

#endif // __cplusplus

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <React/CallInvoker.h>
#include <React/JSBigString.h>
#include <React/RuntimeExecutor.h>
#include <cxxreact/MessageQueueThread.h>
#include <jserrorhandler/JsErrorHandler.h>
#include <jsi/jsi.h>
#include <jsinspector-modern/ReactCdp.h>
#include <react/renderer/runtimescheduler/RuntimeScheduler.h>
#include <react/runtime/BufferedRuntimeExecutor.h>
#include <react/runtime/CallInvokerImpl.h>
#include <react/runtime/JSRuntimeFactory.h>
#include <react/runtime/TimerManager.h>

namespace facebook::react {

class ReactInstance final : private jsinspector_modern::InstanceTargetDelegate {
 public:
  using BindingsInstallFunc = std::function<void(jsi::Runtime &runtime)>;
  using ArgFactory = std::function<void(jsi::Runtime &runtime, std::vector<jsi::Value> &args)>;

  using JSRuntimeProvider = std::function<std::unique_ptr<JSRuntime>()>;

  ReactInstance(
      std::unique_ptr<JSRuntime> runtime,
      std::shared_ptr<MessageQueueThread> jsMessageQueueThread,
      std::shared_ptr<TimerManager> timerManager,
      JsErrorHandler::OnJsError onJsError,
      jsinspector_modern::HostTarget *parentInspectorTarget = nullptr);

  /**
   * Like the constructor above, but the JS runtime is created by `runtimeProvider` as the first task
   * on the JS thread instead of synchronously on the calling thread. That lets the caller continue
   * with the rest of the instance setup (TurboModules, Fabric) while the runtime is being created.
   * The only method that needs the runtime synchronously, `getJavaScriptContext()`, waits for it.
   * When `parentInspectorTarget` is set the runtime is created synchronously, as the inspector
   * registration needs it right away.
   */
  ReactInstance(
      JSRuntimeProvider runtimeProvider,
      std::shared_ptr<MessageQueueThread> jsMessageQueueThread,
      std::shared_ptr<TimerManager> timerManager,
      JsErrorHandler::OnJsError onJsError,
      jsinspector_modern::HostTarget *parentInspectorTarget = nullptr);
  ReactInstance(const ReactInstance &) = delete;
  ReactInstance(ReactInstance &&) = delete;
  ReactInstance &operator=(const ReactInstance &) = delete;
  ReactInstance &operator=(ReactInstance &&) = delete;
  ~ReactInstance() noexcept override;

  RuntimeExecutor getUnbufferedRuntimeExecutor() noexcept;

  RuntimeExecutor getBufferedRuntimeExecutor() noexcept;

  std::shared_ptr<RuntimeScheduler> getRuntimeScheduler() noexcept;

  /**
   * The CallInvoker platforms should hand to TurboModules and other native
   * callers. It shares the instance's BufferedRuntimeExecutor, so async calls
   * are ordered against `callFunctionOnModule` and do not run before the main
   * bundle has finished evaluating. See CallInvokerImpl.
   */
  std::shared_ptr<CallInvoker> createJSCallInvoker() noexcept;

  struct JSRuntimeFlags {
    bool isProfiling = false;
    const std::string runtimeDiagnosticFlags = {};
  };

  void initializeRuntime(JSRuntimeFlags options, BindingsInstallFunc bindingsInstallFunc) noexcept;

  void loadScript(
      std::unique_ptr<const JSBigString> script,
      const std::string &sourceURL,
      std::function<void(jsi::Runtime &runtime)> &&beforeLoad = nullptr,
      std::function<void(jsi::Runtime &runtime)> &&afterLoad = nullptr);

  void registerSegment(uint32_t segmentId, const std::string &segmentPath);

  void callFunctionOnModule(const std::string &moduleName, const std::string &methodName, folly::dynamic &&args);

  /**
   * Like the overload above, but `argFactory` adds the arguments on the JS thread, so platform
   * values can be converted to JS values directly.
   */
  void callFunctionOnModule(const std::string &moduleName, const std::string &methodName, ArgFactory &&argFactory);

  void handleMemoryPressureJs(int pressureLevel);

  /**
   * Unregisters the instance from the inspector. This method must be called
   * on the main (non-JS) thread.
   */
  void unregisterFromInspector();

  /**
   * Returns the jsi::Runtime pointer. Blocks until the runtime has been created when the instance
   * was constructed with a JSRuntimeProvider and the JS thread has not created it yet; returns
   * nullptr if the instance is being destroyed before that happened.
   */
  void *getJavaScriptContext();

 private:
  class RuntimeHolder;

  ReactInstance(
      std::shared_ptr<JSRuntime> runtime,
      JSRuntimeProvider runtimeProvider,
      std::shared_ptr<MessageQueueThread> jsMessageQueueThread,
      std::shared_ptr<TimerManager> timerManager,
      JsErrorHandler::OnJsError onJsError,
      jsinspector_modern::HostTarget *parentInspectorTarget);

  std::shared_ptr<RuntimeHolder> runtimeHolder_;
  std::shared_ptr<MessageQueueThread> jsMessageQueueThread_;
  std::shared_ptr<BufferedRuntimeExecutor> bufferedRuntimeExecutor_;
  std::shared_ptr<TimerManager> timerManager_;
  std::unordered_map<std::string, std::variant<jsi::Function, jsi::Object>> callableModules_;
  std::shared_ptr<RuntimeScheduler> runtimeScheduler_;
  std::shared_ptr<JsErrorHandler> jsErrorHandler_;

  jsinspector_modern::InstanceTarget *inspectorTarget_{nullptr};
  jsinspector_modern::RuntimeTarget *runtimeInspectorTarget_{nullptr};
  jsinspector_modern::HostTarget *parentInspectorTarget_{nullptr};
};

} // namespace facebook::react

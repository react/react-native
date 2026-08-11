/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifndef RCT_REMOVE_LEGACY_ARCH

#include <atomic>
#include <functional>
#include <map>
#include <vector>

#include <ReactCommon/CallInvoker.h>
#include <ReactCommon/RuntimeExecutor.h>
#include <cxxreact/JSExecutor.h>
#include <jsinspector-modern/ReactCdp.h>

namespace folly {
struct dynamic;
}

namespace facebook::react {

struct InstanceCallback;
class JsToNativeBridge;
class MessageQueueThread;
class ModuleRegistry;
class RAMBundleRegistry;

// This class manages calls from native code to JS.  It also manages
// executors and their threads.  All functions here can be called from
// any thread.
//
// Except for loadBundleSync(), all void methods will queue
// work to run on the jsQueue passed to the ctor, and return
// immediately.
class [[deprecated(
    "This API will be removed along with the legacy architecture.")]] NativeToJsBridge {
 public:
  friend class JsToNativeBridge;

  /**
   * This must be called on the main JS thread.
   */
  NativeToJsBridge(
      JSExecutorFactory * jsExecutorFactory,
      std::shared_ptr<ModuleRegistry> registry,
      std::shared_ptr<MessageQueueThread> jsQueue,
      std::shared_ptr<InstanceCallback> callback);
  virtual ~NativeToJsBridge();

  /**
   * Executes a function with the module ID and method ID and any additional
   * arguments in JS.
   */
  void callFunction(
      std::string && module,
      std::string && method,
      folly::dynamic && arguments);

  /**
   * Invokes a callback with the cbID, and optional additional arguments in JS.
   */
  void invokeCallback(double callbackId, folly::dynamic&& arguments);

  /**
   * Sets global variables in the JS Context.
   */
  void initializeRuntime();

  /**
   * Starts the JS application.  If bundleRegistry is non-null, then it is
   * used to fetch JavaScript modules as individual scripts.
   * Otherwise, the script is assumed to include all the modules.
   */
  void loadBundle(
      std::unique_ptr<RAMBundleRegistry> bundleRegistry,
      std::unique_ptr<const JSBigString> startupScript,
      std::string sourceURL);
  void loadBundleSync(
      std::unique_ptr<RAMBundleRegistry> bundleRegistry,
      std::unique_ptr<const JSBigString> startupScript,
      std::string sourceURL);

  void registerBundle(uint32_t bundleId, const std::string& bundlePath);
  void setGlobalVariable(
      std::string propName, std::unique_ptr<const JSBigString> jsonValue);
  void* getJavaScriptContext();
  bool isInspectable();
  bool isBatchActive();

  void handleMemoryPressure(int pressureLevel);

  /**
   * Synchronously tears down the bridge and the main executor.
   */
  void destroy();

  void runOnExecutorQueue(std::function<void(JSExecutor*)> && task) noexcept;

  /**
   * NativeMethodCallInvoker is used by TurboModules to schedule work on the
   * NativeModule thread(s).
   */
  std::shared_ptr<NativeMethodCallInvoker> getDecoratedNativeMethodCallInvoker(
      std::shared_ptr<NativeMethodCallInvoker> nativeMethodCallInvoker) const;

  jsinspector_modern::RuntimeTargetDelegate& getInspectorTargetDelegate();

 private:
  // This is used to avoid a race condition where a proxyCallback gets queued
  // after ~NativeToJsBridge(), on the same thread. In that case, the callback
  // will try to run the task on m_callback which will have been destroyed
  // within ~NativeToJsBridge(), thus causing a SIGSEGV.
  std::shared_ptr<bool> m_destroyed;
  std::shared_ptr<JsToNativeBridge> m_delegate;
  std::unique_ptr<JSExecutor> m_executor;
  std::shared_ptr<MessageQueueThread> m_executorMessageQueueThread;

  // Memoize this on the JS thread, so that it can be inspected from
  // any thread later.  This assumes inspectability doesn't change for
  // a JSExecutor instance, which is true for all existing implementations.
  bool m_inspectable;

  // Keep track of whether the JS bundle containing the application logic causes
  // exception when evaluated initially. If so, more calls to JS will very
  // likely fail as well, so this flag can help prevent them.
  bool m_applicationScriptHasFailure = false;

#ifdef WITH_FBSYSTRACE
  std::atomic<uint_least32_t> m_systraceCookie{0};
#endif
};

} // namespace facebook::react

#endif // RCT_REMOVE_LEGACY_ARCH

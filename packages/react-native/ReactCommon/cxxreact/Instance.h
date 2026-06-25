/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifndef RCT_REMOVE_LEGACY_ARCH

#include <condition_variable>
#include <list>
#include <memory>
#include <mutex>

#include <ReactCommon/RuntimeExecutor.h>
#include <cxxreact/NativeToJsBridge.h>
#include <jsinspector-modern/ReactCdp.h>

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace folly {
struct dynamic;
}

namespace facebook::react {

class JSBigString;
class JSExecutorFactory;
class MessageQueueThread;
class ModuleRegistry;
class RAMBundleRegistry;

struct [[deprecated("This API will be removed along with the legacy architecture.")]] InstanceCallback {
  virtual ~InstanceCallback() = default;
  virtual void onBatchComplete() {}
  virtual void incrementPendingJSCalls() {}
  virtual void decrementPendingJSCalls() {}
};

class RN_EXPORT [[deprecated("This API will be removed along with the legacy architecture.")]] Instance
    : private jsinspector_modern::InstanceTargetDelegate {
 public:
  ~Instance() override;
  void initializeBridge(
      std::unique_ptr<InstanceCallback> callback,
      std::shared_ptr<JSExecutorFactory> jsef,
      std::shared_ptr<MessageQueueThread> jsQueue,
      std::shared_ptr<ModuleRegistry> moduleRegistry,
      jsinspector_modern::HostTarget *inspectorTarget = nullptr);

  void initializeRuntime();

  void setSourceURL(std::string sourceURL);

  void loadScriptFromString(std::unique_ptr<const JSBigString> string, std::string sourceURL, bool loadSynchronously);
  void loadRAMBundle(
      std::unique_ptr<RAMBundleRegistry> bundleRegistry,
      std::unique_ptr<const JSBigString> startupScript,
      std::string startupScriptSourceURL,
      bool loadSynchronously);
  bool supportsProfiling();
  void setGlobalVariable(std::string propName, std::unique_ptr<const JSBigString> jsonValue);
  void *getJavaScriptContext();
  bool isInspectable();
  bool isBatchActive();
  void callJSFunction(std::string &&module, std::string &&method, folly::dynamic &&params);
  void callJSCallback(uint64_t callbackId, folly::dynamic &&params);

  // This method is experimental, and may be modified or removed.
  void registerBundle(uint32_t bundleId, const std::string &bundlePath);

  const ModuleRegistry &getModuleRegistry() const;
  ModuleRegistry &getModuleRegistry();

  void handleMemoryPressure(int pressureLevel);

  /**
   * JS CallInvoker is used by TurboModules to schedule work on the JS thread.
   *
   * Why is the bridge creating JS CallInvoker?
   *
   * - After every Native -> JS call in the TurboModule system, the bridge
   *   needs to flush all queued NativeModule method calls. The bridge must
   *   also dispatch onBatchComplete if the queue of NativeModule method calls
   *   was not empty.
   */
  std::shared_ptr<CallInvoker> getJSCallInvoker();

  /**
   * NativeMethodCallInvoker is used by TurboModules to schedule work on the
   * NativeModule thread(s).
   *
   * Why is the bridge decorating NativeMethodCallInvoker?
   *
   * - The bridge must be informed of all TurboModule async method calls. Why?
   *   When all queued NativeModule method calls are flushed by a call from
   *   Native -> JS, if that queue was non-zero in size, JsToNativeBridge
   *   dispatches onBatchComplete. When we turn our NativeModules to
   *   TurboModules, there will be less and less pending NativeModule method
   *   calls, so onBatchComplete will not fire as often. Therefore, the bridge
   *   needs to know how many TurboModule async method calls have been completed
   *   since the last time the bridge was flushed. If this number is non-zero,
   *   we fire onBatchComplete.
   *
   * Why can't we just create and return a new NativeMethodCallInvoker?
   *
   * - On Android, we have one NativeModule thread. That thread is created and
   *   managed outside of NativeToJsBridge. On iOS, we have one MethodQueue per
   *   module. Those MethodQueues are also created and managed outside of
   *   NativeToJsBridge. Therefore, we need to pass in a
   * NativeMethodCallInvoker that schedules work on the respective thread.
   */
  std::shared_ptr<NativeMethodCallInvoker> getDecoratedNativeMethodCallInvoker(
      std::shared_ptr<NativeMethodCallInvoker> nativeMethodCallInvoker);

  /**
   * RuntimeExecutor is used by Fabric to access the jsi::Runtime.
   */
  RuntimeExecutor getRuntimeExecutor();

  /**
   * Unregisters the instance from the inspector. This method must be called
   * on the main (non-JS) thread, AFTER \c initializeBridge has completed.
   */
  void unregisterFromInspector();

 private:
  void callNativeModules(folly::dynamic &&calls, bool isEndOfBatch);
  void loadBundle(
      std::unique_ptr<RAMBundleRegistry> bundleRegistry,
      std::unique_ptr<const JSBigString> startupScript,
      std::string startupScriptSourceURL);
  void loadBundleSync(
      std::unique_ptr<RAMBundleRegistry> bundleRegistry,
      std::unique_ptr<const JSBigString> startupScript,
      std::string startupScriptSourceURL);

  std::shared_ptr<InstanceCallback> callback_;
  std::shared_ptr<NativeToJsBridge> nativeToJsBridge_;
  std::shared_ptr<ModuleRegistry> moduleRegistry_;

  std::mutex m_syncMutex;
  std::condition_variable m_syncCV;
  bool m_syncReady = false;

  class JSCallInvoker : public CallInvoker {
   private:
    std::weak_ptr<NativeToJsBridge> m_nativeToJsBridge;
    std::mutex m_mutex;
    bool m_shouldBuffer = true;
    std::list<CallFunc> m_workBuffer;

    void scheduleAsync(CallFunc &&work) noexcept;

   public:
    void setNativeToJsBridgeAndFlushCalls(std::weak_ptr<NativeToJsBridge> nativeToJsBridge);
    void invokeAsync(CallFunc &&work) noexcept override;
    void invokeSync(CallFunc &&work) override;
  };

  std::shared_ptr<JSCallInvoker> jsCallInvoker_ = std::make_shared<JSCallInvoker>();

  jsinspector_modern::HostTarget *parentInspectorTarget_{nullptr};
  jsinspector_modern::InstanceTarget *inspectorTarget_{nullptr};
  jsinspector_modern::RuntimeTarget *runtimeInspectorTarget_{nullptr};
};

} // namespace facebook::react

#endif // RCT_REMOVE_LEGACY_ARCH

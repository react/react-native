/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HermesExecutorFactory.h"

#include <cxxreact/MessageQueueThread.h>
#include <cxxreact/TraceSection.h>
#include <hermes/hermes.h>
#include <jsi/decorator.h>
#include <jsinspector-modern/InspectorFlags.h>

#include <thread>

#include <hermes/inspector-modern/chrome/HermesRuntimeTargetDelegate.h>

using namespace facebook::hermes;
using namespace facebook::jsi;

namespace facebook::react {

namespace {

struct ReentrancyCheck {
// This is effectively a very subtle and complex assert, so only
// include it in builds which would include asserts.
#ifndef NDEBUG
  ReentrancyCheck() : tid(std::thread::id()), depth(0) {}

  void before() {
    std::thread::id this_id = std::this_thread::get_id();
    std::thread::id expected = std::thread::id();

    // A note on memory ordering: the main purpose of these checks is
    // to observe a before/before race, without an intervening after.
    // This will be detected by the compare_exchange_strong atomicity
    // properties, regardless of memory order.
    //
    // For everything else, it is easiest to think of 'depth' as a
    // proxy for any access made inside the VM.  If access to depth
    // are reordered incorrectly, the same could be true of any other
    // operation made by the VM.  In fact, using acquire/release
    // memory ordering could create barriers which mask a programmer
    // error.  So, we use relaxed memory order, to avoid masking
    // actual ordering errors.  Although, in practice, ordering errors
    // of this sort would be surprising, because the decorator would
    // need to call after() without before().

    if (tid.compare_exchange_strong(
            expected, this_id, std::memory_order_relaxed)) {
      // Returns true if tid and expected were the same.  If they
      // were, then the stored tid referred to no thread, and we
      // atomically saved this thread's tid.  Now increment depth.
      assert(depth == 0 && "No thread id, but depth != 0");
      ++depth;
    } else if (expected == this_id) {
      // If the stored tid referred to a thread, expected was set to
      // that value.  If that value is this thread's tid, that's ok,
      // just increment depth again.
      assert(depth != 0 && "Thread id was set, but depth == 0");
      ++depth;
    } else {
      // The stored tid was some other thread.  This indicates a bad
      // programmer error, where VM methods were called on two
      // different threads unsafely.  Fail fast (and hard) so the
      // crash can be analyzed.
      __builtin_trap();
    }
  }

  void after() {
    assert(
        tid.load(std::memory_order_relaxed) == std::this_thread::get_id() &&
        "No thread id in after()");
    if (--depth == 0) {
      // If we decremented depth to zero, store no-thread into tid.
      std::thread::id expected = std::this_thread::get_id();
      bool didWrite = tid.compare_exchange_strong(
          expected, std::thread::id(), std::memory_order_relaxed);
      assert(didWrite && "Decremented to zero, but no tid write");
    }
  }

  std::atomic<std::thread::id> tid;
  // This is not atomic, as it is only written or read from the owning
  // thread.
  unsigned int depth;
#endif
};

// This adds ReentrancyCheck to the given Runtime.
class DecoratedRuntime : public jsi::WithRuntimeDecorator<ReentrancyCheck> {
 public:
  // The first argument may be another decorater which itself
  // decorates the real HermesRuntime, depending on the build config.
  DecoratedRuntime(
      std::unique_ptr<Runtime> runtime,
      HermesRuntime& hermesRuntime,
      std::shared_ptr<MessageQueueThread> jsQueue,
      bool enableDebugger,
      const std::string& debuggerName)
      : jsi::WithRuntimeDecorator<ReentrancyCheck>(*runtime, reentrancyCheck_),
        runtime_(std::move(runtime)) {
    (void)hermesRuntime;
    (void)jsQueue;
    (void)enableDebugger;
    (void)debuggerName;
  }

  ~DecoratedRuntime() {}

 private:
  std::shared_ptr<Runtime> runtime_;
  ReentrancyCheck reentrancyCheck_;
};

} // namespace

void HermesExecutorFactory::setEnableDebugger(bool enableDebugger) {
  enableDebugger_ = enableDebugger;
}

void HermesExecutorFactory::setDebuggerName(const std::string& debuggerName) {
  debuggerName_ = debuggerName;
}

std::unique_ptr<JSExecutor> HermesExecutorFactory::createJSExecutor(
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> jsQueue) {
  std::unique_ptr<HermesRuntime> hermesRuntime;
  {
    TraceSection s("makeHermesRuntime");
    hermesRuntime = hermes::makeHermesRuntime(runtimeConfig_);
  }

  HermesRuntime& hermesRuntimeRef = *hermesRuntime;
  auto& inspectorFlags = jsinspector_modern::InspectorFlags::getInstance();
  bool enableDebugger = !inspectorFlags.getFuseboxEnabled() && enableDebugger_;
  auto decoratedRuntime = std::make_shared<DecoratedRuntime>(
      std::move(hermesRuntime),
      hermesRuntimeRef,
      jsQueue,
      enableDebugger,
      debuggerName_);

  // So what do we have now?
  // DecoratedRuntime -> HermesRuntime
  //
  // DecoratedRuntime is held by JSIExecutor.  When it gets used, it
  // will check that it's on the right thread, do any necessary trace
  // logging, then call the real HermesRuntime.

  // Add js engine information to Error.prototype so in error reporting we
  // can send this information.
  auto errorPrototype =
      decoratedRuntime->global()
          .getPropertyAsObject(*decoratedRuntime, "Error")
          .getPropertyAsObject(*decoratedRuntime, "prototype");
  errorPrototype.setProperty(*decoratedRuntime, "jsEngine", "hermes");

  return std::make_unique<HermesExecutor>(
      decoratedRuntime,
      delegate,
      jsQueue,
      timeoutInvoker_,
      runtimeInstaller_,
      hermesRuntimeRef);
}

::hermes::vm::RuntimeConfig HermesExecutorFactory::defaultRuntimeConfig() {
  return ::hermes::vm::RuntimeConfig::Builder()
      .withEnableSampleProfiling(true)
      .build();
}

HermesExecutor::HermesExecutor(
    std::shared_ptr<jsi::Runtime> runtime,
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> jsQueue,
    const JSIScopedTimeoutInvoker& timeoutInvoker,
    RuntimeInstaller runtimeInstaller,
    HermesRuntime& hermesRuntime)
    : JSIExecutor(runtime, delegate, timeoutInvoker, runtimeInstaller),
      runtime_(runtime),
      hermesRuntime_(runtime_, &hermesRuntime) {}

jsinspector_modern::RuntimeTargetDelegate&
HermesExecutor::getRuntimeTargetDelegate() {
  if (!targetDelegate_) {
    targetDelegate_ =
        std::make_unique<jsinspector_modern::HermesRuntimeTargetDelegate>(
            hermesRuntime_, *hermesRuntime_);
  }
  return *targetDelegate_;
}

} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/ReactPrimitives.h>
#include <react/runtime/ReactInstanceConfig.h>
#include <cstdint>
#include <memory>
#include <string>
#include <vector>

#include "TesterAnimationChoreographer.h"
#include "TesterMountingManager.h"

namespace facebook::jsi {
class Runtime;
}

namespace facebook::react {

class FantomTimerRegistry;
class ReactHost;
class StubQueue;
class RunLoopObserverManager;

class TesterAppDelegate {
 public:
  TesterAppDelegate(const ReactInstanceConfig &reactInstanceConfig);
  ~TesterAppDelegate();

  // TesterAppDelegate is not copyable or movable.
  TesterAppDelegate(const TesterAppDelegate &) = delete;
  TesterAppDelegate &operator=(const TesterAppDelegate &) = delete;
  TesterAppDelegate(TesterAppDelegate &&) = delete;
  TesterAppDelegate &operator=(TesterAppDelegate &&) = delete;

  // Loads the bundle, registering the Metro runtime and warm-up modules.
  // Does not run any tests.
  void loadScript(const std::string &bundlePath, const std::string &sourcePath);

  // Loads the bundle and then invokes `$$RunTests$$` to run the tests.
  void loadScriptAndRunTests(const std::string &bundlePath, const std::string &sourcePath);

  // Evaluates a single JS snippet in the already-loaded runtime, in global
  // scope, and flushes the message queue. Used by interactive (REPL) mode.
  void evaluateInteractiveChunk(const std::string &source, const std::string &sourceURL);

  // Reads length-prefixed JS snippets from stdin and evaluates each one until
  // stdin is closed. Each frame is `<byteCount>\n` followed by exactly
  // `byteCount` bytes of UTF-8 source. Emits a `repl-eval-complete` JSON line
  // on stdout after each evaluation.
  void runInteractiveLoop();

  void openDebugger() const;

  void startSurface(
      jsi::Runtime &runtime,
      float widthDp,
      float heightDp,
      SurfaceId surfaceId,
      float pointScaleFactor = 1.0f,
      float viewportOffsetX = 0.0f,
      float viewportOffsetY = 0.0f);

  void updateSurfaceConstraints(SurfaceId surfaceId, float widthDp, float heightDp, float pointScaleFactor);

  void stopSurface(SurfaceId surfaceId);

  void onRender();

  void produceFramesForDuration(double milliseconds);

  // Deterministic timer control (driven from JS via NativeFantom).
  void setTimerMockEnabled(bool enabled);
  void advanceTimers(double deltaMs);
  void runAllTimers();
  uint32_t getPendingTimerCount();

  void flushMessageQueue();

  bool hasPendingTasksInMessageQueue();

  std::vector<std::string> getConsoleLogs();

  std::unique_ptr<ReactHost> reactHost_;
  std::weak_ptr<StubQueue> queue_;

  std::shared_ptr<RunLoopObserverManager> runLoopObserverManager_;

  std::vector<std::string> consoleLogs_{};

  std::shared_ptr<TesterMountingManager> mountingManager_;

  std::shared_ptr<TesterAnimationChoreographer> animationChoreographer_;

 private:
  void runUITick();

  std::function<void()> onAnimationRender_{nullptr};

  // Non-owning pointer to the JS runtime, captured after the script is loaded.
  // Used to evaluate snippets directly (outside the run loop) in REPL mode.
  jsi::Runtime *runtime_{nullptr};

  // Owned by the TimerManager (inside the ReactInstance); this is a non-owning
  // pointer used to drive the deterministic timer mock from JS.
  FantomTimerRegistry *timerRegistry_{nullptr};
};

} // namespace facebook::react

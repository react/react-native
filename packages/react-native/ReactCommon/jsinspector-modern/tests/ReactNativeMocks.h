/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <gmock/gmock.h>
#include <gtest/gtest.h>
#include <queue>

#include <ReactCommon/RuntimeExecutor.h>
#include <jsi/jsi.h>
#include <react/runtime/ReactInstance.h>

namespace facebook::react::jsinspector_modern {

class MockTimerRegistry : public react::PlatformTimerRegistry {
 public:
  MOCK_METHOD2(createTimer, void(uint32_t, double));
  MOCK_METHOD2(createRecurringTimer, void(uint32_t, double));
  MOCK_METHOD1(deleteTimer, void(uint32_t));
};

class MockMessageQueueThread : public react::MessageQueueThread {
 public:
  void runOnQueue(std::function<void()>&& func) override;

  // Unused
  void runOnQueueSync(std::function<void()>&& callback) override;

  // Unused
  void quitSynchronous() override;

  void tick();

  void flush();

  void guardedTick();

  size_t size();

 private:
  std::queue<std::function<void()>> callbackQueue_;
};

class ErrorUtils : public jsi::HostObject {
 public:
  jsi::Value get(jsi::Runtime& rt, const jsi::PropNameID& name) override;

  void reportFatalError(jsi::JSError&& error) {
    errors_.push_back(std::move(error));
  }

  size_t size();

  jsi::JSError getLastError();

 private:
  std::vector<jsi::JSError> errors_;
};

} // namespace facebook::react::jsinspector_modern

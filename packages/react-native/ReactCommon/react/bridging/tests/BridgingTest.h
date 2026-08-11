/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/TestCallInvoker.h>
#include <gtest/gtest.h>
#include <hermes/hermes.h>
#include <react/bridging/Bridging.h>

#define EXPECT_JSI_THROW(expr) EXPECT_THROW((expr), facebook::jsi::JSIException)

namespace facebook::react {

class BridgingTest : public ::testing::Test {
 public:
  BridgingTest(BridgingTest& other) = delete;
  BridgingTest& operator=(BridgingTest& other) = delete;
  BridgingTest(BridgingTest&& other) = delete;
  BridgingTest& operator=(BridgingTest&& other) = delete;

 protected:
  BridgingTest()
      : runtime(hermes::makeHermesRuntime(
            ::hermes::vm::RuntimeConfig::Builder()
                // Make promises work with Hermes microtasks.
                .withMicrotaskQueue(true)
                .build())),
        rt(*runtime),
        invoker(std::make_shared<TestCallInvoker>(*runtime)) {}

  ~BridgingTest() override {
    LongLivedObjectCollection::get(rt).clear();
  }

  void TearDown() override {
    flushQueue();

    // After flushing the invoker queue, we shouldn't leak memory.
    EXPECT_EQ(0, LongLivedObjectCollection::get(rt).size());
  }

  jsi::Value eval(const std::string& js) {
    return rt.global().getPropertyAsFunction(rt, "eval").call(rt, js);
  }

  jsi::Function function(const std::string& js) {
    return eval(("(" + js + ")").c_str()).getObject(rt).getFunction(rt);
  }

  void flushQueue() {
    invoker->flushQueue();
  }

  std::shared_ptr<jsi::Runtime> runtime;
  jsi::Runtime& rt;
  std::shared_ptr<TestCallInvoker> invoker;
};

} // namespace facebook::react

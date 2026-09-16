/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/fabric/AndroidEventBeat.h>

#include <fbjni/fbjni.h>
#include <gtest/gtest.h>
#include <hermes/hermes.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>
#include <react/renderer/runtimescheduler/RuntimeScheduler.h>

#include <memory>
#include <string>
#include <vector>

namespace facebook::react {

class EventBeatTestAccess : public EventBeat {
 public:
  using EventBeat::EventBeat;

  static void markRequested(EventBeat& eventBeat) {
    eventBeat.*requestedMember() = true;
  }

 private:
  static std::atomic<bool> EventBeat::* requestedMember() {
    return &EventBeatTestAccess::isEventBeatRequested_;
  }
};

class AndroidEventBeatTestFeatureFlags
    : public ReactNativeFeatureFlagsDefaults {
 public:
  bool enableBridgelessArchitecture() override {
    return false;
  }
};

class AndroidEventBeatTest : public ::testing::Test {
 protected:
  void SetUp() override {
    ReactNativeFeatureFlags::dangerouslyReset();
    ReactNativeFeatureFlags::override(
        std::make_unique<AndroidEventBeatTestFeatureFlags>());

    runtime_ = facebook::hermes::makeHermesRuntime();
    runtimeScheduler_ = std::make_unique<RuntimeScheduler>(
        [this](std::function<void(jsi::Runtime & runtime)>&& callback) {
          callback(*runtime_);
        });
  }

  void TearDown() override {
    runtimeScheduler_.reset();
    runtime_.reset();
    ReactNativeFeatureFlags::dangerouslyReset();
  }

  std::unique_ptr<AndroidEventBeat> makeEventBeat(
      std::shared_ptr<const void> owner) {
    auto ownerBox = std::make_shared<EventBeat::OwnerBox>();
    ownerBox->owner = owner;
    return std::make_unique<AndroidEventBeat>(
        std::move(ownerBox),
        &eventBeatManager_,
        *runtimeScheduler_,
        jni::global_ref<jobject>{});
  }

  EventBeatManager eventBeatManager_;
  std::unique_ptr<facebook::hermes::HermesRuntime> runtime_;
  std::unique_ptr<RuntimeScheduler> runtimeScheduler_;
};

TEST_F(AndroidEventBeatTest, testTickRunsCallbackForPendingBeat) {
  auto owner = std::make_shared<int>(1);
  auto eventBeat = makeEventBeat(owner);
  std::vector<std::string> calls;

  eventBeat->unstable_setInduceCallback(
      [&calls]() { calls.push_back("induce"); });
  eventBeat->setBeatCallback([&](jsi::Runtime& runtime) {
    EXPECT_EQ(&runtime, runtime_.get());
    calls.push_back("beat");
  });

  EventBeatTestAccess::markRequested(*eventBeat);
  eventBeat->tick();

  EXPECT_EQ(calls, (std::vector<std::string>{"induce", "beat"}));
}

TEST_F(AndroidEventBeatTest, testTickConsumesOnlyOnePendingBeat) {
  auto owner = std::make_shared<int>(1);
  auto eventBeat = makeEventBeat(owner);
  int beatCallbackCount = 0;
  int induceCallbackCount = 0;

  eventBeat->unstable_setInduceCallback(
      [&induceCallbackCount]() { ++induceCallbackCount; });
  eventBeat->setBeatCallback(
      [&beatCallbackCount](jsi::Runtime& /*runtime*/) { ++beatCallbackCount; });

  EventBeatTestAccess::markRequested(*eventBeat);
  eventBeat->tick();
  eventBeat->tick();

  EXPECT_EQ(induceCallbackCount, 1);
  EXPECT_EQ(beatCallbackCount, 1);
}

TEST_F(AndroidEventBeatTest, testTickDoesNotRunBeatCallbackAfterOwnerExpires) {
  auto owner = std::make_shared<int>(1);
  auto eventBeat = makeEventBeat(owner);
  int induceCallbackCount = 0;
  int beatCallbackCount = 0;

  eventBeat->unstable_setInduceCallback(
      [&induceCallbackCount]() { ++induceCallbackCount; });
  eventBeat->setBeatCallback(
      [&beatCallbackCount](jsi::Runtime& /*runtime*/) { ++beatCallbackCount; });

  EventBeatTestAccess::markRequested(*eventBeat);
  owner.reset();
  eventBeat->tick();

  EXPECT_EQ(induceCallbackCount, 1);
  EXPECT_EQ(beatCallbackCount, 0);
}

} // namespace facebook::react

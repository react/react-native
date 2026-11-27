/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <hermes/hermes.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/core/ConcreteShadowNode.h>
#include <react/renderer/core/EventBeat.h>
#include <react/renderer/core/EventQueue.h>
#include <react/renderer/runtimescheduler/RuntimeScheduler.h>
#include <memory>
#include <string>
#include <thread>
#include <vector>

#include "StubQueue.h"

namespace facebook::react {

// NOLINTNEXTLINE(modernize-avoid-c-arrays, facebook-hte-CArray)
constexpr char ImmediateUpdateTestComponentName[] = "ImmediateUpdateTest";
using ImmediateUpdateTestShadowNode =
    ConcreteShadowNode<ImmediateUpdateTestComponentName, ShadowNode, Props>;
using ImmediateUpdateTestDescriptor =
    ConcreteComponentDescriptor<ImmediateUpdateTestShadowNode>;

class EventBeatTestFeatureFlags : public ReactNativeFeatureFlagsDefaults {
 public:
  bool enableBridgelessArchitecture() override {
    return true;
  }
};

/*
 * `induce` is protected: production code induces from platform beat
 * subclasses. The tests drive it directly, standing in for the platform.
 */
class TestEventBeat : public EventBeat {
 public:
  using EventBeat::EventBeat;
  using EventBeat::induce;
};

class EventBeatTest : public testing::Test {
 protected:
  void SetUp() override {
    ReactNativeFeatureFlags::dangerouslyReset();
    ReactNativeFeatureFlags::override(
        std::make_unique<EventBeatTestFeatureFlags>());

    runtime_ = facebook::hermes::makeHermesRuntime(
        ::hermes::vm::RuntimeConfig::Builder().build());
    stubQueue_ = std::make_unique<StubQueue>();

    RuntimeExecutor runtimeExecutor =
        [this](
            std::function<void(facebook::jsi::Runtime & runtime)>&& callback) {
          stubQueue_->runOnQueue([this, callback = std::move(callback)]() {
            callback(*runtime_);
          });
        };

    runtimeScheduler_ = std::make_unique<RuntimeScheduler>(runtimeExecutor);

    ownerBox_ = std::make_shared<EventBeat::OwnerBox>();
    owner_ = std::make_shared<int>(0);
    ownerBox_->owner = owner_;
    eventBeat_ = std::make_unique<TestEventBeat>(ownerBox_, *runtimeScheduler_);
  }

  void TearDown() override {
    ReactNativeFeatureFlags::dangerouslyReset();
  }

  std::unique_ptr<EventQueue> makeStateQueue(StatePipe statePipe) {
    return std::make_unique<EventQueue>(
        EventQueueProcessor({}, {}, std::move(statePipe), {}),
        std::move(eventBeat_));
  }

  StateUpdate makeStateUpdate(
      const SharedShadowNodeFamily& family,
      std::function<void()> apply) {
    return {
        .family = family,
        .callback = [apply = std::move(apply)](const StateData::Shared& data) {
          apply();
          return data;
        }};
  }

  std::unique_ptr<facebook::hermes::HermesRuntime> runtime_;
  std::unique_ptr<StubQueue> stubQueue_;
  std::unique_ptr<RuntimeScheduler> runtimeScheduler_;
  std::shared_ptr<EventBeat::OwnerBox> ownerBox_;
  std::shared_ptr<int> owner_;
  std::unique_ptr<TestEventBeat> eventBeat_;
};

TEST_F(EventBeatTest, induceWithoutRequestIsNoop) {
  int beatCount = 0;
  eventBeat_->setBeatCallback(
      [&beatCount](jsi::Runtime& /*runtime*/) { beatCount++; });

  eventBeat_->induce();

  EXPECT_EQ(beatCount, 0);
  EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_F(EventBeatTest, synchronousRequestIsProcessedAtInduce) {
  int beatCount = 0;
  eventBeat_->setBeatCallback(
      [&beatCount](jsi::Runtime& /*runtime*/) { beatCount++; });

  eventBeat_->requestSynchronous();
  EXPECT_EQ(beatCount, 0);

  // Platform implementations induce the beat at a point where the effects of
  // synchronous events can still make the current frame (the display phase on
  // Apple, before the draw on Android). The beat callback runs synchronously
  // before `induce` returns, with both threads blocked.
  std::thread driver([this]() {
    stubQueue_->waitForTask();
    stubQueue_->tick();
  });
  eventBeat_->induce();
  driver.join();

  EXPECT_EQ(beatCount, 1);

  // The request was consumed: another induce does nothing.
  eventBeat_->induce();
  EXPECT_EQ(beatCount, 1);
  EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_F(EventBeatTest, requestMadeDuringBeatIsProcessedByASubsequentInduce) {
  int beatCount = 0;
  eventBeat_->setBeatCallback([&](jsi::Runtime& /*runtime*/) {
    beatCount++;
    if (beatCount == 1) {
      // A synchronous request made from within the beat (e.g. an event whose
      // handler causes another synchronous event). Platform implementations
      // defer the induce for it (the display phase flusher on Apple, the next
      // pre-draw on Android) rather than inducing from within the beat.
      eventBeat_->requestSynchronous();
    }
  });

  eventBeat_->requestSynchronous();
  std::thread driver([this]() {
    stubQueue_->waitForTask();
    stubQueue_->tick();
  });
  eventBeat_->induce();
  driver.join();

  EXPECT_EQ(beatCount, 1);

  // The request made during the beat is not lost: the next induce processes
  // it.
  std::thread driver2([this]() {
    stubQueue_->waitForTask();
    stubQueue_->tick();
  });
  eventBeat_->induce();
  driver2.join();

  EXPECT_EQ(beatCount, 2);
}

TEST_F(EventBeatTest, synchronousRequestIsNotStrandedBehindScheduledBeat) {
  int beatCount = 0;
  eventBeat_->setBeatCallback(
      [&beatCount](jsi::Runtime& /*runtime*/) { beatCount++; });

  // An asynchronous beat is scheduled but has not run yet.
  eventBeat_->request();
  eventBeat_->induce();
  EXPECT_EQ(beatCount, 0);

  // A synchronous request arriving now must still be processed by its induce
  // instead of being silently deferred behind the scheduled beat.
  eventBeat_->requestSynchronous();
  std::thread inducer([this]() { eventBeat_->induce(); });

  // Wait until the synchronous access request joins the already-queued work
  // item, so that the tick order below is deterministic.
  stubQueue_->waitForTasks(2);

  // The scheduled beat's work item yields to the pending synchronous access
  // without executing.
  stubQueue_->tick();
  EXPECT_EQ(beatCount, 0);

  // The synchronous access processes the beat within its induce.
  stubQueue_->tick();
  inducer.join();
  EXPECT_EQ(beatCount, 1);

  // The beat that yielded resumes afterwards; it was not lost.
  stubQueue_->tick();
  EXPECT_EQ(beatCount, 2);
  EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_F(EventBeatTest, immediateModeDuringRenderingDrainsQueuedStateInline) {
  ImmediateUpdateTestDescriptor descriptor({});
  auto queuedFamily = descriptor.createFamily(
      {.tag = 1, .surfaceId = 1, .instanceHandle = nullptr});
  auto immediateFamily = descriptor.createFamily(
      {.tag = 2, .surfaceId = 2, .instanceHandle = nullptr});
  auto* beat = eventBeat_.get();
  std::vector<std::string> trace;
  auto queue = makeStateQueue(
      [](const StateUpdate& update) { update.callback(nullptr); });

  std::thread driver([this]() {
    stubQueue_->waitForTask();
    stubQueue_->tick();
  });
  runtimeScheduler_->executeNowOnTheSameThread([&](jsi::Runtime&) {
    runtimeScheduler_->scheduleRenderingUpdate(1, [&]() {
      trace.emplace_back("render-start");
      std::thread producer([&]() {
        queue->enqueueStateUpdate(makeStateUpdate(
            queuedFamily, [&]() { trace.emplace_back("queued-state"); }));
      });
      producer.join();
      queue->enqueueStateUpdate(
          makeStateUpdate(
              immediateFamily,
              [&]() { trace.emplace_back("immediate-state"); }),
          EventQueue::UpdateMode::unstable_Immediate);
      trace.emplace_back("render-end");
    });
  });
  driver.join();

  const std::vector<std::string> expected{
      "render-start", "queued-state", "immediate-state", "render-end"};
  EXPECT_EQ(trace, expected);
  beat->induce();
  stubQueue_->flush();
  EXPECT_EQ(trace, expected);
}

TEST_F(EventBeatTest, existingImmediateModeStillDrainsQueuedState) {
  ImmediateUpdateTestDescriptor descriptor({});
  auto queuedFamily = descriptor.createFamily(
      {.tag = 1, .surfaceId = 1, .instanceHandle = nullptr});
  auto immediateFamily = descriptor.createFamily(
      {.tag = 2, .surfaceId = 2, .instanceHandle = nullptr});
  auto* beat = eventBeat_.get();
  std::vector<std::string> trace;
  auto queue = makeStateQueue(
      [](const StateUpdate& update) { update.callback(nullptr); });

  queue->enqueueStateUpdate(makeStateUpdate(
      queuedFamily, [&]() { trace.emplace_back("queued-state"); }));
  queue->enqueueStateUpdate(
      makeStateUpdate(
          immediateFamily, [&]() { trace.emplace_back("immediate-state"); }),
      EventQueue::UpdateMode::unstable_Immediate);

  EXPECT_EQ(
      trace, (std::vector<std::string>{"queued-state", "immediate-state"}));
  beat->induce();
  stubQueue_->flush();
  EXPECT_EQ(
      trace, (std::vector<std::string>{"queued-state", "immediate-state"}));
}

TEST_F(
    EventBeatTest,
    existingImmediateModeStillSupersedesAdjacentQueuedFamilyUpdate) {
  ImmediateUpdateTestDescriptor descriptor({});
  auto family = descriptor.createFamily(
      {.tag = 1, .surfaceId = 1, .instanceHandle = nullptr});
  auto* beat = eventBeat_.get();
  std::vector<std::string> trace;
  auto queue = makeStateQueue(
      [](const StateUpdate& update) { update.callback(nullptr); });

  queue->enqueueStateUpdate(makeStateUpdate(
      family, [&]() { trace.emplace_back("superseded-state"); }));
  queue->enqueueStateUpdate(
      makeStateUpdate(family, [&]() { trace.emplace_back("latest-state"); }),
      EventQueue::UpdateMode::unstable_Immediate);

  EXPECT_EQ(trace, (std::vector<std::string>{"latest-state"}));
  beat->induce();
  stubQueue_->flush();
  EXPECT_EQ(trace, (std::vector<std::string>{"latest-state"}));
}

} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>
#include <react/renderer/core/EventBeat.h>
#include <react/renderer/core/EventQueue.h>
#include <react/renderer/core/EventQueueProcessor.h>
#include <react/renderer/core/ValueFactoryEventPayload.h>
#include <react/renderer/runtimescheduler/RuntimeScheduler.h>

#include <memory>
#include <vector>

namespace facebook::react {

namespace {

class SameFrameMountForDiscreteEventsFeatureFlags
    : public ReactNativeFeatureFlagsDefaults {
 public:
  bool enableSameFrameMountForDiscreteEvents() override {
    return true;
  }
};

class RecordingEventBeat : public EventBeat {
 public:
  RecordingEventBeat(
      std::shared_ptr<OwnerBox> ownerBox,
      RuntimeScheduler& runtimeScheduler,
      std::shared_ptr<int> requests,
      std::shared_ptr<std::vector<Tag>> discreteRequests)
      : EventBeat(std::move(ownerBox), runtimeScheduler),
        requests_(std::move(requests)),
        discreteRequests_(std::move(discreteRequests)) {}

  void request() const override {
    (*requests_)++;
    EventBeat::request();
  }

  void requestForDiscreteEvent(Tag tag) const override {
    discreteRequests_->push_back(tag);
    EventBeat::request();
  }

 private:
  std::shared_ptr<int> requests_;
  std::shared_ptr<std::vector<Tag>> discreteRequests_;
};

} // namespace

class EventQueueTest : public testing::Test {
 protected:
  void SetUp() override {
    ReactNativeFeatureFlags::dangerouslyReset();
    runtimeScheduler_ = std::make_unique<RuntimeScheduler>(
        [](std::function<void(jsi::Runtime&)>&& /*callback*/) {});
  }

  void TearDown() override {
    eventQueue_.reset();
    ReactNativeFeatureFlags::dangerouslyReset();
  }

  void makeEventQueue() {
    auto ownerBox = std::make_shared<EventBeat::OwnerBox>();
    auto eventBeat = std::make_unique<RecordingEventBeat>(
        ownerBox, *runtimeScheduler_, requests_, discreteRequests_);
    eventQueue_ = std::make_unique<EventQueue>(
        EventQueueProcessor(
            [](jsi::Runtime&,
               const EventTarget*,
               const std::string&,
               ReactEventPriority,
               const EventPayload&,
               HighResTimeStamp) {},
            [](jsi::Runtime&) {},
            [](const StateUpdate&) {},
            {}),
        std::move(eventBeat));
  }

  void enqueue(RawEvent::Category category) {
    eventQueue_->enqueueEvent(RawEvent(
        "event",
        std::make_shared<ValueFactoryEventPayload>(ValueFactory{}),
        nullptr,
        {},
        category));
  }

  std::unique_ptr<RuntimeScheduler> runtimeScheduler_;
  std::shared_ptr<int> requests_ = std::make_shared<int>(0);
  std::shared_ptr<std::vector<Tag>> discreteRequests_ =
      std::make_shared<std::vector<Tag>>();
  std::unique_ptr<EventQueue> eventQueue_;
};

TEST_F(EventQueueTest, discreteEventsUseTheDiscreteRequestWhenEnabled) {
  ReactNativeFeatureFlags::override(
      std::make_unique<SameFrameMountForDiscreteEventsFeatureFlags>());
  makeEventQueue();

  enqueue(RawEvent::Category::Discrete);
  enqueue(RawEvent::Category::ContinuousStart);
  enqueue(RawEvent::Category::ContinuousEnd);
  EXPECT_EQ(discreteRequests_->size(), 3u);
  EXPECT_EQ(*requests_, 0);
  // No event target: no view attribution.
  EXPECT_EQ(discreteRequests_->front(), kNoTag);

  // Continuous and unattributed events keep the ordinary request, so scrolls
  // and drags never make the main thread wait.
  enqueue(RawEvent::Category::Continuous);
  enqueue(RawEvent::Category::Unspecified);
  enqueue(RawEvent::Category::Idle);
  EXPECT_EQ(discreteRequests_->size(), 3u);
  EXPECT_EQ(*requests_, 3);
}

TEST_F(EventQueueTest, discreteEventsUseTheOrdinaryRequestByDefault) {
  makeEventQueue();

  enqueue(RawEvent::Category::Discrete);
  enqueue(RawEvent::Category::ContinuousEnd);
  EXPECT_EQ(discreteRequests_->size(), 0u);
  EXPECT_EQ(*requests_, 2);
}

} // namespace facebook::react

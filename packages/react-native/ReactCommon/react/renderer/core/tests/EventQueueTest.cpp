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
  }

  void TearDown() override {
    eventQueue_.reset();
    runtimeScheduler_.reset();
    ReactNativeFeatureFlags::dangerouslyReset();
  }

  // Call after overriding feature flags: the runtime scheduler reads them.
  void makeEventQueue() {
    runtimeScheduler_ = std::make_unique<RuntimeScheduler>(
        [](std::function<void(jsi::Runtime&)>&& /*callback*/) {});
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

  void enqueue(const std::string& type, RawEvent::Category category) {
    eventQueue_->enqueueEvent(RawEvent(
        type,
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

TEST_F(EventQueueTest, tapEndsAndTypingUseTheDiscreteRequestWhenEnabled) {
  ReactNativeFeatureFlags::override(
      std::make_unique<SameFrameMountForDiscreteEventsFeatureFlags>());
  makeEventQueue();

  enqueue("topTouchEnd", RawEvent::Category::ContinuousEnd);
  enqueue("topClick", RawEvent::Category::Discrete);
  enqueue("topChange", RawEvent::Category::Unspecified);
  enqueue("topKeyPress", RawEvent::Category::Unspecified);
  enqueue("topSubmitEditing", RawEvent::Category::Discrete);
  EXPECT_EQ(discreteRequests_->size(), 5u);
  EXPECT_EQ(*requests_, 0);
  // No event target: no view attribution.
  EXPECT_EQ(discreteRequests_->front(), kNoTag);
}

TEST_F(
    EventQueueTest,
    touchStartsHoverAndContinuousEventsKeepTheOrdinaryRequest) {
  ReactNativeFeatureFlags::override(
      std::make_unique<SameFrameMountForDiscreteEventsFeatureFlags>());
  makeEventQueue();

  // The first frame of every scroll, pointer hover transitions and continuous
  // events never make the main thread wait, whatever their category.
  enqueue("topTouchStart", RawEvent::Category::ContinuousStart);
  enqueue("topPointerDown", RawEvent::Category::ContinuousStart);
  enqueue("topPointerUp", RawEvent::Category::ContinuousEnd);
  enqueue("topPointerEnter", RawEvent::Category::ContinuousStart);
  enqueue("topPointerLeave", RawEvent::Category::ContinuousEnd);
  enqueue("topPointerOver", RawEvent::Category::ContinuousStart);
  enqueue("topPointerOut", RawEvent::Category::ContinuousStart);
  enqueue("topTouchMove", RawEvent::Category::Continuous);
  enqueue("topFocus", RawEvent::Category::Unspecified);
  EXPECT_EQ(discreteRequests_->size(), 0u);
  EXPECT_EQ(*requests_, 9);
}

TEST_F(EventQueueTest, tapEndsAndTypingUseTheOrdinaryRequestByDefault) {
  makeEventQueue();

  enqueue("topTouchEnd", RawEvent::Category::ContinuousEnd);
  enqueue("topClick", RawEvent::Category::Discrete);
  enqueue("topChange", RawEvent::Category::Unspecified);
  EXPECT_EQ(discreteRequests_->size(), 0u);
  EXPECT_EQ(*requests_, 3);
}

} // namespace facebook::react

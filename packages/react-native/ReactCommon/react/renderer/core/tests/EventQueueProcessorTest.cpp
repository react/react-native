/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <hermes/hermes.h>
#include <jsi/jsi.h>
#include <react/renderer/core/EventLogger.h>
#include <react/renderer/core/EventPipe.h>
#include <react/renderer/core/EventQueueProcessor.h>
#include <react/renderer/core/EventTarget.h>
#include <react/renderer/core/InstanceHandle.h>
#include <react/renderer/core/ShadowNodeFamily.h>
#include <react/renderer/core/StatePipe.h>
#include <react/renderer/core/ValueFactoryEventPayload.h>

#include <memory>
#include <stdexcept>
#include <string_view>

namespace facebook::react {

class MockEventLogger : public EventLogger {
  EventTag onEventStart(
      std::string_view /*name*/,
      SharedEventTarget /*target*/,
      std::optional<HighResTimeStamp> /*eventStartTimeStamp*/) override {
    return EMPTY_EVENT_TAG;
  }
  void onEventProcessingStart(EventTag /*tag*/) override {}
  void onEventProcessingEnd(EventTag /*tag*/) override {}
};

class EventQueueProcessorTest : public testing::Test {
 protected:
  void SetUp() override {
    runtime_ = facebook::hermes::makeHermesRuntime();

    auto eventPipe = [this](
                         jsi::Runtime& /*runtime*/,
                         const EventTarget* /*eventTarget*/,
                         const std::string& type,
                         ReactEventPriority priority,
                         const EventPayload& /*payload*/,
                         HighResTimeStamp /*eventTimestamp*/) {
      eventTypes_.push_back(type);
      eventPriorities_.push_back(priority);
    };

    auto dummyEventPipeConclusion = [](jsi::Runtime&) {};
    auto dummyStatePipe = [](const StateUpdate&) {};
    auto mockEventLogger = std::make_shared<MockEventLogger>();

    eventProcessor_ = std::make_unique<EventQueueProcessor>(
        eventPipe, dummyEventPipeConclusion, dummyStatePipe, mockEventLogger);
  }

  std::unique_ptr<facebook::hermes::HermesRuntime> runtime_;
  std::unique_ptr<EventQueueProcessor> eventProcessor_;
  std::vector<std::string> eventTypes_;
  std::vector<ReactEventPriority> eventPriorities_;
  ValueFactory dummyValueFactory_;
};

TEST_F(EventQueueProcessorTest, singleUnspecifiedEvent) {
  eventProcessor_->flushEvents(
      *runtime_,
      {RawEvent(
          "my type",
          std::make_shared<ValueFactoryEventPayload>(dummyValueFactory_),
          nullptr,
          {},
          RawEvent::Category::Unspecified)});

  EXPECT_EQ(eventPriorities_.size(), 1);
  EXPECT_EQ(eventTypes_[0], "my type");
  EXPECT_EQ(eventPriorities_[0], ReactEventPriority::Discrete);
}

TEST_F(EventQueueProcessorTest, continuousEvent) {
  eventProcessor_->flushEvents(
      *runtime_,
      {RawEvent(
           "touchStart",
           std::make_shared<ValueFactoryEventPayload>(dummyValueFactory_),
           nullptr,
           {},
           RawEvent::Category::ContinuousStart),
       RawEvent(
           "touchMove",
           std::make_shared<ValueFactoryEventPayload>(dummyValueFactory_),
           nullptr,
           {},
           RawEvent::Category::Unspecified),
       RawEvent(
           "touchEnd",
           std::make_shared<ValueFactoryEventPayload>(dummyValueFactory_),
           nullptr,
           {},
           RawEvent::Category::ContinuousEnd),
       RawEvent(
           "custom event",
           std::make_shared<ValueFactoryEventPayload>(dummyValueFactory_),
           nullptr,
           {},
           RawEvent::Category::Unspecified)});

  EXPECT_EQ(eventPriorities_.size(), 4);

  EXPECT_EQ(eventTypes_[0], "touchStart");
  EXPECT_EQ(eventPriorities_[0], ReactEventPriority::Discrete);

  EXPECT_EQ(eventTypes_[1], "touchMove");
  EXPECT_EQ(eventPriorities_[1], ReactEventPriority::Default);

  EXPECT_EQ(eventTypes_[2], "touchEnd");
  EXPECT_EQ(eventPriorities_[2], ReactEventPriority::Discrete);

  EXPECT_EQ(eventTypes_[3], "custom event");
  EXPECT_EQ(eventPriorities_[3], ReactEventPriority::Discrete);
}

TEST_F(EventQueueProcessorTest, alwaysContinuousEvent) {
  eventProcessor_->flushEvents(
      *runtime_,
      {
          RawEvent(
              "onScroll",
              std::make_shared<ValueFactoryEventPayload>(dummyValueFactory_),
              nullptr,
              {},
              RawEvent::Category::Continuous),
      });

  EXPECT_EQ(eventPriorities_.size(), 1);

  EXPECT_EQ(eventTypes_[0], "onScroll");
  EXPECT_EQ(eventPriorities_[0], ReactEventPriority::Default);
}

TEST_F(EventQueueProcessorTest, alwaysDiscreteEvent) {
  eventProcessor_->flushEvents(
      *runtime_,
      {
          RawEvent(
              "onChange",
              std::make_shared<ValueFactoryEventPayload>(dummyValueFactory_),
              nullptr,
              {},
              RawEvent::Category::Discrete),
      });

  EXPECT_EQ(eventPriorities_.size(), 1);

  EXPECT_EQ(eventTypes_[0], "onChange");
  EXPECT_EQ(eventPriorities_[0], ReactEventPriority::Discrete);
}

TEST_F(EventQueueProcessorTest, releasesEventTargetsWhenDispatchThrows) {
  // Set up an enabled EventTarget so that flushEvents() will retain a strong
  // JSI reference to its instance handle.
  auto object = jsi::Object(*runtime_);
  auto instanceHandle = std::make_shared<InstanceHandle>(
      *runtime_, jsi::Value(*runtime_, object), 1);
  auto eventTarget =
      std::make_shared<EventTarget>(std::move(instanceHandle), 41);
  eventTarget->setEnabled(true);

  // An event pipe that throws, simulating a JS exception during dispatch.
  auto throwingEventPipe = [](jsi::Runtime& /*runtime*/,
                              const EventTarget* /*eventTarget*/,
                              const std::string& /*type*/,
                              ReactEventPriority /*priority*/,
                              const EventPayload& /*payload*/,
                              HighResTimeStamp /*eventTimestamp*/) {
    throw std::runtime_error("dispatch failed");
  };
  auto dummyEventPipeConclusion = [](jsi::Runtime& /*runtime*/) {};
  auto dummyStatePipe = [](const StateUpdate& /*stateUpdate*/) {};
  auto mockEventLogger = std::make_shared<MockEventLogger>();

  auto processor = EventQueueProcessor(
      throwingEventPipe,
      dummyEventPipeConclusion,
      dummyStatePipe,
      mockEventLogger);

  EXPECT_THROW(
      processor.flushEvents(
          *runtime_,
          {RawEvent(
              "onThrow",
              std::make_shared<ValueFactoryEventPayload>(dummyValueFactory_),
              eventTarget,
              {},
              RawEvent::Category::Discrete)}),
      std::runtime_error);

  // The strong JSI reference acquired by retain() must have been released even
  // though dispatch threw, so the instance handle is no longer reachable
  // through the EventTarget.
  EXPECT_TRUE(eventTarget->getInstanceHandle(*runtime_).isNull());
}

} // namespace facebook::react

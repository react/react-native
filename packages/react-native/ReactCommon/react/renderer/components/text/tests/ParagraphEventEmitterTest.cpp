/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/components/text/ParagraphEventEmitter.h>

#include <gtest/gtest.h>
#include <hermes/hermes.h>
#include <react/renderer/core/EventBeat.h>
#include <react/renderer/core/EventDispatcher.h>
#include <react/renderer/core/EventListener.h>
#include <react/renderer/runtimescheduler/RuntimeScheduler.h>

namespace facebook::react {

namespace {

struct CapturedEvent {
  std::string type;
  SharedEventPayload payload;
};

class ParagraphEventEmitterTest : public ::testing::Test {
 protected:
  void SetUp() override {
    runtime_ = facebook::hermes::makeHermesRuntime(
        ::hermes::vm::RuntimeConfig::Builder().build());

    RuntimeExecutor runtimeExecutor =
        [this](std::function<void(jsi::Runtime&)>&& callback) {
          callback(*runtime_);
        };
    runtimeScheduler_ = std::make_unique<RuntimeScheduler>(runtimeExecutor);

    auto eventBeat = std::make_unique<EventBeat>(
        std::make_shared<EventBeat::OwnerBox>(), *runtimeScheduler_);
    auto eventQueueProcessor = EventQueueProcessor(
        [](jsi::Runtime&,
           EventTarget*,
           const std::string&,
           ReactEventPriority,
           const EventPayload&,
           HighResTimeStamp) {},
        [](jsi::Runtime&) {},
        [](const StateUpdate&) {},
        {});
    eventDispatcher_ = std::make_shared<EventDispatcher>(
        eventQueueProcessor,
        std::move(eventBeat),
        [](const StateUpdate&) {},
        std::weak_ptr<EventLogger>{});

    listener_ = std::make_shared<EventListener>([this](const RawEvent& event) {
      events_.push_back({event.type, event.eventPayload});
      return true;
    });
    eventDispatcher_->addListener(listener_);
  }

  void expectLine(
      const jsi::Array& lines,
      size_t index,
      const LineMeasurement& expected) {
    auto line = lines.getValueAtIndex(*runtime_, index).asObject(*runtime_);
    EXPECT_EQ(
        line.getProperty(*runtime_, "text").asString(*runtime_).utf8(*runtime_),
        expected.text);
    EXPECT_EQ(
        line.getProperty(*runtime_, "x").asNumber(), expected.frame.origin.x);
    EXPECT_EQ(
        line.getProperty(*runtime_, "y").asNumber(), expected.frame.origin.y);
    EXPECT_EQ(
        line.getProperty(*runtime_, "width").asNumber(),
        expected.frame.size.width);
    EXPECT_EQ(
        line.getProperty(*runtime_, "height").asNumber(),
        expected.frame.size.height);
    EXPECT_EQ(
        line.getProperty(*runtime_, "descender").asNumber(),
        expected.descender);
    EXPECT_EQ(
        line.getProperty(*runtime_, "capHeight").asNumber(),
        expected.capHeight);
    EXPECT_EQ(
        line.getProperty(*runtime_, "ascender").asNumber(), expected.ascender);
    EXPECT_EQ(
        line.getProperty(*runtime_, "xHeight").asNumber(), expected.xHeight);
  }

  std::unique_ptr<facebook::hermes::HermesRuntime> runtime_;
  std::unique_ptr<RuntimeScheduler> runtimeScheduler_;
  std::shared_ptr<EventDispatcher> eventDispatcher_;
  std::shared_ptr<const EventListener> listener_;
  std::vector<CapturedEvent> events_;
};

TEST_F(
    ParagraphEventEmitterTest,
    testOnTextLayoutSerializesEveryLineMeasurement) {
  const LinesMeasurements measurements{
      {"First line", {{1.25, 2.5}, {30.75, 10.5}}, -2.25, 7.5, 8.25, 4.5},
      {"Second line", {{3.5, 13.75}, {42.25, 11.5}}, -1.5, 8.0, 9.75, 5.25},
  };
  ParagraphEventEmitter eventEmitter(nullptr, eventDispatcher_);

  eventEmitter.onTextLayout(measurements);

  ASSERT_EQ(events_.size(), 1);
  EXPECT_EQ(events_[0].type, "topTextLayout");
  auto payload = events_[0].payload->asJSIValue(*runtime_).asObject(*runtime_);
  auto lines = payload.getProperty(*runtime_, "lines")
                   .asObject(*runtime_)
                   .asArray(*runtime_);
  ASSERT_EQ(lines.size(*runtime_), measurements.size());
  expectLine(lines, 0, measurements[0]);
  expectLine(lines, 1, measurements[1]);
}

TEST_F(
    ParagraphEventEmitterTest,
    testOnTextLayoutSuppressesIdenticalMeasurementsButDispatchesChanges) {
  const LinesMeasurements measurements{
      {"Line", {{1, 2}, {30, 10}}, -2, 7, 8, 4},
  };
  auto changedMeasurements = measurements;
  changedMeasurements[0].xHeight = 5;
  ParagraphEventEmitter eventEmitter(nullptr, eventDispatcher_);

  eventEmitter.onTextLayout(measurements);
  ASSERT_EQ(events_.size(), 1);

  eventEmitter.onTextLayout(measurements);
  ASSERT_EQ(events_.size(), 1);

  eventEmitter.onTextLayout(changedMeasurements);
  ASSERT_EQ(events_.size(), 2);
  auto payload = events_[1].payload->asJSIValue(*runtime_).asObject(*runtime_);
  auto lines = payload.getProperty(*runtime_, "lines")
                   .asObject(*runtime_)
                   .asArray(*runtime_);
  ASSERT_EQ(lines.size(*runtime_), changedMeasurements.size());
  auto line = lines.getValueAtIndex(*runtime_, 0).asObject(*runtime_);
  EXPECT_EQ(
      line.getProperty(*runtime_, "xHeight").asNumber(),
      changedMeasurements[0].xHeight);
}

TEST_F(
    ParagraphEventEmitterTest,
    testOnTextLayoutDispatchesTransitionToEmptyMeasurements) {
  const LinesMeasurements measurements{
      {"Removed line", {{1, 2}, {30, 10}}, -2, 7, 8, 4},
  };
  ParagraphEventEmitter eventEmitter(nullptr, eventDispatcher_);

  eventEmitter.onTextLayout(measurements);
  ASSERT_EQ(events_.size(), 1);

  eventEmitter.onTextLayout({});
  ASSERT_EQ(events_.size(), 2);
  auto payload = events_[1].payload->asJSIValue(*runtime_).asObject(*runtime_);
  auto lines = payload.getProperty(*runtime_, "lines")
                   .asObject(*runtime_)
                   .asArray(*runtime_);
  EXPECT_EQ(lines.size(*runtime_), 0);

  eventEmitter.onTextLayout({});
  EXPECT_EQ(events_.size(), 2);
}

} // namespace

} // namespace facebook::react

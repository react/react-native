/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <hermes/hermes.h>
#include <react/renderer/components/view/PointerEvent.h>
#include <react/renderer/core/DynamicEventPayload.h>
#include <react/renderer/core/EventQueue.h>
#include <react/renderer/core/InstanceHandle.h>
#include <react/renderer/core/ValueFactoryEventPayload.h>
#include <react/renderer/runtimescheduler/RuntimeScheduler.h>

namespace facebook::react {

namespace {

class DrainableEventQueue : public EventQueue {
 public:
  using EventQueue::EventQueue;
  using EventQueue::flushEvents;
};

struct DeliveredEvent {
  std::string type;
  const EventTarget* target;
  double value;
  int pointerId;
  bool isPrimary;
};

enum class PointerPayloadKind { Typed, Dynamic };

} // namespace

class EventQueueTest : public testing::TestWithParam<PointerPayloadKind> {
 protected:
  void SetUp() override {
    runtime_ = facebook::hermes::makeHermesRuntime();
    scheduler_ = std::make_unique<RuntimeScheduler>(
        [this](auto&& callback) { callback(*runtime_); });
    auto processor = EventQueueProcessor(
        [this](
            jsi::Runtime& runtime,
            const EventTarget* target,
            const std::string& type,
            ReactEventPriority,
            const EventPayload& payload,
            HighResTimeStamp) {
          auto value = payload.asJSIValue(runtime);
          if (value.isObject() &&
              value.asObject(runtime).hasProperty(runtime, "pointerId")) {
            auto object = value.asObject(runtime);
            delivered_.push_back(
                {type,
                 target,
                 object.getProperty(runtime, "clientX").asNumber(),
                 static_cast<int>(
                     object.getProperty(runtime, "pointerId").asNumber()),
                 object.getProperty(runtime, "isPrimary").getBool()});
          } else {
            delivered_.push_back(
                {type,
                 target,
                 value.isObject() ? value.asObject(runtime)
                                        .getProperty(runtime, "value")
                                        .asNumber()
                                  : value.asNumber(),
                 -1,
                 false});
          }
        },
        [](jsi::Runtime&) {},
        [](const StateUpdate&) {},
        {});
    queue_ = std::make_unique<DrainableEventQueue>(
        std::move(processor),
        std::make_unique<EventBeat>(
            std::make_shared<EventBeat::OwnerBox>(), *scheduler_));
  }

  SharedEventPayload makePointer(int pointerId, Float x, bool isPrimary) {
    if (GetParam() == PointerPayloadKind::Dynamic) {
      return DynamicEventPayload::create(
          folly::dynamic::object("pointerId", static_cast<double>(pointerId))(
              "clientX", x)("isPrimary", isPrimary)(
              "hitPathForEventListener", folly::dynamic::array()));
    }
    auto pointer = std::make_shared<PointerEvent>();
    pointer->pointerId = pointerId;
    pointer->clientPoint = {x, 0};
    pointer->isPrimary = isPrimary;
    return pointer;
  }

  void enqueueMove(
      int pointerId,
      Float x,
      bool isPrimary,
      SharedEventTarget target) {
    queue_->enqueueUniqueEvent(RawEvent(
        "topPointerMove",
        makePointer(pointerId, x, isPrimary),
        std::move(target),
        {}));
  }

  SharedEventTarget makeTarget(Tag tag) {
    return std::make_shared<EventTarget>(
        std::make_shared<InstanceHandle>(
            *runtime_, jsi::Object(*runtime_), tag),
        41);
  }

  std::unique_ptr<facebook::hermes::HermesRuntime> runtime_;
  std::unique_ptr<RuntimeScheduler> scheduler_;
  std::unique_ptr<DrainableEventQueue> queue_;
  std::vector<DeliveredEvent> delivered_;
};

TEST_P(EventQueueTest, keepsMovesFromDifferentPointersOnOneTarget) {
  auto target = makeTarget(101);
  enqueueMove(2, 120, true, target);
  enqueueMove(3, 210, false, target);
  queue_->flushEvents(*runtime_);

  ASSERT_EQ(delivered_.size(), 2);
  EXPECT_EQ(delivered_[0].pointerId, 2);
  EXPECT_TRUE(delivered_[0].isPrimary);
  EXPECT_EQ(delivered_[0].value, 120);
  EXPECT_EQ(delivered_[1].pointerId, 3);
  EXPECT_FALSE(delivered_[1].isPrimary);
  EXPECT_EQ(delivered_[1].value, 210);
}

TEST_P(EventQueueTest, replacesConsecutiveMovesFromTheSamePointer) {
  auto target = makeTarget(101);
  enqueueMove(2, 120, true, target);
  enqueueMove(2, 210, true, target);
  queue_->flushEvents(*runtime_);

  ASSERT_EQ(delivered_.size(), 1);
  EXPECT_EQ(delivered_[0].pointerId, 2);
  EXPECT_TRUE(delivered_[0].isPrimary);
  EXPECT_EQ(delivered_[0].value, 210);
}

TEST_P(EventQueueTest, anotherPointerOnTheSameTargetIsAnOrderingBarrier) {
  auto target = makeTarget(101);
  enqueueMove(2, 120, true, target);
  enqueueMove(3, 150, false, target);
  enqueueMove(2, 210, true, target);
  queue_->flushEvents(*runtime_);

  ASSERT_EQ(delivered_.size(), 3);
  EXPECT_EQ(delivered_[0].pointerId, 2);
  EXPECT_EQ(delivered_[0].value, 120);
  EXPECT_EQ(delivered_[1].pointerId, 3);
  EXPECT_EQ(delivered_[1].value, 150);
  EXPECT_EQ(delivered_[2].pointerId, 2);
  EXPECT_EQ(delivered_[2].value, 210);
}

TEST_P(EventQueueTest, anotherEventTypeOnTheSameTargetIsAnOrderingBarrier) {
  auto target = makeTarget(101);
  enqueueMove(2, 120, true, target);
  auto terminal = makePointer(2, 150, true);
  queue_->enqueueEvent(RawEvent("topPointerUp", terminal, target, {}));
  enqueueMove(2, 210, true, target);
  queue_->flushEvents(*runtime_);

  ASSERT_EQ(delivered_.size(), 3);
  EXPECT_EQ(delivered_[0].type, "topPointerMove");
  EXPECT_EQ(delivered_[0].value, 120);
  EXPECT_EQ(delivered_[1].type, "topPointerUp");
  EXPECT_EQ(delivered_[1].value, 150);
  EXPECT_EQ(delivered_[2].type, "topPointerMove");
  EXPECT_EQ(delivered_[2].value, 210);
}

TEST_P(EventQueueTest, anotherTargetDoesNotPreventEligibleReplacement) {
  auto first = makeTarget(101);
  auto second = makeTarget(102);
  enqueueMove(2, 120, true, first);
  enqueueMove(3, 150, false, second);
  enqueueMove(2, 210, true, first);
  queue_->flushEvents(*runtime_);

  ASSERT_EQ(delivered_.size(), 2);
  EXPECT_EQ(delivered_[0].target, first.get());
  EXPECT_EQ(delivered_[0].pointerId, 2);
  EXPECT_EQ(delivered_[0].value, 210);
  EXPECT_EQ(delivered_[1].target, second.get());
  EXPECT_EQ(delivered_[1].pointerId, 3);
  EXPECT_EQ(delivered_[1].value, 150);
}

TEST_P(EventQueueTest, retainsNonPointerUniqueEventReplacement) {
  queue_->enqueueUniqueEvent(RawEvent(
      "topScroll",
      std::make_shared<ValueFactoryEventPayload>(
          [](jsi::Runtime&) { return jsi::Value(120); }),
      nullptr,
      {}));
  queue_->enqueueUniqueEvent(RawEvent(
      "topScroll",
      std::make_shared<ValueFactoryEventPayload>(
          [](jsi::Runtime&) { return jsi::Value(210); }),
      nullptr,
      {}));
  queue_->flushEvents(*runtime_);

  ASSERT_EQ(delivered_.size(), 1);
  EXPECT_EQ(delivered_[0].type, "topScroll");
  EXPECT_EQ(delivered_[0].value, 210);
}

TEST_P(EventQueueTest, keepsMovesWhenSecondaryPointerIsQueuedFirst) {
  auto target = makeTarget(101);
  enqueueMove(1, 210, false, target);
  enqueueMove(0, 120, true, target);
  queue_->flushEvents(*runtime_);

  ASSERT_EQ(delivered_.size(), 2);
  EXPECT_EQ(delivered_[0].pointerId, 1);
  EXPECT_FALSE(delivered_[0].isPrimary);
  EXPECT_EQ(delivered_[0].value, 210);
  EXPECT_EQ(delivered_[1].pointerId, 0);
  EXPECT_TRUE(delivered_[1].isPrimary);
  EXPECT_EQ(delivered_[1].value, 120);
}

TEST_P(EventQueueTest, nonUniqueMoveOnTheSameTargetIsAnOrderingBarrier) {
  auto target = makeTarget(101);
  enqueueMove(2, 120, true, target);
  queue_->enqueueEvent(
      RawEvent("topPointerMove", makePointer(2, 150, true), target, {}));
  enqueueMove(2, 210, true, target);
  queue_->flushEvents(*runtime_);

  ASSERT_EQ(delivered_.size(), 3);
  EXPECT_EQ(delivered_[0].value, 120);
  EXPECT_EQ(delivered_[1].value, 150);
  EXPECT_EQ(delivered_[2].value, 210);
}

TEST_P(EventQueueTest, anotherUniqueTypeOnTheSameTargetIsAnOrderingBarrier) {
  auto target = makeTarget(101);
  enqueueMove(2, 120, true, target);
  queue_->enqueueUniqueEvent(
      RawEvent("topPointerOver", makePointer(2, 150, true), target, {}));
  enqueueMove(2, 210, true, target);
  queue_->flushEvents(*runtime_);

  ASSERT_EQ(delivered_.size(), 3);
  EXPECT_EQ(delivered_[0].type, "topPointerMove");
  EXPECT_EQ(delivered_[0].value, 120);
  EXPECT_EQ(delivered_[1].type, "topPointerOver");
  EXPECT_EQ(delivered_[1].value, 150);
  EXPECT_EQ(delivered_[2].type, "topPointerMove");
  EXPECT_EQ(delivered_[2].value, 210);
}

TEST_P(EventQueueTest, pointerPhasesOnTheSameTargetAreOrderingBarriers) {
  auto target = makeTarget(101);
  for (const auto* phase : {"topPointerDown", "topPointerCancel"}) {
    delivered_.clear();
    enqueueMove(2, 120, true, target);
    queue_->enqueueEvent(
        RawEvent(phase, makePointer(2, 150, true), target, {}));
    enqueueMove(2, 210, true, target);
    queue_->flushEvents(*runtime_);

    ASSERT_EQ(delivered_.size(), 3);
    EXPECT_EQ(delivered_[0].type, "topPointerMove");
    EXPECT_EQ(delivered_[0].value, 120);
    EXPECT_EQ(delivered_[1].type, phase);
    EXPECT_EQ(delivered_[1].value, 150);
    EXPECT_EQ(delivered_[2].type, "topPointerMove");
    EXPECT_EQ(delivered_[2].value, 210);
  }
}

TEST_P(EventQueueTest, retainsDynamicNonPointerUniqueEventReplacement) {
  for (auto pointerId : {2, 3}) {
    queue_->enqueueUniqueEvent(RawEvent(
        "topCustom",
        DynamicEventPayload::create(
            folly::dynamic::object("clientX", pointerId * 10)(
                "pointerId", pointerId)("isPrimary", false)(
                "hitPathForEventListener", folly::dynamic::array())),
        nullptr,
        {}));
  }
  queue_->flushEvents(*runtime_);

  ASSERT_EQ(delivered_.size(), 1);
  EXPECT_EQ(delivered_[0].value, 30);
}

TEST_P(EventQueueTest, retainsDynamicPayloadWithoutPointerId) {
  for (auto value : {120, 210}) {
    queue_->enqueueUniqueEvent(RawEvent(
        "topScroll",
        DynamicEventPayload::create(folly::dynamic::object("value", value)),
        nullptr,
        {}));
  }
  queue_->flushEvents(*runtime_);

  ASSERT_EQ(delivered_.size(), 1);
  EXPECT_EQ(delivered_[0].value, 210);
}

INSTANTIATE_TEST_SUITE_P(
    PointerPayloads,
    EventQueueTest,
    testing::Values(PointerPayloadKind::Typed, PointerPayloadKind::Dynamic),
    [](const testing::TestParamInfo<PointerPayloadKind>& info) {
      return info.param == PointerPayloadKind::Typed ? "Typed" : "Dynamic";
    });

} // namespace facebook::react

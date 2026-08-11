/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/performance/timeline/PerformanceEntryReporter.h>
#include <react/renderer/core/EventLogger.h>
#include <react/renderer/runtimescheduler/RuntimeSchedulerEventTimingDelegate.h>
#include <react/renderer/uimanager/UIManagerMountHook.h>

#include <memory>
#include <mutex>
#include <optional>
#include <string_view>
#include <unordered_map>

namespace facebook::react {

class EventPerformanceLogger : public EventLogger,
                               public RuntimeSchedulerEventTimingDelegate,
                               public UIManagerMountHook {
 public:
  explicit EventPerformanceLogger(
      std::weak_ptr<PerformanceEntryReporter> performanceEntryReporter);

#pragma mark - EventLogger

  EventTag onEventStart(
      std::string_view name,
      SharedEventTarget target,
      std::optional<HighResTimeStamp> eventStartTimeStamp =
          std::nullopt) override;
  void onEventProcessingStart(EventTag tag) override;
  void onEventProcessingEnd(EventTag tag) override;

#pragma mark - RuntimeSchedulerEventTimingDelegate

  void dispatchPendingEventTimingEntries(
      HighResTimeStamp taskEndTime,
      const std::unordered_set<SurfaceId>&
          surfaceIdsWithPendingRenderingUpdates) override;

#pragma mark - UIManagerMountHook

  void shadowTreeDidMount(
      const RootShadowNode::Shared& rootShadowNode,
      HighResTimeStamp mountTime) noexcept override;

 private:
  struct EventEntry {
    std::string_view name;
    SharedEventTarget target{nullptr};
    HighResTimeStamp startTime;
    std::optional<HighResTimeStamp> processingStartTime;
    std::optional<HighResTimeStamp> processingEndTime;
    std::optional<HighResTimeStamp> taskEndTime;

    bool isWaitingForMount{false};

    // TODO: Define the way to assign interaction IDs to the event chains
    // (T141358175)
    PerformanceEntryInteractionId interactionId{0};

    bool isWaitingForDispatch() {
      return !processingEndTime.has_value();
    }
  };

  // Registry to store the events that are currently ongoing.
  // Note that we could probably use a more efficient container for that,
  // but since we only report discrete events, the volume is normally low,
  // so a hash map should be just fine.
  std::unordered_map<EventTag, EventEntry> eventsInFlight_;
  std::mutex eventsInFlightMutex_;

  std::weak_ptr<PerformanceEntryReporter> performanceEntryReporter_;

  EventTag sCurrentEventTag_{EMPTY_EVENT_TAG};

  EventTag createEventTag();
};

} // namespace facebook::react

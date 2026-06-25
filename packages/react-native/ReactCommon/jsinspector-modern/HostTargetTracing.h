/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "InspectorInterfaces.h"

#include "cdp/CdpJson.h"
#include "tracing/HostTracingProfile.h"
#include "tracing/HostTracingProfileSerializer.h"

#include <array>
#include <concepts>
#include <cstdint>
#include <ranges>

namespace facebook::react::jsinspector_modern {

/**
 * Emits a captured HostTracingProfile in a series of
 * Tracing.dataCollected events, followed by a Tracing.tracingComplete event, to zero or more
 * FrontendChannels. If \p isBackgroundTrace is true, a ReactNativeApplication.traceRequested
 * notification is sent to each FrontendChannel before the trace events are emitted.
 */
template <typename ChannelsRange>
void emitNotificationsForTracingProfile(
    tracing::HostTracingProfile &&hostTracingProfile,
    const ChannelsRange &channels,
    bool isBackgroundTrace)
  requires std::ranges::range<ChannelsRange> &&
    std::convertible_to<std::ranges::range_value_t<ChannelsRange>, FrontendChannel>
{
  /**
   * Maximum serialized byte size of a Trace Event chunk before it is flushed
   * with a Tracing.dataCollected event.
   */
  static constexpr size_t TRACE_EVENT_CHUNK_MAX_BYTES = 10 * 1024 * 1024; // 10 MiB

  /**
   * The maximum number of ProfileChunk trace events
   * that will be sent in a single CDP Tracing.dataCollected message.
   */
  static constexpr uint16_t PROFILE_TRACE_EVENT_CHUNK_SIZE = 10;

  if (std::ranges::empty(channels)) {
    return;
  }

  if (isBackgroundTrace) {
    for (auto &frontendChannel : channels) {
      frontendChannel(cdp::jsonNotification("ReactNativeApplication.traceRequested"));
    }
  }

  // Serialize each chunk once and send it to all eligible sessions.
  tracing::HostTracingProfileSerializer::emitAsDataCollectedChunks(
      std::move(hostTracingProfile),
      [&](folly::dynamic &&serializedChunk) {
        for (auto &frontendChannel : channels) {
          frontendChannel(
              cdp::jsonNotification("Tracing.dataCollected", folly::dynamic::object("value", serializedChunk)));
        }
      },
      TRACE_EVENT_CHUNK_MAX_BYTES,
      PROFILE_TRACE_EVENT_CHUNK_SIZE);

  for (auto &frontendChannel : channels) {
    frontendChannel(
        cdp::jsonNotification("Tracing.tracingComplete", folly::dynamic::object("dataLossOccurred", false)));
  }
}

/**
 * Convenience overload of emitNotificationsForTracingProfile() for a single FrontendChannel.
 */
inline void emitNotificationsForTracingProfile(
    tracing::HostTracingProfile &&hostTracingProfile,
    const FrontendChannel &channel,
    bool isBackgroundTrace)
{
  std::array<FrontendChannel, 1> channels{channel};
  emitNotificationsForTracingProfile(std::move(hostTracingProfile), channels, isBackgroundTrace);
}

} // namespace facebook::react::jsinspector_modern

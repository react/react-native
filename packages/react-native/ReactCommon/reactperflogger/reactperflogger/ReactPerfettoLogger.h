/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/timing/primitives.h>
#include <reactperflogger/ReactPerfettoCategories.h>

#include <optional>
#include <string_view>

namespace facebook::react {

/**
 * An internal interface for logging performance events to Perfetto, when
 * configured.
 */
class ReactPerfettoLogger {
 public:
  static bool isTracing();

  static void mark(
      const std::string_view& eventName,
      HighResTimeStamp startTime,
      const std::optional<std::string_view>& trackName = std::nullopt,
      const std::optional<std::string_view>& trackGroup = std::nullopt);

  static void measure(
      const std::string_view& eventName,
      HighResTimeStamp startTime,
      HighResTimeStamp endTime,
      const std::optional<std::string_view>& trackName = std::nullopt,
      const std::optional<std::string_view>& trackGroup = std::nullopt);
};

} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>

#include <jsinspector-modern/tracing/PerformanceTracer.h>

#include <string_view>

namespace facebook::react::jsinspector_modern::tracing {

/**
 * This is a RAII class that reports a timeStamp block to the React Native
 * Performance Tracer.
 *
 * @example
 *   {
 *     PerformanceTracerSection s("name", "track", "track group");
 *     // do something
 *   }
 */
template <typename... Args>
class PerformanceTracerSection {
 public:
  explicit PerformanceTracerSection(
      const char *name,
      const char *track = nullptr,
      const char *trackGroup = nullptr,
      const char *color = nullptr,
      Args... args) noexcept
      : name_(name), track_(track), trackGroup_(trackGroup), color_(color), args_(std::move(args)...)
  {
    static_assert(
        sizeof...(Args) % 2 == 0,
        "PerformanceTracerSection expects an even number of variadic args representing [name, value] pairs.");
  }

  // Non-movable
  PerformanceTracerSection(const PerformanceTracerSection &) = delete;
  PerformanceTracerSection(PerformanceTracerSection &&) = delete;

  // Non-copyable
  PerformanceTracerSection &operator=(const PerformanceTracerSection &) = delete;
  PerformanceTracerSection &operator=(PerformanceTracerSection &&) = delete;

  ~PerformanceTracerSection() noexcept
  {
    auto &tracer = PerformanceTracer::getInstance();
    if (!tracer.isTracing()) {
      return;
    }

    auto endTime = HighResTimeStamp::now();

    // Slow path when passing properties
    if constexpr (sizeof...(Args) > 0) {
      auto properties = folly::dynamic::array();
      std::apply(
          [&](const auto &...elems) {
            size_t idx = 0;
            (((idx % 2 == 0) ? properties.push_back(folly::dynamic::array(elems))
                             : properties[properties.size() - 1].push_back(elems),
              ++idx),
             ...);
          },
          args_);

      folly::dynamic devtools = folly::dynamic::object();
      devtools["properties"] = std::move(properties);

      if (track_ != nullptr) {
        devtools["track"] = track_;
      }

      if (trackGroup_ != nullptr) {
        devtools["trackGroup"] = trackGroup_;
      }

      if (color_ != nullptr) {
        devtools["color"] = color_;
      }

      folly::dynamic detail = folly::dynamic::object();
      detail["devtools"] = std::move(devtools);

      tracer.reportMeasure(std::string(name_), startTime_, endTime - startTime_, std::move(detail));
    } else {
      tracer.reportTimeStamp(
          std::string(name_),
          startTime_,
          endTime,
          track_ != nullptr ? std::optional{track_} : std::nullopt,
          trackGroup_ != nullptr ? std::optional{trackGroup_} : std::nullopt,
          color_ != nullptr ? getConsoleTimeStampColorFromString(color_) : std::nullopt);
    }
  }

 private:
  HighResTimeStamp startTime_{HighResTimeStamp::now()};
  std::string_view name_;
  const char *track_;
  const char *trackGroup_;
  const char *color_;
  std::tuple<Args...> args_;
};

} // namespace facebook::react::jsinspector_modern::tracing

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "FollyDynamicMatchers.h"
#include "JsiIntegrationTest.h"

#include <fmt/format.h>
#include <folly/dynamic.h>
#include <folly/json.h>
#include <gmock/gmock.h>

#include <set>
#include <vector>

namespace facebook::react::jsinspector_modern {

/**
 * Base test class providing tracing-related test utilities for tests.
 */
template <typename EngineAdapter, typename Executor>
class TracingTestBase
    : public JsiIntegrationPortableTestBase<EngineAdapter, Executor> {
 protected:
  using JsiIntegrationPortableTestBase<EngineAdapter, Executor>::
      JsiIntegrationPortableTestBase;

  /**
   * Helper method to start tracing via Tracing.start CDP command.
   */
  void startTracing(
      const std::set<tracing::Category>& enabledCategories = {
          tracing::Category::HiddenTimeline,
          tracing::Category::JavaScriptSampling,
          tracing::Category::RuntimeExecution,
          tracing::Category::Timeline,
          tracing::Category::UserTiming,
      }) {
    this->expectMessageFromPage(JsonEq(R"({
                                          "id": 1,
                                          "result": {}
                                        })"));

    this->toPage_->sendMessage(fmt::format(
        R"({{
              "id": 1,
              "method": "Tracing.start",
              "params": {{ "categories": "{0}" }}
            }})",
        tracing::serializeTracingCategories(enabledCategories)));
  }

  /**
   * Helper method to end tracing and collect all trace events from potentially
   * multiple chunked Tracing.dataCollected messages.
   * \returns A vector containing all collected trace events
   */
  std::vector<folly::dynamic> endTracingAndCollectEvents() {
    testing::InSequence s;

    this->expectMessageFromPage(JsonEq(R"({
                                          "id": 1,
                                          "result": {}
                                        })"));

    std::vector<folly::dynamic> allTraceEvents;

    EXPECT_CALL(
        this->fromPage(),
        onMessage(JsonParsed(AtJsonPtr("/method", "Tracing.dataCollected"))))
        .Times(testing::AtLeast(1))
        .WillRepeatedly(
            testing::Invoke([&allTraceEvents](const std::string& message) {
              auto parsedMessage = folly::parseJson(message);
              auto& events = parsedMessage.at("params").at("value");
              allTraceEvents.insert(
                  allTraceEvents.end(),
                  std::make_move_iterator(events.begin()),
                  std::make_move_iterator(events.end()));
            }));

    this->expectMessageFromPage(JsonParsed(testing::AllOf(
        AtJsonPtr("/method", "Tracing.tracingComplete"),
        AtJsonPtr("/params/dataLossOccurred", false))));

    this->toPage_->sendMessage(R"({
                                  "id": 1,
                                  "method": "Tracing.end"
                                })");

    return allTraceEvents;
  }
};

} // namespace facebook::react::jsinspector_modern

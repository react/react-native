/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <folly/json.h>
#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include <chrono>
#include <string>
#include <string_view>
#include <utility>
#include <vector>

#include <jsinspector-modern/FallbackRuntimeTargetDelegate.h>
#include <jsinspector-modern/RuntimeAgentDelegate.h>

using namespace ::testing;

namespace facebook::react::jsinspector_modern {

class FallbackRuntimeAgentDelegateTest : public Test {
 protected:
  FrontendChannel frontendChannel() {
    return [this](std::string_view message) {
      messages_.push_back(folly::parseJson(message));
    };
  }

  std::unique_ptr<RuntimeAgentDelegate> createDelegate(
      SessionState& sessionState,
      std::string engineDescription) {
    FallbackRuntimeTargetDelegate targetDelegate(std::move(engineDescription));
    return targetDelegate.createAgentDelegate(
        frontendChannel(), sessionState, nullptr, {}, {});
  }

  std::vector<folly::dynamic> messages_;
};

TEST_F(
    FallbackRuntimeAgentDelegateTest,
    testConstructorWithLogEnabledSendsWarning) {
  using namespace std::chrono;

  SessionState sessionState;
  sessionState.isLogDomainEnabled = true;
  const std::string engineDescription = "Example \"Canary\" Engine";
  const auto beforeConstruction =
      duration_cast<milliseconds>(system_clock::now().time_since_epoch())
          .count();

  auto delegate = createDelegate(sessionState, engineDescription);

  const auto afterConstruction =
      duration_cast<milliseconds>(system_clock::now().time_since_epoch())
          .count();
  ASSERT_EQ(messages_.size(), 1);
  const auto& notification = messages_.front();
  EXPECT_EQ(notification.at("method"), "Log.entryAdded");

  const auto& entry = notification.at("params").at("entry");
  EXPECT_EQ(entry.at("source"), "other");
  EXPECT_EQ(entry.at("level"), "warning");
  EXPECT_THAT(entry.at("text").getString(), HasSubstr(engineDescription));
  EXPECT_GE(entry.at("timestamp").getInt(), beforeConstruction);
  EXPECT_LE(entry.at("timestamp").getInt(), afterConstruction);
}

TEST_F(
    FallbackRuntimeAgentDelegateTest,
    testHandleRequestLogEnableSendsWarningWithoutClaimingRequest) {
  SessionState sessionState;
  auto delegate = createDelegate(sessionState, "Deferred Engine");
  ASSERT_TRUE(messages_.empty());

  const bool handled = delegate->handleRequest(cdp::preparse(R"({
    "id": 17,
    "method": "Log.enable"
  })"));

  EXPECT_FALSE(handled);
  ASSERT_EQ(messages_.size(), 1);
  const auto& notification = messages_.front();
  EXPECT_EQ(notification.at("method"), "Log.entryAdded");
  EXPECT_EQ(notification.at("params").at("entry").at("level"), "warning");
}

TEST_F(
    FallbackRuntimeAgentDelegateTest,
    testHandleRequestNonEnableMethodDoesNotSendWarningOrClaimRequest) {
  SessionState sessionState;
  auto delegate = createDelegate(sessionState, "Boundary Engine");

  const bool handled = delegate->handleRequest(cdp::preparse(R"({
    "id": 23,
    "method": "Log.enableExtra"
  })"));

  EXPECT_FALSE(handled);
  EXPECT_TRUE(messages_.empty());
}

} // namespace facebook::react::jsinspector_modern

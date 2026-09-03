/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <jsinspector-modern/network/NetworkHandler.h>

#include <folly/json.h>
#include <gtest/gtest.h>

#include <string>
#include <utility>
#include <vector>

namespace facebook::react::jsinspector_modern {

class NetworkHandlerTest : public ::testing::Test {
 protected:
  size_t enableAgent(FrontendChannel channel) {
    auto agentId = handler_.enableAgent(std::move(channel));
    agentIds_.push_back(agentId);
    return agentId;
  }

  void TearDown() override {
    for (auto agentId : agentIds_) {
      handler_.disableAgent(agentId);
    }
  }

  NetworkHandler& handler_ = NetworkHandler::getInstance();
  std::vector<size_t> agentIds_;
};

TEST_F(NetworkHandlerTest, testDisableAgentStopsEventDelivery) {
  std::vector<std::string> firstAgentMessages;
  std::vector<std::string> secondAgentMessages;
  auto firstAgentId = enableAgent([&](std::string_view message) {
    firstAgentMessages.emplace_back(message);
  });
  auto secondAgentId = enableAgent([&](std::string_view message) {
    secondAgentMessages.emplace_back(message);
  });

  handler_.onDataReceived("request-1", 12, 18);

  ASSERT_EQ(firstAgentMessages.size(), 1);
  ASSERT_EQ(secondAgentMessages.size(), 1);
  auto event = folly::parseJson(firstAgentMessages.front());
  EXPECT_EQ(event.at("method"), "Network.dataReceived");
  EXPECT_EQ(event.at("params").at("requestId"), "request-1");
  EXPECT_EQ(event.at("params").at("dataLength"), 12);
  EXPECT_EQ(event.at("params").at("encodedDataLength"), 18);
  EXPECT_EQ(folly::parseJson(secondAgentMessages.front()), event);

  handler_.disableAgent(firstAgentId);
  handler_.onLoadingFinished("request-1", 23);

  EXPECT_EQ(firstAgentMessages.size(), 1);
  ASSERT_EQ(secondAgentMessages.size(), 2);
  event = folly::parseJson(secondAgentMessages.back());
  EXPECT_EQ(event.at("method"), "Network.loadingFinished");
  EXPECT_EQ(event.at("params").at("encodedDataLength"), 23);

  handler_.disableAgent(secondAgentId);
  EXPECT_FALSE(handler_.isEnabled());
  handler_.onDataReceived("request-1", 30, 35);
  EXPECT_EQ(firstAgentMessages.size(), 1);
  EXPECT_EQ(secondAgentMessages.size(), 2);
}

TEST_F(NetworkHandlerTest, testResponseBodyClearedAfterLastAgentIsDisabled) {
  auto firstAgentId = enableAgent([](std::string_view) {});
  auto secondAgentId = enableAgent([](std::string_view) {});
  std::string responseBody = "response body";

  handler_.storeResponseBody("request-1", responseBody, false);
  responseBody.assign("changed after storage");

  auto storedResponse = handler_.getResponseBody("request-1");
  ASSERT_TRUE(storedResponse.has_value());
  EXPECT_EQ(std::get<0>(*storedResponse), "response body");
  EXPECT_FALSE(std::get<1>(*storedResponse));

  handler_.disableAgent(firstAgentId);
  EXPECT_TRUE(handler_.getResponseBody("request-1").has_value());

  handler_.disableAgent(secondAgentId);
  EXPECT_FALSE(handler_.getResponseBody("request-1").has_value());
}

TEST_F(NetworkHandlerTest, testRequestInitiatorIsMatchedAndConsumedOnce) {
  std::vector<std::string> messages;
  enableAgent(
      [&](std::string_view message) { messages.emplace_back(message); });
  folly::dynamic stackTrace = folly::dynamic::object(
      "callFrames",
      folly::dynamic::array(
          folly::dynamic::object("functionName", "loadData")));
  folly::dynamic defaultInitiator = folly::dynamic::object("type", "script");
  handler_.recordRequestInitiatorStack("request-1", stackTrace);
  auto request = cdp::network::Request{
      .url = "https://example.com/data",
      .method = "GET",
      .headers = {},
      .postData = std::nullopt,
  };

  handler_.onRequestWillBeSent("request-2", request, std::nullopt);
  handler_.onRequestWillBeSent("request-1", request, std::nullopt);
  handler_.onRequestWillBeSent("request-1", request, std::nullopt);

  ASSERT_EQ(messages.size(), 3);
  auto unrelatedInitiator =
      folly::parseJson(messages[0]).at("params").at("initiator");
  EXPECT_EQ(unrelatedInitiator, defaultInitiator);

  auto storedInitiator =
      folly::parseJson(messages[1]).at("params").at("initiator");
  EXPECT_EQ(storedInitiator.at("type"), "script");
  EXPECT_EQ(storedInitiator.at("stack"), stackTrace);

  auto consumedInitiator =
      folly::parseJson(messages[2]).at("params").at("initiator");
  EXPECT_EQ(consumedInitiator, defaultInitiator);
}

TEST_F(
    NetworkHandlerTest,
    testLoadingFailureUsesResponseResourceTypeAndCancellationStatus) {
  std::vector<std::string> messages;
  enableAgent(
      [&](std::string_view message) { messages.emplace_back(message); });
  auto response = cdp::network::Response{
      .url = "https://example.com/image.png",
      .status = 200,
      .statusText = "OK",
      .headers = {},
      .mimeType = "image/png",
      .encodedDataLength = 256,
  };

  handler_.onResponseReceived("image-request", response);
  handler_.onLoadingFailed("image-request", false);
  handler_.onLoadingFailed("cancelled-request", true);

  ASSERT_EQ(messages.size(), 3);
  auto failedRequest = folly::parseJson(messages[1]);
  EXPECT_EQ(failedRequest.at("method"), "Network.loadingFailed");
  EXPECT_EQ(failedRequest.at("params").at("type"), "Image");
  EXPECT_EQ(failedRequest.at("params").at("errorText"), "net::ERR_FAILED");
  EXPECT_FALSE(failedRequest.at("params").at("canceled").asBool());

  auto cancelledRequest = folly::parseJson(messages[2]);
  EXPECT_EQ(cancelledRequest.at("params").at("type"), "Other");
  EXPECT_EQ(cancelledRequest.at("params").at("errorText"), "net::ERR_ABORTED");
  EXPECT_TRUE(cancelledRequest.at("params").at("canceled").asBool());
}

} // namespace facebook::react::jsinspector_modern

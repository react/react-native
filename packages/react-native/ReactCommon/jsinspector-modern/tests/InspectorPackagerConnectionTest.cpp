/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fmt/format.h>
#include <folly/json.h>
#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include "FollyDynamicMatchers.h"
#include "InspectorPackagerConnectionTest.h"

using namespace ::testing;
using namespace std::literals::chrono_literals;
using namespace std::literals::string_literals;
using folly::dynamic, folly::toJson;

namespace facebook::react::jsinspector_modern {

TEST_F(InspectorPackagerConnectionTest, TestConnectThenDestroy) {
  packagerConnection_->connect();

  // The connection should be established immediately.
  ASSERT_TRUE(webSockets_[0]);
  EXPECT_EQ(webSockets_[0]->url, "ws://mock-host:12345");
  EXPECT_TRUE(packagerConnection_->isConnected());

  // Destroying packagerConnection_ should close the underlying WebSocket (by
  // destroying it).
  packagerConnection_.reset();
  EXPECT_FALSE(webSockets_[0]);
}

TEST_F(InspectorPackagerConnectionTest, TestConnectMultipleTimes) {
  packagerConnection_->connect();

  packagerConnection_->connect();

  // The WebSocket gets recreated and the connection is in a valid state.
  EXPECT_FALSE(webSockets_[0]);
  ASSERT_TRUE(webSockets_[1]);
  EXPECT_EQ(webSockets_[1]->url, "ws://mock-host:12345");
  EXPECT_TRUE(packagerConnection_->isConnected());

  // Destroying packagerConnection_ should close the underlying WebSocket (by
  // destroying it).
  packagerConnection_.reset();
  EXPECT_FALSE(webSockets_[1]);
}

TEST_F(InspectorPackagerConnectionTest, TestCloseQuietly) {
  packagerConnection_->connect();

  ASSERT_TRUE(webSockets_[0]);
  EXPECT_TRUE(packagerConnection_->isConnected());

  packagerConnection_->closeQuietly();
  EXPECT_FALSE(packagerConnection_->isConnected());
  EXPECT_FALSE(webSockets_[0]);

  // Calling closeQuietly again has no effect.
  packagerConnection_->closeQuietly();
  EXPECT_FALSE(packagerConnection_->isConnected());
  EXPECT_FALSE(webSockets_[0]);

  // Connecting again is a noop (except for logging an error).
  packagerConnection_->connect();
  EXPECT_FALSE(packagerConnection_->isConnected());
  EXPECT_FALSE(webSockets_[0]);
}

TEST_F(InspectorPackagerConnectionTest, TestGetPages) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();

  // The list of pages is empty at first.
  EXPECT_CALL(*webSockets_[0], send(JsonEq(R"({
      "event": "getPages",
      "payload": []
    })")))
      .RetiresOnSaturation();
  webSockets_[0]->getDelegate().didReceiveMessage(R"({
      "event": "getPages"
    })");

  auto pageId1 = getInspectorInstance().addPage(
      "mock-description-1",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>(),
      {.nativePageReloads = true});

  auto pageId2 = getInspectorInstance().addPage(
      "mock-description-2",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>(),
      {.nativePageReloads = true});

  // getPages now reports the page we registered, in the order added
  EXPECT_CALL(
      *webSockets_[0],
      send(JsonParsed(AllOf(
          AtJsonPtr("/event", Eq("getPages")),
          AtJsonPtr(
              "/payload",
              ElementsAreArray(
                  {AllOf(
                       AtJsonPtr("/id", Eq(std::to_string(pageId1))),
                       AtJsonPtr("/title", Eq("my-app (my-device)")),
                       AtJsonPtr(
                           "/description",
                           Eq("mock-description-1 [C++ connection]")),
                       AtJsonPtr("/app", Eq("my-app")),
                       AtJsonPtr("/capabilities/nativePageReloads", Eq(true)),
                       AtJsonPtr(
                           "/capabilities/nativeSourceCodeFetching", Eq(false)),
                       AtJsonPtr(
                           "/capabilities/supportsMultipleDebuggers",
                           Eq(true))),
                   AllOf(
                       AtJsonPtr("/id", Eq(std::to_string(pageId2))),
                       AtJsonPtr("/title", Eq("my-app (my-device)")),
                       AtJsonPtr(
                           "/description",
                           Eq("mock-description-2 [C++ connection]")),
                       AtJsonPtr("/app", Eq("my-app")),
                       AtJsonPtr("/capabilities/nativePageReloads", Eq(true)),
                       AtJsonPtr(
                           "/capabilities/nativeSourceCodeFetching", Eq(false)),
                       AtJsonPtr(
                           "/capabilities/supportsMultipleDebuggers",
                           Eq(true)))}))))))
      .RetiresOnSaturation();
  webSockets_[0]->getDelegate().didReceiveMessage(R"({
      "event": "getPages"
    })");

  getInspectorInstance().removePage(pageId1);
  getInspectorInstance().removePage(pageId2);

  // getPages is back to reporting no pages.
  EXPECT_CALL(
      *webSockets_[0],
      send(JsonEq(
          R"({
              "event": "getPages",
              "payload": []
            })")))
      .RetiresOnSaturation();
  webSockets_[0]->getDelegate().didReceiveMessage(R"({
      "event": "getPages"
    })");
}

TEST_F(InspectorPackagerConnectionTest, TestSendReceiveEvents) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  auto pageId = getInspectorInstance().addPage(
      "mock-description",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect to the page.
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
          toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[0]);

  // Send an event from the mocked backend (local) to the frontend (remote)
  // and observe it being sent via the socket.
  EXPECT_CALL(
      *webSockets_[0],
      send(JsonParsed(AllOf(
          AtJsonPtr("/event", Eq("wrappedEvent")),
          AtJsonPtr("/payload/pageId", Eq(std::to_string(pageId))),
          AtJsonPtr(
              "/payload/wrappedEvent",
              JsonEq(
                  R"({
                    "method": "FakeDomain.eventTriggered",
                    "params": ["arg1", "arg2"]
                  })"))))))
      .RetiresOnSaturation();
  localConnections_[0]->getRemoteConnection().onMessage(R"({
                                                            "method": "FakeDomain.eventTriggered",
                                                            "params": ["arg1", "arg2"]
                                                          })");

  // Send an event from the frontend (remote) to the backend (local) and
  // observe it being received by localConnection.
  EXPECT_CALL(
      *localConnections_[0],
      sendMessage(JsonParsed(AllOf(
          AtJsonPtr("/method", Eq("FakeDomain.fakeMethod")),
          AtJsonPtr("/id", Eq(1234)),
          AtJsonPtr("/params", ElementsAre("arg1", "arg2"))))))
      .RetiresOnSaturation();

  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "wrappedEvent",
          "payload": {{
            "pageId": {0},
            "wrappedEvent": {1}
          }}
        }})",
          toJson(std::to_string(pageId)),
          toJson(R"({
                "method": "FakeDomain.fakeMethod",
                "id": 1234,
                "params": ["arg1", "arg2"]
              })")));

  // Send a 'disconnect' event from the mocked backend (local) to the frontend
  // (remote) and observe it being sent via the socket.
  EXPECT_CALL(
      *webSockets_[0],
      send(JsonParsed(AllOf(
          AtJsonPtr("/event", Eq("disconnect")),
          AtJsonPtr("/payload/pageId", Eq(std::to_string(pageId)))))))
      .RetiresOnSaturation();
  localConnections_[0]->getRemoteConnection().onDisconnect();

  EXPECT_CALL(*localConnections_[0], disconnect()).RetiresOnSaturation();
  getInspectorInstance().removePage(pageId);
}

TEST_F(InspectorPackagerConnectionTest, TestSendReceiveEventsToMultiplePages) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();

  std::vector<int> pageIds;

  const int kNumPages = 2;
  for (int i = 0; i < kNumPages; ++i) {
    pageIds.push_back(
        getInspectorInstance().addPage(
            "mock-description",
            "mock-vm",
            localConnections_
                .lazily_make_unique<std::unique_ptr<IRemoteConnection>>()));
    if (i > 0) {
      ASSERT_NE(pageIds[i], pageIds[i - 1])
          << "Received duplicate page IDs from inspector.";
    }
  }

  for (int i = 0; i < kNumPages; ++i) {
    // Connect to the i-th page.
    webSockets_[0]->getDelegate().didReceiveMessage(
        fmt::format(
            R"({{
        "event": "connect",
        "payload": {{
          "pageId": {0}
        }}
      }})",
            toJson(std::to_string(pageIds[i]))));
    ASSERT_TRUE(localConnections_[i]);
  }

  // Send an event from each LocalConnection and observe it being sent via
  // the socket.
  for (int i = 0; i < kNumPages; ++i) {
    // Generate a unique method name for this page to validate that we are
    // routing the events correctly.
    std::string method =
        "FakeDomain.eventFromPage"s + std::to_string(pageIds[i]);
    EXPECT_CALL(
        *webSockets_[0],
        send(JsonParsed(AllOf(
            AtJsonPtr("/event", Eq("wrappedEvent")),
            AtJsonPtr("/payload/pageId", Eq(std::to_string(pageIds[i]))),
            AtJsonPtr(
                "/payload/wrappedEvent",
                JsonParsed(AtJsonPtr("/method", Eq(method))))))))
        .RetiresOnSaturation();
    localConnections_[i]->getRemoteConnection().onMessage(
        toJson(dynamic::object("method", method)));
  }

  // Send an event from the frontend (remote) to the backend (local) and
  // observe it being received by each LocalConnection.
  for (int i = 0; i < kNumPages; ++i) {
    // Generate a unique method name for this page to validate that we are
    // routing the events correctly.
    std::string method =
        "FakeDomain.methodToPage"s + std::to_string(pageIds[i]);
    EXPECT_CALL(
        *localConnections_[i],
        sendMessage(JsonParsed(AtJsonPtr("/method", Eq(method)))))
        .RetiresOnSaturation();
    webSockets_[0]->getDelegate().didReceiveMessage(
        fmt::format(
            R"({{
          "event": "wrappedEvent",
          "payload": {{
            "pageId": {0},
            "wrappedEvent": {1}
          }}
        }})",
            toJson(std::to_string(pageIds[i])),
            toJson(toJson(dynamic::object("method", method)))));
  }

  for (int i = 0; i < kNumPages; ++i) {
    EXPECT_CALL(*localConnections_[i], disconnect()).RetiresOnSaturation();
    getInspectorInstance().removePage(pageIds[i]);
  }
}

TEST_F(InspectorPackagerConnectionTest, TestSendEventToAllConnections) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  auto pageId = getInspectorInstance().addPage(
      "mock-description",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect to the page.
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
          toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[0]);

  // Impersonate the frontend (remote) to send a message to all (local)
  // connections.
  EXPECT_CALL(
      *localConnections_[0],
      sendMessage(JsonParsed(AllOf(
          AtJsonPtr("/method", Eq("FakeDomain.fakeMethod")),
          AtJsonPtr("/id", Eq(1234)),
          AtJsonPtr("/params", ElementsAre("arg1", "arg2"))))))
      .RetiresOnSaturation();
  packagerConnection_->sendEventToAllConnections(R"({
    "method": "FakeDomain.fakeMethod",
    "id": 1234,
    "params": ["arg1", "arg2"]
  })");

  EXPECT_CALL(*localConnections_[0], disconnect()).RetiresOnSaturation();
  getInspectorInstance().removePage(pageId);
}

TEST_F(InspectorPackagerConnectionTest, TestConnectThenDisconnect) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  auto pageId = getInspectorInstance().addPage(
      "mock-description",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect to the page.
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
          toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[0]);

  // Disconnect from the page.
  EXPECT_CALL(*localConnections_[0], disconnect()).RetiresOnSaturation();
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "disconnect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
          toJson(std::to_string(pageId))));
  EXPECT_FALSE(localConnections_[0]);
}

TEST_F(InspectorPackagerConnectionTest, TestConnectThenCloseSocket) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  auto pageId = getInspectorInstance().addPage(
      "mock-description",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect to the page.
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
          toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[0]);

  // Notify that the socket was closed.
  EXPECT_CALL(*localConnections_[0], disconnect()).RetiresOnSaturation();
  webSockets_[0]->getDelegate().didClose();
  EXPECT_FALSE(localConnections_[0]);
}

TEST_F(InspectorPackagerConnectionTest, TestConnectThenSocketFailure) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  auto pageId = getInspectorInstance().addPage(
      "mock-description",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect to the page.
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
          toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[0]);

  // Notify that the socket was closed (implicitly, as the result of an error).
  EXPECT_CALL(*localConnections_[0], disconnect()).RetiresOnSaturation();
  webSockets_[0]->getDelegate().didFailWithError(ECONNABORTED, "Test error");
  EXPECT_FALSE(localConnections_[0]);
}

TEST_F(
    InspectorPackagerConnectionTestAsync,
    TestExplicitCloseAfterSocketFailure) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  auto pageId = getInspectorInstance().addPage(
      "mock-description",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect to the page.
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
          toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[0]);

  // Notify that the socket was closed (implicitly, as the result of an error).
  EXPECT_CALL(*localConnections_[0], disconnect()).RetiresOnSaturation();

  {
    // The WebSocket instance gets destroyed during didFailWithError, so extract
    // the delegate in order to call didClose.
    std::shared_ptr webSocketDelegate = webSockets_[0]->delegate.lock();

    webSocketDelegate->didFailWithError(ECONNABORTED, "Test error");
    webSocketDelegate->didClose();
  }

  EXPECT_FALSE(localConnections_[0]);
  // We're still disconnected since we haven't called the reconnect callback.
  EXPECT_FALSE(packagerConnection_->isConnected());

  // Flush the callback queue.
  asyncExecutor_.advance(2000ms);

  EXPECT_TRUE(packagerConnection_->isConnected());
}

TEST_F(
    InspectorPackagerConnectionTest,
    TestConnectWhileAlreadyConnectedCausesDisconnection) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  auto pageId = getInspectorInstance().addPage(
      "mock-description",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect to the page.
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
          toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[0]);

  // Try connecting to the same page again. This results in a disconnection.
  EXPECT_CALL(*localConnections_[0], disconnect()).RetiresOnSaturation();
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
          toJson(std::to_string(pageId))));
  EXPECT_FALSE(localConnections_[0]);
  EXPECT_EQ(localConnections_.objectsVended(), 1);
}

TEST_F(InspectorPackagerConnectionTest, TestMultipleDisconnect) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  auto pageId = getInspectorInstance().addPage(
      "mock-description",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect to the page.
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
          toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[0]);

  // Disconnect from the page.
  EXPECT_CALL(*localConnections_[0], disconnect()).RetiresOnSaturation();
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "disconnect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
          toJson(std::to_string(pageId))));
  EXPECT_FALSE(localConnections_[0]);

  // Disconnect again. This is a noop.
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "disconnect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
          toJson(std::to_string(pageId))));
  EXPECT_FALSE(localConnections_[0]);
}

TEST_F(InspectorPackagerConnectionTest, TestDisconnectThenSendEvent) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  auto pageId = getInspectorInstance().addPage(
      "mock-description",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect to the page.
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
          toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[0]);

  // Disconnect from the page.
  EXPECT_CALL(*localConnections_[0], disconnect()).RetiresOnSaturation();
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "disconnect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
          toJson(std::to_string(pageId))));
  EXPECT_FALSE(localConnections_[0]);

  // Send an event from the frontend (remote) to the backend (local). This
  // is a noop.
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "wrappedEvent",
          "payload": {{
            "pageId": {0},
            "wrappedEvent": {1}
          }}
        }})",
          toJson(std::to_string(pageId)),
          toJson(R"({
                "method": "FakeDomain.fakeMethod",
                "id": 1234,
                "params": ["arg1", "arg2"]
              })")));
}

TEST_F(InspectorPackagerConnectionTest, TestSendEventToUnknownPage) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();

  // Send an event from the frontend (remote) to the backend (local). This
  // is a noop (except for logging).
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "wrappedEvent",
          "payload": {{
            "pageId": "1234",
            "wrappedEvent": {0}
          }}
        }})",
          toJson(R"({
                "method": "FakeDomain.fakeMethod",
                "id": 1234,
                "params": ["arg1", "arg2"]
              })")));
}

TEST_F(InspectorPackagerConnectionTest, TestReconnectSuccessful) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  ASSERT_TRUE(webSockets_[0]);
  EXPECT_CALL(*packagerConnectionDelegate(), scheduleCallback(_, _))
      .RetiresOnSaturation();
  webSockets_[0]->getDelegate().didClose();
  EXPECT_FALSE(webSockets_[0]);
  EXPECT_TRUE(webSockets_[1]);
  EXPECT_TRUE(packagerConnection_->isConnected());

  // Stops attempting to reconnect after closeQuietly

  packagerConnection_->closeQuietly();
}

TEST_F(InspectorPackagerConnectionTest, TestReconnectFailure) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  ASSERT_TRUE(webSockets_[0]);
  EXPECT_CALL(*packagerConnectionDelegate(), scheduleCallback(_, _))
      .Times(2)
      .RetiresOnSaturation();

  webSockets_[0]->getDelegate().didClose();
  EXPECT_FALSE(webSockets_[0]);
  ASSERT_TRUE(webSockets_[1]);
  webSockets_[1]->getDelegate().didClose();
  EXPECT_FALSE(webSockets_[1]);
  ASSERT_TRUE(webSockets_[2]);
  EXPECT_TRUE(packagerConnection_->isConnected());

  // Stops attempting to reconnect after closeQuietly

  packagerConnection_->closeQuietly();

  EXPECT_FALSE(webSockets_[2]);
  EXPECT_FALSE(packagerConnection_->isConnected());
}

TEST_F(InspectorPackagerConnectionTest, TestReconnectOnSocketError) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  ASSERT_TRUE(webSockets_[0]);
  EXPECT_CALL(*packagerConnectionDelegate(), scheduleCallback(_, _))
      .RetiresOnSaturation();
  webSockets_[0]->getDelegate().didFailWithError(ECONNRESET, "Test error");
  EXPECT_FALSE(webSockets_[0]);
  EXPECT_TRUE(webSockets_[1]);
  EXPECT_TRUE(packagerConnection_->isConnected());

  // Stops attempting to reconnect after closeQuietly

  packagerConnection_->closeQuietly();
}

TEST_F(InspectorPackagerConnectionTest, TestReconnectOnSocketErrorWithNoCode) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  ASSERT_TRUE(webSockets_[0]);
  EXPECT_CALL(*packagerConnectionDelegate(), scheduleCallback(_, _))
      .RetiresOnSaturation();
  webSockets_[0]->getDelegate().didFailWithError(std::nullopt, "Test error");
  EXPECT_FALSE(webSockets_[0]);
  EXPECT_TRUE(webSockets_[1]);
  EXPECT_TRUE(packagerConnection_->isConnected());

  // Stops attempting to reconnect after closeQuietly

  packagerConnection_->closeQuietly();
}

TEST_F(InspectorPackagerConnectionTest, TestUnknownEvent) {
  packagerConnection_->connect();
  ASSERT_TRUE(webSockets_[0]);

  // This is a noop (other than logging an error).
  webSockets_[0]->getDelegate().didReceiveMessage(R"({"event": "foo"})");
}

TEST_F(InspectorPackagerConnectionTest, TestMalformedEvent) {
  packagerConnection_->connect();
  ASSERT_TRUE(webSockets_[0]);

  // This is a noop (other than logging an error).
  webSockets_[0]->getDelegate().didReceiveMessage("this is not json");
  webSockets_[0]->getDelegate().didReceiveMessage("{");
  webSockets_[0]->getDelegate().didReceiveMessage("");
}

TEST_F(InspectorPackagerConnectionTest, TestEventsNotConformingToType) {
  packagerConnection_->connect();
  ASSERT_TRUE(webSockets_[0]);

  // These are all noops (other than logging an error).
  webSockets_[0]->getDelegate().didReceiveMessage(R"({})");
  webSockets_[0]->getDelegate().didReceiveMessage(
      R"({"event": "wrappedEvent"})");
  webSockets_[0]->getDelegate().didReceiveMessage(R"({"event": "connect"})");
  webSockets_[0]->getDelegate().didReceiveMessage(R"({"event": "disconnect"})");
  webSockets_[0]->getDelegate().didReceiveMessage(
      R"({"payload": {"pageId": "1"}})");
}

TEST_F(
    InspectorPackagerConnectionTest,
    TestWebSocketDelegateIsDestroyedWithConnectionByDefault) {
  packagerConnection_->connect();
  ASSERT_TRUE(webSockets_[0]);

  std::weak_ptr delegate = webSockets_[0]->delegate;
  EXPECT_TRUE(delegate.lock());

  packagerConnection_.reset();
  EXPECT_FALSE(delegate.lock());
}

// Edge case: When the C++ layer has released the InspectorPackagerConnection,
// the platform bindings can still call methods on IWebSocketDelegate through
// a shared_ptr (typically _briefly_ upgraded from the weak_ptr we provide).
TEST_F(
    InspectorPackagerConnectionTest,
    TestWebSocketDelegateCanOutliveConnection) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  ASSERT_TRUE(webSockets_[0]);

  std::shared_ptr retainedWebSocketDelegate = webSockets_[0]->delegate.lock();
  ASSERT_TRUE(retainedWebSocketDelegate);

  // Destroy our InspectorPackagerConnection. We can't call methods on it
  // anymore, but its internals are still valid and it is still responding to
  // socket messages.
  packagerConnection_.reset();

  auto pageId = getInspectorInstance().addPage(
      "mock-description",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect to the page.
  retainedWebSocketDelegate->didReceiveMessage(
      fmt::format(
          R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
          toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[0]);

  // Send an event from the frontend (remote) to the backend (local) and
  // observe it being received by localConnection.
  EXPECT_CALL(
      *localConnections_[0],
      sendMessage(JsonParsed(AllOf(
          AtJsonPtr("/method", Eq("FakeDomain.fakeMethod")),
          AtJsonPtr("/id", Eq(1234)),
          AtJsonPtr("/params", ElementsAre("arg1", "arg2"))))))
      .RetiresOnSaturation();

  retainedWebSocketDelegate->didReceiveMessage(
      fmt::format(
          R"({{
          "event": "wrappedEvent",
          "payload": {{
            "pageId": {0},
            "wrappedEvent": {1}
          }}
        }})",
          toJson(std::to_string(pageId)),
          toJson(R"({
                "method": "FakeDomain.fakeMethod",
                "id": 1234,
                "params": ["arg1", "arg2"]
              })")));

  retainedWebSocketDelegate.reset();
  EXPECT_FALSE(localConnections_[0]);
  EXPECT_FALSE(webSockets_[0]);
}

TEST_F(InspectorPackagerConnectionTest, TestDestroyConnectionOnPageRemoved) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  ASSERT_TRUE(webSockets_[0]);

  auto pageId = getInspectorInstance().addPage(
      "mock-description",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect to the page.
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
          toJson(std::to_string(pageId))));
  EXPECT_TRUE(localConnections_[0]);

  // Remove the page.
  EXPECT_CALL(*localConnections_[0], disconnect()).RetiresOnSaturation();
  getInspectorInstance().removePage(pageId);
  EXPECT_FALSE(localConnections_[0]);
}

TEST_F(
    InspectorPackagerConnectionTestAsync,
    TestAttemptSendToRemoteAfterDestroyed) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  auto pageId = getInspectorInstance().addPage(
      "mock-description",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect to the page.
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
          toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[0]);

  // Send an event from the mocked backend (local) to the frontend (remote)
  // but don't flush the callback queue yet.
  localConnections_[0]->getRemoteConnection().onMessage(R"({
                                                            "method": "FakeDomain.eventTriggered",
                                                            "params": ["arg1", "arg2"]
                                                          })");

  EXPECT_CALL(*localConnections_[0], disconnect()).RetiresOnSaturation();
  getInspectorInstance().removePage(pageId);

  packagerConnection_.reset();

  // Flush the callback queue. This doesn't crash.
  EXPECT_EQ(asyncExecutor_.run(), 1);
}

TEST_F(
    InspectorPackagerConnectionTestAsync,
    TestAttemptSendToStaleRemoteConnection) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  auto pageId = getInspectorInstance().addPage(
      "mock-description",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect to the page.
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
          toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[0]);

  // Send an event from the mocked backend (local) to the frontend (remote)
  // but don't flush the callback queue yet.
  localConnections_[0]->getRemoteConnection().onMessage(R"({
                                                            "method": "FakeDomain.eventToBeDropped",
                                                            "params": ["arg1", "arg2"]
                                                          })");

  // Disconnect from the page.
  EXPECT_CALL(*localConnections_[0], disconnect()).RetiresOnSaturation();
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "disconnect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
          toJson(std::to_string(pageId))));
  EXPECT_FALSE(localConnections_[0]);

  // Connect to the same page again.
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
          toJson(std::to_string(pageId))));

  EXPECT_TRUE(localConnections_[1]);

  // Send an event from the mocked backend (local) to the frontend (remote) over
  // the new connection, then flush the callback queue.
  // Only this event should be sent over the socket.
  EXPECT_CALL(
      *webSockets_[0],
      send(JsonParsed(AllOf(
          AtJsonPtr("/event", Eq("wrappedEvent")),
          AtJsonPtr("/payload/pageId", Eq(std::to_string(pageId))),
          AtJsonPtr(
              "/payload/wrappedEvent",
              JsonEq(
                  R"({
                    "method": "FakeDomain.eventToBeDelivered",
                    "params": ["arg1", "arg2"]
                  })"))))))
      .RetiresOnSaturation();
  localConnections_[1]->getRemoteConnection().onMessage(R"({
                                                            "method": "FakeDomain.eventToBeDelivered",
                                                            "params": ["arg1", "arg2"]
                                                          })");
  EXPECT_EQ(asyncExecutor_.run(), 2);

  // Clean up.
  EXPECT_CALL(*localConnections_[1], disconnect()).RetiresOnSaturation();
  getInspectorInstance().removePage(pageId);
}

TEST_F(
    InspectorPackagerConnectionTestAsync,
    TestAttemptSendToStaleRemoteConnectionWhenRetained) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();
  auto pageId = getInspectorInstance().addPage(
      "mock-description",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect to the page.
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
          toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[0]);

  // Send an event from the mocked backend (local) to the frontend (remote)
  // but don't flush the callback queue yet.
  localConnections_[0]->getRemoteConnection().onMessage(R"({
                                                            "method": "FakeDomain.eventToBeDropped",
                                                            "params": ["arg1", "arg2"]
                                                          })");

  // Forcibly retain the remote connection beyond localConnections_[0]'s
  // lifetime.
  auto retainedRemoteConnection0 =
      localConnections_[0]->dangerouslyReleaseRemoteConnection();

  // Disconnect from the page.
  EXPECT_CALL(*localConnections_[0], disconnect()).RetiresOnSaturation();
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "disconnect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
          toJson(std::to_string(pageId))));
  EXPECT_FALSE(localConnections_[0]);

  // Connect to the same page again.
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
          toJson(std::to_string(pageId))));

  EXPECT_TRUE(localConnections_[1]);

  // Remember localConnections_[0]'s remote connection? We can still use it
  // without crashing, but it will not deliver any messages.
  retainedRemoteConnection0->onMessage(R"({
                                           "method": "FakeDomain.anotherEventToBeDropped",
                                           "params": ["arg1", "arg2"]
                                         })");
  retainedRemoteConnection0->onDisconnect();

  // Send events from the mocked backend (local) to the frontend (remote) over
  // the new connection, then flush the callback queue.
  // Only these events should be sent over the socket.
  EXPECT_CALL(
      *webSockets_[0],
      send(JsonParsed(AllOf(
          AtJsonPtr("/event", Eq("wrappedEvent")),
          AtJsonPtr("/payload/pageId", Eq(std::to_string(pageId))),
          AtJsonPtr(
              "/payload/wrappedEvent",
              JsonEq(
                  R"({
                    "method": "FakeDomain.eventToBeDelivered",
                    "params": ["arg1", "arg2"]
                  })"))))))
      .RetiresOnSaturation();
  localConnections_[1]->getRemoteConnection().onMessage(R"({
                                                            "method": "FakeDomain.eventToBeDelivered",
                                                            "params": ["arg1", "arg2"]
                                                          })");
  EXPECT_CALL(
      *webSockets_[0],
      send(JsonParsed(AllOf(
          AtJsonPtr("/event", Eq("disconnect")),
          AtJsonPtr("/payload/pageId", Eq(std::to_string(pageId)))))))
      .RetiresOnSaturation();
  localConnections_[1]->getRemoteConnection().onDisconnect();

  EXPECT_EQ(asyncExecutor_.run(), 5);

  // Clean up.
  EXPECT_CALL(*localConnections_[1], disconnect()).RetiresOnSaturation();
  getInspectorInstance().removePage(pageId);
}

TEST_F(InspectorPackagerConnectionTest, TestRejectedPageConnection) {
  // Configure gmock to expect calls in a specific order.
  InSequence mockCallsMustBeInSequence;

  enum {
    Accept,
    RejectSilently,
    RejectWithDisconnect
  } mockNextConnectionBehavior;

  auto pageId = getInspectorInstance().addPage(
      "mock-description",
      "mock-vm",
      [&mockNextConnectionBehavior,
       this](auto remoteConnection) -> std::unique_ptr<ILocalConnection> {
        switch (mockNextConnectionBehavior) {
          case Accept:
            return localConnections_.make_unique(std::move(remoteConnection));
          case RejectSilently:
            return nullptr;
          case RejectWithDisconnect:
            remoteConnection->onDisconnect();
            return nullptr;
        }
      });

  packagerConnection_->connect();

  ASSERT_TRUE(webSockets_[0]);

  // Reject the connection by returning nullptr.
  mockNextConnectionBehavior = RejectSilently;

  EXPECT_CALL(
      *webSockets_[0],
      send(JsonParsed(AllOf(
          AtJsonPtr("/event", Eq("disconnect")),
          AtJsonPtr("/payload/pageId", Eq(std::to_string(pageId)))))))
      .RetiresOnSaturation();

  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
          toJson(std::to_string(pageId))));

  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "wrappedEvent",
          "payload": {{
            "pageId": {0},
            "wrappedEvent": {1}
          }}
        }})",
          toJson(std::to_string(pageId)),
          toJson(R"({
                "method": "FakeDomain.fakeMethod",
                "id": 1,
                "params": ["arg1", "arg2"]
              })")));

  // Reject the connection by explicitly calling onDisconnect(), then returning
  // nullptr.
  mockNextConnectionBehavior = RejectWithDisconnect;

  EXPECT_CALL(
      *webSockets_[0],
      send(JsonParsed(AllOf(
          AtJsonPtr("/event", Eq("disconnect")),
          AtJsonPtr("/payload/pageId", Eq(std::to_string(pageId)))))))
      .RetiresOnSaturation();

  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
          toJson(std::to_string(pageId))));

  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "wrappedEvent",
          "payload": {{
            "pageId": {0},
            "wrappedEvent": {1}
          }}
        }})",
          toJson(std::to_string(pageId)),
          toJson(R"({
                "method": "FakeDomain.fakeMethod",
                "id": 2,
                "params": ["arg1", "arg2"]
              })")));

  // Accept a connection after previously rejecting connections to the same
  // page.
  mockNextConnectionBehavior = Accept;

  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0}
          }}
        }})",
          toJson(std::to_string(pageId))));

  EXPECT_CALL(
      *localConnections_[0],
      sendMessage(JsonParsed(AllOf(
          AtJsonPtr("/method", Eq("FakeDomain.fakeMethod")),
          AtJsonPtr("/id", Eq(3)),
          AtJsonPtr("/params", ElementsAre("arg1", "arg2"))))))
      .RetiresOnSaturation();

  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "wrappedEvent",
          "payload": {{
            "pageId": {0},
            "wrappedEvent": {1}
          }}
        }})",
          toJson(std::to_string(pageId)),
          toJson(R"({
                "method": "FakeDomain.fakeMethod",
                "id": 3,
                "params": ["arg1", "arg2"]
              })")));

  EXPECT_CALL(*localConnections_[0], disconnect()).RetiresOnSaturation();
  getInspectorInstance().removePage(pageId);
}

} // namespace facebook::react::jsinspector_modern

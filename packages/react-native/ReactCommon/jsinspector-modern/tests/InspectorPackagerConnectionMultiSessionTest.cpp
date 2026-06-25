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

/**
 * Tests for multi-session support in InspectorPackagerConnection.
 *
 * These tests verify that multiple debugger sessions can connect to
 * the same page simultaneously using session IDs.
 */

using namespace ::testing;
using namespace std::literals::chrono_literals;
using namespace std::literals::string_literals;
using folly::toJson;

namespace facebook::react::jsinspector_modern {

using InspectorPackagerConnectionMultiSessionTest =
    InspectorPackagerConnectionTest;

TEST_F(
    InspectorPackagerConnectionMultiSessionTest,
    TestReportsMultiDebuggerCapability) {
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();

  auto pageId = getInspectorInstance().addPage(
      "mock-description",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // getPages should report supportsMultipleDebuggers: true
  EXPECT_CALL(
      *webSockets_[0],
      send(JsonParsed(AllOf(
          AtJsonPtr("/event", Eq("getPages")),
          AtJsonPtr(
              "/payload",
              Contains(AllOf(
                  AtJsonPtr("/id", Eq(std::to_string(pageId))),
                  AtJsonPtr(
                      "/capabilities/supportsMultipleDebuggers",
                      Eq(true)))))))))
      .RetiresOnSaturation();
  webSockets_[0]->getDelegate().didReceiveMessage(R"({
      "event": "getPages"
    })");

  getInspectorInstance().removePage(pageId);
}

TEST_F(
    InspectorPackagerConnectionMultiSessionTest,
    TestMultipleSessionsConnectToSamePage) {
  auto mockCallsMustBeInSequence = std::make_optional<InSequence>();

  packagerConnection_->connect();

  auto pageId = getInspectorInstance().addPage(
      "mock-description",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect first session with sessionId
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0},
            "sessionId": "session-1"
          }}
        }})",
          toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[0]);

  // Connect second session with different sessionId
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0},
            "sessionId": "session-2"
          }}
        }})",
          toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[1]);

  // Both connections should still be active
  EXPECT_TRUE(localConnections_[0]);
  EXPECT_TRUE(localConnections_[1]);

  // The `disconnect` calls are not guaranteed to happen in order, so tear down
  // our InSequence guard before cleaning up.
  mockCallsMustBeInSequence.reset();
  EXPECT_CALL(*localConnections_[0], disconnect()).RetiresOnSaturation();
  EXPECT_CALL(*localConnections_[1], disconnect()).RetiresOnSaturation();
  getInspectorInstance().removePage(pageId);
}

TEST_F(
    InspectorPackagerConnectionMultiSessionTest,
    TestWrappedEventRoutedBySessionId) {
  auto mockCallsMustBeInSequence = std::make_optional<InSequence>();

  packagerConnection_->connect();

  auto pageId = getInspectorInstance().addPage(
      "mock-description",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect two sessions
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0},
            "sessionId": "session-1"
          }}
        }})",
          toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[0]);

  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0},
            "sessionId": "session-2"
          }}
        }})",
          toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[1]);

  // Send a message to session-1 only
  EXPECT_CALL(
      *localConnections_[0],
      sendMessage(JsonParsed(AtJsonPtr("/method", Eq("FakeDomain.method1")))))
      .RetiresOnSaturation();
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "wrappedEvent",
          "payload": {{
            "pageId": {0},
            "sessionId": "session-1",
            "wrappedEvent": {1}
          }}
        }})",
          toJson(std::to_string(pageId)),
          toJson(R"({"method": "FakeDomain.method1"})")));

  // Send a message to session-2 only
  EXPECT_CALL(
      *localConnections_[1],
      sendMessage(JsonParsed(AtJsonPtr("/method", Eq("FakeDomain.method2")))))
      .RetiresOnSaturation();
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "wrappedEvent",
          "payload": {{
            "pageId": {0},
            "sessionId": "session-2",
            "wrappedEvent": {1}
          }}
        }})",
          toJson(std::to_string(pageId)),
          toJson(R"({"method": "FakeDomain.method2"})")));

  // The `disconnect` calls are not guaranteed to happen in order, so tear down
  // our InSequence guard before cleaning up.
  mockCallsMustBeInSequence.reset();
  EXPECT_CALL(*localConnections_[0], disconnect()).RetiresOnSaturation();
  EXPECT_CALL(*localConnections_[1], disconnect()).RetiresOnSaturation();
  getInspectorInstance().removePage(pageId);
}

TEST_F(InspectorPackagerConnectionMultiSessionTest, TestDisconnectBySessionId) {
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();

  auto pageId = getInspectorInstance().addPage(
      "mock-description",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect two sessions
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0},
            "sessionId": "session-1"
          }}
        }})",
          toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[0]);

  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0},
            "sessionId": "session-2"
          }}
        }})",
          toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[1]);

  // Disconnect session-1 only
  EXPECT_CALL(*localConnections_[0], disconnect()).RetiresOnSaturation();
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "disconnect",
          "payload": {{
            "pageId": {0},
            "sessionId": "session-1"
          }}
        }})",
          toJson(std::to_string(pageId))));
  EXPECT_FALSE(localConnections_[0]);

  // Session-2 should still be active
  EXPECT_TRUE(localConnections_[1]);

  // Can still send messages to session-2
  EXPECT_CALL(
      *localConnections_[1],
      sendMessage(JsonParsed(AtJsonPtr("/method", Eq("FakeDomain.method")))))
      .RetiresOnSaturation();
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "wrappedEvent",
          "payload": {{
            "pageId": {0},
            "sessionId": "session-2",
            "wrappedEvent": {1}
          }}
        }})",
          toJson(std::to_string(pageId)),
          toJson(R"({"method": "FakeDomain.method"})")));

  // Clean up
  EXPECT_CALL(*localConnections_[1], disconnect()).RetiresOnSaturation();
  getInspectorInstance().removePage(pageId);
}

TEST_F(
    InspectorPackagerConnectionMultiSessionTest,
    TestOutgoingMessagesIncludeSessionId) {
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();

  auto pageId = getInspectorInstance().addPage(
      "mock-description",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect with a sessionId
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0},
            "sessionId": "my-session"
          }}
        }})",
          toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[0]);

  // When the local connection sends a message, it should include the sessionId
  EXPECT_CALL(
      *webSockets_[0],
      send(JsonParsed(AllOf(
          AtJsonPtr("/event", Eq("wrappedEvent")),
          AtJsonPtr("/payload/pageId", Eq(std::to_string(pageId))),
          AtJsonPtr("/payload/sessionId", Eq("my-session")),
          AtJsonPtr(
              "/payload/wrappedEvent",
              JsonParsed(AtJsonPtr("/method", Eq("FakeDomain.event"))))))))
      .RetiresOnSaturation();
  localConnections_[0]->getRemoteConnection().onMessage(
      R"({"method": "FakeDomain.event"})");

  // When the local connection disconnects, it should include the sessionId
  EXPECT_CALL(
      *webSockets_[0],
      send(JsonParsed(AllOf(
          AtJsonPtr("/event", Eq("disconnect")),
          AtJsonPtr("/payload/pageId", Eq(std::to_string(pageId))),
          AtJsonPtr("/payload/sessionId", Eq("my-session"))))))
      .RetiresOnSaturation();
  localConnections_[0]->getRemoteConnection().onDisconnect();

  EXPECT_CALL(*localConnections_[0], disconnect()).RetiresOnSaturation();
  getInspectorInstance().removePage(pageId);
}

TEST_F(
    InspectorPackagerConnectionTest,
    TestLegacyConnectionWithEmptySessionId) {
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();

  auto pageId = getInspectorInstance().addPage(
      "mock-description",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect without sessionId (legacy proxy). This is treated as an empty
  // string sessionId.
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

  // Incoming messages are routed correctly when sessionId is omitted
  EXPECT_CALL(
      *localConnections_[0],
      sendMessage(JsonParsed(AtJsonPtr("/method", Eq("FakeDomain.method")))))
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
          toJson(R"({"method": "FakeDomain.method"})")));

  // Outgoing messages include the empty string sessionId
  EXPECT_CALL(
      *webSockets_[0],
      send(JsonParsed(AllOf(
          AtJsonPtr("/event", Eq("wrappedEvent")),
          AtJsonPtr("/payload/pageId", Eq(std::to_string(pageId))),
          AtJsonPtr("/payload/sessionId", Eq("")),
          AtJsonPtr(
              "/payload/wrappedEvent",
              JsonParsed(AtJsonPtr("/method", Eq("FakeDomain.event"))))))))
      .RetiresOnSaturation();
  localConnections_[0]->getRemoteConnection().onMessage(
      R"({"method": "FakeDomain.event"})");

  // Disconnect when sessionId is omitted
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

TEST_F(
    InspectorPackagerConnectionTest,
    TestDuplicateSessionIdDisconnectsExisting) {
  // NOTE: See TestConnectWhileAlreadyConnectedCausesDisconnection for the
  // equivalent legacy (empty session ID) case.
  InSequence mockCallsMustBeInSequence;

  packagerConnection_->connect();

  auto pageId = getInspectorInstance().addPage(
      "mock-description",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect with sessionId
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0},
            "sessionId": "session-1"
          }}
        }})",
          toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[0]);

  // Try to connect again with the same sessionId - should disconnect existing
  EXPECT_CALL(*localConnections_[0], disconnect()).RetiresOnSaturation();
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
          "event": "connect",
          "payload": {{
            "pageId": {0},
            "sessionId": "session-1"
          }}
        }})",
          toJson(std::to_string(pageId))));

  // Original connection was disconnected, no new connection created
  EXPECT_FALSE(localConnections_[0]);
  EXPECT_EQ(localConnections_.objectsVended(), 1);
}

TEST_F(
    InspectorPackagerConnectionMultiSessionTest,
    TestPageRemovalDisconnectsAllSessions) {
  auto mockCallsMustBeInSequence = std::make_optional<InSequence>();

  packagerConnection_->connect();

  auto pageId = getInspectorInstance().addPage(
      "mock-description",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // Connect multiple sessions
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
            "event": "connect",
            "payload": {{
              "pageId": {0},
              "sessionId": "session-1"
            }}
          }})",
          toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[0]);

  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
            "event": "connect",
            "payload": {{
              "pageId": {0},
              "sessionId": "session-2"
            }}
          }})",
          toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[1]);

  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
            "event": "connect",
            "payload": {{
              "pageId": {0},
              "sessionId": "session-3"
            }}
          }})",
          toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[2]);

  // Remove the page - all sessions should be disconnected.
  // This is not guaranteed to be in order, so tear down our InSequence guard.
  mockCallsMustBeInSequence.reset();

  EXPECT_CALL(*localConnections_[0], disconnect());
  EXPECT_CALL(*localConnections_[1], disconnect());
  EXPECT_CALL(*localConnections_[2], disconnect());
  getInspectorInstance().removePage(pageId);

  EXPECT_FALSE(localConnections_[0]);
  EXPECT_FALSE(localConnections_[1]);
  EXPECT_FALSE(localConnections_[2]);
}

TEST_F(
    InspectorPackagerConnectionTest,
    TestLegacyConnectThenMultiSessionConnect) {
  // Tests the edge case where a peer starts in legacy mode (empty sessionId)
  // and later sends a connect with a non-empty sessionId.
  auto mockCallsMustBeInSequence = std::make_optional<InSequence>();

  packagerConnection_->connect();

  auto pageId = getInspectorInstance().addPage(
      "mock-description",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // First connect in legacy mode (no sessionId)
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

  // Second connect with a sessionId - this is a different session,
  // so both should coexist (legacy session uses empty string as key)
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
            "event": "connect",
            "payload": {{
              "pageId": {0},
              "sessionId": "session-1"
            }}
          }})",
          toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[1]);

  // Both connections should be active
  EXPECT_TRUE(localConnections_[0]);
  EXPECT_TRUE(localConnections_[1]);

  // Messages to the multi-session connection should work
  EXPECT_CALL(
      *localConnections_[1],
      sendMessage(JsonParsed(AtJsonPtr("/method", Eq("FakeDomain.method1")))))
      .RetiresOnSaturation();
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
            "event": "wrappedEvent",
            "payload": {{
              "pageId": {0},
              "sessionId": "session-1",
              "wrappedEvent": {1}
            }}
          }})",
          toJson(std::to_string(pageId)),
          toJson(R"({"method": "FakeDomain.method1"})")));

  // Messages to the legacy connection should also work
  EXPECT_CALL(
      *localConnections_[0],
      sendMessage(JsonParsed(AtJsonPtr("/method", Eq("FakeDomain.method2")))))
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
          toJson(R"({"method": "FakeDomain.method2"})")));

  // Remove the page - all sessions should be disconnected.
  // This is not guaranteed to be in order, so tear down our InSequence guard.
  mockCallsMustBeInSequence.reset();
  EXPECT_CALL(*localConnections_[0], disconnect()).RetiresOnSaturation();
  EXPECT_CALL(*localConnections_[1], disconnect()).RetiresOnSaturation();
  getInspectorInstance().removePage(pageId);
}

TEST_F(
    InspectorPackagerConnectionTest,
    TestMultiSessionConnectThenLegacyConnect) {
  // Tests the edge case where a peer starts in multi-session mode
  // and later sends a connect in legacy mode (empty sessionId).
  // When switching to legacy mode, all non-legacy sessions should be
  // disconnected first, as it implies the peer won't handle concurrent sessions
  // correctly.
  auto mockCallsMustBeInSequence = std::make_optional<InSequence>();

  packagerConnection_->connect();

  auto pageId = getInspectorInstance().addPage(
      "mock-description",
      "mock-vm",
      localConnections_
          .lazily_make_unique<std::unique_ptr<IRemoteConnection>>());

  // First connect with a sessionId (multi-session mode)
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
            "event": "connect",
            "payload": {{
              "pageId": {0},
              "sessionId": "session-1"
            }}
          }})",
          toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[0]);

  // Connect another multi-session connection
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
            "event": "connect",
            "payload": {{
              "pageId": {0},
              "sessionId": "session-2"
            }}
          }})",
          toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[1]);

  // Both connections should be active
  EXPECT_TRUE(localConnections_[0]);
  EXPECT_TRUE(localConnections_[1]);

  // When we switch to legacy mode, all non-legacy sessions should be
  // disconnected (not guaranteed to be in order)
  mockCallsMustBeInSequence.reset();
  EXPECT_CALL(*localConnections_[0], disconnect()).RetiresOnSaturation();
  EXPECT_CALL(*localConnections_[1], disconnect()).RetiresOnSaturation();
  mockCallsMustBeInSequence.emplace();

  // Now connect in legacy mode (no sessionId)
  webSockets_[0]->getDelegate().didReceiveMessage(
      fmt::format(
          R"({{
            "event": "connect",
            "payload": {{
              "pageId": {0}
            }}
          }})",
          toJson(std::to_string(pageId))));
  ASSERT_TRUE(localConnections_[2]);

  // Only the legacy connection should be active now
  EXPECT_FALSE(localConnections_[0]);
  EXPECT_FALSE(localConnections_[1]);
  EXPECT_TRUE(localConnections_[2]);

  // Messages to the legacy connection should work
  EXPECT_CALL(
      *localConnections_[2],
      sendMessage(JsonParsed(AtJsonPtr("/method", Eq("FakeDomain.method")))))
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
          toJson(R"({"method": "FakeDomain.method"})")));

  // Clean up
  EXPECT_CALL(*localConnections_[2], disconnect()).RetiresOnSaturation();
  getInspectorInstance().removePage(pageId);
}

} // namespace facebook::react::jsinspector_modern

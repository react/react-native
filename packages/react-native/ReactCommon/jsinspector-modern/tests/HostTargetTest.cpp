/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <folly/dynamic.h>
#include <folly/executors/QueuedImmediateExecutor.h>
#include <folly/json.h>
#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include <jsinspector-modern/HostTarget.h>
#include <jsinspector-modern/InspectorInterfaces.h>

#include <memory>

#include "FollyDynamicMatchers.h"
#include "InspectorMocks.h"
#include "UniquePtrFactory.h"
#include "utils/InspectorFlagOverridesGuard.h"

using namespace ::testing;

namespace facebook::react::jsinspector_modern {

namespace {

class HostTargetTest : public Test {
  folly::QueuedImmediateExecutor immediateExecutor_;
  InspectorFlagOverridesGuard inspectorFlagsGuard_{{}};

 protected:
  HostTargetTest() {
    EXPECT_CALL(runtimeTargetDelegate_, createAgentDelegate(_, _, _, _, _))
        .WillRepeatedly(runtimeAgentDelegates_.lazily_make_unique<
                        FrontendChannel,
                        SessionState&,
                        std::unique_ptr<RuntimeAgentDelegate::ExportedState>,
                        const ExecutionContextDescription&,
                        RuntimeExecutor>());
  }

  void connect() {
    ASSERT_FALSE(toPage_) << "Can only connect once in a HostTargetTest.";
    auto conn = makeConnection();
    toPage_ = std::move(conn.first);
  }

  std::pair<std::unique_ptr<ILocalConnection>, MockRemoteConnection&>
  makeConnection() {
    size_t connectionIndex = remoteConnections_.objectsVended();
    auto toPage = page_->connect(remoteConnections_.make_unique());

    // We'll always get an onDisconnect call when we tear
    // down the test. Expect it in order to satisfy the strict mock.
    EXPECT_CALL(*remoteConnections_[connectionIndex], onDisconnect());
    return {std::move(toPage), *remoteConnections_[connectionIndex]};
  }

  MockHostTargetDelegate hostTargetDelegate_;

  MockRemoteConnection& fromPage() {
    assert(toPage_);
    return *remoteConnections_[0];
  }

  VoidExecutor inspectorExecutor_ = [this](auto callback) {
    immediateExecutor_.add(callback);
  };

  std::shared_ptr<HostTarget> page_ =
      HostTarget::create(hostTargetDelegate_, inspectorExecutor_);

  MockInstanceTargetDelegate instanceTargetDelegate_;
  MockRuntimeTargetDelegate runtimeTargetDelegate_;
  // We don't have access to a jsi::Runtime in these tests, so just use an
  // executor that never runs the scheduled callbacks.
  RuntimeExecutor runtimeExecutor_ = [](auto) {};

  UniquePtrFactory<StrictMock<MockRuntimeAgentDelegate>> runtimeAgentDelegates_;

 private:
  UniquePtrFactory<StrictMock<MockRemoteConnection>> remoteConnections_;

 protected:
  // NOTE: Needs to be destroyed before page_.
  std::unique_ptr<ILocalConnection> toPage_;
};

/**
 * Simplified test harness focused on sending messages to and from a HostTarget.
 */
class HostTargetProtocolTest : public HostTargetTest {
 public:
  HostTargetProtocolTest() {
    connect();
  }

 private:
  // Protocol tests shouldn't manually call connect()
  using HostTargetTest::connect;
};

} // namespace

TEST_F(HostTargetProtocolTest, UnrecognizedMethod) {
  EXPECT_CALL(
      fromPage(),
      onMessage(JsonParsed(AllOf(
          AtJsonPtr("/error/code", Eq(-32601)), AtJsonPtr("/id", Eq(1))))))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "SomeUnrecognizedMethod",
                           "params": [1, 2]
                         })");
}

TEST_F(HostTargetProtocolTest, TypeErrorInMethodName) {
  EXPECT_CALL(
      fromPage(),
      onMessage(JsonParsed(AllOf(
          AtJsonPtr("/error/code", Eq(-32600)),
          AtJsonPtr("/id", Eq(nullptr))))))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": 42,
                           "params": [1, 2]
                         })");
}

TEST_F(HostTargetProtocolTest, MissingId) {
  EXPECT_CALL(
      fromPage(),
      onMessage(JsonParsed(AllOf(
          AtJsonPtr("/error/code", Eq(-32600)),
          AtJsonPtr("/id", Eq(nullptr))))))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "method": "SomeUnrecognizedMethod",
                           "params": [1, 2]
                         })");
}

TEST_F(HostTargetProtocolTest, MalformedJson) {
  EXPECT_CALL(
      fromPage(),
      onMessage(JsonParsed(AllOf(
          AtJsonPtr("/error/code", Eq(-32700)),
          AtJsonPtr("/id", Eq(nullptr))))))
      .RetiresOnSaturation();
  toPage_->sendMessage("{");
}

TEST_F(HostTargetProtocolTest, InjectLogsToIdentifyBackend) {
  InSequence s;

  EXPECT_CALL(
      fromPage(),
      onMessage(JsonParsed(AllOf(
          AtJsonPtr("/method", "Log.entryAdded"),
          AtJsonPtr("/params/entry", Not(IsEmpty()))))))
      .Times(AtLeast(1));
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 1,
                                               "result": {}
                                             })")))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Log.enable"
                         })");
}

TEST_F(HostTargetProtocolTest, PageReloadMethod) {
  InSequence s;

  EXPECT_CALL(
      hostTargetDelegate_,
      onReload(
          Eq(HostTargetDelegate::PageReloadRequest{
              .ignoreCache = std::nullopt,
              .scriptToEvaluateOnLoad = std::nullopt})))
      .RetiresOnSaturation();
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 1,
                                               "result": {}
                                             })")))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Page.reload"
                         })");

  EXPECT_CALL(
      hostTargetDelegate_,
      onReload(
          Eq(HostTargetDelegate::PageReloadRequest{
              .ignoreCache = true,
              .scriptToEvaluateOnLoad = "alert('hello');"})))
      .RetiresOnSaturation();
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 2,
                                               "result": {}
                                             })")))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 2,
                           "method": "Page.reload",
                           "params": {
                             "ignoreCache": true,
                             "scriptToEvaluateOnLoad": "alert('hello');"
                           }
                         })");
}

TEST_F(HostTargetProtocolTest, PageAddAndRemoveScriptToEvaluateOnNewDocument) {
  InSequence s;

  // The first registered script gets identifier "1".
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 1,
                                               "result": {"identifier": "1"}
                                             })")))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Page.addScriptToEvaluateOnNewDocument",
                           "params": {"source": "globalThis.__a = 1;"}
                         })");

  // The second registration gets a distinct, monotonically increasing id "2".
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 2,
                                               "result": {"identifier": "2"}
                                             })")))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 2,
                           "method": "Page.addScriptToEvaluateOnNewDocument",
                           "params": {"source": "globalThis.__b = 2;"}
                         })");

  // Removing a registered script succeeds with an empty result.
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 3,
                                               "result": {}
                                             })")))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 3,
                           "method": "Page.removeScriptToEvaluateOnNewDocument",
                           "params": {"identifier": "1"}
                         })");

  // Removing an unknown identifier is a lenient no-op that still succeeds
  // (matching Chrome's behaviour).
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 4,
                                               "result": {}
                                             })")))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 4,
                           "method": "Page.removeScriptToEvaluateOnNewDocument",
                           "params": {"identifier": "999"}
                         })");
}

TEST_F(HostTargetProtocolTest, OverlaySetPausedInDebuggerMessageMethod) {
  InSequence s;

  EXPECT_CALL(
      hostTargetDelegate_,
      onSetPausedInDebuggerMessage(
          Eq(HostTargetDelegate::OverlaySetPausedInDebuggerMessageRequest{
              .message = std::nullopt})))
      .RetiresOnSaturation();
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 1,
                                               "result": {}
                                             })")))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Overlay.setPausedInDebuggerMessage"
                         })");

  EXPECT_CALL(
      hostTargetDelegate_,
      onSetPausedInDebuggerMessage(
          Eq(HostTargetDelegate::OverlaySetPausedInDebuggerMessageRequest{
              .message = "Paused in debugger"})))
      .RetiresOnSaturation();
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 2,
                                               "result": {}
                                             })")))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 2,
                           "method": "Overlay.setPausedInDebuggerMessage",
                           "params": {
                             "message": "Paused in debugger"
                           }
                         })");

  // A cleanup message is sent automatically when we destroy the session.
  EXPECT_CALL(
      hostTargetDelegate_,
      onSetPausedInDebuggerMessage(
          Eq(HostTargetDelegate::OverlaySetPausedInDebuggerMessageRequest{
              .message = std::nullopt})))
      .RetiresOnSaturation();
}

TEST_F(HostTargetProtocolTest, OverlaySetPausedInDebuggerMultipleClients) {
  auto [toPage2, fromPage2] = makeConnection();

  InSequence s;

  EXPECT_CALL(
      hostTargetDelegate_,
      onSetPausedInDebuggerMessage(
          Eq(HostTargetDelegate::OverlaySetPausedInDebuggerMessageRequest{
              .message = "Paused in debugger - client 1"})))
      .RetiresOnSaturation();
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 1,
                                               "result": {}
                                             })")))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Overlay.setPausedInDebuggerMessage",
                           "params": {
                             "message": "Paused in debugger - client 1"
                           }
                         })");

  EXPECT_CALL(
      hostTargetDelegate_,
      onSetPausedInDebuggerMessage(
          Eq(HostTargetDelegate::OverlaySetPausedInDebuggerMessageRequest{
              .message = "Paused in debugger - client 2"})))
      .RetiresOnSaturation();
  EXPECT_CALL(fromPage2, onMessage(JsonEq(R"({
                                               "id": 1,
                                               "result": {}
                                             })")))
      .RetiresOnSaturation();
  toPage2->sendMessage(R"({
                           "id": 1,
                           "method": "Overlay.setPausedInDebuggerMessage",
                           "params": {
                             "message": "Paused in debugger - client 2"
                           }
                         })");

  toPage2.reset();

  // The cleanup message is sent exactly once.
  EXPECT_CALL(
      hostTargetDelegate_,
      onSetPausedInDebuggerMessage(
          Eq(HostTargetDelegate::OverlaySetPausedInDebuggerMessageRequest{
              .message = std::nullopt})))
      .Times(1)
      .RetiresOnSaturation();
}

TEST_F(HostTargetProtocolTest, RegisterUnregisterInstanceWithoutEvents) {
  auto& instanceTarget = page_->registerInstance(instanceTargetDelegate_);

  page_->unregisterInstance(instanceTarget);
}

TEST_F(HostTargetTest, ConnectToAlreadyRegisteredInstanceWithoutEvents) {
  auto& instanceTarget = page_->registerInstance(instanceTargetDelegate_);

  connect();

  page_->unregisterInstance(instanceTarget);
}

TEST_F(HostTargetProtocolTest, RegisterUnregisterInstanceWithEvents) {
  InSequence s;

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 1,
                                               "result": {}
                                             })")));
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Runtime.enable"
                         })");

  auto& instanceTarget = page_->registerInstance(instanceTargetDelegate_);

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "method": "Runtime.executionContextsCleared"
                                             })")));
  page_->unregisterInstance(instanceTarget);
}

TEST_F(HostTargetTest, ConnectToAlreadyRegisteredInstanceWithEvents) {
  auto& instanceTarget = page_->registerInstance(instanceTargetDelegate_);

  connect();

  InSequence s;

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 1,
                                               "result": {}
                                             })")));

  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Runtime.enable"
                         })");

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "method": "Runtime.executionContextsCleared"
                                             })")));
  page_->unregisterInstance(instanceTarget);
}

TEST_F(HostTargetTest, ConnectToAlreadyRegisteredRuntimeWithEvents) {
  auto& instanceTarget = page_->registerInstance(instanceTargetDelegate_);
  auto& runtimeTarget =
      instanceTarget.registerRuntime(runtimeTargetDelegate_, runtimeExecutor_);

  connect();

  InSequence s;

  ASSERT_TRUE(runtimeAgentDelegates_[0]);
  EXPECT_CALL(*runtimeAgentDelegates_[0], handleRequest(_))
      .WillOnce(Return(true))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "CustomRuntimeDomain.Foo",
                           "params": {
                             "expression": "42"
                           }
                         })");

  static constexpr auto kFooResponse = R"({
    "id": 1,
    "result": {
      "fooValue": 42
    }
  })";
  EXPECT_CALL(fromPage(), onMessage(JsonEq(kFooResponse)))
      .RetiresOnSaturation();
  runtimeAgentDelegates_[0]->frontendChannel(kFooResponse);

  instanceTarget.unregisterRuntime(runtimeTarget);
  page_->unregisterInstance(instanceTarget);
}

TEST_F(HostTargetProtocolTest, RuntimeAgentDelegateLifecycle) {
  {
    auto& instanceTarget = page_->registerInstance(instanceTargetDelegate_);
    auto& runtimeTarget = instanceTarget.registerRuntime(
        runtimeTargetDelegate_, runtimeExecutor_);

    EXPECT_TRUE(runtimeAgentDelegates_[0]);

    instanceTarget.unregisterRuntime(runtimeTarget);
    page_->unregisterInstance(instanceTarget);
  }

  EXPECT_FALSE(runtimeAgentDelegates_[0]);

  {
    auto& instanceTarget = page_->registerInstance(instanceTargetDelegate_);
    auto& runtimeTarget = instanceTarget.registerRuntime(
        runtimeTargetDelegate_, runtimeExecutor_);

    EXPECT_TRUE(runtimeAgentDelegates_[1]);

    instanceTarget.unregisterRuntime(runtimeTarget);
    page_->unregisterInstance(instanceTarget);
  }

  EXPECT_FALSE(runtimeAgentDelegates_[1]);
}

TEST_F(HostTargetProtocolTest, MethodNotHandledByRuntimeAgentDelegate) {
  InSequence s;

  auto& instanceTarget = page_->registerInstance(instanceTargetDelegate_);
  auto& runtimeTarget =
      instanceTarget.registerRuntime(runtimeTargetDelegate_, runtimeExecutor_);

  ASSERT_TRUE(runtimeAgentDelegates_[0]);
  EXPECT_CALL(*runtimeAgentDelegates_[0], handleRequest(_))
      .WillOnce(Return(false))
      .RetiresOnSaturation();
  EXPECT_CALL(
      fromPage(), onMessage(JsonParsed(AtJsonPtr("/error/code", Eq(-32601)))))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "CustomRuntimeDomain.Foo",
                           "params": {
                             "expression": "42"
                           }
                         })");

  instanceTarget.unregisterRuntime(runtimeTarget);
  page_->unregisterInstance(instanceTarget);
}

TEST_F(HostTargetProtocolTest, MethodHandledByRuntimeAgentDelegate) {
  InSequence s;

  auto& instanceTarget = page_->registerInstance(instanceTargetDelegate_);
  auto& runtimeTarget =
      instanceTarget.registerRuntime(runtimeTargetDelegate_, runtimeExecutor_);

  ASSERT_TRUE(runtimeAgentDelegates_[0]);
  EXPECT_CALL(*runtimeAgentDelegates_[0], handleRequest(_))
      .WillOnce(Return(true))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "CustomRuntimeDomain.Foo",
                           "params": {
                             "expression": "42"
                           }
                         })");

  static constexpr auto kFooResponse = R"({
    "id": 1,
    "result": {
      "fooValue": 42
    }
  })";
  EXPECT_CALL(fromPage(), onMessage(JsonEq(kFooResponse)))
      .RetiresOnSaturation();
  runtimeAgentDelegates_[0]->frontendChannel(kFooResponse);

  instanceTarget.unregisterRuntime(runtimeTarget);
  page_->unregisterInstance(instanceTarget);
}

TEST_F(HostTargetProtocolTest, MessageRoutingWhileNoRuntimeAgentDelegate) {
  InSequence s;

  EXPECT_CALL(
      fromPage(), onMessage(JsonParsed(AtJsonPtr("/error/code", Eq(-32601)))))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "CustomRuntimeDomain.Foo",
                           "params": {
                             "expression": "42"
                           }
                         })");

  auto& instanceTarget = page_->registerInstance(instanceTargetDelegate_);
  auto& runtimeTarget =
      instanceTarget.registerRuntime(runtimeTargetDelegate_, runtimeExecutor_);

  ASSERT_TRUE(runtimeAgentDelegates_[0]);
  EXPECT_CALL(*runtimeAgentDelegates_[0], handleRequest(_))
      .WillOnce(Return(true))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 2,
                           "method": "CustomRuntimeDomain.Foo",
                           "params": {
                             "expression": "42"
                           }
                         })");

  static constexpr auto kFooResponse = R"({
    "id": 2,
    "result": {
      "fooValue": 42
    }
  })";
  EXPECT_CALL(fromPage(), onMessage(JsonEq(kFooResponse)))
      .RetiresOnSaturation();
  runtimeAgentDelegates_[0]->frontendChannel(kFooResponse);

  instanceTarget.unregisterRuntime(runtimeTarget);
  page_->unregisterInstance(instanceTarget);

  EXPECT_FALSE(runtimeAgentDelegates_[0]);

  EXPECT_CALL(
      fromPage(), onMessage(JsonParsed(AtJsonPtr("/error/code", Eq(-32601)))))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 3,
                           "method": "CustomRuntimeDomain.Foo",
                           "params": {
                             "expression": "42"
                           }
                         })");
}

TEST_F(HostTargetProtocolTest, InstanceWithNullRuntimeAgentDelegate) {
  InSequence s;

  EXPECT_CALL(runtimeTargetDelegate_, createAgentDelegate(_, _, _, _, _))
      .WillRepeatedly(ReturnNull());

  auto& instanceTarget = page_->registerInstance(instanceTargetDelegate_);
  auto& runtimeTarget =
      instanceTarget.registerRuntime(runtimeTargetDelegate_, runtimeExecutor_);

  EXPECT_FALSE(runtimeAgentDelegates_[0]);

  EXPECT_CALL(
      fromPage(), onMessage(JsonParsed(AtJsonPtr("/error/code", Eq(-32601)))))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "CustomRuntimeDomain.Foo",
                           "params": {
                             "expression": "42"
                           }
                         })");

  instanceTarget.unregisterRuntime(runtimeTarget);
  page_->unregisterInstance(instanceTarget);
}

TEST_F(HostTargetProtocolTest, RuntimeAgentDelegateHasAccessToSessionState) {
  // Ignore console messages originating inside the backend.
  EXPECT_CALL(
      fromPage(),
      onMessage(JsonParsed(AllOf(
          AtJsonPtr("/method", "Runtime.consoleAPICalled"),
          AtJsonPtr("/params/context", "main#InstanceAgent")))))
      .Times(AnyNumber());

  InSequence s;

  // Send Runtime.enable before registering the Instance (which in turns creates
  // the RuntimeAgentDelegate).
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 1,
                                               "result": {}
                                             })")))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Runtime.enable"
                         })");

  auto& instanceTarget = page_->registerInstance(instanceTargetDelegate_);

  EXPECT_CALL(
      fromPage(),
      onMessage(
          JsonParsed(AtJsonPtr("/method", "Runtime.executionContextCreated"))))
      .RetiresOnSaturation();
  instanceTarget.registerRuntime(runtimeTargetDelegate_, runtimeExecutor_);
  ASSERT_TRUE(runtimeAgentDelegates_[0]);

  EXPECT_TRUE(runtimeAgentDelegates_[0]->sessionState.isRuntimeDomainEnabled);

  // Send Runtime.disable while the RuntimeAgentDelegate exists - it receives
  // the message and can also observe the updated state.
  EXPECT_CALL(*runtimeAgentDelegates_[0], handleRequest(Eq(cdp::preparse(R"({
                                                                    "id": 2,
                                                                    "method": "Runtime.disable"
                                                                  })"))));
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 2,
                                               "result": {}
                                             })")));
  toPage_->sendMessage(R"({
                           "id": 2,
                           "method": "Runtime.disable"
                         })");

  EXPECT_FALSE(runtimeAgentDelegates_[0]->sessionState.isRuntimeDomainEnabled);
}

TEST_F(HostTargetTest, HostCommands) {
  // Set up expectations for the RuntimeAgentDelegate that will be created
  // as part of the private session inside HostCommandSender.
  EXPECT_CALL(runtimeTargetDelegate_, createAgentDelegate(_, _, _, _, _))
      .WillOnce([this](
                    FrontendChannel frontendChannel,
                    SessionState& sessionState,
                    std::unique_ptr<RuntimeAgentDelegate::ExportedState>
                        exportedState,
                    const ExecutionContextDescription& context,
                    const RuntimeExecutor& runtimeExecutor) {
        auto delegate = runtimeAgentDelegates_.make_unique(
            std::move(frontendChannel),
            sessionState,
            std::move(exportedState),
            context,
            std::move(runtimeExecutor));
        InSequence s;
        EXPECT_CALL(
            *delegate,
            handleRequest(
                Field(&cdp::PreparsedRequest::method, "Debugger.resume")))
            .WillOnce(Return(false))
            .RetiresOnSaturation();
        EXPECT_CALL(
            *delegate,
            handleRequest(
                Field(&cdp::PreparsedRequest::method, "Debugger.stepOver")))
            .WillOnce(Return(false))
            .RetiresOnSaturation();
        return delegate;
      })
      .RetiresOnSaturation();

  // No RuntimeAgent yet; this command is simply ignored.
  page_->sendCommand(HostCommand::DebuggerStepOver);
  EXPECT_FALSE(runtimeAgentDelegates_[0]);

  auto& instanceTarget = page_->registerInstance(instanceTargetDelegate_);
  auto& runtimeTarget =
      instanceTarget.registerRuntime(runtimeTargetDelegate_, runtimeExecutor_);

  page_->sendCommand(HostCommand::DebuggerResume);
  page_->sendCommand(HostCommand::DebuggerStepOver);
  ASSERT_TRUE(runtimeAgentDelegates_[0]);

  connect();

  // This is part of the HostCommandSender session.
  ASSERT_TRUE(runtimeAgentDelegates_[0]);
  // This is part of the session we just connect()ed to above.
  EXPECT_TRUE(runtimeAgentDelegates_[1]);
  // We can still send commands.
  EXPECT_CALL(
      *runtimeAgentDelegates_[0],
      handleRequest(Field(&cdp::PreparsedRequest::method, "Debugger.stepOver")))
      .WillOnce(Return(false))
      .RetiresOnSaturation();
  page_->sendCommand(HostCommand::DebuggerStepOver);

  // NOTE: Our use of StrictMock ensures that the session doesn't receive any
  // noise resulting from the sendCommand call ( = no
  // runtimeAgentDelegates_[1]->handleRequest, no fromPage()->onMessage, etc).

  instanceTarget.unregisterRuntime(runtimeTarget);
  page_->unregisterInstance(instanceTarget);
}

TEST_F(HostTargetTest, NetworkLoadNetworkResourceSuccess) {
  connect();

  InSequence s;

  ScopedExecutor<NetworkRequestListener> executor;
  EXPECT_CALL(
      hostTargetDelegate_,
      loadNetworkResource(
          Field(&LoadNetworkResourceRequest::url, "http://example.com"), _))
      .Times(1)
      .WillOnce([&executor](
                    const LoadNetworkResourceRequest& /*params*/,
                    ScopedExecutor<NetworkRequestListener> executorArg) {
        // Capture the ScopedExecutor<NetworkRequestListener> to use later.
        executor = std::move(executorArg);
      })
      .RetiresOnSaturation();

  // Load the resource, expect a CDP response as soon as headers are received.
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Network.loadNetworkResource",
                           "params": {
                             "url": "http://example.com"
                            }
                         })");

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                            "id": 1,
                                            "result": {
                                              "resource": {
                                                "success": true,
                                                "stream": "0",
                                                "httpStatusCode": 200,
                                                "headers": {
                                                  "x-test": "foo",
                                                  "Content-Type": "text/plain"
                                                }
                                              }
                                            }
                                          })")));

  executor([](NetworkRequestListener& listener) {
    listener.onHeaders(
        200, Headers{{"x-test", "foo"}, {"Content-Type", "text/plain"}});
  });

  // Retrieve the first chunk of data.
  toPage_->sendMessage(R"({
                          "id": 2,
                          "method": "IO.read",
                          "params": {
                            "handle": "0",
                            "size": 8
                          }
                        })");

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                            "id": 2,
                                            "result": {
                                              "data": "Hello, W",
                                              "eof": false,
                                              "base64Encoded": false
                                            }
                                          })")));

  executor([](NetworkRequestListener& listener) {
    listener.onData("Hello, World!");
  });

  // Retrieve the remaining data.
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                            "id": 3,
                                            "result": {
                                              "data": "orld!",
                                              "eof": false,
                                              "base64Encoded": false
                                            }
                                          })")));
  toPage_->sendMessage(R"({
                          "id": 3,
                          "method": "IO.read",
                          "params": {
                            "handle": "0",
                            "size": 8
                          }
                        })");

  // No more data - expect empty payload with eof: true.
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                            "id": 4,
                                            "result": {
                                              "data": "",
                                              "eof": true,
                                              "base64Encoded": false
                                            }
                                          })")));
  toPage_->sendMessage(R"({
                          "id": 4,
                          "method": "IO.read",
                          "params": {
                            "handle": "0",
                            "size": 8
                          }
                        })");

  executor([](NetworkRequestListener& listener) { listener.onCompletion(); });

  // Close the stream.
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                            "id": 5,
                                            "result": {}
                                          })")));
  toPage_->sendMessage(R"({
                          "id": 5,
                          "method": "IO.close",
                          "params": {
                            "handle": "0"
                          }
                        })");
}

TEST_F(HostTargetTest, NetworkLoadNetworkResourceBinaryData) {
  connect();

  InSequence s;

  ScopedExecutor<NetworkRequestListener> executor;
  EXPECT_CALL(
      hostTargetDelegate_,
      loadNetworkResource(
          Field(&LoadNetworkResourceRequest::url, "http://example.com"), _))
      .Times(1)
      .WillOnce([&executor](
                    const LoadNetworkResourceRequest& /*params*/,
                    ScopedExecutor<NetworkRequestListener> executorArg) {
        // Capture the ScopedExecutor<NetworkRequestListener> to use later.
        executor = std::move(executorArg);
      })
      .RetiresOnSaturation();

  // Load the resource, expect a CDP response as soon as headers are received.
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Network.loadNetworkResource",
                           "params": {
                             "url": "http://example.com"
                            }
                         })");

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                            "id": 1,
                                            "result": {
                                              "resource": {
                                                "success": true,
                                                "stream": "0",
                                                "httpStatusCode": 200,
                                                "headers": {
                                                  "Content-Type": "application/octet-stream"
                                                }
                                              }
                                            }
                                          })")));

  executor([](NetworkRequestListener& listener) {
    // Arbitrary binary data.
    listener.onHeaders(
        200, Headers{{"Content-Type", "application/octet-stream"}});
  });

  // Retrieve the first chunk of data.
  toPage_->sendMessage(R"({
                          "id": 2,
                          "method": "IO.read",
                          "params": {
                            "handle": "0",
                            "size": 4
                          }
                        })");

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                            "id": 2,
                                            "result": {
                                              "data": "3q2+7w==",
                                              "eof": false,
                                              "base64Encoded": true
                                            }
                                          })")));

  executor([](NetworkRequestListener& listener) {
    std::array<char, 8> binaryData = {
        '\xDE',
        '\xAD',
        '\xBE',
        '\xEF',
        '\x00',
        '\x11',
        '\x22',
        '\x33',
    };
    listener.onData(std::string_view(binaryData.data(), binaryData.size()));
  });

  // Retrieve the remaining data.
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                            "id": 3,
                                            "result": {
                                              "data": "ABEiMw==",
                                              "eof": false,
                                              "base64Encoded": true
                                            }
                                          })")));
  toPage_->sendMessage(R"({
                          "id": 3,
                          "method": "IO.read",
                          "params": {
                            "handle": "0",
                            "size": 4
                          }
                        })");

  // No more data - expect empty payload with eof: true.
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                            "id": 4,
                                            "result": {
                                              "data": "",
                                              "eof": true,
                                              "base64Encoded": true
                                            }
                                          })")));
  toPage_->sendMessage(R"({
                          "id": 4,
                          "method": "IO.read",
                          "params": {
                            "handle": "0",
                            "size": 8
                          }
                        })");

  executor([](NetworkRequestListener& listener) { listener.onCompletion(); });

  // Close the stream.
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                            "id": 5,
                                            "result": {}
                                          })")));
  toPage_->sendMessage(R"({
                          "id": 5,
                          "method": "IO.close",
                          "params": {
                            "handle": "0"
                          }
                        })");
}

TEST_F(HostTargetTest, NetworkLoadNetworkResourceMimeIsTextContentIsNot) {
  connect();

  InSequence s;

  ScopedExecutor<NetworkRequestListener> executor;
  EXPECT_CALL(
      hostTargetDelegate_,
      loadNetworkResource(
          Field(&LoadNetworkResourceRequest::url, "http://example.com"), _))
      .Times(1)
      .WillOnce([&executor](
                    const LoadNetworkResourceRequest& /*params*/,
                    ScopedExecutor<NetworkRequestListener> executorArg) {
        // Capture the ScopedExecutor<NetworkRequestListener> to use later.
        executor = std::move(executorArg);
      })
      .RetiresOnSaturation();

  // Load the resource, expect a CDP response as soon as headers are received.
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Network.loadNetworkResource",
                           "params": {
                             "url": "http://example.com"
                            }
                         })");

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                            "id": 1,
                                            "result": {
                                              "resource": {
                                                "success": true,
                                                "stream": "0",
                                                "httpStatusCode": 200,
                                                "headers": {
                                                  "Content-Type": "text/plain"
                                                }
                                              }
                                            }
                                          })")));

  executor([](NetworkRequestListener& listener) {
    // Claim text/plain...
    listener.onHeaders(200, Headers{{"Content-Type", "text/plain"}});
  });

  // Retrieve the first chunk of data.
  toPage_->sendMessage(R"({
                          "id": 2,
                          "method": "IO.read",
                          "params": {
                            "handle": "0",
                            "size": 4
                          }
                        })");

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                            "id": 2,
                                            "error": {
                                              "message": "Invalid UTF-8 sequence",
                                              "code": -32603
                                            }
                                          })")));

  executor([](NetworkRequestListener& listener) {
    std::array<char, 4> binaryData = {
        '\x80',
        '\x80',
        '\x80',
        '\x80',
    };
    // Actually emit binary that cannot be represented as UTF-8.
    listener.onData(std::string_view(binaryData.data(), binaryData.size()));
  });
}

TEST_F(HostTargetTest, NetworkLoadNetworkResourceStreamInterrupted) {
  connect();

  InSequence s;

  ScopedExecutor<NetworkRequestListener> executor;
  EXPECT_CALL(
      hostTargetDelegate_,
      loadNetworkResource(
          Field(&LoadNetworkResourceRequest::url, "http://example.com"), _))
      .Times(1)
      .WillOnce([&executor](
                    const LoadNetworkResourceRequest& /*params*/,
                    ScopedExecutor<NetworkRequestListener> executorArg) {
        // Capture the ScopedExecutor<NetworkRequestListener> to use later.
        executor = std::move(executorArg);
      })
      .RetiresOnSaturation();

  // Load the resource, receiving headers successfully.
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Network.loadNetworkResource",
                           "params": {
                             "url": "http://example.com"
                            }
                         })");

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
    "id": 1,
    "result": {
      "resource": {
        "success": true,
        "stream": "0",
        "httpStatusCode": 200,
        "headers": {
          "x-test": "foo"
        }
      }
    }
  })")));

  executor([](NetworkRequestListener& listener) {
    listener.onHeaders(200, Headers{{"x-test", "foo"}});
  });

  // Retrieve the first chunk of data.
  toPage_->sendMessage(R"({
                          "id": 2,
                          "method": "IO.read",
                          "params": {
                            "handle": "0",
                            "size": 20
                          }
                        })");

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
    "id": 2,
    "result": {
      "data": "VGhlIG1lYW5pbmcgb2YgbGlmZSA=",
      "eof": false,
      "base64Encoded": true
    }
  })")));
  executor([](NetworkRequestListener& listener) {
    listener.onData("The meaning of life is...");
  });

  // Simulate an error mid-stream, expect in-flight IO.reads to return a CDP
  // error.
  toPage_->sendMessage(R"({
                          "id": 3,
                          "method": "IO.read",
                          "params": {
                            "handle": "0",
                            "size": 20
                          }
                        })");

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
    "id": 3,
    "error": {
      "code": -32603,
      "message": "Connection lost"
    }
  })")));
  executor([](NetworkRequestListener& listener) {
    listener.onError("Connection lost");
  });

  // IO.close should be a successful no-op after an error.
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
    "id": 4,
    "result": {}
  })")));
  toPage_->sendMessage(R"({
                          "id": 4,
                          "method": "IO.close",
                          "params": {
                            "handle": "0"
                          }
                        })");
}

TEST_F(HostTargetTest, NetworkLoadNetworkResource404) {
  connect();

  InSequence s;

  ScopedExecutor<NetworkRequestListener> executor;
  EXPECT_CALL(
      hostTargetDelegate_,
      loadNetworkResource(
          Field(&LoadNetworkResourceRequest::url, "http://example.com/404"), _))
      .Times(1)
      .WillOnce([&executor](
                    const LoadNetworkResourceRequest& /*params*/,
                    ScopedExecutor<NetworkRequestListener> executorArg) {
        // Capture the ScopedExecutor<NetworkRequestListener> to use later.
        executor = std::move(executorArg);
      })
      .RetiresOnSaturation();

  // A 404 response should trigger a CDP result with success: false, including
  // the status code, headers, but *no* stream handle.
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                            "id": 1,
                                            "result": {
                                              "resource": {
                                                "success": false,
                                                "httpStatusCode": 404,
                                                "headers": {
                                                  "x-test": "foo"
                                                }
                                              }
                                            }
                                          })")));

  toPage_->sendMessage(R"({
                        "id": 1,
                        "method": "Network.loadNetworkResource",
                        "params": {
                          "url": "http://example.com/404"
                        }
                      })");

  executor([](NetworkRequestListener& listener) {
    listener.onHeaders(404, Headers{{"x-test", "foo"}});
  });

  // Assuming a successful request would have assigned handle "0", verify that
  // handle has *not* been assigned.
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                            "id": 2,
                                            "error": {
                                              "code": -32603,
                                              "message": "Stream not found with handle 0"
                                            }
                                          })")));

  toPage_->sendMessage(R"({
                          "id": 2,
                          "method": "IO.read",
                          "params": {
                            "handle": "0",
                            "size": 20
                          }
                        })");
}

TEST_F(HostTargetTest, NetworkLoadNetworkResourceInitialNetError) {
  connect();

  InSequence s;

  ScopedExecutor<NetworkRequestListener> executor;
  EXPECT_CALL(
      hostTargetDelegate_,
      loadNetworkResource(
          Field(&LoadNetworkResourceRequest::url, "http://baddomain.com"), _))
      .Times(1)
      .WillOnce([&executor](
                    const LoadNetworkResourceRequest& /*params*/,
                    ScopedExecutor<NetworkRequestListener> executorArg) {
        // Capture the ScopedExecutor<NetworkRequestListener> to use later.
        executor = std::move(executorArg);
      })
      .RetiresOnSaturation();

  // Load the resource, expect a CDP resonse with no headers or status code,
  // but with success: false and a netErrorName
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Network.loadNetworkResource",
                           "params": {
                             "url": "http://baddomain.com"
                            }
                         })");

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                            "id": 1,
                                            "result": {
                                              "resource": {
                                                "success": false,
                                                "netErrorName": "Arbitrary error string"
                                              }
                                            }
                                          })")));

  executor([](NetworkRequestListener& listener) {
    listener.onError("Arbitrary error string");
  });
}

TEST_F(HostTargetTest, NetworkLoadNetworkResourceStreamClosed) {
  connect();

  InSequence s;

  ScopedExecutor<NetworkRequestListener> executor;
  EXPECT_CALL(
      hostTargetDelegate_,
      loadNetworkResource(
          Field(&LoadNetworkResourceRequest::url, "http://example.com"), _))
      .Times(1)
      .WillOnce([&executor](
                    const LoadNetworkResourceRequest& /*params*/,
                    ScopedExecutor<NetworkRequestListener> executorArg) {
        // Capture the ScopedExecutor<NetworkRequestListener> to use later.
        executor = std::move(executorArg);
      })
      .RetiresOnSaturation();

  // Load the resource, receiving headers successfully.
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Network.loadNetworkResource",
                           "params": {
                             "url": "http://example.com"
                            }
                         })");

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
    "id": 1,
    "result": {
      "resource": {
        "success": true,
        "stream": "0",
        "httpStatusCode": 200,
        "headers": {
          "content-type": "text/plain"
        }
      }
    }
  })")));

  bool cancelFunctionCalled = false;
  executor([&cancelFunctionCalled](NetworkRequestListener& listener) {
    listener.setCancelFunction(
        [&cancelFunctionCalled]() { cancelFunctionCalled = true; });

    listener.onHeaders(200, Headers{{"content-type", "text/plain"}});
  });

  // Retrieve the first chunk of data.
  toPage_->sendMessage(R"({
                          "id": 2,
                          "method": "IO.read",
                          "params": {
                            "handle": "0",
                            "size": 22
                          }
                        })");

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
    "id": 2,
    "result": {
      "data": "The meaning of life is",
      "eof": false,
      "base64Encoded": false
    }
  })")));
  executor([](NetworkRequestListener& listener) {
    listener.onData("The meaning of life is...");
  });

  EXPECT_FALSE(cancelFunctionCalled);

  // Simulate the client closing the stream while data is still incoming.

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                            "id": 3,
                                            "result": {}
                                          })")));

  toPage_->sendMessage(R"({
                          "id": 3,
                          "method": "IO.close",
                          "params": {
                            "handle": "0"
                          }
                        })");

  EXPECT_TRUE(cancelFunctionCalled);
}

TEST_F(HostTargetTest, NetworkLoadNetworkResourceAgentDisconnect) {
  connect();

  InSequence s;

  ScopedExecutor<NetworkRequestListener> executor;
  EXPECT_CALL(hostTargetDelegate_, loadNetworkResource(_, _))
      .Times(1)
      .WillOnce([&executor](
                    const LoadNetworkResourceRequest& /*params*/,
                    ScopedExecutor<NetworkRequestListener> executorArg) {
        // Capture the ScopedExecutor<NetworkRequestListener> to use later.
        executor = std::move(executorArg);
      })
      .RetiresOnSaturation();

  // Load the resource, receiving headers successfully.
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Network.loadNetworkResource",
                           "params": {
                             "url": "http://example.com"
                            }
                         })");

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
    "id": 1,
    "result": {
      "resource": {
        "success": true,
        "stream": "0",
        "httpStatusCode": 200,
        "headers": {
          "x-test": "foo"
        }
      }
    }
  })")));

  bool cancelFunctionCalled = false;
  executor([&cancelFunctionCalled](NetworkRequestListener& listener) {
    listener.setCancelFunction(
        [&cancelFunctionCalled]() { cancelFunctionCalled = true; });

    listener.onHeaders(200, Headers{{"x-test", "foo"}});
  });

  EXPECT_FALSE(cancelFunctionCalled);

  // Simulate the frontend disconnecting while data is still incoming.
  toPage_->disconnect();

  // Expect the destruction of the agent to notify the platform implementation
  // that it may cancel any download.
  EXPECT_TRUE(cancelFunctionCalled);

  // The host may still hold a scoped executor, but our listener has now been
  // destroyed because it was owned by the (disconnected) agent, so we expect
  // a late executor call to be a) safe and b) never execute.
  bool callbackCalledAfterDisconnect = false;
  executor(
      [&callbackCalledAfterDisconnect](NetworkRequestListener& /*listener*/) {
        callbackCalledAfterDisconnect = true;
      });
  EXPECT_FALSE(callbackCalledAfterDisconnect);
}

TEST_F(HostTargetTest, NetworkLoadNetworkResourceNotImplementedByDelegate) {
  connect();

  InSequence s;

  EXPECT_CALL(
      hostTargetDelegate_,
      loadNetworkResource(
          Field(&LoadNetworkResourceRequest::url, "http://example.com"), _))
      .Times(1)
      .WillOnce([](const LoadNetworkResourceRequest& /*params*/,
                   const ScopedExecutor<NetworkRequestListener>& /*executor*/) {
        throw NotImplementedException(
            "This delegate does not implement loadNetworkResource.");
      })
      .RetiresOnSaturation();

  // The delegate's loadNetworkResource may throw immediately - verify this is
  // handled and that we clean up.
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                            "id": 1,
                                            "error": {
                                              "code": -32601,
                                              "message": "This delegate does not implement loadNetworkResource."
                                            }
                                          })")));

  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Network.loadNetworkResource",
                           "params": {
                             "url": "http://example.com"
                            }
                         })");

  // Check no stream is retained
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                            "id": 2,
                                            "error": {
                                              "code": -32603,
                                              "message": "Stream not found: 0"
                                            }
                                          })")));

  toPage_->sendMessage(R"({
                          "id": 2,
                          "method": "IO.close",
                          "params": {
                            "handle": "0"
                          }
                        })");
}

TEST_F(HostTargetTest, NetworkLoadNetworkResource3xx) {
  connect();

  InSequence s;

  ScopedExecutor<NetworkRequestListener> executor;
  EXPECT_CALL(
      hostTargetDelegate_,
      loadNetworkResource(
          Field(&LoadNetworkResourceRequest::url, "http://example.com/3xx"), _))
      .Times(1)
      .WillOnce([&executor](
                    const LoadNetworkResourceRequest& /*params*/,
                    ScopedExecutor<NetworkRequestListener> executorArg) {
        // Capture the ScopedExecutor<NetworkRequestListener> to use later.
        executor = std::move(executorArg);
      })
      .RetiresOnSaturation();

  // We don't support 3xx responses, and treat them as a CDP error (as if not
  // implemented so that the frontend may fall back.
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Network.loadNetworkResource",
                           "params": {
                             "url": "http://example.com/3xx"
                            }
                         })");

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                            "id": 1,
                                            "error": {
                                              "code": -32603,
                                              "message": "Handling of status 301 not implemented."
                                            }
                                          })")));

  executor([](NetworkRequestListener& listener) {
    listener.onHeaders(301, Headers{{"Location", "/new"}});
  });
}

TEST_F(HostTargetTest, IOReadSizeValidation) {
  connect();

  InSequence s;

  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                            "id": 1,
                                            "error": {
                                              "message": "Invalid params: size cannot be greater than 10MB.",
                                              "code": -32602
                                            }
                                          })")));
  toPage_->sendMessage(R"({
        "id": 1,
        "method": "IO.read",
        "params": {
          "handle": "0",
          "size": 134217728
        }
      })");
}

TEST_F(HostTargetTest, TracingDelegateIsNotifiedOnCDPRequest) {
  connect();
  InSequence s;

  EXPECT_CALL(
      hostTargetDelegate_.getTracingDelegateMock(),
      onTracingStarted(Eq(tracing::Mode::CDP), Eq(false)))
      .Times(1)
      .RetiresOnSaturation();
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 1,
                                               "result": {}
                                             })")));
  toPage_->sendMessage(R"({
                        "id": 1,
                        "method": "Tracing.start"
                      })");

  EXPECT_CALL(hostTargetDelegate_.getTracingDelegateMock(), onTracingStopped())
      .Times(1)
      .RetiresOnSaturation();
  EXPECT_CALL(fromPage(), onMessage(JsonEq(R"({
                                               "id": 1,
                                               "result": {}
                                             })")));
  EXPECT_CALL(
      fromPage(),
      onMessage(JsonParsed(
          testing::AllOf(
              AtJsonPtr("/method", "Tracing.tracingComplete"),
              AtJsonPtr("/params/dataLossOccurred", false)))));
  toPage_->sendMessage(R"({
                        "id": 1,
                        "method": "Tracing.end"
                      })");
}

TEST_F(HostTargetTest, TracingDelegateIsNotifiedOnDirectTracingCall) {
  connect();

  EXPECT_CALL(
      hostTargetDelegate_.getTracingDelegateMock(),
      onTracingStarted(Eq(tracing::Mode::Background), Eq(false)))
      .Times(1)
      .RetiresOnSaturation();
  page_->startTracing(tracing::Mode::Background, {});

  EXPECT_CALL(hostTargetDelegate_.getTracingDelegateMock(), onTracingStopped())
      .Times(1)
      .RetiresOnSaturation();
  page_->stopTracing();
}

TEST_F(HostTargetProtocolTest, CaptureScreenshotNotSupportedWhenFlagDisabled) {
  EXPECT_CALL(
      fromPage(),
      onMessage(JsonParsed(AllOf(
          AtJsonPtr("/error/code", Eq(-32601)), AtJsonPtr("/id", Eq(1))))))
      .RetiresOnSaturation();
  toPage_->sendMessage(R"({
                           "id": 1,
                           "method": "Page.captureScreenshot"
                         })");
}

} // namespace facebook::react::jsinspector_modern

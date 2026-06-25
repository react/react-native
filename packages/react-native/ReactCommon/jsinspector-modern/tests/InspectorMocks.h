/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/executors/ScheduledExecutor.h>
#include <gmock/gmock.h>

#include <jsinspector-modern/InspectorInterfaces.h>
#include <jsinspector-modern/InspectorPackagerConnection.h>
#include <jsinspector-modern/ReactCdp.h>

#include <chrono>
#include <functional>
#include <memory>
#include <string>

// Configurable mocks of various interfaces required by the inspector API.

namespace facebook::react::jsinspector_modern {

class MockWebSocket : public IWebSocket {
 public:
  MockWebSocket(const std::string &url, std::weak_ptr<IWebSocketDelegate> delegate) : url{url}, delegate{delegate}
  {
    EXPECT_TRUE(this->delegate.lock()) << "Delegate should exist when provided to createWebSocket";
  }

  const std::string url;
  std::weak_ptr<IWebSocketDelegate> delegate;

  /**
   * Convenience method to access the delegate from tests.
   * \pre The delegate has not been destroyed.
   */
  IWebSocketDelegate &getDelegate()
  {
    auto delegateStrong = this->delegate.lock();
    EXPECT_TRUE(delegateStrong);
    return *delegateStrong;
  }

  // IWebSocket methods
  MOCK_METHOD(void, send, (std::string_view message), (override));
};

class MockRemoteConnection : public IRemoteConnection {
 public:
  MockRemoteConnection() = default;

  // IRemoteConnection methods
  MOCK_METHOD(void, onMessage, (std::string message), (override));
  MOCK_METHOD(void, onDisconnect, (), (override));
};

class MockLocalConnection : public ILocalConnection {
 public:
  explicit MockLocalConnection(std::unique_ptr<IRemoteConnection> remoteConnection)
      : remoteConnection_{std::move(remoteConnection)}
  {
  }

  IRemoteConnection &getRemoteConnection()
  {
    return *remoteConnection_;
  }

  std::unique_ptr<IRemoteConnection> dangerouslyReleaseRemoteConnection()
  {
    return std::move(remoteConnection_);
  }

  // ILocalConnection methods
  MOCK_METHOD(void, sendMessage, (std::string message), (override));
  MOCK_METHOD(void, disconnect, (), (override));

 private:
  std::unique_ptr<IRemoteConnection> remoteConnection_;
};

class MockInspectorPackagerConnectionDelegate : public InspectorPackagerConnectionDelegate {
 public:
  explicit MockInspectorPackagerConnectionDelegate(folly::Executor &executor) : executor_(executor)
  {
    using namespace testing;
    ON_CALL(*this, scheduleCallback(_, _)).WillByDefault([this](auto callback, auto delay) {
      if (auto scheduledExecutor = dynamic_cast<folly::ScheduledExecutor *>(&executor_)) {
        scheduledExecutor->scheduleAt(callback, scheduledExecutor->now() + delay);
      } else {
        executor_.add(callback);
      }
    });
    EXPECT_CALL(*this, scheduleCallback(_, _)).Times(AnyNumber());
  }

  // InspectorPackagerConnectionDelegate methods
  MOCK_METHOD(
      std::unique_ptr<IWebSocket>,
      connectWebSocket,
      (const std::string &url, std::weak_ptr<IWebSocketDelegate> delegate),
      (override));
  MOCK_METHOD(
      void,
      scheduleCallback,
      (std::function<void(void)> callback, std::chrono::milliseconds delayMs),
      (override));

 private:
  folly::Executor &executor_;
};

class MockHostTargetTracingDelegate : public HostTargetTracingDelegate {
 public:
  MOCK_METHOD(void, onTracingStarted, (tracing::Mode tracingMode, bool screenshotsCategoryEnabled), (override));
  MOCK_METHOD(void, onTracingStopped, (), (override));
};

class MockHostTargetDelegate : public HostTargetDelegate {
 public:
  // HostTargetDelegate methods
  HostTargetMetadata getMetadata() override
  {
    return {.integrationName = "MockHostTargetDelegate"};
  }
  MOCK_METHOD(void, onReload, (const PageReloadRequest &request), (override));
  MOCK_METHOD(
      void,
      onSetPausedInDebuggerMessage,
      (const OverlaySetPausedInDebuggerMessageRequest &request),
      (override));
  MOCK_METHOD(
      void,
      loadNetworkResource,
      (const LoadNetworkResourceRequest &params, ScopedExecutor<NetworkRequestListener> executor),
      (override));
  MOCK_METHOD(std::optional<std::string>, captureScreenshot, (const PageCaptureScreenshotRequest &request), (override));

  HostTargetTracingDelegate *getTracingDelegate() override
  {
    return mockTracingDelegate_.get();
  }

  MockHostTargetTracingDelegate &getTracingDelegateMock()
  {
    return *mockTracingDelegate_;
  }

 private:
  std::unique_ptr<MockHostTargetTracingDelegate> mockTracingDelegate_ =
      std::make_unique<MockHostTargetTracingDelegate>();
};

class MockInstanceTargetDelegate : public InstanceTargetDelegate {};

class MockRuntimeTargetDelegate : public RuntimeTargetDelegate {
 public:
  // RuntimeTargetDelegate methods
  MOCK_METHOD(
      std::unique_ptr<RuntimeAgentDelegate>,
      createAgentDelegate,
      (FrontendChannel channel,
       SessionState &sessionState,
       std::unique_ptr<RuntimeAgentDelegate::ExportedState> previouslyExportedState,
       const ExecutionContextDescription &,
       RuntimeExecutor),
      (override));
  MOCK_METHOD(void, addConsoleMessage, (jsi::Runtime & runtime, ConsoleMessage message), (override));
  MOCK_METHOD(bool, supportsConsole, (), (override, const));
  MOCK_METHOD(
      std::unique_ptr<StackTrace>,
      captureStackTrace,
      (jsi::Runtime & runtime, size_t framesToSkip),
      (override));
  MOCK_METHOD(void, enableSamplingProfiler, (), (override));
  MOCK_METHOD(void, disableSamplingProfiler, (), (override));
  MOCK_METHOD(tracing::RuntimeSamplingProfile, collectSamplingProfile, (), (override));
  MOCK_METHOD(std::optional<folly::dynamic>, serializeStackTrace, (const StackTrace &stackTrace), (override));

  inline MockRuntimeTargetDelegate()
  {
    using namespace testing;

    // Silence "uninteresting mock function call" warnings for methods that
    // don't have side effects.

    EXPECT_CALL(*this, supportsConsole()).Times(AnyNumber());
  }
};

class MockRuntimeAgentDelegate : public RuntimeAgentDelegate {
 public:
  inline MockRuntimeAgentDelegate(
      FrontendChannel frontendChannel,
      SessionState &sessionState,
      std::unique_ptr<RuntimeAgentDelegate::ExportedState> /*unused*/,
      ExecutionContextDescription executionContextDescription,
      const RuntimeExecutor & /*runtimeExecutor*/)
      : frontendChannel(std::move(frontendChannel)),
        sessionState(sessionState),
        executionContextDescription(std::move(executionContextDescription))
  {
  }

  // RuntimeAgentDelegate methods
  MOCK_METHOD(bool, handleRequest, (const cdp::PreparsedRequest &req), (override));

  const FrontendChannel frontendChannel;
  SessionState &sessionState;
  const ExecutionContextDescription executionContextDescription;
};

} // namespace facebook::react::jsinspector_modern

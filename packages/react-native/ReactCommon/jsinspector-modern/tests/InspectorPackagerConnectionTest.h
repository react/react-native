/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fmt/format.h>
#include <folly/dynamic.h>
#include <folly/executors/ManualExecutor.h>
#include <folly/executors/QueuedImmediateExecutor.h>
#include <folly/json.h>
#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include <jsinspector-modern/InspectorInterfaces.h>
#include <jsinspector-modern/InspectorPackagerConnection.h>

#include <memory>

#include "InspectorMocks.h"
#include "UniquePtrFactory.h"

namespace facebook::react::jsinspector_modern {

/**
 * Base test fixture for InspectorPackagerConnection tests.
 *
 * The Executor template parameter controls how asynchronous work is executed:
 * - folly::QueuedImmediateExecutor: Work is executed immediately inline.
 * - folly::ManualExecutor: Work must be manually advanced in the test.
 */
template <typename Executor>
class InspectorPackagerConnectionTestBase : public testing::Test {
 protected:
  InspectorPackagerConnectionTestBase()
      : packagerConnection_(
            InspectorPackagerConnection{
                "ws://mock-host:12345",
                "my-device",
                "my-app",
                packagerConnectionDelegates_.make_unique(asyncExecutor_)})
  {
    auto makeSocket = webSockets_.lazily_make_unique<const std::string &, std::weak_ptr<IWebSocketDelegate>>();
    ON_CALL(*packagerConnectionDelegate(), connectWebSocket(testing::_, testing::_))
        .WillByDefault([makeSocket](auto &&...args) {
          auto socket = makeSocket(std::forward<decltype(args)>(args)...);
          socket->getDelegate().didOpen();
          return std::move(socket);
        });
    EXPECT_CALL(*packagerConnectionDelegate(), connectWebSocket(testing::_, testing::_)).Times(testing::AnyNumber());
  }

  void TearDown() override
  {
    // Forcibly clean up all pages currently registered with the inspector in
    // order to isolate state between tests. NOTE: Using TearDown instead of a
    // destructor so that we can use FAIL() etc.
    std::vector<int> pagesToRemove;
    auto pages = getInspectorInstance().getPages();
    int liveConnectionCount = 0;
    for (size_t i = 0; i != localConnections_.objectsVended(); ++i) {
      if (localConnections_[i] != nullptr) {
        liveConnectionCount++;
        // localConnections_[i] is a strict mock and will complain when we
        // removePage if the call is unexpected.
        EXPECT_CALL(*localConnections_[i], disconnect());
      }
    }
    for (auto &page : pages) {
      getInspectorInstance().removePage(page.id);
    }
    if (!pages.empty() && (liveConnectionCount != 0)) {
      if (!::testing::Test::HasFailure()) {
        FAIL() << "Test case ended with " << liveConnectionCount << " open connection(s) and " << pages.size()
               << " registered page(s). You must manually call removePage for each page.";
      }
    }
    ::testing::Test::TearDown();
  }

  MockInspectorPackagerConnectionDelegate *packagerConnectionDelegate()
  {
    // We only create one PackagerConnectionDelegate per test.
    EXPECT_EQ(packagerConnectionDelegates_.objectsVended(), 1);
    return packagerConnectionDelegates_[0];
  }

  Executor asyncExecutor_;

  UniquePtrFactory<MockInspectorPackagerConnectionDelegate> packagerConnectionDelegates_;
  /**
   * webSockets_ will hold the WebSocket instance(s) owned by
   * packagerConnection_ while also allowing us to access them during
   * the test. We can send messages *to* packagerConnection_ by
   * calling webSockets_[i]->getDelegate().didReceiveMessage(...). Messages
   * *from* packagerConnection_ will be found as calls to
   * webSockets_[i]->send, which is a mock method installed by gmock.
   * These are strict mocks, so method calls will fail if they are not
   * expected with a corresponding call to EXPECT_CALL(...) - for example
   * if unexpected WebSocket messages are sent.
   */
  UniquePtrFactory<testing::StrictMock<MockWebSocket>> webSockets_;
  /**
   * localConnections_ will hold the LocalConnection instances owned
   * by packagerConnection_ while also allowing us to access them
   * during the test.
   * These are strict mocks, so method calls will fail if they are not
   * expected with a corresponding call to EXPECT_CALL(...).
   */
  UniquePtrFactory<testing::StrictMock<MockLocalConnection>> localConnections_;
  std::optional<InspectorPackagerConnection> packagerConnection_;
};

/**
 * Standard test fixture that uses QueuedImmediateExecutor.
 * Work scheduled on the executor is run immediately inline.
 */
using InspectorPackagerConnectionTest = InspectorPackagerConnectionTestBase<folly::QueuedImmediateExecutor>;

/**
 * Test fixture that uses ManualExecutor.
 * Work scheduled on the executor is *not* run automatically; it must be
 * manually advanced in the body of the test.
 */
class InspectorPackagerConnectionTestAsync : public InspectorPackagerConnectionTestBase<folly::ManualExecutor> {
 public:
  void TearDown() override
  {
    // Assert there are no pending tasks on the ManualExecutor.
    auto tasksCleared = asyncExecutor_.clear();
    EXPECT_EQ(tasksCleared, 0)
        << "There were still pending tasks on asyncExecutor_ at the end of the test. Use advance() or run() as needed.";
    InspectorPackagerConnectionTestBase<folly::ManualExecutor>::TearDown();
  }
};

} // namespace facebook::react::jsinspector_modern

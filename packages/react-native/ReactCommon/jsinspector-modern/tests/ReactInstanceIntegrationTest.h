/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "InspectorMocks.h"
#include "ReactNativeMocks.h"
#include "UniquePtrFactory.h"

#include <folly/executors/QueuedImmediateExecutor.h>
#include <folly/json.h>
#include <gtest/gtest.h>
#include <jsinspector-modern/InspectorInterfaces.h>

#include <cassert>
#include <memory>

namespace facebook::react::jsinspector_modern {

using namespace ::testing;

enum ReactInstanceIntegrationTestMode {
  FUSEBOX,
};

class ReactInstanceIntegrationTest
    : public Test,
      public ::testing::WithParamInterface<ReactInstanceIntegrationTestMode> {
 protected:
  ReactInstanceIntegrationTest();

  void SetUp() override;
  void TearDown() override;

  jsi::Value run(const std::string& script);
  bool verbose(bool isVerbose);

  void send(
      const std::string& method,
      const folly::dynamic& params = folly::dynamic::object());
  void sendJSONString(const std::string& message);

  jsi::Runtime* runtime;
  std::unique_ptr<react::ReactInstance> instance;
  std::shared_ptr<MockMessageQueueThread> messageQueueThread;
  std::shared_ptr<ErrorUtils> errorHandler;

  NiceMock<MockRemoteConnection>& getRemoteConnection() {
    EXPECT_EQ(mockRemoteConnections_.objectsVended(), 1);
    auto rawPtr = mockRemoteConnections_[0];
    assert(rawPtr);
    return *rawPtr;
  }

 private:
  void initializeRuntime(std::string_view script);

  ReactInstanceIntegrationTestMode testMode_;
  size_t id_ = 1;
  bool verbose_ = false;
  std::optional<int> pageId_;
  UniquePtrFactory<NiceMock<MockRemoteConnection>> mockRemoteConnections_;
  std::unique_ptr<ILocalConnection> clientToVM_;
  folly::QueuedImmediateExecutor immediateExecutor_;
  MockHostTargetDelegate hostTargetDelegate_;
};

} // namespace facebook::react::jsinspector_modern

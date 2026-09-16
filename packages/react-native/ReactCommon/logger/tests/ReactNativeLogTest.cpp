/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <logger/react_native_log.h>

#include <vector>

namespace {

struct CapturedLog {
  ReactNativeLogLevel level;
  const char* message;
};

std::vector<CapturedLog>* capturedLogs = nullptr;
std::vector<const char*>* firstHandlerMessages = nullptr;
std::vector<const char*>* secondHandlerMessages = nullptr;

void captureLog(ReactNativeLogLevel level, const char* message) {
  capturedLogs->push_back({level, message});
}

void captureWithFirstHandler(ReactNativeLogLevel, const char* message) {
  firstHandlerMessages->push_back(message);
}

void captureWithSecondHandler(ReactNativeLogLevel, const char* message) {
  secondHandlerMessages->push_back(message);
}

class ReactNativeLogTest : public ::testing::Test {
 protected:
  void SetUp() override {
    capturedLogs = &logs_;
    set_react_native_logfunc(captureLog);
  }

  void TearDown() override {
    set_react_native_logfunc(nullptr);
    capturedLogs = nullptr;
    firstHandlerMessages = nullptr;
    secondHandlerMessages = nullptr;
  }

  std::vector<CapturedLog> logs_;
};

TEST_F(
    ReactNativeLogTest,
    testConvenienceLogFunctionsForwardLevelsAndMessages) {
  const char* infoMessage = "bridge initialized";
  const char* warningMessage = "slow module load";
  const char* errorMessage = "native module failed";
  const char* fatalMessage = "unrecoverable bridge error";

  react_native_log_info(infoMessage);
  react_native_log_warn(warningMessage);
  react_native_log_error(errorMessage);
  react_native_log_fatal(fatalMessage);

  ASSERT_EQ(logs_.size(), 4);
  EXPECT_EQ(logs_[0].level, ReactNativeLogLevelInfo);
  EXPECT_EQ(logs_[0].message, infoMessage);
  EXPECT_EQ(logs_[1].level, ReactNativeLogLevelWarning);
  EXPECT_EQ(logs_[1].message, warningMessage);
  EXPECT_EQ(logs_[2].level, ReactNativeLogLevelError);
  EXPECT_EQ(logs_[2].message, errorMessage);
  EXPECT_EQ(logs_[3].level, ReactNativeLogLevelFatal);
  EXPECT_EQ(logs_[3].message, fatalMessage);
}

TEST_F(ReactNativeLogTest, testDispatcherForwardsLevelAndNullMessageToHandler) {
  _react_native_log(ReactNativeLogLevelWarning, nullptr);

  ASSERT_EQ(logs_.size(), 1);
  EXPECT_EQ(logs_[0].level, ReactNativeLogLevelWarning);
  EXPECT_EQ(logs_[0].message, nullptr);
}

TEST_F(ReactNativeLogTest, testSetLogFunctionReplacesInstalledHandler) {
  std::vector<const char*> firstMessages;
  std::vector<const char*> secondMessages;
  firstHandlerMessages = &firstMessages;
  secondHandlerMessages = &secondMessages;

  const char* firstMessage = "before replacement";
  const char* secondMessage = "after replacement";

  set_react_native_logfunc(captureWithFirstHandler);
  react_native_log_info(firstMessage);
  set_react_native_logfunc(captureWithSecondHandler);
  react_native_log_info(secondMessage);

  ASSERT_EQ(firstMessages.size(), 1);
  EXPECT_EQ(firstMessages[0], firstMessage);
  ASSERT_EQ(secondMessages.size(), 1);
  EXPECT_EQ(secondMessages[0], secondMessage);
}

} // namespace

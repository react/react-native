/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <stdexcept>
#include <string>

#include <yoga/Yoga.h>

namespace {

struct LogRecord {
  int calls = 0;
  YGConfigConstRef config = nullptr;
  YGNodeConstRef node = nullptr;
  YGLogLevel level = YGLogLevelDebug;
};

int recordLog(
    YGConfigConstRef config,
    YGNodeConstRef node,
    YGLogLevel level,
    const char* /*format*/,
    va_list /*args*/) {
  auto* record = static_cast<LogRecord*>(YGConfigGetContext(config));
  record->calls++;
  record->config = config;
  record->node = node;
  record->level = level;
  return 0;
}

YGSize measureInvalidWidth(
    YGNodeConstRef /*node*/,
    float /*width*/,
    YGMeasureMode /*widthMode*/,
    float /*height*/,
    YGMeasureMode /*heightMode*/) {
  return YGSize{-1.0f, 10.0f};
}

class LogTest : public ::testing::Test {
 protected:
  void SetUp() override {
    config_ = YGConfigNew();
    YGConfigSetContext(config_, &record_);
    YGConfigSetLogger(config_, recordLog);
  }

  void TearDown() override {
    if (node_ != nullptr) {
      YGNodeFree(node_);
    }
    YGConfigFree(config_);
  }

  LogRecord record_;
  YGConfigRef config_ = nullptr;
  YGNodeRef node_ = nullptr;
};

TEST_F(LogTest, testConfigFailureForwardsLoggerMetadata) {
  EXPECT_THROW(YGConfigSetPointScaleFactor(config_, -1.0f), std::logic_error);

  EXPECT_EQ(record_.calls, 1);
  EXPECT_EQ(record_.config, config_);
  EXPECT_EQ(record_.node, nullptr);
  EXPECT_EQ(record_.level, YGLogLevelFatal);
}

TEST_F(LogTest, testInvalidNodeMeasurementUsesNodesConfiguredLogger) {
  node_ = YGNodeNewWithConfig(config_);
  YGNodeSetMeasureFunc(node_, measureInvalidWidth);

  YGNodeCalculateLayout(node_, YGUndefined, YGUndefined, YGDirectionLTR);

  EXPECT_EQ(record_.calls, 1);
  EXPECT_EQ(record_.config, config_);
  EXPECT_EQ(record_.node, node_);
  EXPECT_EQ(record_.level, YGLogLevelWarn);
}

TEST_F(LogTest, testNullLoggerRestoresDefaultErrorLogger) {
  YGConfigSetLogger(config_, nullptr);
  testing::internal::CaptureStdout();
  testing::internal::CaptureStderr();

  EXPECT_THROW(YGConfigSetPointScaleFactor(config_, -1.0f), std::logic_error);

  const std::string stdoutOutput = testing::internal::GetCapturedStdout();
  const std::string stderrOutput = testing::internal::GetCapturedStderr();
  EXPECT_EQ(record_.calls, 0);
  EXPECT_TRUE(stdoutOutput.empty());
  EXPECT_FALSE(stderrOutput.empty());
}

} // namespace

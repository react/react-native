/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/debug/redbox/RedBoxErrorParser.h>

using namespace facebook::react::unstable_redbox;

TEST(RedBoxErrorParserTest, ParsesBabelTransformError) {
  auto result = parseErrorMessage(
      "SyntaxError: /path/to/file.js: Unexpected token (10:5)\n\n"
      "> 10 |   const x = {\n"
      "     |              ^");

  EXPECT_EQ(result.title, "Syntax Error");
  EXPECT_EQ(result.message, "Unexpected token");
  ASSERT_TRUE(result.codeFrame.has_value());
  EXPECT_EQ(result.codeFrame->fileName, "/path/to/file.js");
  EXPECT_EQ(result.codeFrame->row, 10);
  EXPECT_EQ(result.codeFrame->column, 5);
  EXPECT_TRUE(result.isCompileError);
  EXPECT_TRUE(result.isRetryable);
}

TEST(RedBoxErrorParserTest, ParsesMetroError) {
  auto result = parseErrorMessage(
      "InternalError Metro has encountered an error: "
      "BundleError: Unable to resolve module (1:0)\n\n"
      "code frame here");

  EXPECT_EQ(result.title, "BundleError");
  EXPECT_EQ(result.message, "Unable to resolve module");
  ASSERT_TRUE(result.codeFrame.has_value());
  EXPECT_EQ(result.codeFrame->row, 1);
  EXPECT_TRUE(result.isCompileError);
}

TEST(RedBoxErrorParserTest, ParsesBundleLoadError_SyntaxError) {
  auto result = parseErrorMessage(
      "SyntaxError in /app/index.js: Unexpected token (3:10)\ncode frame");

  EXPECT_EQ(result.title, "Syntax Error");
  EXPECT_EQ(result.message, "Unexpected token");
  ASSERT_TRUE(result.codeFrame.has_value());
  EXPECT_EQ(result.codeFrame->fileName, "/app/index.js");
  EXPECT_EQ(result.codeFrame->row, 3);
  EXPECT_EQ(result.codeFrame->column, 10);
  EXPECT_TRUE(result.isCompileError);
}

TEST(RedBoxErrorParserTest, ParsesBundleLoadError_UnableToResolve) {
  auto result = parseErrorMessage(
      "UnableToResolveError in /app/index.js: Cannot find module (1:0)");

  EXPECT_EQ(result.title, "Module Not Found");
  EXPECT_TRUE(result.isCompileError);
}

TEST(RedBoxErrorParserTest, ParsesGenericTransformError) {
  auto result = parseErrorMessage("TransformError some error message");

  EXPECT_EQ(result.title, "Syntax Error");
  EXPECT_EQ(result.message, "TransformError some error message");
  EXPECT_FALSE(result.codeFrame.has_value());
  EXPECT_TRUE(result.isCompileError);
}

TEST(RedBoxErrorParserTest, DefaultsToUncaughtError) {
  auto result = parseErrorMessage("TypeError: undefined is not a function");

  EXPECT_EQ(result.title, "Uncaught Error");
  EXPECT_EQ(result.message, "TypeError: undefined is not a function");
  EXPECT_FALSE(result.codeFrame.has_value());
  EXPECT_FALSE(result.isCompileError);
  EXPECT_TRUE(result.isRetryable);
}

TEST(RedBoxErrorParserTest, UsesNameForTitle) {
  auto result = parseErrorMessage("something broke", "CustomError");

  EXPECT_EQ(result.title, "CustomError");
}

TEST(RedBoxErrorParserTest, UsesRenderErrorForComponentStack) {
  auto result =
      parseErrorMessage("something broke", "", "in MyComponent\nin App");

  EXPECT_EQ(result.title, "Render Error");
}

TEST(RedBoxErrorParserTest, NonFatalDefaultsToError) {
  auto result = parseErrorMessage("warning message", "", "", false);

  EXPECT_EQ(result.title, "Error");
}

TEST(RedBoxErrorParserTest, HandlesEmptyMessage) {
  auto result = parseErrorMessage("");

  EXPECT_EQ(result.title, "Uncaught Error");
  EXPECT_EQ(result.message, "");
  EXPECT_FALSE(result.codeFrame.has_value());
}

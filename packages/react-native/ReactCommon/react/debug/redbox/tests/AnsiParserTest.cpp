/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/debug/redbox/AnsiParser.h>

using namespace facebook::react::unstable_redbox;

TEST(AnsiParserTest, ParsesPlainText) {
  auto spans = parseAnsi("hello world");
  ASSERT_EQ(spans.size(), 1);
  EXPECT_EQ(spans[0].text, "hello world");
  EXPECT_FALSE(spans[0].foregroundColor.has_value());
  EXPECT_FALSE(spans[0].backgroundColor.has_value());
}

TEST(AnsiParserTest, ParsesRedForeground) {
  auto spans = parseAnsi("\x1b[31mred text\x1b[0m normal");
  ASSERT_EQ(spans.size(), 2);
  EXPECT_EQ(spans[0].text, "red text");
  ASSERT_TRUE(spans[0].foregroundColor.has_value());
  EXPECT_EQ(spans[0].foregroundColor->r, 187);
  EXPECT_EQ(spans[0].foregroundColor->g, 86);
  EXPECT_EQ(spans[0].foregroundColor->b, 83);

  EXPECT_EQ(spans[1].text, " normal");
  EXPECT_FALSE(spans[1].foregroundColor.has_value());
}

TEST(AnsiParserTest, ParsesMultipleColors) {
  auto spans = parseAnsi("\x1b[32mgreen\x1b[34mblue\x1b[0m");
  ASSERT_EQ(spans.size(), 2);
  EXPECT_EQ(spans[0].text, "green");
  EXPECT_EQ(spans[0].foregroundColor->r, 144);
  EXPECT_EQ(spans[1].text, "blue");
  EXPECT_EQ(spans[1].foregroundColor->r, 125);
}

TEST(AnsiParserTest, ParsesBrightColors) {
  auto spans = parseAnsi("\x1b[93myellow\x1b[0m");
  ASSERT_EQ(spans.size(), 1);
  EXPECT_EQ(spans[0].text, "yellow");
  ASSERT_TRUE(spans[0].foregroundColor.has_value());
  EXPECT_EQ(spans[0].foregroundColor->r, 234);
}

TEST(AnsiParserTest, ParsesBackgroundColor) {
  auto spans = parseAnsi("\x1b[41mred bg\x1b[0m");
  ASSERT_EQ(spans.size(), 1);
  EXPECT_EQ(spans[0].text, "red bg");
  EXPECT_FALSE(spans[0].foregroundColor.has_value());
  ASSERT_TRUE(spans[0].backgroundColor.has_value());
  EXPECT_EQ(spans[0].backgroundColor->r, 187);
  EXPECT_EQ(spans[0].backgroundColor->g, 86);
  EXPECT_EQ(spans[0].backgroundColor->b, 83);
}

TEST(AnsiParserTest, ResetClearsBackground) {
  auto spans = parseAnsi("\x1b[31;42mcolored\x1b[49mfg only\x1b[0m");
  ASSERT_EQ(spans.size(), 2);
  ASSERT_TRUE(spans[0].foregroundColor.has_value());
  ASSERT_TRUE(spans[0].backgroundColor.has_value());
  ASSERT_TRUE(spans[1].foregroundColor.has_value());
  EXPECT_FALSE(spans[1].backgroundColor.has_value());
}

TEST(AnsiParserTest, ResetShorthandClearsColors) {
  auto spans = parseAnsi("\x1b[31mred\x1b[mplain");
  ASSERT_EQ(spans.size(), 2);
  EXPECT_EQ(spans[0].text, "red");
  ASSERT_TRUE(spans[0].foregroundColor.has_value());
  EXPECT_EQ(spans[1].text, "plain");
  EXPECT_FALSE(spans[1].foregroundColor.has_value());
  EXPECT_FALSE(spans[1].backgroundColor.has_value());
}

TEST(AnsiParserTest, StripsAnsi) {
  auto result = stripAnsi("\x1b[31mred\x1b[0m and \x1b[32mgreen\x1b[0m");
  EXPECT_EQ(result, "red and green");
}

TEST(AnsiParserTest, HandlesEmptyString) {
  auto spans = parseAnsi("");
  EXPECT_TRUE(spans.empty());
}

TEST(AnsiParserTest, HandlesSemicolonSeparatedCodes) {
  auto spans = parseAnsi("\x1b[1;31mtext\x1b[0m");
  ASSERT_EQ(spans.size(), 1);
  EXPECT_EQ(spans[0].text, "text");
  ASSERT_TRUE(spans[0].foregroundColor.has_value());
  EXPECT_EQ(spans[0].foregroundColor->r, 187);
}

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef RCT_REMOVE_LEGACY_ARCH

#include <cxxreact/MethodCall.h>

#include <folly/json.h>
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wsign-compare"
#include <gtest/gtest.h>
#pragma GCC diagnostic pop

using namespace facebook::react;
using dynamic = folly::dynamic;

TEST(parseMethodCalls, SingleReturnCallNoArgs) {
  auto jsText = "[[7],[3],[[]]]";
  auto returnedCalls = parseMethodCalls(folly::parseJson(jsText));
  EXPECT_EQ(1, returnedCalls.size());
  auto returnedCall = returnedCalls[0];
  EXPECT_EQ(0, returnedCall.arguments.size());
  EXPECT_EQ(7, returnedCall.moduleId);
  EXPECT_EQ(3, returnedCall.methodId);
}

TEST(parseMethodCalls, InvalidReturnFormat) {
  try {
    auto input = dynamic::object("foo", 1);
    parseMethodCalls(std::move(input));
    ADD_FAILURE();
  } catch (const std::invalid_argument&) {
    // ignored
  }
  try {
    auto input = dynamic::array(dynamic::object("foo", 1));
    parseMethodCalls(std::move(input));
    ADD_FAILURE();
  } catch (const std::invalid_argument&) {
    // ignored
  }
  try {
    auto input = dynamic::array(1, 4, dynamic::object("foo", 2));
    parseMethodCalls(std::move(input));
    ADD_FAILURE();
  } catch (const std::invalid_argument&) {
    // ignored
  }
  try {
    auto input = dynamic::array(
        dynamic::array(1), dynamic::array(4), dynamic::object("foo", 2));
    parseMethodCalls(std::move(input));
    ADD_FAILURE();
  } catch (const std::invalid_argument&) {
    // ignored
  }
  try {
    auto input =
        dynamic::array(dynamic::array(1), dynamic::array(4), dynamic::array());
    parseMethodCalls(std::move(input));
    ADD_FAILURE();
  } catch (const std::invalid_argument&) {
    // ignored
  }
}

TEST(parseMethodCalls, NumberReturn) {
  auto jsText = "[[0],[0],[[\"foobar\"]]]";
  auto returnedCalls = parseMethodCalls(folly::parseJson(jsText));
  EXPECT_EQ(1, returnedCalls.size());
  auto returnedCall = returnedCalls[0];
  EXPECT_EQ(1, returnedCall.arguments.size());
  EXPECT_EQ(folly::dynamic::STRING, returnedCall.arguments[0].type());
  EXPECT_EQ("foobar", returnedCall.arguments[0].asString());
}

TEST(parseMethodCalls, StringReturn) {
  auto jsText = "[[0],[0],[[42.16]]]";
  auto returnedCalls = parseMethodCalls(folly::parseJson(jsText));
  EXPECT_EQ(1, returnedCalls.size());
  auto returnedCall = returnedCalls[0];
  EXPECT_EQ(1, returnedCall.arguments.size());
  EXPECT_EQ(folly::dynamic::DOUBLE, returnedCall.arguments[0].type());
  EXPECT_EQ(42.16, returnedCall.arguments[0].asDouble());
}

TEST(parseMethodCalls, BooleanReturn) {
  auto jsText = "[[0],[0],[[false]]]";
  auto returnedCalls = parseMethodCalls(folly::parseJson(jsText));
  EXPECT_EQ(1, returnedCalls.size());
  auto returnedCall = returnedCalls[0];
  EXPECT_EQ(1, returnedCall.arguments.size());
  EXPECT_EQ(folly::dynamic::BOOL, returnedCall.arguments[0].type());
  ASSERT_FALSE(returnedCall.arguments[0].asBool());
}

TEST(parseMethodCalls, NullReturn) {
  auto jsText = "[[0],[0],[[null]]]";
  auto returnedCalls = parseMethodCalls(folly::parseJson(jsText));
  EXPECT_EQ(1, returnedCalls.size());
  auto returnedCall = returnedCalls[0];
  EXPECT_EQ(1, returnedCall.arguments.size());
  EXPECT_EQ(folly::dynamic::NULLT, returnedCall.arguments[0].type());
}

TEST(parseMethodCalls, MapReturn) {
  auto jsText = R"([[0],[0],[[{"foo": "hello", "bar": 4.0, "baz": true}]]])";
  auto returnedCalls = parseMethodCalls(folly::parseJson(jsText));
  EXPECT_EQ(1, returnedCalls.size());
  auto returnedCall = returnedCalls[0];
  EXPECT_EQ(1, returnedCall.arguments.size());
  EXPECT_EQ(folly::dynamic::OBJECT, returnedCall.arguments[0].type());
  auto& returnedMap = returnedCall.arguments[0];
  auto foo = returnedMap.at("foo");
  EXPECT_EQ(folly::dynamic("hello"), foo);
  auto bar = returnedMap.at("bar");
  EXPECT_EQ(folly::dynamic(4.0), bar);
  auto baz = returnedMap.at("baz");
  EXPECT_EQ(folly::dynamic(true), baz);
}

TEST(parseMethodCalls, ArrayReturn) {
  auto jsText = "[[0],[0],[[[\"foo\", 42.0, false]]]]";
  auto returnedCalls = parseMethodCalls(folly::parseJson(jsText));
  EXPECT_EQ(1, returnedCalls.size());
  auto returnedCall = returnedCalls[0];
  EXPECT_EQ(1, returnedCall.arguments.size());
  EXPECT_EQ(folly::dynamic::ARRAY, returnedCall.arguments[0].type());
  auto& returnedArray = returnedCall.arguments[0];
  EXPECT_EQ(3, returnedArray.size());
  EXPECT_EQ(folly::dynamic("foo"), returnedArray[0]);
  EXPECT_EQ(folly::dynamic(42.0), returnedArray[1]);
  EXPECT_EQ(folly::dynamic(false), returnedArray[2]);
}

TEST(parseMethodCalls, ReturnMultipleParams) {
  auto jsText = "[[0],[0],[[\"foo\", 14, null, false]]]";
  auto returnedCalls = parseMethodCalls(folly::parseJson(jsText));
  EXPECT_EQ(1, returnedCalls.size());
  auto returnedCall = returnedCalls[0];
  EXPECT_EQ(4, returnedCall.arguments.size());
  EXPECT_EQ(folly::dynamic::STRING, returnedCall.arguments[0].type());
  EXPECT_EQ(folly::dynamic::INT64, returnedCall.arguments[1].type());
  EXPECT_EQ(folly::dynamic::NULLT, returnedCall.arguments[2].type());
  EXPECT_EQ(folly::dynamic::BOOL, returnedCall.arguments[3].type());
}

TEST(parseMethodCalls, ParseTwoCalls) {
  auto jsText = "[[0,0],[1,1],[[],[]]]";
  auto returnedCalls = parseMethodCalls(folly::parseJson(jsText));
  EXPECT_EQ(2, returnedCalls.size());
}

#endif // RCT_REMOVE_LEGACY_ARCH

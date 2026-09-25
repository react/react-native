/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <jsi/JSIDynamic.h>

#include <gtest/gtest.h>
#include <jsi/test/testlib.h>

using namespace facebook::jsi;

class JSIDynamicTest : public JSITestBase {};

TEST_P(JSIDynamicTest, testValueFromDynamicConvertsNestedCollections) {
  folly::dynamic input = folly::dynamic::object("nullValue", nullptr)(
      "enabled", true)("count", 42)("ratio", 1.5)(
      "children",
      folly::dynamic::array(
          folly::dynamic::object("name", "first")(
              "values", folly::dynamic::array(3, 5)),
          folly::dynamic::object("name", "second")("active", false)))(
      "metadata",
      folly::dynamic::object(7, "numeric key")(false, "unsupported key"));

  Object result = valueFromDynamic(rt, input).getObject(rt);

  EXPECT_TRUE(result.getProperty(rt, "nullValue").isNull());
  EXPECT_TRUE(result.getProperty(rt, "enabled").getBool());
  EXPECT_EQ(result.getProperty(rt, "count").getNumber(), 42);
  EXPECT_EQ(result.getProperty(rt, "ratio").getNumber(), 1.5);

  Array children = result.getPropertyAsObject(rt, "children").getArray(rt);
  ASSERT_EQ(children.size(rt), 2);
  Object first = children.getValueAtIndex(rt, 0).getObject(rt);
  EXPECT_EQ(first.getProperty(rt, "name").getString(rt).utf8(rt), "first");
  Array values = first.getPropertyAsObject(rt, "values").getArray(rt);
  ASSERT_EQ(values.size(rt), 2);
  EXPECT_EQ(values.getValueAtIndex(rt, 0).getNumber(), 3);
  EXPECT_EQ(values.getValueAtIndex(rt, 1).getNumber(), 5);

  Object second = children.getValueAtIndex(rt, 1).getObject(rt);
  EXPECT_EQ(second.getProperty(rt, "name").getString(rt).utf8(rt), "second");
  EXPECT_FALSE(second.getProperty(rt, "active").getBool());

  Object metadata = result.getPropertyAsObject(rt, "metadata");
  EXPECT_EQ(
      metadata.getProperty(rt, "7").getString(rt).utf8(rt), "numeric key");
  EXPECT_EQ(metadata.getPropertyNames(rt).size(rt), 1);
}

TEST_P(JSIDynamicTest, testDynamicFromValueConvertsNestedCollections) {
  Value input = eval(
      "({left: [{id: 1}, {id: 2}], "
      "right: {enabled: true, label: 'ready'}, value: 2.25})");
  folly::dynamic expected = folly::dynamic::object(
      "left",
      folly::dynamic::array(
          folly::dynamic::object("id", 1.0),
          folly::dynamic::object("id", 2.0)))(
      "right", folly::dynamic::object("enabled", true)("label", "ready"))(
      "value", 2.25);

  folly::dynamic result = dynamicFromValue(rt, input);

  EXPECT_EQ(result, expected);
}

TEST_P(JSIDynamicTest, testDynamicFromValueNormalizesAndFiltersProperties) {
  Value input = eval(
      "({keep: 7, drop: 8, missing: undefined, "
      "callback: function() {}, items: [undefined, 'ok']})");
  folly::dynamic expected = folly::dynamic::object("keep", 7.0)(
      "callback", nullptr)("items", folly::dynamic::array(nullptr, "ok"));

  folly::dynamic result = dynamicFromValue(
      rt, input, [](const std::string& key) { return key == "drop"; });

  EXPECT_EQ(result, expected);
}

TEST_P(JSIDynamicTest, testDynamicFromValueRejectsUnsupportedValues) {
  auto expectConversionError = [&](const char* expression,
                                   const char* expectedMessage) {
    try {
      dynamicFromValue(rt, eval(expression));
      FAIL() << "Expected conversion to throw for " << expression;
    } catch (const JSError& error) {
      EXPECT_NE(
          std::string(error.what()).find(expectedMessage), std::string::npos)
          << error.what();
    }
  };

  expectConversionError(
      "(function() {})", "JS Functions are not convertible to dynamic");
  expectConversionError("1n", "JS BigInts are not convertible to dynamic");
  expectConversionError(
      "Symbol('token')", "JS Symbols are not convertible to dynamic");
}

TEST_P(JSIDynamicTest, testDynamicFromValueHandlesDeeplyNestedObjects) {
  constexpr size_t kDepth = 25000;
  std::string expression =
      "(function() { let head = {}; let node = head; "
      "for (let i = 0; i < " +
      std::to_string(kDepth) +
      "; ++i) { node.next = {}; node = node.next; } "
      "node.value = true; return head; })()";

  folly::dynamic result = dynamicFromValue(rt, eval(expression.c_str()));

  folly::dynamic* current = &result;
  size_t depth = 0;
  while (folly::dynamic* next = current->get_ptr("next")) {
    current = next;
    ++depth;
  }
  EXPECT_EQ(depth, kDepth);
  EXPECT_TRUE((*current)["value"].getBool());

  while (folly::dynamic* next = result.get_ptr("next")) {
    folly::dynamic child = std::move(*next);
    result = std::move(child);
  }
}

INSTANTIATE_TEST_SUITE_P(
    Runtimes,
    JSIDynamicTest,
    ::testing::ValuesIn(runtimeGenerators()));

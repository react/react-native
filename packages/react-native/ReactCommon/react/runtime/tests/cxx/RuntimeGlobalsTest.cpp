/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <hermes/hermes.h>
#include <react/runtime/RuntimeGlobals.h>

#include <memory>
#include <string>

namespace facebook::react {

namespace {

bool evaluate(jsi::Runtime& runtime, const std::string& script) {
  return runtime
      .evaluateJavaScript(
          std::make_shared<jsi::StringBuffer>(script), "startup.js")
      .getBool();
}

} // namespace

TEST(RuntimeGlobalsTest, FirstScriptReadsCallerNamedGlobalsAndNestedValues) {
  auto install = createRuntimeGlobalsInstaller(
      folly::dynamic::object(
          "startupConfig",
          folly::dynamic::object("text", "native")("enabled", true)(
              "count", 42)(
              "items",
              folly::dynamic::array(
                  "first",
                  2.5,
                  false,
                  nullptr,
                  folly::dynamic::object("nested", true))))(
          "emptyValue", nullptr)("customName", "value"));
  auto runtime = facebook::hermes::makeHermesRuntime();

  install(*runtime);

  EXPECT_TRUE(evaluate(
      *runtime,
      "startupConfig.text === 'native' && startupConfig.enabled === true && "
      "startupConfig.count === 42 && startupConfig.items[0] === 'first' && "
      "startupConfig.items[1] === 2.5 && startupConfig.items[2] === false && "
      "startupConfig.items[3] === null && startupConfig.items[4].nested === true && "
      "emptyValue === null && customName === 'value'"));
}

TEST(
    RuntimeGlobalsTest,
    RecreatedRuntimeReceivesFreshObjectsFromTheOriginalSnapshot) {
  auto install = createRuntimeGlobalsInstaller(
      folly::dynamic::object(
          "config", folly::dynamic::object("items", folly::dynamic::array(1))));
  {
    auto firstRuntime = facebook::hermes::makeHermesRuntime();
    install(*firstRuntime);
    EXPECT_TRUE(evaluate(
        *firstRuntime, "config.items[0] = 9; config.items.push(2); true"));
  }

  auto nextRuntime = facebook::hermes::makeHermesRuntime();
  install(*nextRuntime);

  EXPECT_TRUE(evaluate(
      *nextRuntime, "config.items.length === 1 && config.items[0] === 1"));
}

TEST(RuntimeGlobalsTest, IndependentInstallersDoNotShareData) {
  auto installFirst =
      createRuntimeGlobalsInstaller(folly::dynamic::object("config", "first"));
  auto installSecond =
      createRuntimeGlobalsInstaller(folly::dynamic::object("config", "second"));
  auto firstRuntime = facebook::hermes::makeHermesRuntime();
  auto secondRuntime = facebook::hermes::makeHermesRuntime();

  installFirst(*firstRuntime);
  installSecond(*secondRuntime);

  EXPECT_TRUE(evaluate(*firstRuntime, "config === 'first'"));
  EXPECT_TRUE(evaluate(*secondRuntime, "config === 'second'"));
}

TEST(RuntimeGlobalsTest, CopiesOwnTheirDataAfterTheOriginalIsDestroyed) {
  auto additionalValue = std::make_shared<int>(8);
  auto install = createRuntimeGlobalsInstaller(
      folly::dynamic::object("value", 7),
      [additionalValue](jsi::Runtime& runtime) {
        runtime.global().setProperty(
            runtime, "additionalValue", *additionalValue);
      });
  auto copy = install;
  additionalValue.reset();
  install = nullptr;
  auto runtime = facebook::hermes::makeHermesRuntime();

  copy(*runtime);

  EXPECT_TRUE(evaluate(*runtime, "value === 7 && additionalValue === 8"));
}

TEST(RuntimeGlobalsTest, AdditionalBindingsRunAfterGlobalsForEachRuntime) {
  int calls = 0;
  auto install = createRuntimeGlobalsInstaller(
      folly::dynamic::object("value", "native"),
      [&calls](jsi::Runtime& runtime) {
        EXPECT_TRUE(evaluate(runtime, "value === 'native'"));
        runtime.global().setProperty(runtime, "value", "custom");
        ++calls;
      });

  for (int i = 0; i < 2; ++i) {
    auto runtime = facebook::hermes::makeHermesRuntime();
    install(*runtime);
    EXPECT_TRUE(evaluate(*runtime, "value === 'custom'"));
  }

  EXPECT_EQ(calls, 2);
}

TEST(RuntimeGlobalsTest, EmptyGlobalsPreserveTheRuntime) {
  auto install = createRuntimeGlobalsInstaller(folly::dynamic::object());
  auto runtime = facebook::hermes::makeHermesRuntime();
  runtime->global().setProperty(*runtime, "existingValue", 7);

  install(*runtime);

  EXPECT_TRUE(evaluate(
      *runtime, "existingValue === 7 && typeof Object === 'function'"));
}

TEST(
    RuntimeGlobalsTest,
    AssignsExistingPropertiesAndPreservesFullPropertyNames) {
  auto install = createRuntimeGlobalsInstaller(
      folly::dynamic::object("existingValue", 8)("配置", "value")(
          std::string("a\0b", 3), true));
  auto runtime = facebook::hermes::makeHermesRuntime();
  runtime->global().setProperty(*runtime, "existingValue", 7);

  install(*runtime);

  EXPECT_TRUE(evaluate(
      *runtime,
      "existingValue === 8 && globalThis['配置'] === 'value' && globalThis['a\\u0000b'] === true"));
}

} // namespace facebook::react

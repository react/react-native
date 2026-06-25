/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <NativeCxxModuleExample/NativeCxxModuleExample.h>
#include <ReactCommon/TurboModuleTestFixture.h>
#include <gtest/gtest.h>
#include <cstdint>
#include <memory>
#include <optional>
#include <span>
#include <vector>

namespace facebook::react {

class NativeCxxModuleExampleTests
    : public TurboModuleTestFixture<NativeCxxModuleExample> {};

TEST_F(NativeCxxModuleExampleTests, GetArrayReturnsCorrectValues) {
  std::vector<std::optional<facebook::react::ObjectStruct>> empty;
  EXPECT_EQ(module_->getArray(*runtime_, empty), empty);

  std::vector<std::optional<ObjectStruct>> withNull = {std::nullopt};
  EXPECT_EQ(module_->getArray(*runtime_, withNull), withNull);

  std::vector<std::optional<ObjectStruct>> withObj = {ObjectStruct{1, "2"}};
  auto result = module_->getArray(*runtime_, withObj);
  ASSERT_EQ(result.size(), 1);
  EXPECT_EQ(result[0]->a, 1);
  EXPECT_EQ(result[0]->b, "2");
}

TEST_F(NativeCxxModuleExampleTests, GetArrayBufferReturnsCorrectValues) {
  auto eval = runtime_->global().getPropertyAsFunction(*runtime_, "eval");
  jsi::ArrayBuffer buf = eval.call(*runtime_, "new Uint8Array([1,2,3]).buffer")
                             .getObject(*runtime_)
                             .getArrayBuffer(*runtime_);
  jsi::ArrayBuffer out = module_->getArrayBuffer(*runtime_, std::move(buf));
  EXPECT_EQ(out.size(*runtime_), 3);
  auto bytes = std::span(out.data(*runtime_), out.size(*runtime_));
  EXPECT_EQ(bytes[0], 1);
  EXPECT_EQ(bytes[1], 2);
  EXPECT_EQ(bytes[2], 3);
}

TEST_F(NativeCxxModuleExampleTests, CreateNativeBufferReturnsCorrectSize) {
  jsi::ArrayBuffer buf = module_->createNativeBuffer(*runtime_, 42);
  EXPECT_EQ(buf.size(*runtime_), 42);
}

TEST_F(NativeCxxModuleExampleTests, GetBoolReturnsCorrectValues) {
  EXPECT_FALSE(module_->getBool(*runtime_, false));
  EXPECT_TRUE(module_->getBool(*runtime_, true));
}

TEST_F(NativeCxxModuleExampleTests, GetConstantsReturnsCorrectValues) {
  auto constants = module_->getConstants(*runtime_);
  EXPECT_TRUE(constants.const1);
  EXPECT_EQ(constants.const2, 69);
  EXPECT_EQ(constants.const3, "react-native");
}

TEST_F(NativeCxxModuleExampleTests, GetCustomEnumReturnsCorrectValue) {
  EXPECT_EQ(
      module_->getCustomEnum(*runtime_, CustomEnumInt::A), CustomEnumInt::A);
}

TEST_F(NativeCxxModuleExampleTests, GetAndConsumeCustomHostObject) {
  auto hostObj = module_->getCustomHostObject(*runtime_);
  ASSERT_NE(hostObj, nullptr);
  EXPECT_EQ(module_->consumeCustomHostObject(*runtime_, hostObj), "answer42");
}

TEST_F(NativeCxxModuleExampleTests, GetBinaryTreeNodeReturnsCorrectValues) {
  auto result = module_->getBinaryTreeNode(
      *runtime_,
      BinaryTreeNode{
          .left = std::make_unique<BinaryTreeNode>(
              BinaryTreeNode{nullptr, 2, nullptr}),
          .value = 4,
          .right = std::make_unique<BinaryTreeNode>(
              BinaryTreeNode{nullptr, 6, nullptr})});
  ASSERT_NE(result.left, nullptr);
  EXPECT_EQ(result.left->value, 2);
  EXPECT_EQ(result.value, 4);
  ASSERT_NE(result.right, nullptr);
  EXPECT_EQ(result.right->value, 6);
}

TEST_F(NativeCxxModuleExampleTests, GetGraphNodeReturnsCorrectValues) {
  GraphNode input{
      .label = "root",
      .neighbors = std::vector<GraphNode>{
          GraphNode{.label = "child1"}, GraphNode{.label = "child2"}}};
  auto result = module_->getGraphNode(*runtime_, input);
  EXPECT_EQ(result.label, "root");
  ASSERT_EQ(result.neighbors.value().size(), 4);
  EXPECT_EQ(result.neighbors.value()[0].label, "child1");
  EXPECT_EQ(result.neighbors.value()[1].label, "child2");
  EXPECT_EQ(result.neighbors.value()[2].label, "top");
  EXPECT_EQ(result.neighbors.value()[3].label, "down");
}

TEST_F(NativeCxxModuleExampleTests, GetNumEnumReturnsCorrectValues) {
  EXPECT_EQ(
      module_->getNumEnum(*runtime_, NativeCxxModuleExampleEnumInt::IA),
      NativeCxxModuleExampleEnumInt::IA);
  EXPECT_EQ(
      module_->getNumEnum(*runtime_, NativeCxxModuleExampleEnumInt::IB),
      NativeCxxModuleExampleEnumInt::IB);
}

TEST_F(NativeCxxModuleExampleTests, GetStrEnumReturnsCorrectValues) {
  EXPECT_EQ(
      module_->getStrEnum(*runtime_, NativeCxxModuleExampleEnumNone::NA),
      NativeCxxModuleExampleEnumStr::SB);
  EXPECT_EQ(
      module_->getStrEnum(*runtime_, NativeCxxModuleExampleEnumNone::NB),
      NativeCxxModuleExampleEnumStr::SB);
}

TEST_F(NativeCxxModuleExampleTests, GetMapReturnsCorrectValues) {
  std::map<std::string, std::optional<int32_t>> input = {
      {"a", 0}, {"b", std::nullopt}, {"c", 3}};
  auto result = module_->getMap(*runtime_, input);
  EXPECT_EQ(result["a"], 0);
  EXPECT_EQ(result["b"], std::nullopt);
  EXPECT_EQ(result["c"], 3);
}

TEST_F(NativeCxxModuleExampleTests, GetNumberReturnsCorrectValues) {
  EXPECT_EQ(module_->getNumber(*runtime_, 0), 0);
  EXPECT_EQ(module_->getNumber(*runtime_, pow(2, 53)), pow(2, 53));
}

TEST_F(NativeCxxModuleExampleTests, GetObjectReturnsCorrectValues) {
  ObjectStruct input1{2, "two"};
  auto result1 = module_->getObject(*runtime_, input1);
  EXPECT_EQ(result1.a, 2);
  EXPECT_EQ(result1.b, "two");
  ObjectStruct input2{4, "four", "seven"};
  auto result2 = module_->getObject(*runtime_, input2);
  EXPECT_EQ(result2.a, 4);
  EXPECT_EQ(result2.b, "four");
  EXPECT_EQ(result2.c, "seven");
}

TEST_F(NativeCxxModuleExampleTests, GetSetReturnsCorrectValues) {
  std::set<float> input = {1, 2, 3, 3, 3};
  auto result = module_->getSet(*runtime_, input);
  EXPECT_EQ(result.size(), 3);
  EXPECT_TRUE(result.count(1));
  EXPECT_TRUE(result.count(2));
  EXPECT_TRUE(result.count(3));
}

TEST_F(NativeCxxModuleExampleTests, GetStringReturnsCorrectValues) {
  EXPECT_EQ(module_->getString(*runtime_, ""), "");
  EXPECT_EQ(module_->getString(*runtime_, "string"), "string");
}

TEST_F(NativeCxxModuleExampleTests, GetValueReturnsCorrectValues) {
  ObjectStruct z{4, "four", "seven"};
  auto result = module_->getValue(*runtime_, 23, "forty-two", z);
  EXPECT_EQ(result.x, 23);
  EXPECT_EQ(result.y, "forty-two");
  EXPECT_EQ(result.z.a, 4);
  EXPECT_EQ(result.z.b, "four");
  EXPECT_EQ(result.z.c, "seven");
}

TEST_F(NativeCxxModuleExampleTests, GetValueWithPromiseReturnsCorrectValues) {
  auto promise1 = module_->getValueWithPromise(*runtime_, false);
  auto result = resolvePromise(promise1);
  EXPECT_EQ(result, "result!");

  auto promise2 = module_->getValueWithPromise(*runtime_, true);
  auto message = handleError(promise2);
  EXPECT_EQ(message, "intentional promise rejection");
}

TEST_F(
    NativeCxxModuleExampleTests,
    GetWithWithOptionalArgsReturnsCorrectValues) {
  EXPECT_EQ(
      module_->getWithWithOptionalArgs(*runtime_, std::nullopt), std::nullopt);
  EXPECT_EQ(module_->getWithWithOptionalArgs(*runtime_, true), true);
  EXPECT_EQ(module_->getWithWithOptionalArgs(*runtime_, false), false);
}

TEST_F(NativeCxxModuleExampleTests, VoidFunEmitsEvents) {
  int onPressCalled = 0;
  std::string onClickCalled;
  auto onPressSubscription = addEventEmitterListener<>(
      *runtime_, "onPress", [&]() { onPressCalled++; });
  addEventEmitterListener<std::string>(
      *runtime_, "onClick", [&](const std::string& event) {
        onClickCalled = event;
      });
  module_->voidFunc(*runtime_);
  jsInvoker_->flushQueue();
  EXPECT_EQ(onPressCalled, 1);
  EXPECT_EQ(onClickCalled, "value from callback on click!");

  onPressSubscription.remove();
  jsInvoker_->flushQueue();

  module_->voidFunc(*runtime_);
  jsInvoker_->flushQueue();
  EXPECT_EQ(onPressCalled, 1);
}
} // namespace facebook::react

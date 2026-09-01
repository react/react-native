/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ReactCommon/TurboModuleManager.h>

#include <gtest/gtest.h>

#include <memory>

namespace facebook::react {

namespace {

class TestCallInvoker final : public CallInvoker {
 public:
  void invokeAsync(CallFunc&& /*func*/) noexcept override {}
  void invokeSync(CallFunc&& /*func*/) override {}
};

class TestNativeMethodCallInvoker final : public NativeMethodCallInvoker {
 public:
  void invokeAsync(
      const std::string& /*methodName*/,
      NativeMethodCallFunc&& /*func*/) noexcept override {}
  void invokeSync(
      const std::string& /*methodName*/,
      NativeMethodCallFunc&& /*func*/) override {}
};

} // namespace

TEST(TurboModuleManagerTest, testInitHybridRetainsInvokersFromHolders) {
  std::weak_ptr<CallInvoker> weakJsCallInvoker;
  std::weak_ptr<NativeMethodCallInvoker> weakNativeMethodCallInvoker;

  auto hybridData = [&]() {
    auto jsCallInvoker = std::make_shared<TestCallInvoker>();
    auto nativeMethodCallInvoker =
        std::make_shared<TestNativeMethodCallInvoker>();
    weakJsCallInvoker = jsCallInvoker;
    weakNativeMethodCallInvoker = nativeMethodCallInvoker;

    auto jsCallInvokerHolder =
        CallInvokerHolder::newObjectCxxArgs(jsCallInvoker);
    auto nativeMethodCallInvokerHolder =
        NativeMethodCallInvokerHolder::newObjectCxxArgs(
            nativeMethodCallInvoker);
    facebook::jni::alias_ref<TurboModuleManager::jhybridobject> unusedJavaPart;
    facebook::jni::alias_ref<TurboModuleManagerDelegate::javaobject>
        nullDelegate;

    return TurboModuleManager::initHybrid(
        unusedJavaPart,
        jsCallInvokerHolder,
        nativeMethodCallInvokerHolder,
        nullDelegate);
  }();

  ASSERT_NE(nullptr, hybridData);
  // The holders and original shared_ptrs died inside the factory lambda.
  // The returned HybridData owns the manager that must retain both invokers.
  EXPECT_FALSE(weakJsCallInvoker.expired());
  EXPECT_FALSE(weakNativeMethodCallInvoker.expired());
}

} // namespace facebook::react

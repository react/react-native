/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "YGJNIVanilla.h"

#include <algorithm>
#include <bit>
#include <cstdint>
#include <cstring>
#include <memory>
#include <stdexcept>
#include <vector>

#include <gtest/gtest.h>
#include <jni.h>
#include <yoga/Yoga.h>

namespace {

struct RegistrationState {
  std::vector<JNINativeMethod> methods;
};

// JNI callbacks cannot capture fixture state, so the active fixture installs
// its state for the duration of each test.
// NOLINTNEXTLINE(facebook-avoid-non-const-global-variables)
RegistrationState* gRegistrationState = nullptr;

jclass findClass(JNIEnv*, const char*) {
  static _jclass clazz;
  return &clazz;
}

jint registerNatives(
    JNIEnv*,
    jclass,
    const JNINativeMethod* methods,
    jint methodCount) {
  gRegistrationState->methods.assign(methods, methods + methodCount);
  return JNI_OK;
}

JNINativeInterface makeNativeInterface() {
  JNINativeInterface table{};
  table.FindClass = findClass;
  table.RegisterNatives = registerNatives;
  return table;
}

YGValue decodeYogaValue(jlong encodedValue) {
  const uint64_t bits = static_cast<uint64_t>(encodedValue);
  return YGValue{
      .value = std::bit_cast<float>(static_cast<uint32_t>(bits)),
      .unit = static_cast<YGUnit>(bits >> 32)};
}

class YGJNIVanillaTest : public ::testing::Test {
 protected:
  void SetUp() override {
    gRegistrationState = &registrationState_;
    nativeInterface_ = makeNativeInterface();
    env_.functions = &nativeInterface_;
    YGJNIVanilla::registerNatives(&env_);
  }

  void TearDown() override {
    gRegistrationState = nullptr;
  }

  template <typename Function>
  Function registeredMethod(const char* name) const {
    auto method = std::find_if(
        registrationState_.methods.begin(),
        registrationState_.methods.end(),
        [name](const JNINativeMethod& candidate) {
          return std::strcmp(candidate.name, name) == 0;
        });
    if (method == registrationState_.methods.end()) {
      throw std::runtime_error{"Native method was not registered"};
    }
    return reinterpret_cast<Function>(method->fnPtr);
  }

  JNIEnv* env() {
    return &env_;
  }

 private:
  RegistrationState registrationState_;
  JNINativeInterface nativeInterface_{};
  _JNIEnv env_{};
};

TEST_F(YGJNIVanillaTest, testConfigWebDefaultsChangeDefaultLayoutDirection) {
  using ConfigNew = jlong(JNICALL*)(JNIEnv*, jobject);
  using ConfigSetUseWebDefaults =
      void(JNICALL*)(JNIEnv*, jobject, jlong, jboolean);
  using NodeNewWithConfig = jlong(JNICALL*)(JNIEnv*, jobject, jlong);

  const auto configNew = registeredMethod<ConfigNew>("jni_YGConfigNewJNI");
  const auto setUseWebDefaults = registeredMethod<ConfigSetUseWebDefaults>(
      "jni_YGConfigSetUseWebDefaultsJNI");
  const auto nodeNewWithConfig =
      registeredMethod<NodeNewWithConfig>("jni_YGNodeNewWithConfigJNI");

  const jlong configHandle = configNew(env(), nullptr);
  auto config = std::unique_ptr<YGConfig, decltype(&YGConfigFree)>{
      reinterpret_cast<YGConfigRef>(configHandle), &YGConfigFree};
  setUseWebDefaults(env(), nullptr, configHandle, JNI_TRUE);

  const jlong rootHandle = nodeNewWithConfig(env(), nullptr, configHandle);
  auto root = std::unique_ptr<YGNode, decltype(&YGNodeFree)>{
      reinterpret_cast<YGNodeRef>(rootHandle), &YGNodeFree};
  YGNodeRef firstChild = YGNodeNew();
  YGNodeStyleSetWidth(firstChild, 10.0F);
  YGNodeStyleSetHeight(firstChild, 20.0F);
  YGNodeInsertChild(root.get(), firstChild, 0);
  YGNodeRef secondChild = YGNodeNew();
  YGNodeStyleSetWidth(secondChild, 20.0F);
  YGNodeStyleSetHeight(secondChild, 10.0F);
  YGNodeInsertChild(root.get(), secondChild, 1);

  YGNodeCalculateLayout(root.get(), YGUndefined, YGUndefined, YGDirectionLTR);

  EXPECT_FLOAT_EQ(30.0F, YGNodeLayoutGetWidth(root.get()));
  EXPECT_FLOAT_EQ(20.0F, YGNodeLayoutGetHeight(root.get()));
  EXPECT_FLOAT_EQ(0.0F, YGNodeLayoutGetLeft(firstChild));
  EXPECT_FLOAT_EQ(10.0F, YGNodeLayoutGetLeft(secondChild));

  YGNodeRemoveChild(root.get(), firstChild);
  YGNodeRemoveChild(root.get(), secondChild);
  YGNodeFree(firstChild);
  YGNodeFree(secondChild);
}

TEST_F(YGJNIVanillaTest, testNodeResetPreservesJniEdgeTracking) {
  using NodeNew = jlong(JNICALL*)(JNIEnv*, jobject);
  using NodeReset = void(JNICALL*)(JNIEnv*, jobject, jlong);
  using NodeSetMargin = void(JNICALL*)(JNIEnv*, jobject, jlong, jint, jfloat);
  using NodeGetMargin = jlong(JNICALL*)(JNIEnv*, jobject, jlong, jint);

  const auto nodeNew = registeredMethod<NodeNew>("jni_YGNodeNewJNI");
  const auto nodeReset = registeredMethod<NodeReset>("jni_YGNodeResetJNI");
  const auto setMargin =
      registeredMethod<NodeSetMargin>("jni_YGNodeStyleSetMarginJNI");
  const auto getMargin =
      registeredMethod<NodeGetMargin>("jni_YGNodeStyleGetMarginJNI");

  const jlong nodeHandle = nodeNew(env(), nullptr);
  auto node = std::unique_ptr<YGNode, decltype(&YGNodeFree)>{
      reinterpret_cast<YGNodeRef>(nodeHandle), &YGNodeFree};
  setMargin(env(), nullptr, nodeHandle, YGEdgeLeft, 3.0F);

  nodeReset(env(), nullptr, nodeHandle);
  YGNodeStyleSetMargin(node.get(), YGEdgeLeft, 7.25F);
  const YGValue margin =
      decodeYogaValue(getMargin(env(), nullptr, nodeHandle, YGEdgeLeft));

  EXPECT_EQ(YGUnitPoint, margin.unit);
  EXPECT_FLOAT_EQ(7.25F, margin.value);
}

TEST_F(YGJNIVanillaTest, testNodeCloneRetainsIndependentEdgeTracking) {
  using NodeNew = jlong(JNICALL*)(JNIEnv*, jobject);
  using NodeClone = jlong(JNICALL*)(JNIEnv*, jobject, jlong);
  using NodeSetPadding = void(JNICALL*)(JNIEnv*, jobject, jlong, jint, jfloat);
  using NodeGetPadding = jlong(JNICALL*)(JNIEnv*, jobject, jlong, jint);

  const auto nodeNew = registeredMethod<NodeNew>("jni_YGNodeNewJNI");
  const auto nodeClone = registeredMethod<NodeClone>("jni_YGNodeCloneJNI");
  const auto setPadding =
      registeredMethod<NodeSetPadding>("jni_YGNodeStyleSetPaddingJNI");
  const auto getPadding =
      registeredMethod<NodeGetPadding>("jni_YGNodeStyleGetPaddingJNI");

  const jlong originalHandle = nodeNew(env(), nullptr);
  auto original = std::unique_ptr<YGNode, decltype(&YGNodeFree)>{
      reinterpret_cast<YGNodeRef>(originalHandle), &YGNodeFree};
  setPadding(env(), nullptr, originalHandle, YGEdgeTop, 4.5F);

  const jlong cloneHandle = nodeClone(env(), nullptr, originalHandle);
  auto clone = std::unique_ptr<YGNode, decltype(&YGNodeFree)>{
      reinterpret_cast<YGNodeRef>(cloneHandle), &YGNodeFree};
  YGNodeStyleSetPadding(clone.get(), YGEdgeTop, 9.5F);

  const YGValue originalPadding =
      decodeYogaValue(getPadding(env(), nullptr, originalHandle, YGEdgeTop));
  const YGValue clonePadding =
      decodeYogaValue(getPadding(env(), nullptr, cloneHandle, YGEdgeTop));
  EXPECT_FLOAT_EQ(4.5F, originalPadding.value);
  EXPECT_EQ(YGUnitPoint, clonePadding.unit);
  EXPECT_FLOAT_EQ(9.5F, clonePadding.value);
}

} // namespace

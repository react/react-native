/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "corefunctions.h"

#include <gtest/gtest.h>
#include <jni.h>
#include "YogaJniException.h"

namespace facebook::yoga::vanillajni {
namespace {

// A single byte handed out as opaque, never-dereferenced JNI handles (jclass,
// jobject, jthrowable, jmethodID). The functions under test only compare these
// against nullptr; they never look inside them.
char gFakeHandleStorage = 0;

template <typename T>
T fakeHandle() {
  return reinterpret_cast<T>(&gFakeHandleStorage);
}

// Overlay for JNIEnv. The real _JNIEnv is standard-layout with a single leading
// functions pointer, so a FakeEnv* can be passed anywhere a JNIEnv* is expected
// and cast back inside the interface callbacks to reach the per-instance,
// test-controlled behavior below.
struct FakeEnv {
  const JNINativeInterface* functions;

  jboolean exceptionCheckResult;
  jthrowable exceptionOccurredResult;
  jobject newGlobalRefResult;
  jclass findClassResult;
  jmethodID getMethodIdResult;
  jobject newObjectResult;

  int exceptionCheckCalls;
  int exceptionClearCalls;
};

struct FakeVm {
  const JNIInvokeInterface* functions;
  JNIEnv* envToReturn;
  jint getEnvResult;
};

FakeEnv* asFake(JNIEnv* env) {
  return reinterpret_cast<FakeEnv*>(env);
}

jboolean fakeExceptionCheck(JNIEnv* env) {
  auto* self = asFake(env);
  ++self->exceptionCheckCalls;
  return self->exceptionCheckResult;
}

jthrowable fakeExceptionOccurred(JNIEnv* env) {
  return asFake(env)->exceptionOccurredResult;
}

void fakeExceptionClear(JNIEnv* env) {
  ++asFake(env)->exceptionClearCalls;
}

jobject fakeNewGlobalRef(JNIEnv* env, jobject /*obj*/) {
  return asFake(env)->newGlobalRefResult;
}

void fakeDeleteGlobalRef(JNIEnv* /*env*/, jobject /*obj*/) {}

jclass fakeFindClass(JNIEnv* env, const char* /*name*/) {
  return asFake(env)->findClassResult;
}

jmethodID fakeGetMethodID(
    JNIEnv* env,
    jclass /*clazz*/,
    const char* /*name*/,
    const char* /*sig*/) {
  return asFake(env)->getMethodIdResult;
}

jobject fakeNewObjectV(
    JNIEnv* env,
    jclass /*clazz*/,
    jmethodID /*methodId*/,
    va_list /*args*/) {
  return asFake(env)->newObjectResult;
}

const JNINativeInterface& fakeNativeInterface() {
  static const JNINativeInterface table = [] {
    JNINativeInterface t{};
    t.ExceptionCheck = &fakeExceptionCheck;
    t.ExceptionOccurred = &fakeExceptionOccurred;
    t.ExceptionClear = &fakeExceptionClear;
    t.NewGlobalRef = &fakeNewGlobalRef;
    t.DeleteGlobalRef = &fakeDeleteGlobalRef;
    t.FindClass = &fakeFindClass;
    t.GetMethodID = &fakeGetMethodID;
    t.NewObjectV = &fakeNewObjectV;
    return t;
  }();
  return table;
}

jint fakeGetEnv(JavaVM* vm, void** out, jint /*version*/) {
  auto* self = reinterpret_cast<FakeVm*>(vm);
  *out = self->envToReturn;
  return self->getEnvResult;
}

const JNIInvokeInterface& fakeInvokeInterface() {
  static const JNIInvokeInterface table = [] {
    JNIInvokeInterface t{};
    t.GetEnv = &fakeGetEnv;
    return t;
  }();
  return table;
}

// getCurrentEnv() (invoked while wrapping a Java exception into a
// YogaJniException) reads a process-global JavaVM that is latched exactly once
// by the first ensureInitialized() call, so it must stay valid for the entire
// process. This plumbing env/VM exists solely to satisfy that constraint: it
// returns constant, non-null JNI handles and is never mutated by any test.
// All per-test, mutable state lives on each fixture's own FakeEnv, so tests
// stay fully isolated from one another.
FakeEnv& plumbingEnv() {
  static FakeEnv env{
      .functions = &fakeNativeInterface(),
      .exceptionCheckResult = JNI_FALSE,
      .exceptionOccurredResult = fakeHandle<jthrowable>(),
      .newGlobalRefResult = fakeHandle<jobject>(),
      .findClassResult = fakeHandle<jclass>(),
      .getMethodIdResult = fakeHandle<jmethodID>(),
      .newObjectResult = fakeHandle<jobject>(),
      .exceptionCheckCalls = 0,
      .exceptionClearCalls = 0};
  return env;
}

JNIEnv* plumbingJniEnv() {
  return reinterpret_cast<JNIEnv*>(&plumbingEnv());
}

FakeVm& plumbingVm() {
  static FakeVm vm{
      .functions = &fakeInvokeInterface(),
      .envToReturn = plumbingJniEnv(),
      .getEnvResult = JNI_OK};
  return vm;
}

JavaVM* plumbingJavaVm() {
  return reinterpret_cast<JavaVM*>(&plumbingVm());
}

class CoreFunctionsTest : public ::testing::Test {
 protected:
  // Latch the process-global JavaVM exactly once for the whole suite so that
  // getCurrentEnv() (used when wrapping exceptions) has a valid, stable env.
  static void SetUpTestSuite() {
    JNIEnv* out = nullptr;
    ensureInitialized(&out, plumbingJavaVm());
  }

  void SetUp() override {
    env_ = FakeEnv{
        .functions = &fakeNativeInterface(),
        .exceptionCheckResult = JNI_FALSE,
        .exceptionOccurredResult = fakeHandle<jthrowable>(),
        .newGlobalRefResult = fakeHandle<jobject>(),
        .findClassResult = fakeHandle<jclass>(),
        .getMethodIdResult = fakeHandle<jmethodID>(),
        .newObjectResult = fakeHandle<jobject>(),
        .exceptionCheckCalls = 0,
        .exceptionClearCalls = 0};
  }

  JNIEnv* env() {
    return reinterpret_cast<JNIEnv*>(&env_);
  }

  // Owned per test instance; each test observes and mutates only its own copy.
  FakeEnv env_{};
};

TEST_F(CoreFunctionsTest, ensureInitializedReturnsVersionAndPopulatesEnv) {
  JNIEnv* out = nullptr;

  jint result = ensureInitialized(&out, plumbingJavaVm());

  EXPECT_EQ(JNI_VERSION_1_6, result);
  // The out-param must be populated with the JNIEnv that the VM GetEnv hook
  // wrote, not left untouched.
  EXPECT_EQ(plumbingJniEnv(), out);
}

TEST_F(CoreFunctionsTest, assertNoPendingJniExceptionReturnsWhenNoException) {
  env_.exceptionCheckResult = JNI_FALSE;

  EXPECT_NO_THROW(assertNoPendingJniException(env()));
  // A clean env must be left alone: no attempt to clear a (non-existent)
  // pending exception.
  EXPECT_EQ(0, env_.exceptionClearCalls);
}

TEST_F(CoreFunctionsTest, assertNoPendingJniExceptionClearsAndWrapsPending) {
  env_.exceptionCheckResult = JNI_TRUE;
  env_.exceptionOccurredResult = fakeHandle<jthrowable>();

  EXPECT_THROW(assertNoPendingJniException(env()), YogaJniException);
  // The pending Java exception must be cleared exactly once before it is
  // rethrown as a C++ exception, otherwise it would leak into the next JNI
  // call.
  EXPECT_EQ(1, env_.exceptionClearCalls);
}

TEST_F(
    CoreFunctionsTest,
    assertNoPendingJniExceptionIfSkipsCheckWhenConditionFalse) {
  // Arrange a pending exception that would throw if it were inspected.
  env_.exceptionCheckResult = JNI_TRUE;
  env_.exceptionOccurredResult = fakeHandle<jthrowable>();

  EXPECT_NO_THROW(assertNoPendingJniExceptionIf(env(), false));
  // With a false condition the env must not be probed at all.
  EXPECT_EQ(0, env_.exceptionCheckCalls);
}

TEST_F(
    CoreFunctionsTest,
    assertNoPendingJniExceptionIfThrowsWhenConditionTrueWithoutPending) {
  // Condition is true but there is no pending JNI exception, so the function
  // must still surface a failure by synthesizing a YogaJniException.
  env_.exceptionCheckResult = JNI_FALSE;

  EXPECT_THROW(assertNoPendingJniExceptionIf(env(), true), YogaJniException);
}

} // namespace
} // namespace facebook::yoga::vanillajni

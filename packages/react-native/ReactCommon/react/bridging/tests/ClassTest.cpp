/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BridgingTest.h"

#include <utility>

namespace facebook::react {

using namespace std::literals;

struct TestClass {
  explicit TestClass(std::shared_ptr<CallInvoker> invoker)
      : invoker_(std::move(invoker)) {}

  double add(jsi::Runtime& /*unused*/, int a, float b) {
    return a + b;
  }

  jsi::Object getObject(jsi::Runtime& /*unused*/, jsi::Object obj) {
    return obj;
  }

  AsyncPromise<std::string> getPromise(jsi::Runtime& rt, std::string result) {
    auto promise = AsyncPromise<std::string>(rt, invoker_);
    promise.resolve(std::move(result));
    return promise;
  }

  std::string callFunc(
      jsi::Runtime& /*unused*/,
      SyncCallback<std::string(int)> func,
      int num) {
    return func(num);
  }

  void callAsync(jsi::Runtime& /*unused*/, const AsyncCallback<>& callback) {
    callback();
  }

  size_t byteLength(jsi::Runtime& rt, jsi::ArrayBuffer buffer) {
    return buffer.size(rt);
  }

  jsi::ArrayBuffer echo(jsi::Runtime& /*unused*/, jsi::ArrayBuffer buffer) {
    return buffer;
  }

  size_t keyCount(jsi::Runtime& rt, const jsi::Object& obj) {
    return obj.getPropertyNames(rt).size(rt);
  }

  double callFunction(jsi::Runtime& rt, const jsi::Function& func) {
    return func.call(rt).asNumber();
  }

  bool isObject(jsi::Runtime& /*unused*/, const jsi::Value& value) {
    return value.isObject();
  }

 private:
  std::shared_ptr<CallInvoker> invoker_;
};

TEST_F(BridgingTest, callFromJsTest) {
  auto instance = TestClass(invoker);

  EXPECT_EQ(
      3.0,
      bridging::callFromJs<double>(
          rt, &TestClass::add, invoker, &instance, 1, 2.0));

  auto object = jsi::Object(rt);

  EXPECT_TRUE(
      jsi::Object::strictEquals(
          rt,
          object,
          bridging::callFromJs<jsi::Object>(
              rt, &TestClass::getObject, invoker, &instance, object)));

  auto promise = bridging::callFromJs<jsi::Object>(
      rt,
      &TestClass::getPromise,
      invoker,
      &instance,
      jsi::String::createFromAscii(rt, "hi"));
  auto then = promise.getPropertyAsFunction(rt, "then");

  std::string result;
  then.callWithThis(
      rt,
      promise,
      bridging::toJs(
          rt, [&](std::string res) { result = std::move(res); }, invoker));

  flushQueue();
  EXPECT_EQ("hi"s, result);

  auto func = function("(num) => String(num)");

  EXPECT_EQ(
      "1"s,
      bridging::callFromJs<jsi::String>(
          rt, &TestClass::callFunc, invoker, &instance, func, 1)
          .utf8(rt));

  bool called = false;
  func = bridging::toJs(rt, [&] { called = true; }, invoker);

  bridging::callFromJs<void>(
      rt, &TestClass::callAsync, invoker, &instance, func);

  flushQueue();
  EXPECT_TRUE(called);
}

TEST_F(BridgingTest, arrayBufferCallFromJsTest) {
  auto instance = TestClass(invoker);
  auto buf = eval("new ArrayBuffer(5)").asObject(rt).getArrayBuffer(rt);
  EXPECT_EQ(
      5,
      bridging::callFromJs<size_t>(
          rt, &TestClass::byteLength, invoker, &instance, std::move(buf)));

  auto buf2 = eval("new ArrayBuffer(9)").asObject(rt).getArrayBuffer(rt);
  auto out = bridging::callFromJs<jsi::ArrayBuffer>(
      rt, &TestClass::echo, invoker, &instance, std::move(buf2));
  EXPECT_EQ(9, out.size(rt));
}

TEST_F(BridgingTest, jsiReferenceArgumentCallFromJsTest) {
  // Converting to a JSI reference type must yield an owned value, not a
  // reference to a temporary destroyed inside fromJs.
  static_assert(
      !std::is_reference_v<decltype(bridging::fromJs<const jsi::Object&>(
          rt, std::declval<jsi::Object>(), invoker))>);
  static_assert(
      !std::is_reference_v<decltype(bridging::fromJs<const jsi::Function&>(
          rt, std::declval<const jsi::Value&>(), invoker))>);
  static_assert(
      !std::is_reference_v<decltype(bridging::fromJs<const jsi::Value&>(
          rt, std::declval<jsi::Value>(), invoker))>);

  auto instance = TestClass(invoker);

  // Methods taking JSI values by const reference must be called with a value
  // that outlives the call, both for rvalue and lvalue arguments.
  EXPECT_EQ(
      2,
      bridging::callFromJs<size_t>(
          rt,
          &TestClass::keyCount,
          invoker,
          &instance,
          eval("({opacity: 0.5, width: 10})").asObject(rt)));

  auto object = eval("({opacity: 0.5, width: 10})").asObject(rt);
  EXPECT_EQ(
      2,
      bridging::callFromJs<size_t>(
          rt, &TestClass::keyCount, invoker, &instance, object));

  EXPECT_EQ(
      42.0,
      bridging::callFromJs<double>(
          rt,
          &TestClass::callFunction,
          invoker,
          &instance,
          function("() => 42")));

  EXPECT_TRUE(
      bridging::callFromJs<bool>(
          rt,
          &TestClass::isObject,
          invoker,
          &instance,
          eval("({opacity: 0.5})")));

  auto value = eval("({opacity: 0.5})");
  EXPECT_TRUE(
      bridging::callFromJs<bool>(
          rt, &TestClass::isObject, invoker, &instance, value));
}

struct MethodReturnTypeCastingTestObject {
 public:
  explicit MethodReturnTypeCastingTestObject(int value) : value_(value) {}

  int toInteger() const {
    return value_;
  }

 private:
  int value_;
};

template <>
struct Bridging<MethodReturnTypeCastingTestObject> {
  static MethodReturnTypeCastingTestObject fromJs(
      jsi::Runtime& /*rt*/,
      const jsi::Value& value) {
    return MethodReturnTypeCastingTestObject(
        static_cast<int>(value.asNumber()));
  }

  static int toJs(
      jsi::Runtime& /*rt*/,
      const MethodReturnTypeCastingTestObject& value) {
    return value.toInteger();
  }
};

struct MethodReturnTypeCastingTestClass {
  explicit MethodReturnTypeCastingTestClass(
      std::shared_ptr<CallInvoker> invoker)
      : invoker_(std::move(invoker)) {}

  // This is the key, return type is not a primitive, but an object with defined
  // bridging template.
  MethodReturnTypeCastingTestObject
  add(jsi::Runtime& /*unused*/, int a, int b) {
    return MethodReturnTypeCastingTestObject(a + b);
  }

 private:
  std::shared_ptr<CallInvoker> invoker_;
};

TEST_F(BridgingTest, methodReturnTypeCastingTest) {
  auto instance = MethodReturnTypeCastingTestClass(invoker);

  EXPECT_EQ(
      2,
      bridging::callFromJs<int>(
          rt,
          &MethodReturnTypeCastingTestClass::add,
          invoker,
          &instance,
          1,
          1));
}

} // namespace facebook::react

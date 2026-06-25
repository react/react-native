/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <span>
#include <utility>

#include "BridgingTest.h"

namespace facebook::react {

using namespace std::literals;

TEST_F(BridgingTest, jsiTest) {
  jsi::Value value = true;
  jsi::Value string = jsi::String::createFromAscii(rt, "hello");
  jsi::Value object = jsi::Object(rt);
  jsi::Value array = jsi::Array::createWithElements(rt, value, object);
  jsi::Value func = function("() => {}");
  jsi::Value arrayBuffer = eval("new ArrayBuffer(0)");

  // The bridging mechanism needs to know how to copy and downcast values.
  EXPECT_NO_THROW(bridging::fromJs<jsi::Value>(rt, value, invoker));
  EXPECT_NO_THROW(bridging::fromJs<jsi::String>(rt, string, invoker));
  EXPECT_NO_THROW(bridging::fromJs<jsi::Object>(rt, object, invoker));
  EXPECT_NO_THROW(bridging::fromJs<jsi::Array>(rt, array, invoker));
  EXPECT_NO_THROW(bridging::fromJs<jsi::Function>(rt, func, invoker));
  EXPECT_NO_THROW(bridging::fromJs<jsi::ArrayBuffer>(rt, arrayBuffer, invoker));

  // Should throw when attempting an invalid cast.
  EXPECT_JSI_THROW(bridging::fromJs<jsi::Object>(rt, value, invoker));
  EXPECT_JSI_THROW(bridging::fromJs<jsi::String>(rt, array, invoker));
  EXPECT_JSI_THROW(bridging::fromJs<jsi::Array>(rt, object, invoker));
  EXPECT_JSI_THROW(bridging::fromJs<jsi::Array>(rt, string, invoker));
  EXPECT_JSI_THROW(bridging::fromJs<jsi::Array>(rt, func, invoker));
  EXPECT_JSI_THROW(bridging::fromJs<jsi::ArrayBuffer>(rt, value, invoker));

  // Should be able to generically no-op convert JSI.
  EXPECT_NO_THROW(bridging::toJs(rt, value, invoker));
  EXPECT_NO_THROW(bridging::toJs(rt, string.asString(rt), invoker));
  EXPECT_NO_THROW(bridging::toJs(rt, object.asObject(rt), invoker));
  EXPECT_NO_THROW(bridging::toJs(rt, array.asObject(rt).asArray(rt), invoker));
  EXPECT_NO_THROW(
      bridging::toJs(rt, func.asObject(rt).asFunction(rt), invoker));
}

TEST_F(BridgingTest, boolTest) {
  EXPECT_TRUE(bridging::fromJs<bool>(rt, jsi::Value(true), invoker));
  EXPECT_FALSE(bridging::fromJs<bool>(rt, jsi::Value(false), invoker));
  EXPECT_JSI_THROW(bridging::fromJs<bool>(rt, jsi::Value(1), invoker));

  EXPECT_TRUE(bridging::toJs(rt, true));
  EXPECT_FALSE(bridging::toJs(rt, false));
}

TEST_F(BridgingTest, numberTest) {
  EXPECT_EQ(1, bridging::fromJs<int>(rt, jsi::Value(1), invoker));
  EXPECT_FLOAT_EQ(1.2f, bridging::fromJs<float>(rt, jsi::Value(1.2), invoker));
  EXPECT_DOUBLE_EQ(1.2, bridging::fromJs<double>(rt, jsi::Value(1.2), invoker));
  EXPECT_JSI_THROW(bridging::fromJs<double>(rt, jsi::Value(true), invoker));

  EXPECT_EQ(1, static_cast<int>(bridging::toJs(rt, 1)));
  EXPECT_FLOAT_EQ(1.2f, static_cast<float>(bridging::toJs(rt, 1.2f)));
  EXPECT_DOUBLE_EQ(1.2, bridging::toJs(rt, 1.2));

  EXPECT_EQ(
      42,
      static_cast<uint32_t>(
          bridging::toJs(rt, static_cast<uint32_t>(42)).asNumber()));

  EXPECT_EQ(
      -42,
      static_cast<uint32_t>(
          bridging::toJs(rt, static_cast<uint32_t>(-42)).asNumber()));
}

TEST_F(BridgingTest, stringTest) {
  auto string = jsi::String::createFromAscii(rt, "hello");

  EXPECT_EQ("hello"s, bridging::fromJs<std::string>(rt, string, invoker));
  EXPECT_JSI_THROW(bridging::fromJs<std::string>(rt, jsi::Value(1), invoker));

  EXPECT_TRUE(
      jsi::String::strictEquals(rt, string, bridging::toJs(rt, "hello")));
  EXPECT_TRUE(
      jsi::String::strictEquals(rt, string, bridging::toJs(rt, "hello"s)));
  EXPECT_TRUE(
      jsi::String::strictEquals(rt, string, bridging::toJs(rt, "hello"sv)));
}

TEST_F(BridgingTest, objectTest) {
  auto object = jsi::Object(rt);
  object.setProperty(rt, "foo", "bar");

  auto omap =
      bridging::fromJs<std::map<std::string, std::string>>(rt, object, invoker);
  auto umap = bridging::fromJs<std::unordered_map<std::string, std::string>>(
      rt, object, invoker);

  EXPECT_EQ(1, omap.size());
  EXPECT_EQ(1, umap.size());
  EXPECT_EQ("bar"s, omap["foo"]);
  EXPECT_EQ("bar"s, umap["foo"]);

  EXPECT_EQ(
      "bar"s,
      bridging::toJs(rt, omap, invoker)
          .getProperty(rt, "foo")
          .asString(rt)
          .utf8(rt));
  EXPECT_EQ(
      "bar"s,
      bridging::toJs(rt, umap, invoker)
          .getProperty(rt, "foo")
          .asString(rt)
          .utf8(rt));
}

TEST_F(BridgingTest, hostObjectTest) {
  struct TestHostObject : public jsi::HostObject {
    jsi::Value get(jsi::Runtime& rt, const jsi::PropNameID& name) override {
      if (name.utf8(rt) == "test") {
        return {1};
      }
      return jsi::Value::undefined();
    }
  };

  auto hostobject = std::make_shared<TestHostObject>();
  auto object = bridging::toJs(rt, hostobject);

  EXPECT_EQ(1, object.getProperty(rt, "test").asNumber());
  EXPECT_EQ(
      hostobject, bridging::fromJs<decltype(hostobject)>(rt, object, invoker));
}

TEST_F(BridgingTest, weakbjectTest) {
  auto object = jsi::Object(rt);
  auto weakobject = jsi::WeakObject(rt, object);

  EXPECT_TRUE(
      jsi::Object::strictEquals(
          rt,
          object,
          bridging::fromJs<jsi::WeakObject>(rt, object, invoker)
              .lock(rt)
              .asObject(rt)));

  EXPECT_TRUE(
      jsi::Object::strictEquals(
          rt, object, bridging::toJs(rt, weakobject).asObject(rt)));
}

TEST_F(BridgingTest, arrayTest) {
  auto vec = std::vector({"foo"s, "bar"s});
  auto array = jsi::Array::createWithElements(rt, "foo", "bar");

  EXPECT_EQ(
      vec, bridging::fromJs<std::vector<std::string>>(rt, array, invoker));
  auto arr = bridging::fromJs<std::array<std::string, 2>>(rt, array, invoker);
  EXPECT_EQ(vec[0], arr[0]);
  EXPECT_EQ(vec[1], arr[1]);
  auto pair =
      bridging::fromJs<std::pair<std::string, std::string>>(rt, array, invoker);
  EXPECT_EQ(vec[0], pair.first);
  EXPECT_EQ(vec[1], pair.second);

  EXPECT_EQ(vec.size(), bridging::toJs(rt, vec, invoker).size(rt));
  for (size_t i = 0; i < vec.size(); i++) {
    EXPECT_EQ(
        vec[i],
        bridging::toJs(rt, vec, invoker)
            .getValueAtIndex(rt, i)
            .asString(rt)
            .utf8(rt));
  }

  EXPECT_EQ(2, bridging::toJs(rt, std::make_pair(1, "2"), invoker).size(rt));
  EXPECT_EQ(2, bridging::toJs(rt, std::make_tuple(1, "2"), invoker).size(rt));
  EXPECT_EQ(2, bridging::toJs(rt, std::array<int, 2>{1, 2}, invoker).size(rt));
  EXPECT_EQ(
      2,
      bridging::toJs(rt, std::array<std::string, 2>{"1", "2"}, invoker)
          .size(rt));
  EXPECT_EQ(2, bridging::toJs(rt, std::deque<int>{1, 2}, invoker).size(rt));
  EXPECT_EQ(2, bridging::toJs(rt, std::list<int>{1, 2}, invoker).size(rt));
  EXPECT_EQ(
      2,
      bridging::toJs(rt, std::initializer_list<int>{1, 2}, invoker).size(rt));

  std::vector<std::array<std::string, 2>> headers{
      {"foo", "bar"}, {"baz", "qux"}};
  auto jsiHeaders = bridging::toJs(rt, headers, invoker);
  EXPECT_EQ(headers.size(), jsiHeaders.size(rt));
}

TEST_F(BridgingTest, functionTest) {
  auto object = jsi::Object(rt);
  object.setProperty(rt, "foo", "bar");

  auto lambda = [](std::map<std::string, std::string> map,
                   const std::string& key) { return map[key]; };

  auto func = bridging::toJs(rt, lambda, invoker);

  EXPECT_EQ(
      "bar"s,
      func.call(rt, object, jsi::String::createFromAscii(rt, "foo"))
          .asString(rt)
          .utf8(rt));

  // Should throw if not enough arguments are passed or are the wrong types.
  EXPECT_JSI_THROW(func.call(rt, object));
  EXPECT_JSI_THROW(func.call(rt, object, jsi::Value(1)));

  // Test with non-capturing lambda converted to function pointer.
  func = bridging::toJs(rt, +lambda, invoker);

  EXPECT_EQ(
      "bar"s,
      func.call(rt, object, jsi::String::createFromAscii(rt, "foo"))
          .asString(rt)
          .utf8(rt));
}

TEST_F(BridgingTest, syncCallbackTest) {
  auto fn = function("(a, b) => a + b");
  auto cb = bridging::fromJs<SyncCallback<std::string(std::string, int)>>(
      rt, fn, invoker);
  auto foo = "foo"s;

  EXPECT_EQ("foo1"s, cb(foo, 1)); // Tests lvalue string
  EXPECT_EQ("bar2", cb("bar", 2)); // Tests rvalue C string
  EXPECT_TRUE(fn.isFunction(rt)); // Ensure the function wasn't invalidated.
}

TEST_F(BridgingTest, syncCallbackImplicitBridgingTest) {
  { // Value
    auto fn = function("(a, b) => a + b");
    auto cb = bridging::fromJs<SyncCallback<std::string(jsi::Value, int)>>(
        rt, fn, invoker);
    jsi::Value foo(jsi::String::createFromAscii(rt, "foo"));

    EXPECT_EQ(cb(std::move(foo), 1), "foo1");
    EXPECT_EQ(cb(jsi::String::createFromAscii(rt, "bar"), 2), "bar2");
    EXPECT_TRUE(fn.isFunction(rt));
  }
  { // Object
    auto fn = function("(a, b) => a.obj + b");
    auto cb = bridging::fromJs<SyncCallback<std::string(jsi::Object, int)>>(
        rt, fn, invoker);

    jsi::Object foo(rt);
    foo.setProperty(rt, "obj", "foo");

    EXPECT_EQ(cb(std::move(foo), 1), "foo1");
    EXPECT_TRUE(fn.isFunction(rt));
  }
  { // String
    auto fn = function("(a, b) => a + b");
    auto cb = bridging::fromJs<SyncCallback<std::string(jsi::String, int)>>(
        rt, fn, invoker);
    jsi::String foo(jsi::String::createFromAscii(rt, "foo"));

    EXPECT_EQ(cb(std::move(foo), 1), "foo1");
    EXPECT_EQ(cb(jsi::String::createFromAscii(rt, "bar"), 2), "bar2");
    EXPECT_TRUE(fn.isFunction(rt));
  }
  { // Array
    auto fn = function("(a, b) => a[0] + b");
    auto cb = bridging::fromJs<SyncCallback<std::string(jsi::Array, int)>>(
        rt, fn, invoker);

    jsi::Array foo(rt, 1);
    foo.setValueAtIndex(rt, 0, jsi::String::createFromAscii(rt, "foo"));

    EXPECT_EQ(cb(std::move(foo), 1), "foo1");
    EXPECT_TRUE(fn.isFunction(rt));
  }
}

TEST_F(BridgingTest, asyncCallbackTest) {
  std::string output;

  auto func = std::function<void(std::string)>(
      [&](auto str) { output = std::move(str); });

  auto cb = bridging::fromJs<AsyncCallback<decltype(func), std::string>>(
      rt, function("(func, str) => func(str)"), invoker);

  cb(func, "hello");

  flushQueue(); // Run scheduled async work
  EXPECT_EQ("hello"s, output);

  // Test with lambda invocation
  cb.call([func, jsInvoker = invoker](jsi::Runtime& rt, jsi::Function& f) {
    f.call(
        rt,
        bridging::toJs(rt, func, jsInvoker),
        bridging::toJs(rt, "hello again", jsInvoker));
  });

  flushQueue();
  EXPECT_EQ("hello again"s, output);
}

TEST_F(BridgingTest, asyncCallbackInvalidation) {
  std::string output;
  std::function<void(std::string)> func = [&](auto str) {
    output = std::move(str);
  };

  auto jsCallback = bridging::fromJs<AsyncCallback<>>(
      rt, bridging::toJs(rt, func, invoker), invoker);
  jsCallback.call(
      [](jsi::Runtime& rt, jsi::Function& f) { f.call(rt, "hello"); });

  // LongLivedObjectCollection goes away before callback is executed
  LongLivedObjectCollection::get(rt).clear();

  flushQueue();

  // Assert native callback is never invoked
  ASSERT_EQ(""s, output);
}

TEST_F(BridgingTest, asyncCallbackImplicitBridgingTest) {
  std::string output;
  auto func = std::function<void(std::string)>(
      [&](auto str) { output = std::move(str); });
  { // Value
    auto cb = bridging::fromJs<AsyncCallback<decltype(func), jsi::Value, int>>(
        rt, function("(func, a, b) => func(a + b)"), invoker);
    jsi::Value foo(jsi::String::createFromAscii(rt, "foo"));

    cb(func, std::move(foo), 1);
    flushQueue();
    EXPECT_EQ(output, "foo1");

    cb(func, jsi::String::createFromAscii(rt, "bar"), 2);
    flushQueue();
    EXPECT_EQ(output, "bar2");

    output.clear();
  }
  { // Object
    auto cb = bridging::fromJs<AsyncCallback<decltype(func), jsi::Object, int>>(
        rt, function("(func, a, b) => func(a.obj + b)"), invoker);

    jsi::Object foo(rt);
    foo.setProperty(rt, "obj", "foo");

    cb(func, std::move(foo), 1);
    flushQueue();
    EXPECT_EQ(output, "foo1");

    output.clear();
  }
  { // String
    auto cb = bridging::fromJs<AsyncCallback<decltype(func), jsi::String, int>>(
        rt, function("(func, a, b) => func(a + b)"), invoker);
    jsi::String foo(jsi::String::createFromAscii(rt, "foo"));

    cb(func, std::move(foo), 1);
    flushQueue();
    EXPECT_EQ(output, "foo1");

    cb(func, jsi::String::createFromAscii(rt, "bar"), 2);
    flushQueue();
    EXPECT_EQ(output, "bar2");

    output.clear();
  }
  { // Array
    auto fn = function("(func, a, b) => func(a[0] + b)");
    auto cb = bridging::fromJs<AsyncCallback<decltype(func), jsi::Array, int>>(
        rt, fn, invoker);

    jsi::Array foo(rt, 1);
    foo.setValueAtIndex(rt, 0, jsi::String::createFromAscii(rt, "foo"));

    cb(func, std::move(foo), 1);
    flushQueue();
    EXPECT_EQ(output, "foo1");

    output.clear();
  }
}

TEST_F(BridgingTest, promiseTest) {
  auto func = function(
      "(promise, obj) => {"
      "  promise.then("
      "    (res) => { obj.res = res; },"
      "    (err) => { obj.err = err; }"
      "  )"
      "}");

  auto promise = AsyncPromise<std::vector<std::string>>(rt, invoker);
  auto output = jsi::Object(rt);

  func.call(rt, bridging::toJs(rt, promise, invoker), output);
  promise.resolve({"foo"s, "bar"s});
  flushQueue();

  EXPECT_EQ(1, output.getPropertyNames(rt).size(rt));
  EXPECT_EQ(2, output.getProperty(rt, "res").asObject(rt).asArray(rt).size(rt));
  EXPECT_NO_THROW(promise.resolve({"ignored"}));
  EXPECT_NO_THROW(promise.reject("ignored"));

  promise = AsyncPromise<std::vector<std::string>>(rt, invoker);
  output = jsi::Object(rt);

  func.call(rt, bridging::toJs(rt, promise, invoker), output);
  promise.reject("fail");
  flushQueue();

  EXPECT_EQ(1, output.getPropertyNames(rt).size(rt));
  EXPECT_EQ(
      "fail"s,
      output.getProperty(rt, "err")
          .asObject(rt)
          .getProperty(rt, "message")
          .asString(rt)
          .utf8(rt));
  EXPECT_NO_THROW(promise.resolve({"ignored"}));
  EXPECT_NO_THROW(promise.reject("ignored"));
}

using EventType = std::vector<std::string>;
using EventSubscriptionsWithLastEvent =
    std::vector<std::pair<jsi::Object, std::shared_ptr<EventType>>>;

namespace {

template <typename EventType>
void addEventSubscription(
    jsi::Runtime& rt,
    const AsyncEventEmitter<EventType>& eventEmitter,
    EventSubscriptionsWithLastEvent& eventSubscriptionsWithListener,
    const std::shared_ptr<TestCallInvoker>& invoker) {
  auto eventEmitterJs = bridging::toJs(rt, eventEmitter, invoker);
  auto lastEvent = std::make_shared<EventType>();
  auto listenJs = bridging::toJs(
      rt,
      [lastEvent = lastEvent](const EventType& event) { *lastEvent = event; },
      invoker);
  eventSubscriptionsWithListener.emplace_back(
      std::make_pair(
          jsi::Object(eventEmitterJs.asFunction(rt)
                          .callWithThis(rt, eventEmitterJs, listenJs)
                          .asObject(rt)),
          std::move(lastEvent)));
}

} // namespace

TEST_F(BridgingTest, eventEmitterTest) {
  EventSubscriptionsWithLastEvent eventSubscriptionsWithListener;

  AsyncEventEmitter<EventType> eventEmitter;
  EXPECT_NO_THROW(eventEmitter.emit({"one", "two", "three"}));
  EXPECT_EQ(0, eventSubscriptionsWithListener.size());

  // register 3 JavaScript listeners to the event emitter
  for (int i = 0; i < 3; ++i) {
    addEventSubscription<EventType>(
        rt, eventEmitter, eventSubscriptionsWithListener, invoker);
  }

  EXPECT_TRUE(eventEmitter.state_->listeners.contains(0));
  EXPECT_TRUE(eventEmitter.state_->listeners.contains(1));
  EXPECT_TRUE(eventEmitter.state_->listeners.contains(2));

  // emit with args
  EXPECT_NO_THROW(eventEmitter.emit({"four", "five", "six"}));
  flushQueue();

  // verify all listeners received the event
  for (const auto& [_, lastEvent] : eventSubscriptionsWithListener) {
    EXPECT_EQ(3, lastEvent->size());
    EXPECT_EQ("four", lastEvent->at(0));
    EXPECT_EQ("five", lastEvent->at(1));
    EXPECT_EQ("six", lastEvent->at(2));
  }

  // Remove 2nd eventSubscriptions
  eventSubscriptionsWithListener[1]
      .first.getPropertyAsFunction(rt, "remove")
      .callWithThis(rt, eventSubscriptionsWithListener[1].first);
  eventSubscriptionsWithListener.erase(
      eventSubscriptionsWithListener.begin() + 1);

  // Add 4th and 5th eventSubscriptions
  addEventSubscription<EventType>(
      rt, eventEmitter, eventSubscriptionsWithListener, invoker);
  addEventSubscription<EventType>(
      rt, eventEmitter, eventSubscriptionsWithListener, invoker);

  EXPECT_TRUE(eventEmitter.state_->listeners.contains(0));
  EXPECT_FALSE(eventEmitter.state_->listeners.contains(1));
  EXPECT_TRUE(eventEmitter.state_->listeners.contains(2));
  EXPECT_TRUE(eventEmitter.state_->listeners.contains(3));
  EXPECT_TRUE(eventEmitter.state_->listeners.contains(4));

  // Emit more events
  EXPECT_NO_THROW(eventEmitter.emit({"seven", "eight", "nine"}));
  flushQueue();

  for (const auto& [_, lastEvent] : eventSubscriptionsWithListener) {
    EXPECT_EQ(3, lastEvent->size());
    EXPECT_EQ("seven", lastEvent->at(0));
    EXPECT_EQ("eight", lastEvent->at(1));
    EXPECT_EQ("nine", lastEvent->at(2));
  }

  // clean-up the event subscriptions
  for (const auto& [eventSubscription, _] : eventSubscriptionsWithListener) {
    eventSubscription.getPropertyAsFunction(rt, "remove")
        .callWithThis(rt, eventSubscription);
  }
  flushQueue();

  // Emit with function
  EXPECT_NO_THROW(eventEmitter.emit(
      [jsInvoker = invoker,
       value = {"ten", "eleven", "twelve"}](jsi::Runtime& rt) -> jsi::Value {
        return bridging::toJs(rt, value, jsInvoker);
      }));
  flushQueue();

  // no new data as listeners had been removed
  for (const auto& [_, lastEvent] : eventSubscriptionsWithListener) {
    EXPECT_EQ(3, lastEvent->size());
    EXPECT_EQ("seven", lastEvent->at(0));
    EXPECT_EQ("eight", lastEvent->at(1));
    EXPECT_EQ("nine", lastEvent->at(2));
  }
}

TEST_F(BridgingTest, optionalTest) {
  EXPECT_EQ(
      1, bridging::fromJs<std::optional<int>>(rt, jsi::Value(1), invoker));
  EXPECT_EQ(
      1,
      bridging::fromJs<std::optional<int>>(
          rt, std::make_optional(jsi::Value(1)), invoker));
  EXPECT_EQ(
      "hi"s,
      bridging::fromJs<std::optional<std::string>>(
          rt,
          std::make_optional(jsi::String::createFromAscii(rt, "hi")),
          invoker));
  EXPECT_FALSE(
      bridging::fromJs<std::optional<int>>(rt, jsi::Value::undefined(), invoker)
          .has_value());
  EXPECT_FALSE(
      bridging::fromJs<std::optional<int>>(rt, jsi::Value::null(), invoker)
          .has_value());

  EXPECT_TRUE(bridging::toJs(rt, std::optional<int>(), invoker).isNull());
  EXPECT_EQ(1, bridging::toJs(rt, std::optional<int>(1), invoker).asNumber());
}

TEST_F(BridgingTest, pointerTest) {
  auto str = "hi"s;
  auto unique = std::make_unique<std::string>(str);
  auto shared = std::make_shared<std::string>(str);
  auto weak = std::weak_ptr<std::string>(shared);

  EXPECT_EQ(str, bridging::toJs(rt, unique, invoker).asString(rt).utf8(rt));
  EXPECT_EQ(str, bridging::toJs(rt, shared, invoker).asString(rt).utf8(rt));
  EXPECT_EQ(str, bridging::toJs(rt, weak, invoker).asString(rt).utf8(rt));

  shared.reset();

  EXPECT_TRUE(bridging::toJs(rt, weak, invoker).isNull());
}

TEST_F(BridgingTest, supportTest) {
  // Ensure sure can convert some basic types, including primitives that can be
  // trivially converted to JSI values.
  EXPECT_TRUE((bridging::supportsFromJs<bool>));
  EXPECT_TRUE((bridging::supportsFromJs<bool, bool>));
  EXPECT_TRUE((bridging::supportsFromJs<bool, jsi::Value&>));
  EXPECT_TRUE((bridging::supportsFromJs<int>));
  EXPECT_TRUE((bridging::supportsFromJs<int, int>));
  EXPECT_TRUE((bridging::supportsFromJs<int, jsi::Value&>));
  EXPECT_TRUE((bridging::supportsFromJs<double>));
  EXPECT_TRUE((bridging::supportsFromJs<double, double>));
  EXPECT_TRUE((bridging::supportsFromJs<double, jsi::Value&>));
  EXPECT_TRUE((bridging::supportsFromJs<std::string>));
  EXPECT_TRUE((bridging::supportsFromJs<std::string, jsi::String>));
  EXPECT_TRUE((bridging::supportsFromJs<std::string, jsi::String&>));
  EXPECT_TRUE((bridging::supportsFromJs<std::set<int>, jsi::Array>));
  EXPECT_TRUE((bridging::supportsFromJs<std::set<int>, jsi::Array&>));
  EXPECT_TRUE((bridging::supportsFromJs<std::vector<int>, jsi::Array>));
  EXPECT_TRUE((bridging::supportsFromJs<std::vector<int>, jsi::Array&>));
  EXPECT_TRUE((
      bridging::
          supportsFromJs<std::vector<std::array<std::string, 2>>, jsi::Array>));
  EXPECT_TRUE((bridging::supportsFromJs<
               std::vector<std::array<std::string, 2>>,
               jsi::Array&>));
  EXPECT_TRUE(
      (bridging::supportsFromJs<std::map<std::string, int>, jsi::Object>));
  EXPECT_TRUE(
      (bridging::supportsFromJs<std::map<std::string, int>, jsi::Object&>));

  // Ensure incompatible conversions will fail.
  EXPECT_FALSE((bridging::supportsFromJs<bool, jsi::String>));
  EXPECT_FALSE((bridging::supportsFromJs<bool, jsi::String&>));
  EXPECT_FALSE((bridging::supportsFromJs<int, jsi::String>));
  EXPECT_FALSE((bridging::supportsFromJs<int, jsi::String&>));
  EXPECT_FALSE((bridging::supportsFromJs<double, jsi::String>));
  EXPECT_FALSE((bridging::supportsFromJs<double, jsi::String&>));
  EXPECT_FALSE((bridging::supportsFromJs<bool, jsi::Object>));
  EXPECT_FALSE((bridging::supportsFromJs<bool, jsi::Object&>));
  EXPECT_FALSE((bridging::supportsFromJs<int, jsi::Object>));
  EXPECT_FALSE((bridging::supportsFromJs<int, jsi::Object&>));
  EXPECT_FALSE((bridging::supportsFromJs<double, jsi::Object>));
  EXPECT_FALSE((bridging::supportsFromJs<double, jsi::Object&>));
  EXPECT_FALSE((bridging::supportsFromJs<std::string, jsi::Object>));
  EXPECT_FALSE((bridging::supportsFromJs<std::string, jsi::Object&>));
  EXPECT_FALSE((bridging::supportsFromJs<std::set<int>, jsi::String>));
  EXPECT_FALSE((bridging::supportsFromJs<std::set<int>, jsi::String&>));
  EXPECT_FALSE((bridging::supportsFromJs<std::vector<int>, jsi::String>));
  EXPECT_FALSE((bridging::supportsFromJs<std::vector<int>, jsi::String&>));

  // Ensure copying and down casting JSI values is also supported.
  EXPECT_TRUE((bridging::supportsFromJs<jsi::Value>));
  EXPECT_TRUE((bridging::supportsFromJs<jsi::Value, jsi::Value&>));
  EXPECT_TRUE((bridging::supportsFromJs<jsi::String>));
  EXPECT_TRUE((bridging::supportsFromJs<jsi::String, jsi::String>));
  EXPECT_TRUE((bridging::supportsFromJs<jsi::String, jsi::String&>));
  EXPECT_TRUE((bridging::supportsFromJs<jsi::Object>));
  EXPECT_TRUE((bridging::supportsFromJs<jsi::Object, jsi::Object>));
  EXPECT_TRUE((bridging::supportsFromJs<jsi::Object, jsi::Object&>));
  EXPECT_TRUE((bridging::supportsFromJs<jsi::Object, jsi::Array>));
  EXPECT_TRUE((bridging::supportsFromJs<jsi::Object, jsi::Array&>));
  EXPECT_TRUE((bridging::supportsFromJs<jsi::Object, jsi::Function>));
  EXPECT_TRUE((bridging::supportsFromJs<jsi::Object, jsi::Function&>));
  EXPECT_TRUE((bridging::supportsFromJs<jsi::Array>));
  EXPECT_TRUE((bridging::supportsFromJs<jsi::Array, jsi::Array>));
  EXPECT_TRUE((bridging::supportsFromJs<jsi::Array, jsi::Array&>));
  EXPECT_TRUE((bridging::supportsFromJs<jsi::Array, jsi::Object>));
  EXPECT_TRUE((bridging::supportsFromJs<jsi::Array, jsi::Object&>));
  EXPECT_TRUE((bridging::supportsFromJs<jsi::Function>));
  EXPECT_TRUE((bridging::supportsFromJs<jsi::Function, jsi::Function>));
  EXPECT_TRUE((bridging::supportsFromJs<jsi::Function, jsi::Function&>));
  EXPECT_TRUE((bridging::supportsFromJs<jsi::Function, jsi::Object>));
  EXPECT_TRUE((bridging::supportsFromJs<jsi::Function, jsi::Object&>));

  // Ensure incorrect casts will fail.
  EXPECT_FALSE((bridging::supportsFromJs<jsi::Array, jsi::Function>));
  EXPECT_FALSE((bridging::supportsFromJs<jsi::Array, jsi::Function&>));
  EXPECT_FALSE((bridging::supportsFromJs<jsi::Function, jsi::Array>));
  EXPECT_FALSE((bridging::supportsFromJs<jsi::Function, jsi::Array&>));

  // Ensure we can create HighResTimeStamp and HighResDuration from JSI
  // values.
  EXPECT_TRUE((bridging::supportsFromJs<HighResTimeStamp, jsi::Value>));
  EXPECT_TRUE((bridging::supportsFromJs<HighResTimeStamp, jsi::Value&>));
  EXPECT_TRUE((bridging::supportsFromJs<HighResDuration, jsi::Value>));
  EXPECT_TRUE((bridging::supportsFromJs<HighResDuration, jsi::Value&>));

  // Ensure we can convert some basic types to JSI values.
  EXPECT_TRUE((bridging::supportsToJs<bool>));
  EXPECT_TRUE((bridging::supportsToJs<int>));
  EXPECT_TRUE((bridging::supportsToJs<double>));
  EXPECT_TRUE((bridging::supportsToJs<std::string>));
  EXPECT_TRUE((bridging::supportsToJs<std::string, jsi::String>));
  EXPECT_TRUE((bridging::supportsToJs<std::set<int>>));
  EXPECT_TRUE((bridging::supportsToJs<std::set<int>, jsi::Array>));
  EXPECT_TRUE((bridging::supportsToJs<std::vector<int>>));
  EXPECT_TRUE((bridging::supportsToJs<std::vector<int>, jsi::Array>));
  EXPECT_TRUE((bridging::supportsToJs<std::map<std::string, int>>));
  EXPECT_TRUE(
      (bridging::supportsToJs<std::map<std::string, int>, jsi::Object>));
  EXPECT_TRUE((bridging::supportsToJs<void (*)()>));
  EXPECT_TRUE((bridging::supportsToJs<void (*)(), jsi::Function>));

  // Ensure invalid conversions to JSI values are not supported.
  EXPECT_FALSE((bridging::supportsToJs<void*>));
  EXPECT_FALSE((bridging::supportsToJs<bool, jsi::Object>));
  EXPECT_FALSE((bridging::supportsToJs<int, jsi::Object>));
  EXPECT_FALSE((bridging::supportsToJs<double, jsi::Object>));
  EXPECT_FALSE((bridging::supportsToJs<std::string, jsi::Object>));
  EXPECT_FALSE((bridging::supportsToJs<std::vector<int>, jsi::Function>));

  // Ensure we can convert HighResTimeStamp and HighResDuration to
  // DOMHighResTimeStamp (double).
  EXPECT_TRUE((bridging::supportsToJs<HighResTimeStamp, double>));
  EXPECT_TRUE((bridging::supportsToJs<HighResDuration, double>));
}

TEST_F(BridgingTest, dynamicTest) {
  // Null
  auto nullFromJsResult =
      bridging::fromJs<folly::dynamic>(rt, jsi::Value::null(), invoker);
  EXPECT_TRUE(nullFromJsResult.isNull());

  auto nullToJsResult = bridging::toJs<folly::dynamic>(rt, nullptr, invoker);
  EXPECT_TRUE(nullToJsResult.isNull());

  // Boolean
  auto booleanFromJsResult =
      bridging::fromJs<folly::dynamic>(rt, jsi::Value(true), invoker);
  EXPECT_TRUE(booleanFromJsResult.isBool());
  EXPECT_TRUE(booleanFromJsResult.asBool());

  auto booleanToJsResult = bridging::toJs<folly::dynamic>(rt, true, invoker);
  EXPECT_TRUE(booleanToJsResult.isBool());
  EXPECT_TRUE(booleanToJsResult.asBool());

  // Number
  auto numberFromJsResult =
      bridging::fromJs<folly::dynamic>(rt, jsi::Value(1.2), invoker);
  EXPECT_TRUE(numberFromJsResult.isNumber());
  EXPECT_DOUBLE_EQ(1.2, numberFromJsResult.asDouble());

  auto numberToJsResult = bridging::toJs<folly::dynamic>(rt, 1.2, invoker);
  EXPECT_TRUE(numberToJsResult.isNumber());
  EXPECT_DOUBLE_EQ(1.2, numberToJsResult.asNumber());

  // String
  auto stringFromJsResult = bridging::fromJs<folly::dynamic>(
      rt, jsi::Value(jsi::String::createFromAscii(rt, "hello")), invoker);
  EXPECT_TRUE(stringFromJsResult.isString());
  EXPECT_EQ("hello"s, stringFromJsResult.asString());

  auto stringToJsResult = bridging::toJs<folly::dynamic>(rt, "hello", invoker);
  EXPECT_TRUE(stringToJsResult.isString());
  EXPECT_EQ("hello"s, stringToJsResult.asString(rt).utf8(rt));

  // Array
  auto arrayFromJsResult = bridging::fromJs<folly::dynamic>(
      rt,
      jsi::Value(jsi::Array::createWithElements(rt, "foo", "bar")),
      invoker);
  EXPECT_TRUE(arrayFromJsResult.isArray());
  EXPECT_EQ(2, arrayFromJsResult.size());
  EXPECT_EQ("foo"s, arrayFromJsResult[0].asString());
  EXPECT_EQ("bar"s, arrayFromJsResult[1].asString());

  auto arrayToJsResult = bridging::toJs<folly::dynamic>(
      rt, folly::dynamic::array("foo", "bar"), invoker);
  EXPECT_TRUE(arrayToJsResult.isObject());
  EXPECT_TRUE(arrayToJsResult.asObject(rt).isArray(rt));
  auto arrayToJsResultArray = arrayToJsResult.asObject(rt).asArray(rt);
  EXPECT_EQ(2, arrayToJsResultArray.size(rt));
  EXPECT_EQ(
      "foo"s,
      arrayToJsResultArray.getValueAtIndex(rt, 0).asString(rt).utf8(rt));
  EXPECT_EQ(
      "bar"s,
      arrayToJsResultArray.getValueAtIndex(rt, 1).asString(rt).utf8(rt));

  // Object
  auto jsiObject = jsi::Object(rt);
  jsiObject.setProperty(rt, "foo", "bar");
  auto objectFromJsResult = bridging::fromJs<folly::dynamic>(
      rt, jsi::Value(std::move(jsiObject)), invoker);

  EXPECT_TRUE(objectFromJsResult.isObject());
  EXPECT_EQ(1, objectFromJsResult.size());
  EXPECT_EQ("bar"s, objectFromJsResult["foo"].asString());

  auto objectToJsResult = bridging::toJs<folly::dynamic>(
      rt, folly::dynamic::object("foo", "bar"), invoker);
  EXPECT_TRUE(objectToJsResult.isObject());
  auto objectToJsResultObject = objectToJsResult.asObject(rt);
  EXPECT_EQ(
      "bar"s,
      objectToJsResultObject.getProperty(rt, "foo").asString(rt).utf8(rt));

  // Undefined
  auto undefinedFromJsResult =
      bridging::fromJs<folly::dynamic>(rt, jsi::Value::undefined(), invoker);
  EXPECT_TRUE(undefinedFromJsResult.isNull());
}

TEST_F(BridgingTest, arrayBufferTest) {
  auto rawBuf = eval("new ArrayBuffer(7)");
  auto buf = bridging::fromJs<jsi::ArrayBuffer>(rt, rawBuf, invoker);
  EXPECT_EQ(7, buf.size(rt));

  auto typedArrayBuf = eval("new Uint8Array([1, 2, 3]).buffer");
  auto fromTa = bridging::fromJs<jsi::ArrayBuffer>(rt, typedArrayBuf, invoker);
  EXPECT_EQ(3, fromTa.size(rt));

  auto jsVal = bridging::toJs(rt, std::move(buf), invoker);
  EXPECT_TRUE(jsVal.isArrayBuffer(rt));
  auto roundTrip = bridging::fromJs<jsi::ArrayBuffer>(rt, jsVal, invoker);
  EXPECT_EQ(7, roundTrip.size(rt));

  EXPECT_JSI_THROW(
      bridging::fromJs<jsi::ArrayBuffer>(rt, jsi::Value(1), invoker));
}

TEST_F(BridgingTest, asyncArrayBufferConstructorTest) {
  // JS-heap-allocated buffer: acquire() copies into an internal buffer.
  {
    auto jsBuf = eval("new Uint8Array([10, 20, 30]).buffer")
                     .asObject(rt)
                     .getArrayBuffer(rt);
    auto safe = AsyncArrayBuffer::acquire(rt, jsBuf);
    EXPECT_EQ(3, safe.size());
    auto data = std::span(safe.data(), safe.size());
    EXPECT_EQ(10, data[0]);
    EXPECT_EQ(20, data[1]);
    EXPECT_EQ(30, data[2]);
  }

  // ArrayBuffer created from a native MutableBuffer: acquire() returns the
  // same bytes. Whether it's zero-copy depends on whether the runtime
  // implements tryGetMutableBuffer (e.g. Hermes does not, so acquire falls
  // back to a copy).
  {
    auto nativeBuf = std::make_shared<detail::OwnedBytesBuffer>(
        std::vector<uint8_t>{1, 2, 3, 4});
    auto* rawPtr = nativeBuf.get();
    auto jsBuf = jsi::ArrayBuffer(rt, nativeBuf);
    auto safe = AsyncArrayBuffer::acquire(rt, jsBuf);
    EXPECT_EQ(4, safe.size());
    auto data = std::span(safe.data(), safe.size());
    EXPECT_EQ(1, data[0]);
    EXPECT_EQ(4, data[3]);
    if (jsBuf.tryGetMutableBuffer(rt) != nullptr) {
      EXPECT_EQ(rawPtr, safe.getMutableBuffer().get());
    }
  }
}

TEST_F(BridgingTest, asyncArrayBufferBorrowThrowsOnJsHeapTest) {
  // JS-heap-allocated buffer: borrow throws.
  auto jsBuf = eval("new ArrayBuffer(4)").asObject(rt).getArrayBuffer(rt);
  EXPECT_JSI_THROW(AsyncArrayBuffer::borrow(rt, jsBuf));
}

TEST_F(BridgingTest, asyncArrayBufferBorrowNativeBackedTest) {
  // Native-backed buffer: borrow succeeds zero-copy on runtimes that implement
  // tryGetMutableBuffer; otherwise borrow throws (since there is no native
  // MutableBuffer to hand back).
  auto nativeBuf =
      std::make_shared<detail::OwnedBytesBuffer>(std::vector<uint8_t>{5, 6, 7});
  auto* rawPtr = nativeBuf.get();
  auto jsBuf = jsi::ArrayBuffer(rt, nativeBuf);
  if (jsBuf.tryGetMutableBuffer(rt) == nullptr) {
    EXPECT_JSI_THROW(AsyncArrayBuffer::borrow(rt, jsBuf));
    return;
  }
  auto safe = AsyncArrayBuffer::borrow(rt, jsBuf);
  EXPECT_EQ(3, safe.size());
  auto data = std::span(safe.data(), safe.size());
  EXPECT_EQ(5, data[0]);
  EXPECT_EQ(rawPtr, safe.getMutableBuffer().get());
}

TEST_F(BridgingTest, asyncArrayBufferCopyTest) {
  // JS-heap-allocated buffer: copy succeeds.
  {
    auto jsBuf = eval("new Uint8Array([100, 200]).buffer")
                     .asObject(rt)
                     .getArrayBuffer(rt);
    auto safe = AsyncArrayBuffer::copy(rt, jsBuf);
    EXPECT_EQ(2, safe.size());
    auto data = std::span(safe.data(), safe.size());
    EXPECT_EQ(100, data[0]);
    EXPECT_EQ(200, data[1]);
  }

  // Native-backed buffer: copy() still copies into an internal buffer.
  {
    auto nativeBuf = std::make_shared<detail::OwnedBytesBuffer>(
        std::vector<uint8_t>{9, 8, 7});
    auto* rawPtr = nativeBuf.get();
    auto jsBuf = jsi::ArrayBuffer(rt, nativeBuf);
    auto safe = AsyncArrayBuffer::copy(rt, jsBuf);
    EXPECT_EQ(3, safe.size());
    auto data = std::span(safe.data(), safe.size());
    EXPECT_EQ(9, data[0]);
    EXPECT_NE(rawPtr, safe.getMutableBuffer().get());
  }
}

TEST_F(BridgingTest, asyncArrayBufferMoveTest) {
  auto jsBuf =
      eval("new Uint8Array([1, 2, 3]).buffer").asObject(rt).getArrayBuffer(rt);
  auto safe = AsyncArrayBuffer::acquire(rt, jsBuf);
  EXPECT_EQ(3, safe.size());

  auto moved = std::move(safe);
  EXPECT_EQ(3, moved.size());
  auto data = std::span(moved.data(), moved.size());
  EXPECT_EQ(1, data[0]);
}

TEST_F(BridgingTest, asyncArrayBufferWrapTest) {
  // wrap(shared_ptr<MutableBuffer>): zero-copy, same underlying buffer.
  {
    auto nativeBuf = std::make_shared<detail::OwnedBytesBuffer>(
        std::vector<uint8_t>{1, 2, 3});
    auto* rawPtr = nativeBuf.get();
    auto safe = AsyncArrayBuffer::wrap(nativeBuf);
    EXPECT_EQ(3, safe.size());
    auto data = std::span(safe.data(), safe.size());
    EXPECT_EQ(1, data[0]);
    EXPECT_EQ(3, data[2]);
    EXPECT_EQ(rawPtr, safe.getMutableBuffer().get());
  }

  // wrap(vector<uint8_t>): bytes are owned by an internal MutableBuffer.
  {
    auto safe = AsyncArrayBuffer::wrap(std::vector<uint8_t>{10, 20, 30, 40});
    EXPECT_EQ(4, safe.size());
    auto data = std::span(safe.data(), safe.size());
    EXPECT_EQ(10, data[0]);
    EXPECT_EQ(40, data[3]);
    EXPECT_NE(nullptr, safe.getMutableBuffer());
  }
}

TEST_F(BridgingTest, asyncArrayBufferBridgingTest) {
  // toJs with native-backed buffer: JS ArrayBuffer backed by the same
  // MutableBuffer.
  {
    auto nativeBuf = std::make_shared<detail::OwnedBytesBuffer>(
        std::vector<uint8_t>{5, 6, 7});
    auto safe = AsyncArrayBuffer::wrap(nativeBuf);
    auto jsVal = bridging::toJs(rt, std::move(safe), invoker);
    EXPECT_TRUE(jsVal.asObject(rt).isArrayBuffer(rt));
    auto jsBuf = jsVal.asObject(rt).getArrayBuffer(rt);
    EXPECT_EQ(3, jsBuf.size(rt));
    auto data = std::span(jsBuf.data(rt), jsBuf.size(rt));
    EXPECT_EQ(5, data[0]);
    EXPECT_EQ(7, data[2]);
  }

  // toJs with owned bytes: JS ArrayBuffer contains the correct data.
  {
    auto safe = AsyncArrayBuffer::wrap(std::vector<uint8_t>{100, 200});
    auto jsVal = bridging::toJs(rt, std::move(safe), invoker);
    EXPECT_TRUE(jsVal.asObject(rt).isArrayBuffer(rt));
    auto jsBuf = jsVal.asObject(rt).getArrayBuffer(rt);
    EXPECT_EQ(2, jsBuf.size(rt));
    auto data = std::span(jsBuf.data(rt), jsBuf.size(rt));
    EXPECT_EQ(100, data[0]);
    EXPECT_EQ(200, data[1]);
  }
}

TEST_F(BridgingTest, highResTimeStampTest) {
  HighResTimeStamp timestamp = HighResTimeStamp::now();
  EXPECT_EQ(
      timestamp,
      bridging::fromJs<HighResTimeStamp>(
          rt, bridging::toJs(rt, timestamp), invoker));

  auto duration = HighResDuration::fromNanoseconds(1);
  EXPECT_EQ(
      duration,
      bridging::fromJs<HighResDuration>(
          rt, bridging::toJs(rt, duration), invoker));

  EXPECT_EQ(1.0, bridging::toJs(rt, HighResDuration::fromNanoseconds(1e6)));
  EXPECT_EQ(
      1.000001, bridging::toJs(rt, HighResDuration::fromNanoseconds(1e6 + 1)));
}

} // namespace facebook::react

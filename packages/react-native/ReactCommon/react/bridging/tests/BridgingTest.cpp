/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <barrier>
#include <chrono>
#include <condition_variable>
#include <functional>
#include <list>
#include <memory>
#include <mutex>
#include <optional>
#include <span>
#include <thread>
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

TEST_F(BridgingTest, eventEmitterMapLookupTest) {
  // Mirrors the lookup the codegen'd setEventEmitterCallback lambda performs:
  // an unknown event name must not insert an entry, and a null emitter must not
  // be dereferenced.
  std::unordered_map<std::string, std::shared_ptr<IAsyncEventEmitter>>
      eventEmitterMap;
  eventEmitterMap["onEvent"] = std::make_shared<AsyncEventEmitter<EventType>>();
  eventEmitterMap["onNullEvent"] = nullptr;

  // Subscribe to the valid emitter so the emit("onEvent") case can be verified
  // by an observable side effect, not merely EXPECT_NO_THROW.
  EventSubscriptionsWithLastEvent eventSubscriptionsWithListener;
  addEventSubscription<EventType>(
      rt,
      static_cast<AsyncEventEmitter<EventType>&>(*eventEmitterMap["onEvent"]),
      eventSubscriptionsWithListener,
      invoker);

  auto emit = [&eventEmitterMap](const std::string& name) {
    auto it = eventEmitterMap.find(name);
    if (it == eventEmitterMap.end() || !it->second) {
      return;
    }
    static_cast<AsyncEventEmitter<EventType>&>(*it->second)
        .emit({"one", "two", "three"});
  };

  EXPECT_NO_THROW(emit("onUnknownEvent"));
  EXPECT_NO_THROW(emit("onNullEvent"));
  EXPECT_NO_THROW(emit("onEvent"));

  // The valid emit must actually reach the subscribed listener.
  flushQueue();
  ASSERT_EQ(1, eventSubscriptionsWithListener.size());
  const auto& lastEvent = eventSubscriptionsWithListener[0].second;
  ASSERT_EQ(3, lastEvent->size());
  EXPECT_EQ("one", lastEvent->at(0));
  EXPECT_EQ("two", lastEvent->at(1));
  EXPECT_EQ("three", lastEvent->at(2));

  // The miss must not have grown the map, which operator[] would have done.
  EXPECT_EQ(2, eventEmitterMap.size());
  EXPECT_FALSE(eventEmitterMap.contains("onUnknownEvent"));

  // Clean up the subscription so the LongLivedObjectCollection leak check in
  // TearDown passes.
  for (const auto& [eventSubscription, _] : eventSubscriptionsWithListener) {
    eventSubscription.getPropertyAsFunction(rt, "remove")
        .callWithThis(rt, eventSubscription);
  }
  flushQueue();
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
  // Nanosecond counts that are not a whole number of milliseconds, spanning the
  // magnitudes a monotonic clock reports (seconds to weeks since boot). Fixed
  // values are used instead of `HighResTimeStamp::now()` so that the precision
  // of the round trip does not depend on the uptime of the host running this
  // test.
  for (int64_t nanoseconds :
       {1LL, 999'999LL, 1'000'001LL, 12'345'678'901LL, 537'648'854'729'250LL}) {
    auto timestamp = HighResTimeStamp::fromChronoSteadyClockTimePoint(
        std::chrono::steady_clock::time_point(
            std::chrono::nanoseconds(nanoseconds)));
    EXPECT_EQ(
        timestamp,
        bridging::fromJs<HighResTimeStamp>(
            rt, bridging::toJs(rt, timestamp), invoker))
        << "timestamp of " << nanoseconds << "ns did not round trip";

    auto duration = HighResDuration::fromNanoseconds(nanoseconds);
    EXPECT_EQ(
        duration,
        bridging::fromJs<HighResDuration>(
            rt, bridging::toJs(rt, duration), invoker))
        << "duration of " << nanoseconds << "ns did not round trip";
  }

  EXPECT_EQ(1.0, bridging::toJs(rt, HighResDuration::fromNanoseconds(1e6)));
  EXPECT_EQ(
      1.000001, bridging::toJs(rt, HighResDuration::fromNanoseconds(1e6 + 1)));
}

namespace {

template <typename T>
constexpr bool canReleaseLongLivedObjectOnJS =
    requires(std::weak_ptr<T> object, std::weak_ptr<CallInvoker> invoker) {
      detail::releaseLongLivedObjectOnJS(std::move(object), std::move(invoker));
    };

static_assert(canReleaseLongLivedObjectOnJS<LongLivedObject>);
static_assert(!canReleaseLongLivedObjectOnJS<
              LongLivedObjectHandle<jsi::Function>::Holder>);

// `TestCallInvoker` keeps its queue in a bare `std::list`, so it cannot be used
// by the tests below, which schedule work from worker threads. Jobs are taken
// out of the queue under the lock and run (and destroyed) outside it, so a
// release scheduled while the queue drains is picked up by the same flush.
class ConcurrentTestCallInvoker : public CallInvoker {
 public:
  explicit ConcurrentTestCallInvoker(jsi::Runtime& runtime)
      : runtime_(runtime) {}

  void invokeAsync(CallFunc&& func) noexcept override {
    std::unique_lock lock(mutex_);
    ++dispatchCount_;
    dispatched_.notify_all();
    gateOpened_.wait(lock, [this] { return gateOpen_; });
    queue_.push_back(std::move(func));
  }

  void invokeAsync(SchedulerPriority priority, CallFunc&& func) noexcept
      override {
    {
      std::scoped_lock lock(mutex_);
      lastPriority_ = priority;
    }
    invokeAsync(std::move(func));
  }

  void invokeSync(CallFunc&& func) override {
    func(runtime_);
  }

  void flushQueue() {
    while (auto job = takeNextJob()) {
      (*job)(runtime_);
      job.reset();
      runtime_.drainMicrotasks();
    }
  }

  // Throws queued work away without running it, the way a JavaScript queue
  // torn down at virtual machine shutdown would.
  void discardQueue() {
    while (auto job = takeNextJob()) {
      job.reset();
    }
  }

  size_t queueSize() {
    std::scoped_lock lock(mutex_);
    return queue_.size();
  }

  std::optional<SchedulerPriority> lastPriority() {
    std::scoped_lock lock(mutex_);
    return lastPriority_;
  }

  // Parks every dispatching thread inside `invokeAsync` until `openGate()`,
  // which makes the window between "the callback is still alive" and "the task
  // is queued" a deterministic point to interleave the JavaScript thread with.
  void closeGate() {
    std::scoped_lock lock(mutex_);
    gateOpen_ = false;
  }

  void openGate() {
    std::scoped_lock lock(mutex_);
    gateOpen_ = true;
    gateOpened_.notify_all();
  }

  void waitForDispatch(size_t count) {
    std::unique_lock lock(mutex_);
    dispatched_.wait(lock, [&] { return dispatchCount_ >= count; });
  }

  std::optional<CallFunc> takeNextJob() {
    std::scoped_lock lock(mutex_);
    if (queue_.empty()) {
      return std::nullopt;
    }
    auto job = std::move(queue_.front());
    queue_.pop_front();
    return job;
  }

 private:
  jsi::Runtime& runtime_;
  std::mutex mutex_;
  std::condition_variable gateOpened_;
  std::condition_variable dispatched_;
  std::list<CallFunc> queue_;
  std::optional<SchedulerPriority> lastPriority_;
  size_t dispatchCount_{0};
  bool gateOpen_{true};
};

// Where and how often a value owned by a long lived object was destroyed.
struct ReleaseRecord {
  void record() {
    std::scoped_lock lock(mutex);
    ++count;
    thread = std::this_thread::get_id();
  }

  int releaseCount() {
    std::scoped_lock lock(mutex);
    return count;
  }

  std::thread::id releaseThread() {
    std::scoped_lock lock(mutex);
    return thread;
  }

  std::mutex mutex;
  int count{0};
  std::thread::id thread{};
};

// A payload that reports its own destruction. Moving it hands the report over,
// so a moved-from temporary never counts as a release.
class ProbePayload {
 public:
  explicit ProbePayload(std::function<void()> onDestroy)
      : onDestroy_(std::move(onDestroy)) {}

  ProbePayload(ProbePayload&& other) noexcept
      : onDestroy_(std::exchange(other.onDestroy_, nullptr)) {}

  ProbePayload& operator=(ProbePayload&&) = delete;

  ProbePayload(const ProbePayload&) = delete;
  ProbePayload& operator=(const ProbePayload&) = delete;

  ~ProbePayload() {
    if (onDestroy_) {
      onDestroy_();
    }
  }

 private:
  std::function<void()> onDestroy_;
};

ProbePayload recordingPayload(const std::shared_ptr<ReleaseRecord>& record) {
  return ProbePayload([record] { record->record(); });
}

} // namespace

TEST_F(BridgingTest, syncCallbackDestroyedOffJsThreadReleasesOnJsThread) {
  auto jsInvoker = std::make_shared<ConcurrentTestCallInvoker>(rt);
  auto& collection = LongLivedObjectCollection::get(rt);

  {
    // Kept on the heap so that a cleanup job reaching back into the destroyed
    // native owner is a use-after-free the sanitizers report, rather than a
    // read of stack storage that is still mapped.
    auto callback = std::make_unique<SyncCallback<void()>>(
        rt, function("() => {}"), jsInvoker);
    EXPECT_EQ(1, collection.size());

    std::thread worker([&] { callback.reset(); });
    worker.join();

    // Dropping the last native owner away from the JavaScript thread must not
    // reach into the collection: the function stays rooted until a JavaScript
    // task releases it.
    EXPECT_EQ(1, collection.size());
  }

  jsInvoker->flushQueue();
  EXPECT_EQ(0, collection.size());
}

TEST_F(BridgingTest, syncCallbackMoveAssignmentReleasesReplacedCallback) {
  auto jsInvoker = std::make_shared<ConcurrentTestCallInvoker>(rt);
  auto& collection = LongLivedObjectCollection::get(rt);

  {
    SyncCallback<std::string()> callback(
        rt, function("() => 'first'"), jsInvoker);

    {
      SyncCallback<std::string()> replacement(
          rt, function("() => 'second'"), jsInvoker);
      EXPECT_EQ(2, collection.size());

      callback = std::move(replacement);

      // On the JavaScript thread the replaced root goes immediately and no
      // cleanup job is left behind.
      EXPECT_EQ(1, collection.size());
      EXPECT_EQ(0, jsInvoker->queueSize());
      EXPECT_EQ("second"s, callback());
    }

    // Destroying the moved-from source must not release what it handed over.
    EXPECT_EQ(1, collection.size());
    EXPECT_EQ("second"s, callback());

    // Assignment resets the destination before taking ownership, so self
    // assignment has to be guarded.
    auto& alias = callback;
    callback = std::move(alias);
    EXPECT_EQ(1, collection.size());
    EXPECT_EQ("second"s, callback());
  }

  EXPECT_EQ(0, jsInvoker->queueSize());
  EXPECT_EQ(0, collection.size());
}

TEST_F(BridgingTest, asyncCallbackClearedDuringDispatchNeverCallsJs) {
  enum class Path {
    Arguments,
    ArgumentsWithPriority,
    Function,
    FunctionWithPriority,
  };

  for (auto path :
       {Path::Arguments,
        Path::ArgumentsWithPriority,
        Path::Function,
        Path::FunctionWithPriority}) {
    auto jsInvoker = std::make_shared<ConcurrentTestCallInvoker>(rt);
    std::string output;
    auto nativeFunc = std::function<void(std::string)>(
        [&](auto str) { output = std::move(str); });

    {
      auto callback =
          bridging::fromJs<AsyncCallback<decltype(nativeFunc), std::string>>(
              rt, function("(func, str) => func(str)"), jsInvoker);

      auto callImpl = [nativeFunc, jsInvoker](
                          jsi::Runtime& runtime, jsi::Function& jsFunc) {
        jsFunc.call(
            runtime,
            bridging::toJs(runtime, nativeFunc, jsInvoker),
            bridging::toJs(runtime, "called", jsInvoker));
      };

      jsInvoker->closeGate();

      std::thread worker([&] {
        switch (path) {
          case Path::Arguments:
            callback(nativeFunc, "called");
            break;
          case Path::ArgumentsWithPriority:
            callback.callWithPriority(
                SchedulerPriority::IdlePriority, nativeFunc, "called");
            break;
          case Path::Function:
            callback.call(callImpl);
            break;
          case Path::FunctionWithPriority:
            callback.callWithPriority(
                SchedulerPriority::IdlePriority, callImpl);
            break;
        }
      });

      // The dispatching thread is now parked inside the invoker, past the
      // point where it found the callback alive.
      jsInvoker->waitForDispatch(1);
      LongLivedObjectCollection::get(rt).clear();
      jsInvoker->openGate();
      worker.join();

      jsInvoker->flushQueue();
      EXPECT_EQ(""s, output) << "dispatch path " << static_cast<int>(path);
    }

    jsInvoker->flushQueue();
  }
}

TEST_F(BridgingTest, asyncCallbackDispatchAfterInvalidationEnqueuesNothing) {
  auto jsInvoker = std::make_shared<ConcurrentTestCallInvoker>(rt);
  std::string output;
  auto nativeFunc = std::function<void(std::string)>(
      [&](auto str) { output = std::move(str); });

  {
    auto callback =
        bridging::fromJs<AsyncCallback<decltype(nativeFunc), std::string>>(
            rt, function("(func, str) => func(str)"), jsInvoker);

    auto callImpl = [nativeFunc, jsInvoker](
                        jsi::Runtime& runtime, jsi::Function& jsFunc) {
      jsFunc.call(
          runtime,
          bridging::toJs(runtime, nativeFunc, jsInvoker),
          bridging::toJs(runtime, "called", jsInvoker));
    };

    LongLivedObjectCollection::get(rt).clear();

    callback(nativeFunc, "called");
    callback.callWithPriority(
        SchedulerPriority::IdlePriority, nativeFunc, "called");
    callback.call(callImpl);
    callback.callWithPriority(SchedulerPriority::IdlePriority, callImpl);

    EXPECT_EQ(0, jsInvoker->queueSize());
  }

  jsInvoker->flushQueue();
  EXPECT_EQ(""s, output);
}

TEST_F(BridgingTest, asyncCallbackQueuedInvocationOutlivesItsOwner) {
  auto jsInvoker = std::make_shared<ConcurrentTestCallInvoker>(rt);
  auto& collection = LongLivedObjectCollection::get(rt);
  std::string output;
  auto nativeFunc = std::function<void(std::string)>(
      [&](auto str) { output = std::move(str); });

  {
    auto callback =
        bridging::fromJs<AsyncCallback<decltype(nativeFunc), std::string>>(
            rt, function("(func, str) => func(str)"), jsInvoker);
    callback.callWithPriority(
        SchedulerPriority::IdlePriority, nativeFunc, "late");
  }

  // The queued task owns the callback state, so dropping every public owner
  // before it runs neither releases the function nor schedules a release.
  EXPECT_EQ(SchedulerPriority::IdlePriority, jsInvoker->lastPriority());
  EXPECT_EQ(1, jsInvoker->queueSize());
  EXPECT_EQ(1, collection.size());

  jsInvoker->flushQueue();
  EXPECT_EQ("late"s, output);
  EXPECT_EQ(0, collection.size());
}

TEST_F(BridgingTest, asyncPromiseDroppedOffJsThreadReleasesOnJsThread) {
  auto jsInvoker = std::make_shared<ConcurrentTestCallInvoker>(rt);
  auto& collection = LongLivedObjectCollection::get(rt);

  {
    auto promise = std::make_optional<AsyncPromise<int>>(rt, jsInvoker);
    const auto rooted = collection.size();
    EXPECT_GT(rooted, 0u);

    std::thread worker([&] { promise.reset(); });
    worker.join();

    EXPECT_EQ(rooted, collection.size());
  }

  jsInvoker->flushQueue();
  EXPECT_EQ(0, collection.size());
}

TEST_F(BridgingTest, asyncPromiseSettlementSurvivesBeingDroppedOffJsThread) {
  auto observe = function(
      "(promise, obj) => {"
      "  promise.then("
      "    (res) => { obj.res = res; },"
      "    (err) => { obj.err = err.message; }"
      "  )"
      "}");

  for (bool rejects : {false, true}) {
    auto jsInvoker = std::make_shared<ConcurrentTestCallInvoker>(rt);
    auto output = jsi::Object(rt);

    {
      auto promise = std::make_optional<AsyncPromise<int>>(rt, jsInvoker);
      observe.call(rt, bridging::toJs(rt, *promise, jsInvoker), output);

      if (rejects) {
        promise->reject("boom");
      } else {
        promise->resolve(42);
      }

      // Every public copy is dropped away from the JavaScript thread while
      // the settlement is still queued.
      std::thread worker([&] { promise.reset(); });
      worker.join();
    }

    jsInvoker->flushQueue();

    if (rejects) {
      ASSERT_TRUE(output.getProperty(rt, "err").isString());
      EXPECT_EQ("boom"s, output.getProperty(rt, "err").asString(rt).utf8(rt));
    } else {
      ASSERT_TRUE(output.getProperty(rt, "res").isNumber());
      EXPECT_EQ(42, output.getProperty(rt, "res").asNumber());
    }
    EXPECT_EQ(0, LongLivedObjectCollection::get(rt).size());
  }
}

TEST_F(BridgingTest, asyncPromiseCopiesShareOneSettlement) {
  auto jsInvoker = std::make_shared<ConcurrentTestCallInvoker>(rt);
  auto observe = function(
      "(promise, obj) => {"
      "  obj.count = 0;"
      "  promise.then("
      "    (res) => { obj.count++; obj.res = res; },"
      "    () => { obj.count++; obj.rejected = true; }"
      "  )"
      "}");
  auto output = jsi::Object(rt);

  {
    auto promise = AsyncPromise<int>(rt, jsInvoker);
    observe.call(rt, bridging::toJs(rt, promise, jsInvoker), output);

    {
      auto copy = promise;
      copy.resolve(1);
    }

    // Dropping a copy leaves the shared state, and only the first settlement
    // counts.
    EXPECT_NO_THROW(promise.get(rt));
    EXPECT_NO_THROW(promise.resolve(2));
    EXPECT_NO_THROW(promise.reject("ignored"));
  }

  jsInvoker->flushQueue();

  EXPECT_EQ(1, output.getProperty(rt, "count").asNumber());
  EXPECT_EQ(1, output.getProperty(rt, "res").asNumber());
  EXPECT_FALSE(output.hasProperty(rt, "rejected"));
  EXPECT_EQ(0, LongLivedObjectCollection::get(rt).size());
}

TEST_F(BridgingTest, asyncPromiseGetFailsAfterInvalidation) {
  auto jsInvoker = std::make_shared<ConcurrentTestCallInvoker>(rt);

  {
    auto promise = AsyncPromise<int>(rt, jsInvoker);
    EXPECT_NO_THROW(promise.get(rt));

    LongLivedObjectCollection::get(rt).clear();

    EXPECT_JSI_THROW(promise.get(rt));
    EXPECT_NO_THROW(promise.resolve(1));
    EXPECT_NO_THROW(promise.reject("ignored"));
    EXPECT_EQ(0, jsInvoker->queueSize());
  }

  jsInvoker->flushQueue();
  EXPECT_EQ(0, LongLivedObjectCollection::get(rt).size());
}

TEST_F(BridgingTest, longLivedObjectHandleReleasesPayloadOnJsThreadOnce) {
  auto jsInvoker = std::make_shared<ConcurrentTestCallInvoker>(rt);
  auto& collection = LongLivedObjectCollection::get(rt);
  auto record = std::make_shared<ReleaseRecord>();

  {
    LongLivedObjectHandle<ProbePayload> handle(
        rt, recordingPayload(record), jsInvoker);
    EXPECT_EQ(1, collection.size());

    std::thread worker([&] {
      handle.reset();
      handle.reset();
    });
    worker.join();
    EXPECT_EQ(1, jsInvoker->queueSize());

    // The payload belongs to the collection, so nothing is destroyed on the
    // worker thread however often the handle is reset.
    EXPECT_EQ(0, record->releaseCount());
    EXPECT_EQ(1, collection.size());
  }

  jsInvoker->flushQueue();

  EXPECT_EQ(1, record->releaseCount());
  EXPECT_EQ(std::this_thread::get_id(), record->releaseThread());
  EXPECT_EQ(0, collection.size());
}

TEST_F(BridgingTest, longLivedObjectHandleAccessExpiresWithItsRoot) {
  auto jsInvoker = std::make_shared<ConcurrentTestCallInvoker>(rt);

  LongLivedObjectHandle<std::string> empty;
  EXPECT_TRUE(empty.expired());
  EXPECT_EQ(nullptr, empty.lockInvoker());
  EXPECT_FALSE(static_cast<bool>(empty.lockJSValue(rt)));

  {
    LongLivedObjectHandle<std::string> handle(rt, "payload"s, jsInvoker);
    EXPECT_FALSE(handle.expired());
    EXPECT_EQ(
        static_cast<CallInvoker*>(jsInvoker.get()), handle.lockInvoker().get());

    {
      auto locked = handle.lockJSValue(rt);
      ASSERT_TRUE(locked);
      locked->value += "!";
    }

    {
      // The payload lives in the collection rather than in the handle, so the
      // mutation is visible through a second lock.
      auto locked = handle.lockJSValue(rt);
      ASSERT_TRUE(locked);
      EXPECT_EQ("payload!"s, locked->value);
    }

    LongLivedObjectCollection::get(rt).clear();

    // An invoker retained elsewhere must not allow dispatch through an
    // invalidated handle.
    EXPECT_TRUE(handle.expired());
    EXPECT_EQ(nullptr, handle.lockInvoker());
    EXPECT_FALSE(static_cast<bool>(handle.lockJSValue(rt)));
  }

  jsInvoker->flushQueue();
  EXPECT_EQ(0, LongLivedObjectCollection::get(rt).size());
}

TEST_F(BridgingTest, longLivedObjectHandleDestroyedOnJsThreadReleasesInline) {
  auto jsInvoker = std::make_shared<ConcurrentTestCallInvoker>(rt);
  auto& collection = LongLivedObjectCollection::get(rt);
  auto record = std::make_shared<ReleaseRecord>();

  {
    LongLivedObjectHandle<ProbePayload> handle(
        rt, recordingPayload(record), jsInvoker);
    EXPECT_EQ(1, collection.size());

    handle.reset();

    // Released from the thread that built it, so the root and the value go
    // inline and the queue never sees a cleanup job.
    EXPECT_EQ(0, jsInvoker->queueSize());
    EXPECT_EQ(1, record->releaseCount());
    EXPECT_EQ(std::this_thread::get_id(), record->releaseThread());
    EXPECT_EQ(0, collection.size());
  }

  // Destroying the emptied handle schedules nothing either.
  EXPECT_EQ(0, jsInvoker->queueSize());
  EXPECT_EQ(1, record->releaseCount());
}

TEST_F(BridgingTest, longLivedObjectHandleReleaseTaskHoldsNoStrongReference) {
  auto jsInvoker = std::make_shared<ConcurrentTestCallInvoker>(rt);
  auto& collection = LongLivedObjectCollection::get(rt);
  auto record = std::make_shared<ReleaseRecord>();

  {
    auto handle = std::make_optional<LongLivedObjectHandle<ProbePayload>>(
        rt, recordingPayload(record), jsInvoker);

    // Only a handle dropped away from the JavaScript thread leaves a queued
    // cleanup job to inspect.
    std::thread owner([&] { handle.reset(); });
    owner.join();
  }
  EXPECT_EQ(1, jsInvoker->queueSize());

  // A queue that is thrown away destroys its tasks on whichever thread tears
  // it down, so a scheduled release must not own the payload.
  std::thread worker([&] { jsInvoker->discardQueue(); });
  worker.join();

  EXPECT_EQ(0, record->releaseCount());
  EXPECT_EQ(1, collection.size());

  collection.clear();

  EXPECT_EQ(1, record->releaseCount());
  EXPECT_EQ(std::this_thread::get_id(), record->releaseThread());
  EXPECT_EQ(0, collection.size());
}

TEST_F(BridgingTest, longLivedObjectCollectionClearDestroysPayloadsUnlocked) {
  auto jsInvoker = std::make_shared<ConcurrentTestCallInvoker>(rt);
  auto& collection = LongLivedObjectCollection::get(rt);
  int reentrantClears = 0;

  {
    LongLivedObjectHandle<ProbePayload> handle(
        rt,
        ProbePayload([&] {
          ++reentrantClears;
          LongLivedObjectCollection::get(rt).clear();
        }),
        jsInvoker);

    // A payload destructor is allowed to reach back into the collection, which
    // it cannot do if clear() still holds the lock while destroying.
    collection.clear();
  }

  EXPECT_EQ(1, reentrantClears);
  EXPECT_EQ(0, collection.size());

  jsInvoker->flushQueue();
  EXPECT_EQ(0, collection.size());
}

TEST_F(BridgingTest, asyncCallbackRuntimeDestroyedDuringDispatch) {
  for (bool customCall : {false, true}) {
    auto standaloneRuntime = hermes::makeHermesRuntime();
    auto jsInvoker =
        std::make_shared<ConcurrentTestCallInvoker>(*standaloneRuntime);
    auto callback = std::make_optional<AsyncCallback<int>>(
        *standaloneRuntime,
        jsi::Function::createFromHostFunction(
            *standaloneRuntime,
            jsi::PropNameID::forAscii(*standaloneRuntime, "callback"),
            1,
            [](jsi::Runtime&, const jsi::Value&, const jsi::Value*, size_t) {
              return jsi::Value::undefined();
            }),
        jsInvoker);

    jsInvoker->closeGate();
    std::thread worker([&] {
      if (customCall) {
        callback->call([](jsi::Runtime& runtime, jsi::Function& function) {
          function.call(runtime, 1);
        });
      } else {
        callback->call(1);
      }
    });

    jsInvoker->waitForDispatch(1);
    // A native-side strong reference would survive clear() while dispatch is
    // parked; address sanitizer detects its invalidation after runtime
    // disposal.
    LongLivedObjectCollection::get(*standaloneRuntime).clear();
    standaloneRuntime.reset();
    jsInvoker->openGate();
    worker.join();
    EXPECT_EQ(1, jsInvoker->queueSize());

    callback.reset();
    std::thread discard([&] { jsInvoker->discardQueue(); });
    discard.join();
    EXPECT_EQ(0, jsInvoker->queueSize());
  }
}

TEST_F(BridgingTest, callbackRoundTripPreservesFunctionIdentity) {
  auto original = function("(value) => value + 1");
  auto sync = bridging::fromJs<SyncCallback<int(int)>>(
      rt, original.getFunction(rt), invoker);
  auto async = bridging::fromJs<AsyncCallback<int>>(
      rt, original.getFunction(rt), invoker);

  EXPECT_TRUE(
      jsi::Object::strictEquals(
          rt, original, Bridging<decltype(sync)>::toJs(rt, sync)));
  EXPECT_TRUE(
      jsi::Object::strictEquals(
          rt, original, Bridging<decltype(async)>::toJs(rt, async)));

  LongLivedObjectCollection::get(rt).clear();
  EXPECT_JSI_THROW(Bridging<decltype(sync)>::toJs(rt, sync));
  EXPECT_JSI_THROW(Bridging<decltype(async)>::toJs(rt, async));
}

TEST_F(BridgingTest, longLivedObjectHandleRejectsMissingInvoker) {
  EXPECT_JSI_THROW(
      LongLivedObjectHandle<jsi::Object>(rt, jsi::Object(rt), nullptr));
  EXPECT_EQ(0, LongLivedObjectCollection::get(rt).size());
}

TEST_F(BridgingTest, syncCallbackMoveConstructionTransfersOwnership) {
  {
    auto source = std::make_optional<SyncCallback<std::string()>>(
        rt, function("() => 'moved'"), invoker);
    auto moved = std::move(*source);
    source.reset();
    flushQueue();
    EXPECT_EQ(1, LongLivedObjectCollection::get(rt).size());
    EXPECT_EQ("moved"s, moved());
  }
  flushQueue();
  EXPECT_EQ(0, LongLivedObjectCollection::get(rt).size());
}

TEST_F(BridgingTest, syncCallbackCanDestroyItsNativeOwnerDuringCall) {
  // Heap allocated so that touching a member after the owner is gone is a
  // use-after-free the sanitizers report, not a read of live stack storage.
  std::unique_ptr<SyncCallback<int()>> callback;
  auto destroyOwner = std::function<int()>([&] {
    callback.reset();
    return 42;
  });
  callback = std::make_unique<SyncCallback<int()>>(
      rt, bridging::toJs(rt, destroyOwner, invoker), invoker);

  EXPECT_EQ(42, callback->call());
  EXPECT_EQ(nullptr, callback);
  flushQueue();
  EXPECT_EQ(0, LongLivedObjectCollection::get(rt).size());
}

TEST_F(BridgingTest, longLivedObjectCollectionRemoveDestroysPayloadsUnlocked) {
  struct ReentrantObject : LongLivedObject {
    ReentrantObject(jsi::Runtime& runtime, int& releases)
        : LongLivedObject(runtime), releases_(releases) {}

    ~ReentrantObject() override {
      ++releases_;
      LongLivedObjectCollection::get(runtime_).clear();
    }

    int& releases_;
  };

  auto& collection = LongLivedObjectCollection::get(rt);
  int releases = 0;
  auto object = std::make_shared<ReentrantObject>(rt, releases);
  auto address = object.get();
  collection.add(std::move(object));
  collection.remove(address);

  EXPECT_EQ(1, releases);
  EXPECT_EQ(0, collection.size());
}

TEST_F(BridgingTest, asyncCallbackInvalidationReleasesQueuedArguments) {
  for (bool discard : {false, true}) {
    auto jsInvoker = std::make_shared<ConcurrentTestCallInvoker>(rt);
    auto lifetime = std::make_shared<int>(1);
    std::weak_ptr<int> weakLifetime = lifetime;
    auto argument =
        std::function<void()>([lifetime] { EXPECT_EQ(1, *lifetime); });
    auto callback = AsyncCallback<decltype(argument), std::string>(
        rt, function("(callback, value) => callback()"), jsInvoker);

    callback.callWithPriority(
        SchedulerPriority::IdlePriority, argument, "queued");
    argument = {};
    lifetime.reset();
    EXPECT_FALSE(weakLifetime.expired());
    EXPECT_EQ(1, jsInvoker->queueSize());

    LongLivedObjectCollection::get(rt).clear();
    if (discard) {
      std::thread worker([&] { jsInvoker->discardQueue(); });
      worker.join();
    } else {
      jsInvoker->flushQueue();
    }
    EXPECT_TRUE(weakLifetime.expired());
    EXPECT_EQ(0, jsInvoker->queueSize());
  }
}

TEST_F(BridgingTest, longLivedObjectHandleDoesNotRetainInvoker) {
  auto jsInvoker = std::make_shared<ConcurrentTestCallInvoker>(rt);
  std::weak_ptr<CallInvoker> weakInvoker = jsInvoker;
  auto record = std::make_shared<ReleaseRecord>();
  LongLivedObjectHandle<ProbePayload> handle(
      rt, recordingPayload(record), jsInvoker);

  jsInvoker.reset();
  EXPECT_TRUE(weakInvoker.expired());
  EXPECT_FALSE(handle.expired());

  std::thread worker([&] { handle.reset(); });
  worker.join();
  EXPECT_EQ(0, record->releaseCount());

  LongLivedObjectCollection::get(rt).clear();
  EXPECT_EQ(1, record->releaseCount());
  EXPECT_EQ(std::this_thread::get_id(), record->releaseThread());
}

TEST_F(BridgingTest, asyncCallbackQueuedCallStopsWhenInvokerExpires) {
  auto jsInvoker = std::make_shared<ConcurrentTestCallInvoker>(rt);
  std::weak_ptr<CallInvoker> weakInvoker = jsInvoker;
  int calls = 0;
  auto nativeCallback = std::function<void()>([&] { ++calls; });
  auto callback = AsyncCallback<decltype(nativeCallback)>(
      rt, function("(callback) => callback()"), jsInvoker);
  callback.call(nativeCallback);

  auto queued = jsInvoker->takeNextJob();
  ASSERT_TRUE(queued.has_value());
  jsInvoker.reset();
  ASSERT_TRUE(weakInvoker.expired());

  EXPECT_NO_THROW((*queued)(rt));
  EXPECT_EQ(0, calls);
}

TEST_F(BridgingTest, asyncCallbackQueuedCustomCallDoesNotRequireInvoker) {
  auto jsInvoker = std::make_shared<ConcurrentTestCallInvoker>(rt);
  std::weak_ptr<CallInvoker> weakInvoker = jsInvoker;
  int calls = 0;
  auto callback = AsyncCallback<>(rt, function("() => {}"), jsInvoker);
  callback.call([&](jsi::Runtime&, jsi::Function&) { ++calls; });

  auto queued = jsInvoker->takeNextJob();
  ASSERT_TRUE(queued.has_value());
  jsInvoker.reset();
  ASSERT_TRUE(weakInvoker.expired());

  (*queued)(rt);
  EXPECT_EQ(1, calls);
}

TEST_F(BridgingTest, syncCallbackStopsWhenInvokerExpires) {
  auto jsInvoker = std::make_shared<ConcurrentTestCallInvoker>(rt);
  SyncCallback<int()> callback(rt, function("() => 42"), jsInvoker);

  jsInvoker.reset();
  EXPECT_THROW(callback.call(), std::runtime_error);
}

TEST_F(BridgingTest, asyncCallbackUsesItsStoredRuntime) {
  auto otherRuntime = hermes::makeHermesRuntime();
  for (bool customCall : {false, true}) {
    auto jsInvoker = std::make_shared<ConcurrentTestCallInvoker>(rt);
    int calls = 0;
    auto nativeCallback = std::function<void()>([&] { ++calls; });
    auto callback = AsyncCallback<decltype(nativeCallback)>(
        rt, function("(callback) => callback()"), jsInvoker);

    if (customCall) {
      callback.call([&](jsi::Runtime& runtime, jsi::Function& function) {
        EXPECT_EQ(&rt, &runtime);
        function.call(
            runtime, bridging::toJs(runtime, nativeCallback, jsInvoker));
      });
    } else {
      callback.call(nativeCallback);
    }

    auto queued = jsInvoker->takeNextJob();
    ASSERT_TRUE(queued.has_value());
    (*queued)(*otherRuntime);
    EXPECT_EQ(1, calls);
  }
}

TEST_F(BridgingTest, longLivedObjectHandleResetRacesRuntimeCleanup) {
  constexpr size_t iterations = 10000;
  auto jsInvoker = std::make_shared<ConcurrentTestCallInvoker>(rt);
  auto& collection = LongLivedObjectCollection::get(rt);
  std::optional<LongLivedObjectHandle<ProbePayload>> handle;
  std::barrier phase(2);

  std::thread worker([&] {
    for (size_t iteration = 0; iteration < iterations; ++iteration) {
      phase.arrive_and_wait();
      handle->reset();
      phase.arrive_and_wait();
    }
  });

  size_t wrongReleaseCount = 0;
  size_t wrongReleaseThread = 0;
  for (size_t iteration = 0; iteration < iterations; ++iteration) {
    auto record = std::make_shared<ReleaseRecord>();
    handle.emplace(rt, recordingPayload(record), jsInvoker);

    // Repeatedly overlap teardown with native release to cover short-lived
    // strong references hidden inside converting weak-pointer constructors.
    phase.arrive_and_wait();
    collection.clear();
    phase.arrive_and_wait();

    wrongReleaseCount += static_cast<size_t>(record->releaseCount() != 1);
    wrongReleaseThread += static_cast<size_t>(
        record->releaseThread() != std::this_thread::get_id());
    jsInvoker->discardQueue();
  }
  worker.join();

  EXPECT_EQ(0, wrongReleaseCount);
  EXPECT_EQ(0, wrongReleaseThread);
  EXPECT_EQ(0, collection.size());
  EXPECT_EQ(0, jsInvoker->queueSize());
}

} // namespace facebook::react

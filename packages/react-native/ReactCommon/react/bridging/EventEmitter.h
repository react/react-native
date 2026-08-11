/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/bridging/Function.h>
#include <functional>
#include <memory>
#include <mutex>
#include <unordered_map>

#define FRIEND_TEST(test_case_name, test_name) \
  friend class test_case_name##_##test_name##_Test

namespace facebook::react {

class EventSubscription {
 public:
  explicit EventSubscription(std::function<void()> remove)
      : remove_(std::move(remove)) {}
  ~EventSubscription() = default;
  EventSubscription(EventSubscription&&) noexcept = default;
  EventSubscription& operator=(EventSubscription&&) noexcept = default;
  EventSubscription(const EventSubscription&) = delete;
  EventSubscription& operator=(const EventSubscription&) = delete;

  void remove() {
    remove_();
  }

 private:
  friend Bridging<EventSubscription>;
  std::function<void()> remove_;
};

template <>
struct Bridging<EventSubscription> {
  static EventSubscription fromJs(
      jsi::Runtime& rt,
      const jsi::Object& value,
      const std::shared_ptr<CallInvoker>& jsInvoker) {
    auto listener = bridging::fromJs<AsyncCallback<>>(
        rt, value.getProperty(rt, "remove"), jsInvoker);
    return EventSubscription(
        [listener = std::move(listener)]() mutable { listener(); });
  }

  static jsi::Object toJs(
      jsi::Runtime& rt,
      const EventSubscription& eventSubscription,
      const std::shared_ptr<CallInvoker>& jsInvoker) {
    auto result = jsi::Object(rt);
    result.setProperty(
        rt, "remove", bridging::toJs(rt, eventSubscription.remove_, jsInvoker));
    return result;
  }
};

class IAsyncEventEmitter {
 public:
  IAsyncEventEmitter() noexcept = default;
  virtual ~IAsyncEventEmitter() noexcept = default;
  IAsyncEventEmitter(IAsyncEventEmitter&&) noexcept = default;
  IAsyncEventEmitter& operator=(IAsyncEventEmitter&&) noexcept = default;
  IAsyncEventEmitter(const IAsyncEventEmitter&) = delete;
  IAsyncEventEmitter& operator=(const IAsyncEventEmitter&) = delete;

  virtual jsi::Object get(
      jsi::Runtime& rt,
      const std::shared_ptr<CallInvoker>& jsInvoker) const = 0;
};

template <typename... Args>
class AsyncEventEmitter : public IAsyncEventEmitter {
  static_assert(
      sizeof...(Args) <= 1,
      "AsyncEventEmitter must have at most one argument");

 public:
  AsyncEventEmitter() : state_(std::make_shared<SharedState>()) {
    listen_ = [state = state_](AsyncCallback<Args...> listener) {
      std::lock_guard<std::mutex> lock(state->mutex);
      auto listenerId = state->listenerId++;
      state->listeners.emplace(listenerId, std::move(listener));
      return EventSubscription([state, listenerId]() {
        std::lock_guard<std::mutex> innerLock(state->mutex);
        state->listeners.erase(listenerId);
      });
    };
  }
  ~AsyncEventEmitter() override = default;
  AsyncEventEmitter(AsyncEventEmitter&&) noexcept = default;
  AsyncEventEmitter& operator=(AsyncEventEmitter&&) noexcept = default;
  AsyncEventEmitter(const AsyncEventEmitter&) = delete;
  AsyncEventEmitter& operator=(const AsyncEventEmitter&) = delete;

  void emit(std::function<jsi::Value(jsi::Runtime&)>&& converter) {
    std::lock_guard<std::mutex> lock(state_->mutex);
    for (auto& [_, listener] : state_->listeners) {
      listener.call([converter](jsi::Runtime& rt, jsi::Function& jsFunction) {
        jsFunction.call(rt, converter(rt));
      });
    }
  }

  void emit(Args... value) {
    std::lock_guard<std::mutex> lock(state_->mutex);
    for (const auto& [_, listener] : state_->listeners) {
      listener.call(static_cast<Args>(value)...);
    }
  }

  jsi::Object get(
      jsi::Runtime& rt,
      const std::shared_ptr<CallInvoker>& jsInvoker) const override {
    return bridging::toJs(rt, listen_, jsInvoker);
  }

 private:
  friend Bridging<AsyncEventEmitter>;
  FRIEND_TEST(BridgingTest, eventEmitterTest);

  struct SharedState {
    std::mutex mutex;
    std::unordered_map<size_t, AsyncCallback<Args...>> listeners;
    size_t listenerId{};
  };

  std::function<EventSubscription(AsyncCallback<Args...>)> listen_;
  std::shared_ptr<SharedState> state_;
};

template <typename... Args>
struct Bridging<AsyncEventEmitter<Args...>> {
  static jsi::Object toJs(
      jsi::Runtime& rt,
      const AsyncEventEmitter<Args...>& eventEmitter,
      const std::shared_ptr<CallInvoker>& jsInvoker) {
    return eventEmitter.get(rt, jsInvoker);
  }
};

} // namespace facebook::react

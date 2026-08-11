/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/bridging/Base.h>
#include <react/bridging/CallbackWrapper.h>

#include <ReactCommon/CallInvoker.h>
#include <ReactCommon/SchedulerPriority.h>

namespace facebook::react {

template <typename F>
class SyncCallback;

template <typename... Args>
class AsyncCallback {
 public:
  AsyncCallback(
      jsi::Runtime& runtime,
      jsi::Function function,
      std::shared_ptr<CallInvoker> jsInvoker)
      : callback_(std::make_shared<SyncCallback<void(Args...)>>(
            runtime,
            std::move(function),
            std::move(jsInvoker))) {}

  void operator()(Args... args) const noexcept {
    call(std::forward<Args>(args)...);
  }

  void call(Args... args) const noexcept {
    callWithArgs(std::nullopt, std::forward<Args>(args)...);
  }

  void callWithPriority(SchedulerPriority priority, Args... args)
      const noexcept {
    callWithArgs(priority, std::forward<Args>(args)...);
  }

  void call(std::function<void(jsi::Runtime&, jsi::Function&)>&& callImpl)
      const noexcept {
    callWithFunction(std::nullopt, std::move(callImpl));
  }

  void callWithPriority(
      SchedulerPriority priority,
      std::function<void(jsi::Runtime&, jsi::Function&)>&& callImpl)
      const noexcept {
    callWithFunction(priority, std::move(callImpl));
  }

 private:
  friend Bridging<AsyncCallback>;

  std::shared_ptr<SyncCallback<void(Args...)>> callback_;

  void callWithArgs(std::optional<SchedulerPriority> priority, Args... args)
      const noexcept {
    if (auto wrapper = callback_->wrapper_.lock()) {
      auto fn = [callback = callback_,
                 argsPtr = std::make_shared<std::tuple<Args...>>(
                     std::make_tuple(std::forward<Args>(args)...))](
                    jsi::Runtime&) { callback->apply(std::move(*argsPtr)); };

      auto& jsInvoker = wrapper->jsInvoker();
      if (priority) {
        jsInvoker.invokeAsync(*priority, std::move(fn));
      } else {
        jsInvoker.invokeAsync(std::move(fn));
      }
    }
  }

  void callWithFunction(
      std::optional<SchedulerPriority> priority,
      std::function<void(jsi::Runtime&, jsi::Function&)>&& callImpl)
      const noexcept {
    if (auto wrapper = callback_->wrapper_.lock()) {
      // Capture callback_ and not wrapper_. If callback_ is deallocated or the
      // JSVM is shutdown before the async task is scheduled, the underlying
      // function will have been deallocated.
      auto fn = [callback = callback_,
                 callImpl = std::move(callImpl)](jsi::Runtime& rt) {
        if (auto wrapper2 = callback->wrapper_.lock()) {
          callImpl(rt, wrapper2->callback());
        }
      };

      auto& jsInvoker = wrapper->jsInvoker();
      if (priority) {
        jsInvoker.invokeAsync(*priority, std::move(fn));
      } else {
        jsInvoker.invokeAsync(std::move(fn));
      }
    }
  }
};

// You must ensure that when invoking this you're located on the JS thread, or
// have exclusive control of the JS VM context. If you cannot ensure this, use
// AsyncCallback instead.
template <typename R, typename... Args>
class SyncCallback<R(Args...)> {
 public:
  SyncCallback(
      jsi::Runtime& rt,
      jsi::Function function,
      std::shared_ptr<CallInvoker> jsInvoker)
      : wrapper_(CallbackWrapper::createWeak(
            std::move(function),
            rt,
            std::move(jsInvoker))) {}

  // Disallow copying, as we can no longer safely destroy the callback
  // from the destructor if there's multiple copies
  SyncCallback(const SyncCallback&) = delete;
  SyncCallback& operator=(const SyncCallback&) = delete;

  // Allow move
  SyncCallback(SyncCallback&& other) noexcept
      : wrapper_(std::move(other.wrapper_)) {}

  SyncCallback& operator=(SyncCallback&& other) noexcept {
    wrapper_ = std::move(other.wrapper_);
    return *this;
  }

  ~SyncCallback() {
    if (auto wrapper = wrapper_.lock()) {
      wrapper->destroy();
    }
  }

  R operator()(Args... args) const {
    return call(std::forward<Args>(args)...);
  }

  R call(Args... args) const {
    auto wrapper = wrapper_.lock();

    // If the wrapper has been deallocated, we can no longer provide a return
    // value consistently, so our only option is to throw
    if (!wrapper) {
      if constexpr (std::is_void_v<R>) {
        return;
      } else {
        throw std::runtime_error("Failed to call invalidated sync callback");
      }
    }

    auto& callback = wrapper->callback();
    auto& rt = wrapper->runtime();
    auto jsInvoker = wrapper->jsInvokerPtr();

    if constexpr (std::is_void_v<R>) {
      callback.call(
          rt, bridging::toJs(rt, std::forward<Args>(args), jsInvoker)...);
    } else {
      return bridging::fromJs<R>(
          rt,
          callback.call(
              rt, bridging::toJs(rt, std::forward<Args>(args), jsInvoker)...),
          jsInvoker);
    }
  }

 private:
  friend AsyncCallback<Args...>;
  friend Bridging<SyncCallback>;

  R apply(std::tuple<Args...>&& args) const {
    return apply(std::move(args), std::index_sequence_for<Args...>{});
  }

  template <size_t... Index>
  R apply(std::tuple<Args...>&& args, std::index_sequence<Index...> /*unused*/)
      const {
    return call(std::move(std::get<Index>(args))...);
  }

  // Held weakly so lifetime is managed by LongLivedObjectCollection.
  std::weak_ptr<CallbackWrapper> wrapper_;
};

template <typename... Args>
struct Bridging<AsyncCallback<Args...>> {
  static AsyncCallback<Args...> fromJs(
      jsi::Runtime& rt,
      jsi::Function&& value,
      const std::shared_ptr<CallInvoker>& jsInvoker) {
    return AsyncCallback<Args...>(rt, std::move(value), jsInvoker);
  }

  static jsi::Function toJs(
      jsi::Runtime& rt,
      const AsyncCallback<Args...>& value) {
    return value.callback_->function_.getFunction(rt);
  }
};

template <typename R, typename... Args>
struct Bridging<SyncCallback<R(Args...)>> {
  static SyncCallback<R(Args...)> fromJs(
      jsi::Runtime& rt,
      jsi::Function&& value,
      const std::shared_ptr<CallInvoker>& jsInvoker) {
    return SyncCallback<R(Args...)>(rt, std::move(value), jsInvoker);
  }

  static jsi::Function toJs(
      jsi::Runtime& rt,
      const SyncCallback<R(Args...)>& value) {
    return value.function_.getFunction(rt);
  }
};

template <typename R, typename... Args>
struct Bridging<std::function<R(Args...)>> {
  using Func = std::function<R(Args...)>;
  using IndexSequence = std::index_sequence_for<Args...>;

  static constexpr size_t kArgumentCount = sizeof...(Args);

  static jsi::Function toJs(
      jsi::Runtime& rt,
      Func fn,
      const std::shared_ptr<CallInvoker>& jsInvoker) {
    return jsi::Function::createFromHostFunction(
        rt,
        jsi::PropNameID::forAscii(rt, "BridgedFunction"),
        kArgumentCount,
        [fn = std::make_shared<Func>(std::move(fn)), jsInvoker](
            jsi::Runtime& rt,
            const jsi::Value&,
            const jsi::Value* args,
            size_t count) -> jsi::Value {
          if (count < kArgumentCount) {
            throw jsi::JSError(rt, "Incorrect number of arguments");
          }

          if constexpr (std::is_void_v<R>) {
            callFromJs(*fn, rt, args, jsInvoker, IndexSequence{});
            return jsi::Value();
          } else {
            return bridging::toJs(
                rt,
                callFromJs(*fn, rt, args, jsInvoker, IndexSequence{}),
                jsInvoker);
          }
        });
  }

 private:
  template <size_t... Index>
  static R callFromJs(
      Func& fn,
      jsi::Runtime& rt,
      const jsi::Value* args,
      const std::shared_ptr<CallInvoker>& jsInvoker,
      std::index_sequence<Index...> /*unused*/) {
    return fn(bridging::fromJs<Args>(rt, args[Index], jsInvoker)...);
  }
};

template <typename R, typename... Args>
struct Bridging<
    std::function<R(Args...)>,
    std::enable_if_t<
        !std::is_same_v<std::function<R(Args...)>, std::function<R(Args...)>>>>
    : Bridging<std::function<R(Args...)>> {};

template <typename R, typename... Args>
struct Bridging<R(Args...)> : Bridging<std::function<R(Args...)>> {};

template <typename R, typename... Args>
struct Bridging<R (*)(Args...)> : Bridging<std::function<R(Args...)>> {};

} // namespace facebook::react

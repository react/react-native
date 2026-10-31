/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>

#include <react/bridging/Base.h>
#include <react/bridging/CallbackWrapper.h> // Retain the legacy transitive include.

#include <ReactCommon/CallInvoker.h>
#include <ReactCommon/SchedulerPriority.h>

namespace facebook::react {

template <typename F>
class SyncCallback;

template <typename... Args>
class AsyncCallback {
 public:
  AsyncCallback(jsi::Runtime &runtime, jsi::Function function, std::shared_ptr<CallInvoker> jsInvoker)
      : callback_(std::make_shared<SyncCallback<void(Args...)>>(runtime, std::move(function), std::move(jsInvoker)))
  {
  }

  void operator()(Args... args) const noexcept
  {
    call(std::forward<Args>(args)...);
  }

  void call(Args... args) const noexcept
  {
    callWithArgs(std::nullopt, std::forward<Args>(args)...);
  }

  void callWithPriority(SchedulerPriority priority, Args... args) const noexcept
  {
    callWithArgs(priority, std::forward<Args>(args)...);
  }

  void call(std::function<void(jsi::Runtime &, jsi::Function &)> &&callImpl) const noexcept
  {
    callWithFunction(std::nullopt, std::move(callImpl));
  }

  void callWithPriority(SchedulerPriority priority, std::function<void(jsi::Runtime &, jsi::Function &)> &&callImpl)
      const noexcept
  {
    callWithFunction(priority, std::move(callImpl));
  }

 private:
  friend Bridging<AsyncCallback>;

  std::shared_ptr<SyncCallback<void(Args...)>> callback_;

  void callWithArgs(std::optional<SchedulerPriority> priority, Args... args) const noexcept
  {
    auto callback = callback_;
    if (auto jsInvoker = callback->function_.lockInvoker()) {
      // The queued function owns the tuple; its lifetime is opaque to the analyzer.
      // NOLINTNEXTLINE(clang-analyzer-cplusplus.NewDeleteLeaks)
      auto fn = [callback = std::move(callback),
                 argsPtr = std::make_shared<std::tuple<Args...>>(std::make_tuple(std::forward<Args>(args)...))](
                    jsi::Runtime &) { callback->apply(std::move(*argsPtr)); };

      if (priority) {
        jsInvoker->invokeAsync(*priority, std::move(fn));
      } else {
        jsInvoker->invokeAsync(std::move(fn));
      }
    }
  }

  void callWithFunction(
      std::optional<SchedulerPriority> priority,
      std::function<void(jsi::Runtime &, jsi::Function &)> &&callImpl) const noexcept
  {
    auto callback = callback_;
    if (auto jsInvoker = callback->function_.lockInvoker()) {
      // Retain native ownership until this task is destroyed, without retaining
      // a JavaScript value while the task is queued or discarded.
      auto fn = [callback = std::move(callback), callImpl = std::move(callImpl)](jsi::Runtime &) {
        if (!callback->function_.expired()) {
          auto &rt = *callback->runtime_;
          if (auto function = callback->function_.lockJSValue(rt)) {
            callImpl(rt, function->value);
          }
        }
      };

      if (priority) {
        jsInvoker->invokeAsync(*priority, std::move(fn));
      } else {
        jsInvoker->invokeAsync(std::move(fn));
      }
    }
  }
};

// Invoke only on the JavaScript thread. Use AsyncCallback from other threads.
template <typename R, typename... Args>
class SyncCallback<R(Args...)> {
 public:
  SyncCallback(jsi::Runtime &rt, jsi::Function function, std::shared_ptr<CallInvoker> jsInvoker)
      : runtime_(&rt), function_(rt, std::move(function), std::move(jsInvoker))
  {
  }

  SyncCallback(const SyncCallback &) = delete;
  SyncCallback &operator=(const SyncCallback &) = delete;
  SyncCallback(SyncCallback &&) noexcept = default;
  SyncCallback &operator=(SyncCallback &&) noexcept = default;
  ~SyncCallback() = default;

  R operator()(Args... args) const
  {
    return call(std::forward<Args>(args)...);
  }

  R call(Args... args) const
  {
    auto jsInvoker = function_.lockInvoker();
    auto function = jsInvoker ? function_.lockJSValue(*runtime_) : nullptr;

    // If the function has been deallocated, we can no longer provide a return
    // value consistently, so our only option is to throw.
    if (!function) {
      if constexpr (std::is_void_v<R>) {
        return;
      } else {
        throw std::runtime_error("Failed to call invalidated sync callback");
      }
    }

    // JavaScript can destroy this native callback during the call; use only
    // the retained value and local runtime/invoker references afterward.
    auto &callback = function->value;
    auto &rt = *runtime_;

    if constexpr (std::is_void_v<R>) {
      callback.call(rt, bridging::toJs(rt, std::forward<Args>(args), jsInvoker)...);
    } else {
      return bridging::fromJs<R>(
          rt, callback.call(rt, bridging::toJs(rt, std::forward<Args>(args), jsInvoker)...), jsInvoker);
    }
  }

 private:
  friend AsyncCallback<Args...>;
  friend Bridging<SyncCallback>;

  R apply(std::tuple<Args...> &&args) const
  {
    return apply(std::move(args), std::index_sequence_for<Args...>{});
  }

  template <size_t... Index>
  R apply(std::tuple<Args...> &&args, std::index_sequence<Index...> /*unused*/) const
  {
    return call(std::move(std::get<Index>(args))...);
  }

  jsi::Runtime *runtime_;
  LongLivedObjectHandle<jsi::Function> function_;
};

template <typename... Args>
struct Bridging<AsyncCallback<Args...>> {
  static AsyncCallback<Args...>
  fromJs(jsi::Runtime &rt, jsi::Function &&value, const std::shared_ptr<CallInvoker> &jsInvoker)
  {
    return AsyncCallback<Args...>(rt, std::move(value), jsInvoker);
  }

  static jsi::Function toJs(jsi::Runtime &rt, const AsyncCallback<Args...> &value)
  {
    return Bridging<SyncCallback<void(Args...)>>::toJs(rt, *value.callback_);
  }
};

template <typename R, typename... Args>
struct Bridging<SyncCallback<R(Args...)>> {
  static SyncCallback<R(Args...)>
  fromJs(jsi::Runtime &rt, jsi::Function &&value, const std::shared_ptr<CallInvoker> &jsInvoker)
  {
    return SyncCallback<R(Args...)>(rt, std::move(value), jsInvoker);
  }

  static jsi::Function toJs(jsi::Runtime &rt, const SyncCallback<R(Args...)> &value)
  {
    if (auto function = value.function_.lockJSValue(rt)) {
      return function->value.getFunction(rt);
    }
    throw jsi::JSError(rt, "Failed to get invalidated callback");
  }
};

template <typename R, typename... Args>
struct Bridging<std::function<R(Args...)>> {
  using Func = std::function<R(Args...)>;
  using IndexSequence = std::index_sequence_for<Args...>;

  static constexpr size_t kArgumentCount = sizeof...(Args);

  static jsi::Function toJs(jsi::Runtime &rt, Func fn, const std::shared_ptr<CallInvoker> &jsInvoker)
  {
    return jsi::Function::createFromHostFunction(
        rt,
        jsi::PropNameID::forAscii(rt, "BridgedFunction"),
        kArgumentCount,
        [fn = std::make_shared<Func>(std::move(fn)), jsInvoker](
            jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
          if (count < kArgumentCount) {
            throw jsi::JSError(rt, "Incorrect number of arguments");
          }

          if constexpr (std::is_void_v<R>) {
            callFromJs(*fn, rt, args, jsInvoker, IndexSequence{});
            return jsi::Value();
          } else {
            return bridging::toJs(rt, callFromJs(*fn, rt, args, jsInvoker, IndexSequence{}), jsInvoker);
          }
        });
  }

 private:
  template <size_t... Index>
  static R callFromJs(
      Func &fn,
      jsi::Runtime &rt,
      const jsi::Value *args,
      const std::shared_ptr<CallInvoker> &jsInvoker,
      std::index_sequence<Index...> /*unused*/)
  {
    return fn(bridging::fromJs<Args>(rt, args[Index], jsInvoker)...);
  }
};

template <typename R, typename... Args>
struct Bridging<
    std::function<R(Args...)>,
    std::enable_if_t<!std::is_same_v<std::function<R(Args...)>, std::function<R(Args...)>>>>
    : Bridging<std::function<R(Args...)>> {};

template <typename R, typename... Args>
struct Bridging<R(Args...)> : Bridging<std::function<R(Args...)>> {};

template <typename R, typename... Args>
struct Bridging<R (*)(Args...)> : Bridging<std::function<R(Args...)>> {};

} // namespace facebook::react

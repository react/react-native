/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>

#include <react/bridging/Error.h>
#include <react/bridging/Function.h>
#include <react/bridging/LongLivedObject.h>

#include <mutex>
#include <optional>

namespace facebook::react {

template <typename... T>
class AsyncPromise {
  static_assert(sizeof...(T) <= 1, "AsyncPromise must have at most one argument");

 public:
  AsyncPromise(jsi::Runtime &rt, const std::shared_ptr<CallInvoker> &jsInvoker)
      : state_(std::make_shared<SharedState>())
  {
    auto constructor = rt.global().getPropertyAsFunction(rt, "Promise");

    auto promise = constructor.callAsConstructor(
        rt,
        bridging::toJs(
            rt,
            // Safe to capture this since this is called synchronously.
            [this](AsyncCallback<T...> resolve, const AsyncCallback<Error> &reject) {
              state_->resolve = std::move(resolve);
              state_->reject = std::move(reject);
            },
            jsInvoker));

    state_->promiseHandle = LongLivedObjectHandle<jsi::Object>(rt, promise.asObject(rt), jsInvoker);
  }

  void resolve(T... value)
  {
    std::optional<AsyncCallback<T...>> resolve;
    std::optional<AsyncCallback<Error>> reject;
    {
      std::lock_guard<std::mutex> lock(state_->mutex);
      resolve = std::exchange(state_->resolve, std::nullopt);
      reject = std::exchange(state_->reject, std::nullopt);
    }

    if (resolve) {
      resolve->call(std::forward<T>(value)...);
    }
  }

  void reject(Error error)
  {
    std::optional<AsyncCallback<T...>> resolve;
    std::optional<AsyncCallback<Error>> reject;
    {
      std::lock_guard<std::mutex> lock(state_->mutex);
      resolve = std::exchange(state_->resolve, std::nullopt);
      reject = std::exchange(state_->reject, std::nullopt);
    }

    if (reject) {
      reject->call(std::move(error));
    }
  }

  jsi::Object get(jsi::Runtime &rt) const
  {
    if (auto holder = state_->promiseHandle.lockJSValue(rt)) {
      return jsi::Value(rt, holder->value).asObject(rt);
    } else {
      throw jsi::JSError(rt, "Failed to get invalidated promise");
    }
  }

 private:
  struct SharedState {
    std::mutex mutex;
    LongLivedObjectHandle<jsi::Object> promiseHandle;
    std::optional<AsyncCallback<T...>> resolve;
    std::optional<AsyncCallback<Error>> reject;
  };

  std::shared_ptr<SharedState> state_;
};

template <typename... T>
struct Bridging<AsyncPromise<T...>> {
  static jsi::Object toJs(jsi::Runtime &rt, const AsyncPromise<T...> &promise)
  {
    return promise.get(rt);
  }
};

} // namespace facebook::react

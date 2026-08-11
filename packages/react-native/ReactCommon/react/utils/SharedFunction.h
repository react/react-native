/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <memory>
#include <mutex>
#include <shared_mutex>

namespace facebook::react {

/*
 * `SharedFunction` implements a pattern of a shared callable object that
 * contains the same executable inside. It's similar to  `std::function` with
 * one important difference: when the object is copied, the stored function (and
 * captured values) are shared between instances (not copied). `SharedFunction`
 * can be stored inside `std::function` because it's callable. It useful in some
 * scenarios, such as:
 * - When captured by `std::function` arguments are not copyable;
 * - When we need to replace the content of the callable later on the go.
 */
template <typename... ArgumentT>
class SharedFunction {
  using T = void(ArgumentT...);

  struct Pair {
    Pair(std::function<T>&& function) : function(std::move(function)) {}
    std::function<T> function;
    std::shared_mutex mutex{};
  };

 public:
  SharedFunction(std::function<T>&& function = nullptr)
      : pair_(std::make_shared<Pair>(std::move(function))) {}

  SharedFunction(const SharedFunction& other) = default;
  SharedFunction(SharedFunction&& other) noexcept = default;

  SharedFunction& operator=(const SharedFunction& other) = default;
  SharedFunction& operator=(SharedFunction&& other) noexcept = default;

  void assign(std::function<T> function) const {
    std::unique_lock lock(pair_->mutex);
    pair_->function = function;
  }

  void operator()(ArgumentT... args) const {
    std::shared_lock lock(pair_->mutex);
    if (pair_->function) {
      pair_->function(args...);
    }
  }

 private:
  std::shared_ptr<Pair> pair_;
};

} // namespace facebook::react

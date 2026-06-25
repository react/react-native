/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace test {

template <typename R, typename... Args>
class Callback;

template <typename R, typename... Args>
class Callback<R(Args...)> {
 public:
  Callback(const Callback &) = delete;
  Callback &operator=(const Callback &) = delete;

  Callback(Callback &&other) noexcept {}
  Callback &operator=(Callback &&other) noexcept
  {
    return *this;
  }

  R call(Args... args) const {}
};

} // namespace test

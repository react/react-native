/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace folly {

struct dynamic {};

} // namespace folly

namespace test {

template <typename R, typename... T>
R jsArg(const folly::dynamic &arg, R (folly::dynamic::*asFoo)() const, const T &...desc);
template <typename R, typename... T>
R jsArg(const folly::dynamic &arg, R (folly::dynamic::*asFoo)() const &, const T &...desc);

} // namespace test

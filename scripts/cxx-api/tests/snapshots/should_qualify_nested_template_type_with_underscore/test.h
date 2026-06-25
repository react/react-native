/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace facebook {

namespace react {

namespace detail {

template <typename T>
struct is_dynamic {
  using type = typename std::enable_if<std::is_assignable<folly::dynamic, T>::value, T>::type;
};

} // end namespace detail

template <typename T>
typename detail::is_dynamic<T>::type &jsArgAsDynamic(T &&args, size_t n);

} // namespace react

} // namespace facebook

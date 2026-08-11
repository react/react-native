/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>

namespace facebook {
namespace xplat {

namespace detail {

inline std::string toStringHelper() {
  return "";
}

template <typename T, typename... Rest>
inline std::string toStringHelper(const T& value, const Rest&... rest) {
  return std::to_string(value) + toStringHelper(rest...);
}

template <typename... Rest>
inline std::string toStringHelper(const char* value, const Rest&... rest) {
  return std::string(value) + toStringHelper(rest...);
}

template <typename R, typename M, typename... T>
R jsArg1(const folly::dynamic& arg, M asFoo, const T&... desc) {
  try {
    return (arg.*asFoo)();
  } catch (const folly::TypeError& ex) {
    throw JsArgumentException(
        "Error converting JavaScript arg " + toStringHelper(desc...) +
        " to C++: " + ex.what());
  } catch (const std::range_error& ex) {
    throw JsArgumentException(
        "Could not convert argument " + toStringHelper(desc...) +
        " to required type: " + ex.what());
  }
}

} // namespace detail

template <typename R, typename... T>
R jsArg(
    const folly::dynamic& arg,
    R (folly::dynamic::*asFoo)() const,
    const T&... desc) {
  return detail::jsArg1<R>(arg, asFoo, desc...);
}

template <typename R, typename... T>
R jsArg(
    const folly::dynamic& arg,
    R (folly::dynamic::*asFoo)() const&,
    const T&... desc) {
  return detail::jsArg1<R>(arg, asFoo, desc...);
}

template <typename T>
// NOLINTNEXTLINE (T62192316)
typename detail::is_dynamic<T>::type& jsArgAsDynamic(T&& args, size_t n) {
  try {
    return args[n];
  } catch (const std::out_of_range& ex) {
    // Use 1-base counting for argument description.
    throw JsArgumentException(
        "JavaScript provided " + std::to_string(args.size()) +
        " arguments for C++ method which references at least " +
        std::to_string(n + 1) + " arguments: " + ex.what());
  }
}

template <typename R>
R jsArgN(
    const folly::dynamic& args,
    size_t n,
    R (folly::dynamic::*asFoo)() const) {
  return jsArg(jsArgAsDynamic(args, n), asFoo, n);
}
template <typename R>
R jsArgN(
    const folly::dynamic& args,
    size_t n,
    R (folly::dynamic::*asFoo)() const&) {
  return jsArg(jsArgAsDynamic(args, n), asFoo, n);
}

namespace detail {

// This is a helper for jsArgAsArray and jsArgAsObject.

template <typename T>
typename detail::is_dynamic<T>::type& jsArgAsType(
    T&& args,
    size_t n,
    const char* required,
    bool (folly::dynamic::*isFoo)() const) {
  T& ret = jsArgAsDynamic(args, n);
  if ((ret.*isFoo)()) {
    return ret;
  }

  // Use 1-base counting for argument description.
  throw JsArgumentException(
      "Argument " + std::to_string(n + 1) + " of type " + ret.typeName() +
      " is not required type " + required);
}

} // end namespace detail

template <typename T>
typename detail::is_dynamic<T>::type& jsArgAsArray(T&& args, size_t n) {
  return detail::jsArgAsType(args, n, "Array", &folly::dynamic::isArray);
}

template <typename T>
typename detail::is_dynamic<T>::type& jsArgAsObject(T&& args, size_t n) {
  return detail::jsArgAsType(args, n, "Object", &folly::dynamic::isObject);
}

} // namespace xplat
} // namespace facebook

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <exception>
#include <string>

#include <folly/dynamic.h>

// When building a cross-platform module for React Native, arguments passed
// from JS are represented as a folly::dynamic.  This class provides helpers to
// extract arguments from the folly::dynamic to concrete types usable by
// cross-platform code, and converting exceptions to a JsArgumentException so
// they can be caught and reported to RN consistently.  The goal is to make the
// jsArgAs... methods at the end simple to use should be most common, but any
// non-detail method can be used when needed.

namespace facebook::xplat {

class JsArgumentException : public std::logic_error {
 public:
  JsArgumentException(const std::string& msg) : std::logic_error(msg) {}
};

// This extracts a single argument by calling the given method pointer on it.
// If an exception is thrown, the additional arguments are passed to
// std::to_string to be included in the exception string.  This will be most
// commonly used when extracting values from non-scalar argument.  The second
// overload accepts ref-qualified member functions.

template <typename R, typename... T>
R jsArg(
    const folly::dynamic& arg,
    R (folly::dynamic::*asFoo)() const,
    const T&... desc);
template <typename R, typename... T>
R jsArg(
    const folly::dynamic& arg,
    R (folly::dynamic::*asFoo)() const&,
    const T&... desc);

// This is like jsArg, but a operates on a dynamic representing an array of
// arguments.  The argument n is used both to index the array and build the
// exception message, if any.  It can be used directly, but will more often be
// used by the type-specific methods following.

template <typename R>
R jsArgN(
    const folly::dynamic& args,
    size_t n,
    R (folly::dynamic::*asFoo)() const);
template <typename R>
R jsArgN(
    const folly::dynamic& args,
    size_t n,
    R (folly::dynamic::*asFoo)() const&);

namespace detail {

// This is a type helper to implement functions which should work on both const
// and non-const folly::dynamic arguments, and return a type with the same
// constness.  Basically, it causes the templates which use it to be defined
// only for types compatible with folly::dynamic.
template <typename T>
struct is_dynamic {
  using type = typename std::
      enable_if<std::is_assignable<folly::dynamic, T>::value, T>::type;
};

} // end namespace detail

// Easy to use conversion helpers are here:

// Extract the n'th arg from the given dynamic, as a dynamic.  Throws a
// JsArgumentException if there is no n'th arg in the input.
template <typename T>
typename detail::is_dynamic<T>::type& jsArgAsDynamic(T&& args, size_t n);

// Extract the n'th arg from the given dynamic, as a dynamic Array.  Throws a
// JsArgumentException if there is no n'th arg in the input, or it is not an
// Array.
template <typename T>
typename detail::is_dynamic<T>::type& jsArgAsArray(T&& args, size_t n);

// Extract the n'th arg from the given dynamic, as a dynamic Object.  Throws a
// JsArgumentException if there is no n'th arg in the input, or it is not an
// Object.
template <typename T>
typename detail::is_dynamic<T>::type& jsArgAsObject(T&& args, size_t n);

// Extract the n'th arg from the given dynamic, as a bool.  Throws a
// JsArgumentException if this fails for some reason.
inline bool jsArgAsBool(const folly::dynamic& args, size_t n) {
  return jsArgN(args, n, &folly::dynamic::asBool);
}

// Extract the n'th arg from the given dynamic, as an integer.  Throws a
// JsArgumentException if this fails for some reason.
inline int64_t jsArgAsInt(const folly::dynamic& args, size_t n) {
  return jsArgN(args, n, &folly::dynamic::asInt);
}

// Extract the n'th arg from the given dynamic, as a double.  Throws a
// JsArgumentException if this fails for some reason.
inline double jsArgAsDouble(const folly::dynamic& args, size_t n) {
  return jsArgN(args, n, &folly::dynamic::asDouble);
}

// Extract the n'th arg from the given dynamic, as a string.  Throws a
// JsArgumentException if this fails for some reason.
inline std::string jsArgAsString(const folly::dynamic& args, size_t n) {
  return jsArgN(args, n, &folly::dynamic::asString);
}

} // namespace facebook::xplat

#include <cxxreact/JsArgumentHelpers-inl.h>

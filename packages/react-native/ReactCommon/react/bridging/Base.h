/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>
#include <react/bridging/Convert.h>

#include <cstdint>
#include <memory>
#include <type_traits>

namespace facebook::react {

class CallInvoker;

template <typename T, typename = void>
struct Bridging;

template <>
struct Bridging<void> {
  // Highly generic code may result in "casting" to void.
  static void fromJs(jsi::Runtime& /*unused*/, const jsi::Value& /*unused*/) {}
};

namespace bridging {
namespace detail {

template <typename F>
struct function_wrapper;

template <typename ClassT, typename ReturnT, typename... ArgsT>
struct function_wrapper<ReturnT (ClassT::*)(ArgsT...)> {
  using type = std::function<ReturnT(ArgsT...)>;
};

template <typename ClassT, typename ReturnT, typename... ArgsT>
struct function_wrapper<ReturnT (ClassT::*)(ArgsT...) const> {
  using type = std::function<ReturnT(ArgsT...)>;
};

template <typename T, typename = void>
struct bridging_wrapper {
  using type = remove_cvref_t<T>;
};

// Convert lambda types to move-only function types since we can't specialize
// Bridging templates for arbitrary lambdas.
template <typename T>
struct bridging_wrapper<
    T,
    std::void_t<decltype(&remove_cvref_t<T>::operator())>>
    : function_wrapper<decltype(&remove_cvref_t<T>::operator())> {};

} // namespace detail

template <typename T>
using bridging_t = typename detail::bridging_wrapper<T>::type;

template <typename ReturnT, typename JSArgT>
  requires is_jsi_v<JSArgT>
auto fromJs(
    jsi::Runtime& rt,
    JSArgT&& value,
    const std::shared_ptr<CallInvoker>& /*unused*/)
    -> decltype(static_cast<ReturnT>(
        std::move(convert(rt, std::forward<JSArgT>(value)))))

{
  return static_cast<ReturnT>(
      std::move(convert(rt, std::forward<JSArgT>(value))));
}

template <typename ReturnT, typename JSArgT>
auto fromJs(
    jsi::Runtime& rt,
    JSArgT&& value,
    const std::shared_ptr<CallInvoker>& /*unused*/)
    -> decltype(Bridging<remove_cvref_t<ReturnT>>::fromJs(
        rt,
        convert(rt, std::forward<JSArgT>(value)))) {
  return Bridging<remove_cvref_t<ReturnT>>::fromJs(
      rt, convert(rt, std::forward<JSArgT>(value)));
}

template <typename ReturnT, typename JSArgT>
auto fromJs(
    jsi::Runtime& rt,
    JSArgT&& value,
    const std::shared_ptr<CallInvoker>& jsInvoker)
    -> decltype(Bridging<remove_cvref_t<ReturnT>>::fromJs(
        rt,
        convert(rt, std::forward<JSArgT>(value)),
        jsInvoker)) {
  return Bridging<remove_cvref_t<ReturnT>>::fromJs(
      rt, convert(rt, std::forward<JSArgT>(value)), jsInvoker);
}

template <typename T>
  requires is_jsi_v<T>
auto toJs(
    jsi::Runtime& rt,
    T&& value,
    const std::shared_ptr<CallInvoker>& /*unused*/ = nullptr)
    -> remove_cvref_t<T> {
  return convert(rt, std::forward<T>(value));
}

template <typename T>
auto toJs(
    jsi::Runtime& rt,
    T&& value,
    const std::shared_ptr<CallInvoker>& /*unused*/ = nullptr)
    -> decltype(Bridging<bridging_t<T>>::toJs(rt, std::forward<T>(value))) {
  return Bridging<bridging_t<T>>::toJs(rt, std::forward<T>(value));
}

template <typename T>
auto toJs(
    jsi::Runtime& rt,
    T&& value,
    const std::shared_ptr<CallInvoker>& jsInvoker)
    -> decltype(Bridging<bridging_t<T>>::toJs(
        rt,
        std::forward<T>(value),
        jsInvoker)) {
  return Bridging<bridging_t<T>>::toJs(rt, std::forward<T>(value), jsInvoker);
}

template <typename, typename = jsi::Value, typename = void>
inline constexpr bool supportsFromJs = false;

template <typename T, typename Arg>
inline constexpr bool supportsFromJs<
    T,
    Arg,
    std::void_t<decltype(fromJs<T>(
        std::declval<jsi::Runtime&>(),
        std::declval<Arg>(),
        nullptr))>> = true;

template <typename T>
inline constexpr bool supportsFromJs<
    T,
    jsi::Value,
    std::void_t<decltype(fromJs<T>(
        std::declval<jsi::Runtime&>(),
        std::declval<jsi::Value>(),
        nullptr))>> = true;

template <typename, typename = jsi::Value, typename = void>
inline constexpr bool supportsToJs = false;

template <typename JSReturnT, typename ReturnT>
inline constexpr bool supportsToJs<
    JSReturnT,
    ReturnT,
    std::void_t<decltype(toJs(
        std::declval<jsi::Runtime&>(),
        std::declval<JSReturnT>(),
        nullptr))>> =
    std::is_convertible_v<
        decltype(toJs(
            std::declval<jsi::Runtime&>(),
            std::declval<JSReturnT>(),
            nullptr)),
        ReturnT>;

template <typename ReturnT>
inline constexpr bool supportsToJs<
    ReturnT,
    jsi::Value,
    std::void_t<decltype(toJs(
        std::declval<jsi::Runtime&>(),
        std::declval<ReturnT>(),
        nullptr))>> =
    std::is_convertible_v<
        decltype(toJs(
            std::declval<jsi::Runtime&>(),
            std::declval<ReturnT>(),
            nullptr)),
        jsi::Value>;

} // namespace bridging
} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/bridging/Base.h>

namespace facebook::react::bridging {

template <typename JSReturnT, typename ClassT, typename ReturnT, typename... ArgsT, typename... JSArgsT>
JSReturnT callFromJs(
    jsi::Runtime &rt,
    ReturnT (ClassT::*method)(jsi::Runtime &, ArgsT...),
    const std::shared_ptr<CallInvoker> &jsInvoker,
    ClassT *instance,
    JSArgsT &&...args)
{
  static_assert(sizeof...(ArgsT) == sizeof...(JSArgsT), "Incorrect arguments length");
  static_assert((supportsFromJs<ArgsT, JSArgsT> && ...), "Incompatible arguments");
  if constexpr (std::is_void_v<JSReturnT>) {
    static_assert(std::is_void_v<ReturnT>, "Method must return void when JSReturnT is void");
  }

  if constexpr (std::is_void_v<JSReturnT>) {
    (instance->*method)(rt, fromJs<ArgsT>(rt, std::forward<JSArgsT>(args), jsInvoker)...);

  } else if constexpr (std::is_void_v<ReturnT>) {
    static_assert(std::is_same_v<JSReturnT, jsi::Value>, "Void functions may only return undefined");

    (instance->*method)(rt, fromJs<ArgsT>(rt, std::forward<JSArgsT>(args), jsInvoker)...);
    return jsi::Value();

  } else if constexpr (is_jsi_v<JSReturnT> || supportsToJs<ReturnT, JSReturnT>) {
    static_assert(supportsToJs<ReturnT, JSReturnT>, "Incompatible return type");

    return toJs(rt, (instance->*method)(rt, fromJs<ArgsT>(rt, std::forward<JSArgsT>(args), jsInvoker)...), jsInvoker);
  } else if constexpr (is_optional_jsi_v<JSReturnT>) {
    static_assert(
        is_optional_v<ReturnT> ? supportsToJs<typename ReturnT::value_type, typename JSReturnT::value_type>
                               : supportsToJs<ReturnT, typename JSReturnT::value_type>,
        "Incompatible return type");

    auto result =
        toJs(rt, (instance->*method)(rt, fromJs<ArgsT>(rt, std::forward<JSArgsT>(args), jsInvoker)...), jsInvoker);

    if constexpr (std::is_same_v<decltype(result), jsi::Value>) {
      if (result.isNull() || result.isUndefined()) {
        return std::nullopt;
      }
    }

    return convert(rt, std::move(result));
  } else {
    static_assert(std::is_convertible_v<ReturnT, JSReturnT>, "Incompatible return type");
    return (instance->*method)(rt, fromJs<ArgsT>(rt, std::forward<JSArgsT>(args), jsInvoker)...);
  }
}

template <typename ReturnT, typename... ArgsT>
constexpr size_t getParameterCount(ReturnT (* /*unused*/)(ArgsT...))
{
  return sizeof...(ArgsT);
}

template <typename Class, typename ReturnT, typename... ArgsT>
constexpr size_t getParameterCount(ReturnT (Class::* /*unused*/)(ArgsT...))
{
  return sizeof...(ArgsT);
}

} // namespace facebook::react::bridging

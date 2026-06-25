/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/bridging/Base.h>

#include <array>
#include <deque>
#include <initializer_list>
#include <list>
#include <set>
#include <tuple>
#include <utility>
#include <vector>

namespace facebook::react {

namespace array_detail {

template <typename T, size_t N>
struct BridgingStatic {
  static jsi::Array toJs(jsi::Runtime &rt, const T &array, const std::shared_ptr<CallInvoker> &jsInvoker)
  {
    return toJs(rt, array, jsInvoker, std::make_index_sequence<N>{});
  }

 private:
  template <size_t... Index>
  static jsi::Array toJs(
      facebook::jsi::Runtime &rt,
      const T &array,
      const std::shared_ptr<CallInvoker> &jsInvoker,
      std::index_sequence<Index...> /*unused*/)
  {
    return jsi::Array::createWithElements(rt, bridging::toJs(rt, std::get<Index>(array), jsInvoker)...);
  }
};

template <typename T>
struct BridgingDynamic {
  static jsi::Array toJs(jsi::Runtime &rt, const T &list, const std::shared_ptr<CallInvoker> &jsInvoker)
  {
    jsi::Array result(rt, list.size());
    size_t index = 0;

    for (const auto &item : list) {
      result.setValueAtIndex(rt, index++, bridging::toJs(rt, item, jsInvoker));
    }

    return result;
  }
};

} // namespace array_detail

template <typename T, size_t N>
struct Bridging<std::array<T, N>> : array_detail::BridgingStatic<std::array<T, N>, N> {
  static std::array<T, N>
  fromJs(facebook::jsi::Runtime &rt, const jsi::Array &array, const std::shared_ptr<CallInvoker> &jsInvoker)
  {
    size_t length = array.length(rt);

    std::array<T, N> result;
    for (size_t i = 0; i < length; i++) {
      result[i] = bridging::fromJs<T>(rt, array.getValueAtIndex(rt, i), jsInvoker);
    }

    return result;
  }
};

template <typename T1, typename T2>
struct Bridging<std::pair<T1, T2>> : array_detail::BridgingStatic<std::pair<T1, T2>, 2> {
  static std::pair<T1, T2>
  fromJs(facebook::jsi::Runtime &rt, const jsi::Array &array, const std::shared_ptr<CallInvoker> &jsInvoker)
  {
    return std::make_pair(
        bridging::fromJs<T1>(rt, array.getValueAtIndex(rt, 0), jsInvoker),
        bridging::fromJs<T2>(rt, array.getValueAtIndex(rt, 1), jsInvoker));
  }
};

template <typename... Types>
struct Bridging<std::tuple<Types...>> : array_detail::BridgingStatic<std::tuple<Types...>, sizeof...(Types)> {};

template <typename T>
struct Bridging<std::deque<T>> : array_detail::BridgingDynamic<std::deque<T>> {};

template <typename T>
struct Bridging<std::initializer_list<T>> : array_detail::BridgingDynamic<std::initializer_list<T>> {};

template <typename T>
struct Bridging<std::list<T>> : array_detail::BridgingDynamic<std::list<T>> {};

template <typename T>
struct Bridging<std::vector<T>> : array_detail::BridgingDynamic<std::vector<T>> {
  static std::vector<T>
  fromJs(facebook::jsi::Runtime &rt, const jsi::Array &array, const std::shared_ptr<CallInvoker> &jsInvoker)
  {
    size_t length = array.length(rt);

    std::vector<T> vector;
    vector.reserve(length);

    for (size_t i = 0; i < length; i++) {
      vector.push_back(bridging::fromJs<T>(rt, array.getValueAtIndex(rt, i), jsInvoker));
    }

    return vector;
  }
};

template <typename T>
struct Bridging<std::set<T>> : array_detail::BridgingDynamic<std::set<T>> {
  static std::set<T>
  fromJs(facebook::jsi::Runtime &rt, const jsi::Array &array, const std::shared_ptr<CallInvoker> &jsInvoker)
  {
    size_t length = array.length(rt);

    std::set<T> set;
    for (size_t i = 0; i < length; i++) {
      set.insert(bridging::fromJs<T>(rt, array.getValueAtIndex(rt, i), jsInvoker));
    }

    return set;
  }
};

} // namespace facebook::react

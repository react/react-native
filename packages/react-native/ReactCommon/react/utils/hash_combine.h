/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <type_traits>

namespace facebook::react {

template <typename T>
concept Hashable = !
std::is_same_v<T, const char*> && (requires(T a) {
                                     {
                                       std::hash<T>{}(a)
                                       } -> std::convertible_to<std::size_t>;
                                   });

template <Hashable T, Hashable... Rest>
void hash_combine(std::size_t& seed, const T& v, const Rest&... rest) {
  seed ^= std::hash<T>{}(v) + 0x9e3779b9 + (seed << 6) + (seed >> 2);
  (hash_combine(seed, rest), ...);
}

template <Hashable T, Hashable... Args>
std::size_t hash_combine(const T& v, const Args&... args) {
  std::size_t seed = 0;
  hash_combine<T, Args...>(seed, v, args...);
  return seed;
}

} // namespace facebook::react

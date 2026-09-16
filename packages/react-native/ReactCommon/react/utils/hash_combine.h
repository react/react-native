/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>

#include <cstdint>
#include <functional>
#include <optional>
#include <type_traits>

namespace facebook::react {

template <typename T>
concept Hashable = !std::is_same_v<T, const char *> && (requires(T a) {
  { std::hash<T>{}(a) } -> std::convertible_to<std::size_t>;
});

template <Hashable T, Hashable... Rest>
void hash_combine(std::size_t &seed, const T &v, const Rest &...rest)
{
  seed ^= std::hash<T>{}(v) + 0x9e3779b9 + (seed << 6) + (seed >> 2);
  (hash_combine(seed, rest), ...);
}

template <Hashable T, Hashable... Args>
std::size_t hash_combine(const T &v, const Args &...args)
{
  std::size_t seed = 0;
  hash_combine<T, Args...>(seed, v, args...);
  return seed;
}

/*
 * Combines a run of optional fields into `seed` as a single presence bitmask followed by the
 * engaged values only.
 *
 * Each `hash_combine` step mixes into the previous seed, so it forms a dependency chain the CPU
 * cannot overlap and an unset field still costs a full link. The optionals are hashed into an
 * independent seed and merged into the preceding seed once, allowing both chains to overlap.
 * Folding presence into one word keeps unused fields off the optional chain: a further optional
 * costs a bit in the mask rather than a link.
 *
 * The mask is what keeps this collision-free. Skipping disengaged fields on its own would make the
 * same value in two different slots hash identically.
 *
 * Both packs are expanded from the same parameter pack, so the mask's bit order cannot drift out
 * of sync with the order the values are combined.
 */
template <Hashable... Ts>
  requires(sizeof...(Ts) <= 32)
void hash_combine_optionals(std::size_t &seed, const std::optional<Ts> &...optionals)
{
  std::uint32_t presence = 0;
  std::uint32_t bit = 1;
  ((presence |= optionals.has_value() ? bit : 0u, bit <<= 1), ...);
  std::size_t optionalsSeed = presence;

  auto combineIfEngaged = [&optionalsSeed](const auto &optional) {
    if (optional.has_value()) {
      hash_combine(optionalsSeed, *optional);
    }
  };
  (combineIfEngaged(optionals), ...);
  hash_combine(seed, optionalsSeed);
}

} // namespace facebook::react

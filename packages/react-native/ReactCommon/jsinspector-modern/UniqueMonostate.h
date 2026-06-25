/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>

namespace facebook::react::jsinspector_modern {

/**
 * A template for easily creating empty types that are distinct from one
 * another. Useful if you need to generate marker types for use in an
 * std::variant, and a single std::monostate won't do.
 */
template <size_t key>
struct UniqueMonostate {
  constexpr bool operator==(const UniqueMonostate<key> & /*unused*/) const noexcept
  {
    return true;
  }
  constexpr bool operator<(const UniqueMonostate<key> & /*unused*/) const noexcept
  {
    return false;
  }
  constexpr bool operator>(const UniqueMonostate<key> & /*unused*/) const noexcept
  {
    return false;
  }
  constexpr bool operator<=(const UniqueMonostate<key> & /*unused*/) const noexcept
  {
    return true;
  }
  constexpr bool operator>=(const UniqueMonostate<key> & /*unused*/) const noexcept
  {
    return true;
  }
};

} // namespace facebook::react::jsinspector_modern

namespace std {

template <size_t key>
struct hash<::facebook::react::jsinspector_modern::UniqueMonostate<key>> {
  size_t operator()(const ::facebook::react::jsinspector_modern::UniqueMonostate<key> & /*unused*/) const noexcept
  {
    return key;
  }
};

} // namespace std

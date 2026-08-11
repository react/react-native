/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstdint>
#include <functional>
#include <string_view>

#include <react/utils/toLower.h>

namespace facebook::react {

/**
 * FNV-1a hash function implementation.
 * Implemented as described in http://www.isthe.com/chongo/tech/comp/fnv/.
 *
 * Please use std::hash if possible. `fnv1a` should only be used in cases
 * when std::hash does not provide the needed functionality. For example,
 * constexpr.
 */
template <typename CharTransformT = std::identity>
constexpr uint32_t fnv1a(std::string_view string) noexcept {
  constexpr uint32_t offset_basis = 2166136261;

  uint32_t hash = offset_basis;

  for (const auto& c : string) {
    hash ^= static_cast<int8_t>(CharTransformT{}(c));
    // Using shifts and adds instead of multiplication with a prime number.
    // This is faster when compiled with optimizations.
    hash +=
        (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  return hash;
}

constexpr uint32_t fnv1aLowercase(std::string_view string) {
  struct LowerCaseTransform {
    constexpr char operator()(char c) const {
      return toLower(c);
    }
  };

  return fnv1a<LowerCaseTransform>(string);
}

} // namespace facebook::react

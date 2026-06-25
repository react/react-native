/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <bit>
#include <iterator>
#include <type_traits>

namespace facebook::yoga {

/**
 * Concept for any enum/enum class
 */
template <typename EnumT>
concept Enumeration = std::is_enum_v<EnumT>;

/**
 * Count of ordinals in a Yoga enum which is sequential
 */
template <Enumeration EnumT>
constexpr int32_t ordinalCount();

/**
 * Concept for a yoga enum which is sequential
 */
template <typename EnumT>
concept HasOrdinality = (ordinalCount<EnumT>() > 0);

/**
 * Count of bits needed to represent every ordinal
 */
template <HasOrdinality EnumT>
constexpr int32_t bitCount() {
  return std::bit_width(
      static_cast<std::underlying_type_t<EnumT>>(ordinalCount<EnumT>() - 1));
}

/**
 * Polyfill of C++ 23 to_underlying()
 * https://en.cppreference.com/w/cpp/utility/to_underlying
 */
constexpr auto to_underlying(Enumeration auto e) noexcept {
  return static_cast<std::underlying_type_t<decltype(e)>>(e);
}

/**
 * Convenience function to iterate through every value in a Yoga enum as part of
 * a range-based for loop.
 */
template <HasOrdinality EnumT>
auto ordinals() {
  struct Iterator {
    EnumT e{};

    EnumT operator*() const {
      return e;
    }

    Iterator& operator++() {
      e = static_cast<EnumT>(to_underlying(e) + 1);
      return *this;
    }

    bool operator==(const Iterator& other) const = default;
  };

  struct Range {
    Iterator begin() const {
      return Iterator{};
    }
    Iterator end() const {
      return Iterator{static_cast<EnumT>(ordinalCount<EnumT>())};
    }
  };

  return Range{};
}

} // namespace facebook::yoga

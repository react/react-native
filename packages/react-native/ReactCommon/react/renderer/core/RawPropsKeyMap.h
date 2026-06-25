/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/RawPropsPrimitives.h>
#include <string_view>
#include <vector>

namespace facebook::react {

/*
 * A map especially optimized to hold `{name: index}` relations.
 * The implementation is conceptually similar to a classic hash map with a hash
 * function that returns the length of the string.
 * The map is optimized for reads only (the map must be reindexed before a bunch
 * of reads).
 */
class RawPropsKeyMap final {
 public:
  /*
   * Stores `value` with by given `key`.
   */
  void insert(std::string_view key, RawPropsValueIndex value) noexcept;

  /*
   * Reindexes the stored data.
   * Must be called before `at` (after calling a bunch of `add`s).
   */
  void reindex() noexcept;

  /*
   * Finds and returns the `value` (some index) by given `key`.
   * Returns `kRawPropsValueIndexEmpty` if the value wan't found.
   */
  RawPropsValueIndex at(std::string_view name) noexcept;

 private:
  struct Item {
    RawPropsValueIndex value;
    RawPropsPropNameLength length;
    char name[kPropNameLengthHardCap];
  };

  static bool shouldFirstOneBeBeforeSecondOne(const Item &lhs, const Item &rhs) noexcept;
  static bool hasSameName(const Item &lhs, const Item &rhs) noexcept;

  std::vector<Item> items_{};
  std::vector<RawPropsPropNameLength> buckets_{};
};

} // namespace facebook::react

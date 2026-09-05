/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <array>
#include <limits>

namespace facebook::react::jsinspector_modern {

/**
 * A statically-sized array with an enum class as the index type.
 * Values are value-initialized (i.e. zero-initialized for integral types).
 * Requires that the enum class has a kMaxValue member.
 */
template <class IndexType, class ValueType>
  requires std::is_enum_v<IndexType> && std::is_same_v<std::underlying_type_t<IndexType>, int> &&
    requires { IndexType::kMaxValue; } && (static_cast<int>(IndexType::kMaxValue) < std::numeric_limits<int>::max())

class EnumArray {
 public:
  constexpr ValueType &operator[](IndexType i)
  {
    return array_[static_cast<int>(i)];
  }

  constexpr const ValueType &operator[](IndexType i) const
  {
    return array_[static_cast<int>(i)];
  }

  constexpr int size() const
  {
    return size_;
  }

 private:
  constexpr static int size_ = static_cast<int>(IndexType::kMaxValue) + 1;

  std::array<ValueType, size_> array_{};
};
} // namespace facebook::react::jsinspector_modern

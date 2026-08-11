/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <algorithm>
#include <array>
#include <string_view>

namespace facebook::react {

/**
 * Helper to allow passing string literals as template parameters.
 * https://ctrpeach.io/posts/cpp20-string-literal-template-parameters/
 */
template <size_t N>
struct TemplateStringLiteral {
  /* implicit */ constexpr TemplateStringLiteral(
      const char (&str)[N]) { // NOLINT(modernize-avoid-c-arrays)
    std::copy_n(str, N, value.data());
  }

  constexpr operator std::string_view() const {
    return {value.begin(), value.end() - 1};
  }

  // Not private, since structural types required for template parameters cannot
  // have non-punlic data members.
  std::array<char, N> value{};
};

} // namespace facebook::react

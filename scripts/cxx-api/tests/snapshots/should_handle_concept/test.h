/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <any>
#include <concepts>

namespace test {

class CSSSyntaxParser;

template <typename T, typename ReturnT = std::any>
concept CSSParserSink = requires(CSSSyntaxParser &parser) {
  { T::consume(parser) } -> std::convertible_to<ReturnT>;
};

} // namespace test

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
// clang-format off
concept CSSParserSink = requires(CSSSyntaxParser &parser) {
    { T::consume(parser) } -> std::convertible_to<ReturnT>;
};
// clang-format on

template <typename ReturnT, typename... VisitorsT>
concept CSSUniqueComponentValueVisitors =
    CSSSyntaxVisitorReturn<ReturnT> && (CSSComponentValueVisitor<VisitorsT, ReturnT> && ...) &&
    ((CSSFunctionVisitor<VisitorsT, ReturnT> ? 1 : 0) + ... + 0) <= 1 &&
    ((CSSPreservedTokenVisitor<VisitorsT, ReturnT> ? 1 : 0) + ... + 0) <= 1 &&
    ((CSSSimpleBlockVisitor<VisitorsT, ReturnT> ? 1 : 0) + ... + 0) <= 1;

} // namespace test

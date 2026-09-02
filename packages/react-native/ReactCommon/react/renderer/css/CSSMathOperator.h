/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>
#include <utility>
#include <react/utils/to_underlying.h>

namespace facebook::react {

/**
 * Arithmetic operators used in CSS math functions.
 * https://www.w3.org/TR/css-values-4/#calc-syntax
 */
enum class CSSMathOperator : char {
  Add = '+',
  Subtract = '-',
  Multiply = '*',
  Divide = '/',
};

constexpr auto parseCSSMathOperator(char c) -> std::optional<CSSMathOperator>
{
  for (auto op : {CSSMathOperator::Add, CSSMathOperator::Subtract,
                  CSSMathOperator::Multiply, CSSMathOperator::Divide}) {
    if (c == to_underlying(op)) {
      return op;
    }
  }
  return std::nullopt;
}

} // namespace facebook::react

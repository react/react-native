/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>
#include <string_view>

#include <react/renderer/css/CSSMathConstant.h>
#include <react/renderer/css/CSSMathOperator.h>

namespace facebook::react {

/**
 * One of the tokens defined as part of
 * https://www.w3.org/TR/css-syntax-3/#tokenizer-definitions
 */
enum class CSSTokenType {
  CloseCurly,
  CloseParen,
  CloseSquare,
  Comma,
  Delim,
  Dimension,
  EndOfFile,
  Function,
  Ident,
  Number,
  OpenCurly,
  OpenParen,
  OpenSquare,
  Percentage,
  WhiteSpace,
  Hash,
};

/*
 * Represents one of the syntactic CSS tokens as provided by
 * https://www.w3.org/TR/css-syntax-3/#tokenization
 *
 * The token should not be kept long-term, and is only valid for the duration of
 * the originating CSSTokenizer.
 */
class CSSToken {
 public:
  explicit constexpr CSSToken(CSSTokenType type) : type_(type) {}
  constexpr CSSToken(CSSTokenType type, std::string_view value) : type_{type}, stringValue_{value} {}
  constexpr CSSToken(CSSTokenType type, float value) : type_{type}, numericValue_{value} {}
  constexpr CSSToken(CSSTokenType type, float value, std::string_view unit)
      : type_{type}, numericValue_{value}, unit_{unit}
  {
  }

  constexpr CSSToken(const CSSToken &other) = default;
  constexpr CSSToken(CSSToken &&other) = default;
  constexpr CSSToken &operator=(const CSSToken &other) = default;
  constexpr CSSToken &operator=(CSSToken &&other) = default;

  constexpr CSSTokenType type() const
  {
    return type_;
  }

  constexpr std::string_view stringValue() const
  {
    return stringValue_;
  }

  constexpr float numericValue() const
  {
    return numericValue_;
  }

  constexpr std::string_view unit() const
  {
    return unit_;
  }

  /**
   * If this token is a <delim-token> representing a math operator (+, -, *,
   * /), return the corresponding CSSMathOperator.
   * https://www.w3.org/TR/css-values-4/#calc-syntax
   */
  constexpr std::optional<CSSMathOperator> mathOperator() const
  {
    if (type_ != CSSTokenType::Delim || stringValue_.size() != 1) {
      return std::nullopt;
    }
    return parseCSSMathOperator(stringValue_[0]);
  }

  /**
   * If this token is an <ident-token> representing a CSS math constant
   * (e, pi, infinity, -infinity, NaN), return the corresponding
   * CSSMathConstant
   * https://www.w3.org/TR/css-values-4/#calc-constants
   */
  constexpr std::optional<CSSMathConstant> mathConstant() const
  {
    if (type_ != CSSTokenType::Ident) {
      return std::nullopt;
    }
    return parseCSSMathConstant(stringValue_);
  }

  constexpr bool operator==(const CSSToken &other) const = default;

 private:
  CSSTokenType type_;
  std::string_view stringValue_;
  float numericValue_{0.0f};
  std::string_view unit_;
};

} // namespace facebook::react

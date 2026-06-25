/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cmath>
#include <string_view>

#include <fast_float/fast_float.h>
#include <react/renderer/css/CSSToken.h>

namespace facebook::react {

/**
 * A minimal tokenizer for a subset of CSS syntax.
 *
 * This is based on the W3C CSS Syntax specification, with simplifications made
 * for syntax which React Native does not attempt to support.
 * https://www.w3.org/TR/css-syntax-3/#tokenizing-and-parsing
 */
class CSSTokenizer {
 public:
  explicit constexpr CSSTokenizer(std::string_view characters) : remainingCharacters_{characters} {}

  /**
   * Returns the next token according to the algorithm described in
   * https://www.w3.org/TR/css-syntax-3/#consume-token
   */
  constexpr CSSToken next()
  {
    char nextChar = peek();

    if (isWhitespace(nextChar)) {
      return consumeWhitespace();
    }

    switch (nextChar) {
      case '(':
        return consumeCharacter(CSSTokenType::OpenParen);
      case ')':
        return consumeCharacter(CSSTokenType::CloseParen);
      case '[':
        return consumeCharacter(CSSTokenType::OpenSquare);
      case ']':
        return consumeCharacter(CSSTokenType::CloseSquare);
      case '{':
        return consumeCharacter(CSSTokenType::OpenCurly);
      case '}':
        return consumeCharacter(CSSTokenType::CloseCurly);
      case ',':
        return consumeCharacter(CSSTokenType::Comma);
      case '+':
      case '-':
      case '.':
        if (wouldStartNumber()) {
          return consumeNumeric();
        } else {
          return consumeDelim();
        }
      case '#':
        if (isIdent(peek(1))) {
          return consumeHash();
        } else {
          return consumeDelim();
        }
      default:
        break;
    }

    if (isDigit(nextChar)) {
      return consumeNumeric();
    }

    if (isIdentStart(nextChar)) {
      return consumeIdentlikeToken();
    }

    if (nextChar == '\0') {
      return CSSToken{CSSTokenType::EndOfFile};
    }

    return consumeDelim();
  }

 private:
  constexpr char peek(size_t i = 0) const
  {
    auto index = position_ + i;
    return index >= remainingCharacters_.size() ? '\0' : remainingCharacters_[index];
  }

  constexpr void advance()
  {
    position_ += 1;
  }

  constexpr CSSToken consumeDelim()
  {
    advance();
    return {CSSTokenType::Delim, consumeRunningValue()};
  }

  constexpr CSSToken consumeCharacter(CSSTokenType tokenType)
  {
    advance();
    consumeRunningValue();
    return CSSToken{tokenType};
  }

  constexpr CSSToken consumeWhitespace()
  {
    while (isWhitespace(peek())) {
      advance();
    }

    consumeRunningValue();
    return CSSToken{CSSTokenType::WhiteSpace};
  }

  constexpr bool wouldStartNumber() const
  {
    // https://www.w3.org/TR/css-syntax-3/#starts-with-a-number
    if (peek() == '+' || peek() == '-') {
      if (isDigit(peek(1))) {
        return true;
      }
      if (peek(1) == '.' && isDigit(peek(2))) {
        return true;
      }
    } else if (peek() == '.' && isDigit(peek(1))) {
      return true;
    } else if (isDigit(peek())) {
      return true;
    }

    return false;
  }

  constexpr CSSToken consumeNumber()
  {
    // https://www.w3.org/TR/css-syntax-3/#consume-number
    // https://www.w3.org/TR/css-syntax-3/#convert-a-string-to-a-number

    auto *b = remainingCharacters_.data();
    auto *e = b + remainingCharacters_.size();

    float value;
    fast_float::parse_options options{fast_float::chars_format::general | fast_float::chars_format::allow_leading_plus};
    auto [ptr, ec] = fast_float::from_chars_advanced(b, e, value, options);

    // Do we need to handle any other errors?
    // bool isOk = ec == std::errc();

    position_ += ptr - b;
    consumeRunningValue();

    return {CSSTokenType::Number, value};
  }

  constexpr CSSToken consumeNumeric()
  {
    // https://www.w3.org/TR/css-syntax-3/#consume-numeric-token
    auto numberToken = consumeNumber();

    if (isIdent(peek())) {
      auto ident = consumeIdentSequence();
      return {CSSTokenType::Dimension, numberToken.numericValue(), ident.stringValue()};
    } else if (peek() == '%') {
      advance();
      consumeRunningValue();
      return {CSSTokenType::Percentage, numberToken.numericValue()};
    } else {
      return numberToken;
    }
  }

  constexpr CSSToken consumeIdentlikeToken()
  {
    // https://www.w3.org/TR/css-syntax-3/#consume-ident-like-token
    auto ident = consumeIdentSequence();
    if (peek() == '(') {
      advance();
      consumeRunningValue();
      return {CSSTokenType::Function, ident.stringValue()};
    }

    return ident;
  }

  constexpr CSSToken consumeIdentSequence()
  {
    // https://www.w3.org/TR/css-syntax-3/#consume-an-ident-sequence
    while (isIdent(peek())) {
      advance();
    }

    return {CSSTokenType::Ident, consumeRunningValue()};
  }

  constexpr CSSToken consumeHash()
  {
    // https://www.w3.org/TR/css-syntax-3/#consume-token (U+0023 NUMBER SIGN)
    advance();
    consumeRunningValue();

    return {CSSTokenType::Hash, consumeIdentSequence().stringValue()};
  }

  constexpr std::string_view consumeRunningValue()
  {
    auto next = remainingCharacters_.substr(0, position_);
    remainingCharacters_ = remainingCharacters_.substr(next.size());
    position_ = 0;
    return next;
  }

  static constexpr bool isDigit(char c)
  {
    // https://www.w3.org/TR/css-syntax-3/#digit
    return c >= '0' && c <= '9';
  }

  static constexpr bool isIdentStart(char c)
  {
    // https://www.w3.org/TR/css-syntax-3/#ident-start-code-point
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_' || static_cast<unsigned char>(c) > 0x80;
  }

  static constexpr bool isIdent(char c)
  {
    {
      // https://www.w3.org/TR/css-syntax-3/#ident-code-point
      return isIdentStart(c) || isDigit(c) || c == '-';
    }
  }

  static constexpr bool isWhitespace(char c)
  {
    // https://www.w3.org/TR/css-syntax-3/#whitespace
    return c == ' ' || c == '\t' || c == '\r' || c == '\n';
  }

  std::string_view remainingCharacters_;
  size_t position_{0};
};
} // namespace facebook::react

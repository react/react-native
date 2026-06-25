/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <concepts>
#include <optional>

#include <react/renderer/css/CSSTokenizer.h>

namespace facebook::react {

class CSSSyntaxParser;

/**
 * Describes context for a CSS function component value.
 */
struct CSSFunctionBlock {
  std::string_view name{};
};

/**
 * Describes a preserved token component value.
 */
using CSSPreservedToken = CSSToken;

/**
 * Describes context for a CSS function component value.
 */
struct CSSSimpleBlock {
  CSSTokenType openBracketType{};
};

/**
 * Describes a valid return type for a CSSSyntaxParser visitor
 */
template <typename T>
concept CSSSyntaxVisitorReturn = std::is_default_constructible_v<T> && std::equality_comparable<T>;

/**
 * A CSSFunctionVisitor is called to start parsing a function component value.
 * At this point, the Parser is positioned at the start of the function
 * component value list. It is expected that the visitor finishes before the end
 * of the function block.
 */
template <typename T, typename ReturnT>
concept CSSFunctionVisitor =
    CSSSyntaxVisitorReturn<ReturnT> && requires(T visitor, CSSFunctionBlock func, CSSSyntaxParser &blockParser) {
      { visitor(func, blockParser) } -> std::convertible_to<ReturnT>;
    };

/**
 * A CSSPreservedTokenVisitor is called after parsing a preserved token
 * component value.
 */
template <typename T, typename ReturnT>
concept CSSPreservedTokenVisitor = CSSSyntaxVisitorReturn<ReturnT> && requires(T visitor, CSSPreservedToken token) {
  { visitor(token) } -> std::convertible_to<ReturnT>;
};

/**
 * A CSSSimpleBlockVisitor is called after parsing a simple block component
 * value. It is expected that the visitor finishes before the end
 * of the block.
 */
template <typename T, typename ReturnT>
concept CSSSimpleBlockVisitor =
    CSSSyntaxVisitorReturn<ReturnT> && requires(T visitor, CSSSimpleBlock block, CSSSyntaxParser &blockParser) {
      { visitor(block, blockParser) } -> std::convertible_to<ReturnT>;
    };

/**
 * Any visitor for a component value.
 */
template <typename T, typename ReturnT>
concept CSSComponentValueVisitor = CSSSyntaxVisitorReturn<ReturnT> &&
    (CSSFunctionVisitor<T, ReturnT> || CSSPreservedTokenVisitor<T, ReturnT> || CSSSimpleBlockVisitor<T, ReturnT>);

/**
 * Represents a variadic set of CSSComponentValueVisitor with no more than one
 * of a specific type of visitor.
 */
template <typename ReturnT, typename... VisitorsT>
concept CSSUniqueComponentValueVisitors =
    CSSSyntaxVisitorReturn<ReturnT> && (CSSComponentValueVisitor<VisitorsT, ReturnT> && ...) &&
    ((CSSFunctionVisitor<VisitorsT, ReturnT> ? 1 : 0) + ... + 0) <= 1 &&
    ((CSSPreservedTokenVisitor<VisitorsT, ReturnT> ? 1 : 0) + ... + 0) <= 1 &&
    ((CSSSimpleBlockVisitor<VisitorsT, ReturnT> ? 1 : 0) + ... + 0) <= 1;

/**
 * Describes the delimeter to expect before the next component value.
 */
enum class CSSDelimiter {
  Whitespace,
  OptionalWhitespace,
  Solidus,
  SolidusOrWhitespace,
  Comma,
  CommaOrWhitespace,
  None,
};

/**
 * CSSSyntaxParser allows parsing streams of CSS text into "component
 * values".
 *
 * https://www.w3.org/TR/css-syntax-3/#component-value
 */
class CSSSyntaxParser {
  template <CSSSyntaxVisitorReturn ReturnT, CSSComponentValueVisitor<ReturnT>... VisitorsT>
  friend struct CSSComponentValueVisitorDispatcher;
  friend class CSSValueParser;

 public:
  /**
   * Construct the parser over the given string_view, which must stay alive for
   * the duration of the CSSSyntaxParser.
   */
  explicit constexpr CSSSyntaxParser(std::string_view css) : tokenizer_{css}, currentToken_(tokenizer_.next()) {}

  constexpr CSSSyntaxParser(const CSSSyntaxParser &) = default;
  constexpr CSSSyntaxParser(CSSSyntaxParser &&) = default;

  constexpr CSSSyntaxParser &operator=(const CSSSyntaxParser &) = default;
  constexpr CSSSyntaxParser &operator=(CSSSyntaxParser &&) = default;

  /**
   * Directly consume the next component value. The component value is provided
   * to a passed in "visitor", typically a lambda which accepts the component
   * value in a new scope. The visitor may read this component parameter into a
   * higher-level data structure, and continue parsing within its scope using
   * the same underlying CSSSyntaxParser.
   *
   * The state of the parser is reset if a visitor returns a default-constructed
   * value for the given return type, even if it previously advanced the parser.
   * If no visitor returns a non-default-constructed value, the component value
   * will not be consumed.
   *
   * https://www.w3.org/TR/css-syntax-3/#consume-component-value
   *
   * @tparam ReturnT caller-specified return type of visitors. This type will
   * be set to its default constructed state if consuming a component value with
   * no matching visitors, or syntax error
   * @param visitors A unique list of CSSComponentValueVisitor to be called on a
   * match
   * @param delimiter The expected delimeter to occur before the next component
   * value
   * @returns the visitor returned value, or a default constructed value if no
   * visitor was matched, or a syntax error occurred.
   */
  template <CSSSyntaxVisitorReturn ReturnT>
  constexpr ReturnT consumeComponentValue(
      CSSDelimiter delimiter,
      const CSSComponentValueVisitor<ReturnT> auto &...visitors)
    requires(CSSUniqueComponentValueVisitors<ReturnT, decltype(visitors)...>);

  template <CSSSyntaxVisitorReturn ReturnT>
  constexpr ReturnT consumeComponentValue(const CSSComponentValueVisitor<ReturnT> auto &...visitors)
    requires(CSSUniqueComponentValueVisitors<ReturnT, decltype(visitors)...>);
  /**
   * The parser is considered finished when there are no more remaining tokens
   * to be processed
   */
  constexpr bool isFinished() const
  {
    return currentToken_.type() == CSSTokenType::EndOfFile;
  }

  /**
   * Consume any whitespace tokens.
   */
  constexpr void consumeWhitespace()
  {
    if (currentToken_.type() == CSSTokenType::WhiteSpace) {
      currentToken_ = tokenizer_.next();
    }
  }

  /**
   * Consume a delimiter, returning false if a required delimiter is not found.
   */
  constexpr bool consumeDelimiter(CSSDelimiter delimiter)
  {
    if (delimiter == CSSDelimiter::None) {
      return true;
    }

    bool hasWhiteSpace = peek().type() == CSSTokenType::WhiteSpace;
    consumeWhitespace();

    switch (delimiter) {
      case CSSDelimiter::Comma:
        if (peek().type() == CSSTokenType::Comma) {
          consumeToken();
          consumeWhitespace();
          return true;
        }
        return false;
      case CSSDelimiter::Whitespace:
        return hasWhiteSpace;
      case CSSDelimiter::OptionalWhitespace:
        return true;
      case CSSDelimiter::CommaOrWhitespace:
        if (peek().type() == CSSTokenType::Comma) {
          consumeToken();
          consumeWhitespace();
          return true;
        }
        return hasWhiteSpace;
      case CSSDelimiter::Solidus:
        if (peek().type() == CSSTokenType::Delim && peek().stringValue() == "/") {
          consumeToken();
          consumeWhitespace();
          return true;
        }
        return false;
      case CSSDelimiter::SolidusOrWhitespace:
        if (peek().type() == CSSTokenType::Delim && peek().stringValue() == "/") {
          consumeToken();
          consumeWhitespace();
          return true;
        }
        return hasWhiteSpace;
      case CSSDelimiter::None:
        return true;
      default:
        return false;
    }
  }

  /**
   * Returns the current token without consuming it.
   */
  constexpr const CSSToken &peek() const
  {
    return currentToken_;
  }

 private:
  constexpr CSSSyntaxParser(CSSSyntaxParser &parser, CSSTokenType terminator)
      : tokenizer_{parser.tokenizer_}, currentToken_{parser.currentToken_}, terminator_{terminator}
  {
  }

  constexpr CSSToken consumeToken()
  {
    auto prevToken = currentToken_;
    currentToken_ = tokenizer_.next();
    return prevToken;
  }

  constexpr void advanceToBlockParser(CSSSyntaxParser &blockParser)
  {
    currentToken_ = blockParser.currentToken_;
    tokenizer_ = blockParser.tokenizer_;
  }

  CSSTokenizer tokenizer_;
  CSSToken currentToken_;
  CSSTokenType terminator_{CSSTokenType::EndOfFile};
};

template <CSSSyntaxVisitorReturn ReturnT, CSSComponentValueVisitor<ReturnT>... VisitorsT>
struct CSSComponentValueVisitorDispatcher {
  CSSSyntaxParser &parser;

  constexpr ReturnT consumeComponentValue(CSSDelimiter delimiter, const VisitorsT &...visitors)
  {
    auto originalParser = parser;
    if (!parser.consumeDelimiter(delimiter)) {
      parser = originalParser;
      return {};
    }

    if (parser.peek().type() == parser.terminator_) {
      parser = originalParser;
      return {};
    }

#ifdef __clang__
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wswitch-enum"
#endif
    switch (parser.peek().type()) {
#ifdef __clang__
#pragma clang diagnostic pop
#endif
      case CSSTokenType::Function:
        if (auto ret = visitFunction(visitors...)) {
          return *ret;
        }
        break;
      case CSSTokenType::OpenParen:
        if (auto ret = visitSimpleBlock(CSSTokenType::CloseParen, visitors...)) {
          return *ret;
        }
        break;
      case CSSTokenType::OpenSquare:
        if (auto ret = visitSimpleBlock(CSSTokenType::CloseSquare, visitors...)) {
          return *ret;
        }
        break;
      case CSSTokenType::OpenCurly:
        if (auto ret = visitSimpleBlock(CSSTokenType::CloseCurly, visitors...)) {
          return *ret;
        }
        break;
      default:
        if (auto ret = visitPreservedToken(visitors...)) {
          return *ret;
        }
        break;
    }

    parser = originalParser;
    return ReturnT{};
  }

  constexpr std::optional<ReturnT> visitFunction(
      const CSSComponentValueVisitor<ReturnT> auto &visitor,
      const CSSComponentValueVisitor<ReturnT> auto &...rest)
  {
    if constexpr (CSSFunctionVisitor<decltype(visitor), ReturnT>) {
      auto name = parser.consumeToken().stringValue();

      // CSS syntax spec says whitespace is a preserved token, but CSS values
      // spec allows whitespace around parens for all function notation, so we
      // allow this to let the visitors not need to deal with leading/trailing
      // whitespace. https://www.w3.org/TR/css-values-3/#functional-notations
      parser.consumeWhitespace();

      auto blockParser = CSSSyntaxParser{parser, CSSTokenType::CloseParen /*terminator*/};
      auto functionValue = visitor({name}, blockParser);
      parser.advanceToBlockParser(blockParser);
      parser.consumeWhitespace();
      if (parser.peek().type() == CSSTokenType::CloseParen && functionValue != ReturnT{}) {
        parser.consumeToken();
        return functionValue;
      }

      return {};
    }

    return visitFunction(rest...);
  }

  constexpr std::optional<ReturnT> visitFunction()
  {
    return {};
  }

  constexpr std::optional<ReturnT> visitSimpleBlock(
      CSSTokenType endToken,
      const CSSComponentValueVisitor<ReturnT> auto &visitor,
      const CSSComponentValueVisitor<ReturnT> auto &...rest)
  {
    if constexpr (CSSSimpleBlockVisitor<decltype(visitor), ReturnT>) {
      auto openBracketType = parser.consumeToken().type();
      parser.consumeWhitespace();
      auto blockParser = CSSSyntaxParser{parser, endToken};
      auto blockValue = visitor({openBracketType}, blockParser);
      parser.advanceToBlockParser(blockParser);
      parser.consumeWhitespace();
      if (parser.peek().type() == endToken && blockValue != ReturnT{}) {
        parser.consumeToken();
        return blockValue;
      }

      return {};
    }
    return visitSimpleBlock(endToken, rest...);
  }

  constexpr std::optional<ReturnT> visitSimpleBlock(CSSTokenType endToken)
  {
    return {};
  }

  constexpr std::optional<ReturnT> visitPreservedToken(
      const CSSComponentValueVisitor<ReturnT> auto &visitor,
      const CSSComponentValueVisitor<ReturnT> auto &...rest)
  {
    if constexpr (CSSPreservedTokenVisitor<decltype(visitor), ReturnT>) {
      auto ret = visitor(parser.consumeToken());
      if (ret != ReturnT{}) {
        return ret;
      }
    }
    return visitPreservedToken(rest...);
  }

  constexpr std::optional<ReturnT> visitPreservedToken()
  {
    return {};
  }
};

template <CSSSyntaxVisitorReturn ReturnT>
constexpr ReturnT CSSSyntaxParser::consumeComponentValue(
    CSSDelimiter delimiter,
    const CSSComponentValueVisitor<ReturnT> auto &...visitors)
  requires(CSSUniqueComponentValueVisitors<ReturnT, decltype(visitors)...>)
{
  return CSSComponentValueVisitorDispatcher<ReturnT, decltype(visitors)...>{*this}.consumeComponentValue(
      delimiter, visitors...);
}

template <CSSSyntaxVisitorReturn ReturnT>
constexpr ReturnT CSSSyntaxParser::consumeComponentValue(const CSSComponentValueVisitor<ReturnT> auto &...visitors)
  requires(CSSUniqueComponentValueVisitors<ReturnT, decltype(visitors)...>)
{
  return consumeComponentValue<ReturnT>(CSSDelimiter::None, visitors...);
}

} // namespace facebook::react

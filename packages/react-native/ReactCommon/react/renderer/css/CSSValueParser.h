/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>
#include <type_traits>
#include <variant>

#include <react/renderer/css/CSSCompoundDataType.h>
#include <react/renderer/css/CSSDataType.h>
#include <react/renderer/css/CSSKeyword.h>
#include <react/renderer/css/CSSSyntaxParser.h>

namespace facebook::react {

class CSSValueParser {
 public:
  explicit constexpr CSSValueParser(CSSSyntaxParser &parser) : parser_{&parser} {}

  constexpr CSSValueParser(const CSSValueParser &) = default;
  constexpr CSSValueParser &operator=(const CSSValueParser &) = default;

  /**
   * Attempts to parse the next CSS value of a given set of data types, at the
   * current location of the parser, advancing the parser.
   */
  template <CSSMaybeCompoundDataType... AllowedTypesT>
  constexpr auto parseNextValue(CSSDelimiter delimiter = CSSDelimiter::None)
      -> CSSVariantWithTypes<CSSMergedDataTypes<AllowedTypesT...>, std::monostate>
  {
    return consumeValue(delimiter, CSSMergedDataTypes<AllowedTypesT...>{});
  }

  /**
   * Attempts to parse the next CSS value of a given set of data types, at the
   * current location of the parser, without advancing the parser.
   */
  template <CSSMaybeCompoundDataType... AllowedTypesT>
  constexpr auto peekNextValue(CSSDelimiter delimiter = CSSDelimiter::None)
      -> CSSVariantWithTypes<CSSMergedDataTypes<AllowedTypesT...>, std::monostate>
  {
    auto savedParser = *parser_;
    auto ret = consumeValue(delimiter, CSSMergedDataTypes<AllowedTypesT...>{});
    *parser_ = savedParser;
    return ret;
  }

  /**
   * Returns a reference to the underlying CSSSyntaxParser. Use this for
   * syntax-level operations like consumeWhitespace(), consumeDelimiter(),
   * and isFinished().
   */
  constexpr CSSSyntaxParser &syntaxParser()
  {
    return *parser_;
  }

  constexpr const CSSSyntaxParser &syntaxParser() const
  {
    return *parser_;
  }

 private:
  /*
   * Attempts to parse the characters starting at the current component value
   * into one of the given data types. Types are attempted in order, which the
   * caller must consider (e.g. a number token should be preferred to be a
   * <number> before <length>).
   */
  template <CSSDataType... AllowedTypesT>
  constexpr std::variant<std::monostate, AllowedTypesT...> consumeValue(
      CSSDelimiter delimiter,
      std::variant<AllowedTypesT...> /*unused*/)
  {
    using ReturnT = std::variant<std::monostate, AllowedTypesT...>;

    auto consumedValue = tryConsumeParser<ReturnT, CSSDataTypeParser<AllowedTypesT>...>(delimiter);

    if (!std::holds_alternative<std::monostate>(consumedValue)) {
      return consumedValue;
    }

    return parser_->consumeComponentValue<ReturnT>(
        delimiter,
        [&](const CSSPreservedToken &token) {
          return tryConsumePreservedToken<ReturnT, CSSDataTypeParser<AllowedTypesT>...>(token);
        },
        [&](const CSSSimpleBlock &block, CSSSyntaxParser &blockParser) {
          CSSValueParser valueParser(blockParser);
          return tryConsumeSimpleBlock<ReturnT, CSSDataTypeParser<AllowedTypesT>...>(block, valueParser);
        },
        [&](const CSSFunctionBlock &func, CSSSyntaxParser &blockParser) {
          CSSValueParser valueParser(blockParser);
          return tryConsumeFunctionBlock<ReturnT, CSSDataTypeParser<AllowedTypesT>...>(func, valueParser);
        });
  }

  template <typename ReturnT>
  constexpr ReturnT tryConsumePreservedToken(const CSSPreservedToken & /*token*/)
  {
    return {};
  }

  template <typename ReturnT, CSSValidDataTypeParser ParserT, CSSValidDataTypeParser... RestParserT>
  constexpr ReturnT tryConsumePreservedToken(const CSSPreservedToken &token)
  {
    if constexpr (CSSPreservedTokenSink<ParserT>) {
      if (auto ret = ParserT::consumePreservedToken(token)) {
        return *ret;
      }
    }

    return tryConsumePreservedToken<ReturnT, RestParserT...>(token);
  }

  template <typename ReturnT>
  constexpr ReturnT tryConsumeSimpleBlock(const CSSSimpleBlock & /*token*/, CSSValueParser & /*blockParser*/)
  {
    return {};
  }

  template <typename ReturnT, CSSValidDataTypeParser ParserT, CSSValidDataTypeParser... RestParserT>
  constexpr ReturnT tryConsumeSimpleBlock(const CSSSimpleBlock &block, CSSValueParser &blockParser)
  {
    if constexpr (CSSSimpleBlockSink<ParserT>) {
      auto currentParser = blockParser;
      if (auto ret = ParserT::consumeSimpleBlock(block, blockParser)) {
        return *ret;
      }
      blockParser = currentParser;
    }

    return tryConsumeSimpleBlock<ReturnT, RestParserT...>(block, blockParser);
  }

  template <typename ReturnT>
  constexpr ReturnT tryConsumeFunctionBlock(const CSSFunctionBlock & /*func*/, CSSValueParser & /*blockParser*/)
  {
    return {};
  }

  template <typename ReturnT, CSSValidDataTypeParser ParserT, CSSValidDataTypeParser... RestParserT>
  constexpr ReturnT tryConsumeFunctionBlock(const CSSFunctionBlock &func, CSSValueParser &blockParser)
  {
    if constexpr (CSSFunctionBlockSink<ParserT>) {
      auto currentParser = blockParser;
      if (auto ret = ParserT::consumeFunctionBlock(func, blockParser)) {
        return *ret;
      }
      blockParser = currentParser;
    }

    return tryConsumeFunctionBlock<ReturnT, RestParserT...>(func, blockParser);
  }

  template <typename ReturnT>
  constexpr ReturnT tryConsumeParser(CSSDelimiter /*delimiter*/)
  {
    return {};
  }

  template <typename ReturnT, CSSValidDataTypeParser ParserT, CSSValidDataTypeParser... RestParserT>
  constexpr ReturnT tryConsumeParser(CSSDelimiter delimiter)
  {
    if constexpr (CSSParserSink<ParserT>) {
      auto originalParser = *parser_;
      if (parser_->consumeDelimiter(delimiter)) {
        if (auto ret = ParserT::consume(*this)) {
          return *ret;
        }
      }
      *parser_ = originalParser;
    }

    return tryConsumeParser<ReturnT, RestParserT...>(delimiter);
  }

  CSSSyntaxParser *parser_;
};

/**
 * Parse a single CSS property value. Returns a variant holding std::monostate
 * on syntax error.
 */
template <CSSMaybeCompoundDataType... AllowedTypesT>
constexpr auto parseCSSProperty(std::string_view css)
    -> CSSVariantWithTypes<CSSMergedDataTypes<CSSWideKeyword, AllowedTypesT...>, std::monostate>
{
  CSSSyntaxParser syntaxParser(css);
  CSSValueParser parser(syntaxParser);

  syntaxParser.consumeWhitespace();
  auto value = parser.parseNextValue<CSSWideKeyword, AllowedTypesT...>();
  syntaxParser.consumeWhitespace();

  if (syntaxParser.isFinished()) {
    return value;
  }

  return {};
};

} // namespace facebook::react

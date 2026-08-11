/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <folly/json.h>
#include <folly/json_pointer.h>
#include <gmock/gmock.h>

namespace facebook {

namespace folly_dynamic_matchers_utils {

std::string as_string(std::string value);
std::string as_string(const folly::dynamic& value);
std::string explain_error(
    folly::dynamic::json_pointer_resolution_error<const folly::dynamic> error);

} // namespace folly_dynamic_matchers_utils

// GTest / GMock compatible matchers for `folly::dynamic` values.

/**
 * Parses a JSON string into a folly::dynamic, then matches it against the
 * given matcher.
 */
MATCHER_P(
    JsonParsed,
    innerMatcher,
    std::string{"parsed as JSON "} +
        testing::DescribeMatcher<folly::dynamic>(innerMatcher, negation)) {
  using namespace ::testing;
  using namespace folly_dynamic_matchers_utils;
  const auto& json = arg;
  folly::dynamic parsed = folly::parseJson(as_string(json));
  return ExplainMatchResult(innerMatcher, parsed, result_listener);
}

/**
 * Given a folly::dynamic argument, asserts that it is deeply equal to the
 * result of parsing the given JSON string.
 */
MATCHER_P(
    JsonEq,
    expected,
    std::string{"deeply equals "} +
        folly::toPrettyJson(folly::parseJson(expected))) {
  using namespace ::testing;
  return ExplainMatchResult(
      JsonParsed(Eq(folly::parseJson(expected))), arg, result_listener);
}

/**
 * A higher-order matcher that applies an inner matcher to the value at a
 * particular JSON Pointer location within a folly::dynamic.
 */
MATCHER_P2(
    AtJsonPtr,
    jsonPointer,
    innerMatcher,
    std::string{"value at "} + jsonPointer + " " +
        testing::DescribeMatcher<folly::dynamic>(innerMatcher, negation)) {
  using namespace ::testing;
  using namespace folly_dynamic_matchers_utils;
  auto resolved_ptr = arg.try_get_ptr(folly::json_pointer::parse(jsonPointer));
  if (resolved_ptr.hasValue()) {
    return ExplainMatchResult(
        innerMatcher, *resolved_ptr.value().value, result_listener);
  }
  *result_listener << "has no value at " << jsonPointer << " because of error: "
                   << explain_error(resolved_ptr.error());
  return false;
}

/**
 * A higher-order matcher that applies an inner matcher to the string value of
 * a folly::dynamic.
 */
MATCHER_P(
    DynamicString,
    innerMatcher,
    std::string{"string value "} +
        testing::DescribeMatcher<std::string>(innerMatcher, negation)) {
  using namespace ::testing;
  using namespace folly_dynamic_matchers_utils;
  if (!arg.isString()) {
    *result_listener << "is not a string";
    return false;
  }
  return ExplainMatchResult(innerMatcher, arg.getString(), result_listener);
}

/**
 * A user-defined literal for constructing a folly::dynamic from a JSON
 * string. Not technically specific to GMock, but convenient to have in a test
 * suite.
 */
inline folly::dynamic operator""_json(const char* s, size_t n) {
  return folly::parseJson(std::string{s, n});
}

} // namespace facebook

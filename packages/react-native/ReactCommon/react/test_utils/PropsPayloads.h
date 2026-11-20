/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <gtest/gtest.h>

#include <react/renderer/core/DynamicPropsUtilities.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/core/RawPropsParser.h>
#include <react/utils/ContextContainer.h>

#include <algorithm>
#include <cmath>
#include <memory>
#include <set>
#include <string>
#include <vector>

#ifdef RN_SERIALIZABLE_STATE

namespace facebook::react {

/*
 * One commit: the props JS sends (a removed prop is null), and the Props 2.0
 * values that intentionally differ from what Props 1.5 sends.
 */
struct PropsCommit {
  folly::dynamic props;
  folly::dynamic intendedDifferences = folly::dynamic::object();
};

namespace detail {

inline bool payloadValuesMatch(const folly::dynamic &actual, const folly::dynamic &expected)
{
  if (actual.isNumber() && expected.isNumber()) {
    // Props 2.0 stores floats, so 0.998 comes back as 0.99800002574...
    auto tolerance = 1e-6 * std::max(1.0, std::abs(expected.asDouble()));
    return std::abs(actual.asDouble() - expected.asDouble()) <= tolerance;
  }
  if (actual.isArray() && expected.isArray()) {
    return actual.size() == expected.size() &&
        std::equal(actual.begin(), actual.end(), expected.begin(), payloadValuesMatch);
  }
  if (actual.isObject() && expected.isObject()) {
    return actual.size() == expected.size() && std::ranges::all_of(expected.items(), [&](const auto &item) {
             return actual.count(item.first) != 0 && payloadValuesMatch(actual[item.first], item.second);
           });
  }
  return actual == expected;
}

// Each element carries the fields of the expected element, and may add more.
inline bool elementsContainFields(const folly::dynamic &actual, const folly::dynamic &expected)
{
  if (!actual.isArray() || !expected.isArray() || actual.size() != expected.size()) {
    return payloadValuesMatch(actual, expected);
  }
  for (size_t i = 0; i < expected.size(); i++) {
    for (const auto &[field, value] : expected[i].items()) {
      if (actual[i].count(field) == 0 || !payloadValuesMatch(actual[i][field], value)) {
        return false;
      }
    }
  }
  return true;
}

} // namespace detail

/*
 * Applies the commits in order and checks that each Props 2.0 payload
 * (`getDiffProps`) has the keys, nulls and values of the Props 1.5 payload
 * (accumulated raw props), apart from the commit's intended differences. The
 * elements of the arrays under `keysWithAddedFields` may carry fields that JS
 * does not send.
 */
template <typename PropsT>
void expectPayloadsMatchRawProps(
    const std::vector<PropsCommit> &commits,
    const std::set<std::string> &keysWithAddedFields = {})
{
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto previous = std::make_shared<const PropsT>();
  folly::dynamic previousRawProps = folly::dynamic::object();
  for (size_t i = 0; i < commits.size(); i++) {
    const auto &commit = commits[i];
    auto rawProps = RawProps(commit.props);
    auto parser = RawPropsParser();
    parser.template prepare<PropsT>();
    rawProps.parse(parser);
    auto props = std::make_shared<const PropsT>(parserContext, *previous, rawProps);
    auto accumulatedRawProps = mergeDynamicProps(previousRawProps, commit.props, NullValueStrategy::Override);

    auto actual = props->getDiffProps(i == 0 ? nullptr : previous.get());
    auto expected = i == 0 ? accumulatedRawProps : diffDynamicProps(previousRawProps, accumulatedRawProps);
    for (const auto &[key, value] : commit.intendedDifferences.items()) {
      expected[key] = value;
    }

    std::set<std::string> keys;
    for (const auto &payload : {actual, expected}) {
      for (const auto &key : payload.keys()) {
        keys.insert(key.asString());
      }
    }
    for (const auto &key : keys) {
      bool matches = actual.count(key) != 0 && expected.count(key) != 0 &&
          (keysWithAddedFields.contains(key) ? detail::elementsContainFields(actual[key], expected[key])
                                             : detail::payloadValuesMatch(actual[key], expected[key]));
      EXPECT_TRUE(matches) << "commit " << i << " " << commit.props << ", key '" << key
                           << "'\n  Props 2.0: " << actual.getDefault(key, "(absent)")
                           << "\n  expected:  " << expected.getDefault(key, "(absent)");
    }

    previous = props;
    previousRawProps = accumulatedRawProps;
  }
}

} // namespace facebook::react

#endif

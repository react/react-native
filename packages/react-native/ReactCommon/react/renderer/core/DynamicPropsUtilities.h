/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <react/renderer/core/RawProps.h>

namespace facebook::react {

/*
 * Enum defining how missing value in `source` is handled if it is present in
 * `patch`.
 */
enum class NullValueStrategy {
  /*
   * Key in source will be overriden by the matching key in patch.
   *
   * Example:
   * source:   {"key": "value"}
   * patch:    {"key": "new value"}
   * returned: {"key": "new value"}
   */
  Override,

  /*
   * In case key is missing in source, value from patch will be ignored.
   *
   * Example:
   * source:   {"key": "value 1"}
   * patch:    {"key": "new value 1", "key 2": "new value 2"}
   * returned: {"key": "new value 1"}
   */
  Ignore
};

/*
 * Accepts two `folly::dynamic` objects as arguments. Both arguments need to
 * represent a dictionary. It updates `source` with key/value pairs from
 * `patch`.
 */
folly::dynamic mergeDynamicProps(
    const folly::dynamic& source,
    const folly::dynamic& patch,
    NullValueStrategy nullValueStrategy);

folly::dynamic diffDynamicProps(
    const folly::dynamic& oldProps,
    const folly::dynamic& newProps);

} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <limits>
#include <optional>

#include <folly/dynamic.h>
#include <jsi/JSIDynamic.h>
#include <jsi/jsi.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawPropsPrimitives.h>
#include <react/renderer/core/RawValue.h>
#include <vector>

namespace facebook::react {

class RawPropsParser;

/*
 * `RawProps` represents an untyped map of props comes from JavaScript side.
 * `RawProps` stores JSI (or `folly::dynamic`) primitives inside and abstract
 * them as `RawValue` objects.
 * `RawProps` is NOT a thread-safe type nor long-living type.
 * The caller must not store values of this type.
 * The class is practically a wrapper around a `jsi::Value and `jsi::Runtime`
 * pair (or folly::dynamic) preventing direct access to it and inefficient
 * misuse. Not copyable, not moveable.
 */
class RawProps final {
 public:
  /*
   * Mode
   * Represents the type of source data.
   */
  enum class Mode { Empty, JSI, Dynamic };

  /*
   * Creates empty RawProps objects.
   */
  RawProps() : mode_(Mode::Empty) {}

  /*
   * Creates an object with given `runtime` and `value`.
   */
  RawProps(jsi::Runtime &runtime, const jsi::Value &value) noexcept;

  explicit RawProps(const RawProps &other) noexcept;
  RawProps(RawProps &&other) noexcept = default;

  RawProps &operator=(const RawProps &other) noexcept = delete;
  RawProps &operator=(RawProps &&other) noexcept = delete;

  /*
   * Creates an object with given `folly::dynamic` object.
   * Deprecated. Do not use.
   * We need this temporary, only because we have a callsite that does not have
   * a `jsi::Runtime` behind the data.
   */
  explicit RawProps(folly::dynamic dynamic) noexcept;

  void parse(const RawPropsParser &parser) noexcept;

  /*
   * Deprecated. Do not use.
   * The support for explicit conversion to `folly::dynamic` is deprecated and
   * will be removed as soon Android implementation does not need it.
   */
  explicit operator folly::dynamic() const;

  /*
   * Deprecated. Do not use.
   * The support for explicit conversion to `folly::dynamic` is deprecated and
   * will be removed as soon Android implementation does not need it.
   */
  folly::dynamic toDynamic(const std::function<bool(const std::string &)> &filterObjectKeys = nullptr) const;

  /*
   * Returns `true` if the object is empty.
   * Empty `RawProps` does not have any stored data.
   */
  bool isEmpty() const noexcept;

  /*
   * Returns a const unowning pointer to `RawValue` of a prop with a given name.
   * Returns `nullptr` if a prop with the given name does not exist.
   */
  const RawValue *at(const char *name) const noexcept;

 private:
  friend class RawPropsParser;

  mutable const RawPropsParser *parser_{nullptr};

  /*
   * Source artefacts:
   */

  // Mode
  Mode mode_;

  // Case 1: Source data is represented as `jsi::Object`.
  jsi::Runtime *runtime_{};
  jsi::Value value_;

  // Case 2: Source data is represented as `folly::dynamic`.
  folly::dynamic dynamic_;

  /*
   * The index of a prop value that was evaluated on the previous iterations of
   * calling `at()`.
   */
  mutable int keyIndexCursor_{0};

  /*
   * Parsed artefacts:
   * To be used by `RawPropParser`.
   */
  mutable std::vector<RawPropsValueIndex> keyIndexToValueIndex_;
  mutable std::vector<RawValue> values_;
};

/*
 * Once called, props will be filtered out during conversion to
 * folly::dynamic. folly::dynamic conversion is only used on Android and props
 * specific to Yoga do not need to be send over JNI to Android.
 * This is a performance optimisation to minimise traffic between C++ and
 * Java.
 */
template <typename T>
concept RawPropsFilterable = requires(RawProps &rawProps) {
  { T::filterRawProps(rawProps) } -> std::same_as<void>;
};

} // namespace facebook::react

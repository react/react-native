/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RawProps.h"

#include <cxxreact/TraceSection.h>
#include <react/debug/react_native_assert.h>
#include <react/renderer/core/RawPropsParser.h>

namespace facebook::react {

/*
 * Creates an object with given `runtime` and `value`.
 */
RawProps::RawProps(jsi::Runtime& runtime, const jsi::Value& value) noexcept {
  if (value.isNull()) {
    mode_ = Mode::Empty;
    return;
  }

  mode_ = Mode::JSI;
  runtime_ = &runtime;
  value_ = jsi::Value(runtime, value);
}

/*
 * Creates an object with given `folly::dynamic` object.
 * Deprecated. Do not use.
 * We need this temporary, only because we have a callsite that does not have
 * a `jsi::Runtime` behind the data.
 */
RawProps::RawProps(folly::dynamic dynamic) noexcept {
  if (dynamic.isNull()) {
    mode_ = Mode::Empty;
    return;
  }

  mode_ = Mode::Dynamic;
  dynamic_ = std::move(dynamic);
}

RawProps::RawProps(const RawProps& other) noexcept : mode_(other.mode_) {
  if (mode_ == Mode::JSI) {
    runtime_ = other.runtime_;
    value_ = jsi::Value(*runtime_, other.value_);
  } else if (mode_ == Mode::Dynamic) {
    dynamic_ = other.dynamic_;
  }
}

void RawProps::parse(const RawPropsParser& parser) noexcept {
  react_native_assert(parser_ == nullptr && "A parser was already assigned.");
  parser_ = &parser;
  parser.preparse(*this);
}

/*
 * Deprecated. Do not use.
 * The support for explicit conversion to `folly::dynamic` is deprecated and
 * will be removed as soon Android implementation does not need it.
 */
RawProps::operator folly::dynamic() const {
  return toDynamic();
}

/*
 * Deprecated. Do not use.
 * The support for explicit conversion to `folly::dynamic` is deprecated and
 * will be removed as soon Android implementation does not need it.
 */
folly::dynamic RawProps::toDynamic(
    const std::function<bool(const std::string&)>& filterObjectKeys) const {
  switch (mode_) {
    case Mode::Empty:
      return folly::dynamic::object();
    case Mode::JSI: {
      auto result = jsi::dynamicFromValue(*runtime_, value_, filterObjectKeys);
      auto object = value_.asObject(*runtime_);
      auto names = object.getPropertyNames(*runtime_);
      for (size_t i = 0; i < names.size(*runtime_); i++) {
        auto name = names.getValueAtIndex(*runtime_, i).getString(*runtime_);
        auto key = name.utf8(*runtime_);
        if (result.find(key) != result.items().end() ||
            (filterObjectKeys && filterObjectKeys(key))) {
          continue;
        }
        // An explicit undefined is a prop reset. Dynamic/Java consumers use
        // null for resets; omitting the key would retain the previous value.
        if (object.getProperty(*runtime_, name).isUndefined()) {
          result[key] = nullptr;
        }
      }
      return result;
    }
    case Mode::Dynamic:
      return dynamic_;
  }
}

/*
 * Returns `true` if the object is empty.
 * Empty `RawProps` does not have any stored data.
 */
bool RawProps::isEmpty() const noexcept {
  return mode_ == Mode::Empty;
}

/*
 * Returns a const unowning pointer to `RawValue` of a prop with a given name.
 * Returns `nullptr` if a prop with the given name does not exist.
 */
const RawValue* RawProps::at(const char* name) const noexcept {
  react_native_assert(
      parser_ &&
      "The object is not parsed. `parse` must be called before `at`.");
  return parser_->at(*this, name);
}

const RawValue* RawProps::at(
    const char* name,
    const char* prefix,
    const char* suffix) const noexcept {
  if (prefix == nullptr && suffix == nullptr) {
    return at(name);
  }

  std::string concatenated;
  if (prefix != nullptr) {
    concatenated += prefix;
  }
  concatenated += name;
  if (suffix != nullptr) {
    concatenated += suffix;
  }
  react_native_assert(
      parser_ &&
      "The object is not parsed. `parse` must be called before `at`.");
  return parser_->at(*this, concatenated);
}

} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AttributedStringBox.h"

#include <react/debug/react_native_assert.h>

#include <utility>

namespace facebook::react {

AttributedStringBox::AttributedStringBox()
    : mode_(Mode::Value),
      value_(std::make_shared<const AttributedString>(AttributedString{})),
      opaquePointer_({}) {};

AttributedStringBox::AttributedStringBox(const AttributedString& value)
    : mode_(Mode::Value),
      value_(std::make_shared<const AttributedString>(value)),
      opaquePointer_({}) {};

AttributedStringBox::AttributedStringBox(std::shared_ptr<void> opaquePointer)
    : mode_(Mode::OpaquePointer),
      value_({}),
      opaquePointer_(std::move(opaquePointer)) {}

AttributedStringBox::AttributedStringBox(AttributedStringBox&& other) noexcept
    : mode_(other.mode_),
      value_(std::move(other.value_)),
      opaquePointer_(std::move(other.opaquePointer_)) {
  other.mode_ = AttributedStringBox::Mode::Value;
  other.value_ = std::make_shared<const AttributedString>(AttributedString{});
}

AttributedStringBox::Mode AttributedStringBox::getMode() const {
  return mode_;
}

const AttributedString& AttributedStringBox::getValue() const {
  react_native_assert(mode_ == AttributedStringBox::Mode::Value);
  react_native_assert(value_);
  return *value_;
}

std::shared_ptr<void> AttributedStringBox::getOpaquePointer() const {
  react_native_assert(mode_ == AttributedStringBox::Mode::OpaquePointer);
  react_native_assert(opaquePointer_);
  return opaquePointer_;
}

AttributedStringBox& AttributedStringBox::operator=(
    AttributedStringBox&& other) noexcept {
  if (this != &other) {
    mode_ = other.mode_;
    value_ = std::move(other.value_);
    opaquePointer_ = std::move(other.opaquePointer_);
    other.mode_ = AttributedStringBox::Mode::Value;
    other.value_ = std::make_shared<const AttributedString>(AttributedString{});
  }
  return *this;
}

bool operator==(
    const AttributedStringBox& lhs,
    const AttributedStringBox& rhs) {
  if (lhs.getMode() != rhs.getMode()) {
    return false;
  }

  switch (lhs.getMode()) {
    case AttributedStringBox::Mode::Value:
      return lhs.getValue() == rhs.getValue();
    case AttributedStringBox::Mode::OpaquePointer:
      return lhs.getOpaquePointer() == rhs.getOpaquePointer();
  }
}

} // namespace facebook::react

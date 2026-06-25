/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/debug/flags.h>
#include <react/renderer/graphics/Color.h>
#include <react/renderer/graphics/Float.h>
#include <react/renderer/graphics/ValueUnit.h>
#include <optional>

#if RN_DEBUG_STRING_CONVERTIBLE
#include <sstream>
#endif

namespace facebook::react {

struct ColorStop {
  bool operator==(const ColorStop &other) const = default;
  SharedColor color;
  ValueUnit position;

#ifdef RN_SERIALIZABLE_STATE
  folly::dynamic toDynamic() const;
#endif

#if RN_DEBUG_STRING_CONVERTIBLE
  void toString(std::stringstream &ss) const
  {
    ss << color.toString();
    if (position.unit != UnitType::Undefined) {
      ss << " ";
      ss << position.toString();
    }
  }
#endif
};

struct ProcessedColorStop {
  bool operator==(const ProcessedColorStop &other) const = default;
  SharedColor color;
  std::optional<Float> position;
};

}; // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ValueUnit.h"

#include <react/renderer/debug/DebugStringConvertible.h>

namespace facebook::react {

#ifdef RN_SERIALIZABLE_STATE
folly::dynamic ValueUnit::toDynamic() const {
  switch (unit) {
    case UnitType::Undefined:
      return nullptr;
    case UnitType::Point:
      return value;
    case UnitType::Percent:
      return react::toString(value, '%');
    default:
      return nullptr;
  }
}
#endif

#if RN_DEBUG_STRING_CONVERTIBLE
std::string ValueUnit::toString() const {
  if (unit == UnitType::Percent) {
    return react::toString(value, '%');
  } else if (unit == UnitType::Point) {
    return react::toString(value, '\0') + "px";
  } else {
    return "undefined";
  }
}
#endif

} // namespace facebook::react

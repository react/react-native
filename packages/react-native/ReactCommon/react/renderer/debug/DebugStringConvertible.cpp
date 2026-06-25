/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "DebugStringConvertible.h"

#include <cmath>
#include <cstdint>
#include <iomanip>
#include <sstream>

namespace facebook::react {

#if RN_DEBUG_STRING_CONVERTIBLE

std::string DebugStringConvertible::getDebugChildrenDescription(
    DebugStringConvertibleOptions options) const {
  if (options.depth >= options.maximumDepth) {
    return "";
  }

  options.depth++;

  auto trailing = options.format ? std::string{"\n"} : std::string{""};
  std::string childrenString;

  for (const auto& child : getDebugChildren()) {
    if (!child) {
      continue;
    }

    childrenString += child->getDebugDescription(options) + trailing;
  }

  if (!childrenString.empty() && !trailing.empty()) {
    // Removing trailing fragment.
    childrenString.erase(childrenString.end() - 1);
  }

  return childrenString;
}

std::string DebugStringConvertible::getDebugPropsDescription(
    DebugStringConvertibleOptions options) const {
  if (options.depth >= options.maximumDepth) {
    return "";
  }

  options.depth++;

  std::string propsString;

  for (const auto& prop : getDebugProps()) {
    if (!prop) {
      continue;
    }

    auto name = prop->getDebugName();
    auto value = prop->getDebugValue();
    auto children = prop->getDebugPropsDescription(options);
    auto valueAndChildren =
        value + (children.empty() ? "" : "(" + children + ")");
    propsString +=
        " " + name + (valueAndChildren.empty() ? "" : "=" + valueAndChildren);
  }

  if (!propsString.empty()) {
    // Removing leading space character.
    propsString.erase(propsString.begin());
  }

  return propsString;
}

std::string DebugStringConvertible::getDebugDescription(
    DebugStringConvertibleOptions options) const {
  auto nameString = getDebugName();
  auto valueString = getDebugValue();

  // Convention:
  // If `name` and `value` are empty, `description` is also empty.
  if (nameString.empty() && valueString.empty()) {
    return "";
  }

  // Convention:
  // If `name` is empty and `value` isn't empty, `description` equals `value`.
  if (nameString.empty()) {
    return valueString;
  }

  auto childrenString = getDebugChildrenDescription(options);
  auto propsString = getDebugPropsDescription(options);

  auto leading =
      options.format ? std::string(options.depth * 2, ' ') : std::string{""};
  auto trailing = options.format ? std::string{"\n"} : std::string{""};

  return leading + "<" + nameString +
      (valueString.empty() ? "" : "=" + valueString) +
      (propsString.empty() ? "" : " " + propsString) +
      (childrenString.empty() ? "/>"
                              : ">" + trailing + childrenString + trailing +
               leading + "</" + nameString + ">");
}

std::string DebugStringConvertible::getDebugName() const {
  return "Node";
}

std::string DebugStringConvertible::getDebugValue() const {
  return "";
}

SharedDebugStringConvertibleList DebugStringConvertible::getDebugChildren()
    const {
  return {};
}

SharedDebugStringConvertibleList DebugStringConvertible::getDebugProps() const {
  return {};
}

#endif

/*
 * `toString`-family implementation.
 */
std::string toString(const double& value) {
  // Handle special floating-point values with prettier output
  if (std::isnan(value)) {
    return "NaN";
  }
  if (std::isinf(value)) {
    return value < 0 ? "-Infinity" : "Infinity";
  }

  std::ostringstream stream;
  stream << std::fixed << std::setprecision(4) << value;
  std::string result = stream.str();

  // Strip trailing zeros and unnecessary decimal point
  if (auto dotPos = result.find('.'); dotPos != std::string::npos) {
    auto lastNonZero = result.find_last_not_of('0');
    if (lastNonZero == dotPos) {
      result.erase(dotPos);
    } else {
      result.erase(lastNonZero + 1);
    }
  }
  return result;
}

std::string toString(const double doubleValue, char suffix) {
  auto result = toString(doubleValue);
  if (suffix != '\0') {
    result += suffix;
  }
  return result;
}

#if RN_DEBUG_STRING_CONVERTIBLE

std::string toString(const void* value) {
  if (value == nullptr) {
    return "null";
  }
  std::ostringstream stream;
  stream << "0x" << std::uppercase << std::hex
         << reinterpret_cast<uintptr_t>(value);
  return stream.str();
}

#endif

} // namespace facebook::react

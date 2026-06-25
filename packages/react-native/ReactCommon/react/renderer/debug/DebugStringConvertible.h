/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <climits>
#include <memory>
#include <optional>
#include <string>
#include <unordered_set>
#include <vector>

#include <react/renderer/debug/flags.h>

namespace facebook::react {

#if RN_DEBUG_STRING_CONVERTIBLE

class DebugStringConvertible;

using SharedDebugStringConvertible = std::shared_ptr<const DebugStringConvertible>;
using SharedDebugStringConvertibleList = std::vector<SharedDebugStringConvertible>;

struct DebugStringConvertibleOptions {
  bool format{true};
  int depth{0};
  int maximumDepth{INT_MAX};
};

/*
 * Abstract class describes conformance to DebugStringConvertible concept
 * and implements basic recursive debug string assembly algorithm.
 * Use this as a base class for providing a debugging textual representation
 * of your class.
 *
 * The `DebugStringConvertible` *class* is obsolete. Whenever possible prefer
 * implementing standalone functions that conform to the informal
 * `DebugStringConvertible`-like interface instead of extending this class.
 */
class DebugStringConvertible {
 public:
  virtual ~DebugStringConvertible() = default;

  // Returns a name of the object.
  // Default implementation returns "Node".
  virtual std::string getDebugName() const;

  // Returns a value associate with the object.
  // Default implementation returns an empty string.
  virtual std::string getDebugValue() const;

  // Returns a list of `DebugStringConvertible` objects which can be considered
  // as *children* of the object.
  // Default implementation returns an empty list.
  virtual SharedDebugStringConvertibleList getDebugChildren() const;

  // Returns a list of `DebugStringConvertible` objects which can be considered
  // as *properties* of the object.
  // Default implementation returns an empty list.
  virtual SharedDebugStringConvertibleList getDebugProps() const;

  // Returns a string which represents the object in a human-readable way.
  // Default implementation returns a description of the subtree
  // rooted at this node, represented in XML-like format.
  virtual std::string getDebugDescription(DebugStringConvertibleOptions options = {}) const;

  // Do same as `getDebugDescription` but return only *children* and
  // *properties* parts (which are used in `getDebugDescription`).
  virtual std::string getDebugPropsDescription(DebugStringConvertibleOptions options = {}) const;
  virtual std::string getDebugChildrenDescription(DebugStringConvertibleOptions options = {}) const;
};

#else

struct DebugStringConvertibleOptions {};
class DebugStringConvertible {};

#endif

/*
 * Set of particular-format-opinionated functions that convert base types to
 * `std::string`
 */
std::string toString(const double &value);
std::string toString(double doubleValue, char suffix);

#if RN_DEBUG_STRING_CONVERTIBLE

std::string toString(const void *value);

inline std::string toString(const std::string &value)
{
  return value;
}
inline std::string toString(const int &value)
{
  return std::to_string(value);
}
inline std::string toString(const unsigned int &value)
{
  return std::to_string(value);
}
inline std::string toString(const bool &value)
{
  return value ? "true" : "false";
}
inline std::string toString(const float &value)
{
  return toString(static_cast<double>(value));
}

template <typename T>
std::string toString(const std::optional<T> &value)
{
  if (!value) {
    return "null";
  }
  return toString(value.value());
}

template <typename T>
std::string toString(const std::vector<T> &value)
{
  std::string result = "[";
  for (size_t i = 0; i < value.size(); i++) {
    result += toString(value[i]);
    if (i < value.size() - 1) {
      result += ", ";
    }
  }
  result += "]";
  return result;
}

/*
 * *Informal* `DebugStringConvertible` interface.
 *
 * The interface consts of several functions which are designed to be composable
 * and reusable relying on C++ overloading mechanism. Implement appropriate
 * versions of those functions for your custom type to enable conformance to the
 * interface:
 *
 * - `getDebugName`: Returns a name of the object. Default implementation
 * returns "Node".
 *
 * - `getDebugValue`: Returns a value associate with the object. Default
 * implementation returns an empty string.
 *
 * - `getDebugChildren`: Returns a list of `DebugStringConvertible`-compatible
 * objects which can be considered as *children* of the object. Default
 * implementation returns an empty list.
 *
 * - `getDebugProps`: Returns a list of `DebugStringConvertible` objects which
 * can be considered as *properties* of the object. Default implementation
 * returns an empty list.
 *
 * - `getDebugDescription`: Returns a string which represents the object in a
 * human-readable way. Default implementation returns a description of the
 * subtree rooted at this node, represented in XML-like format using functions
 * above to form the tree.
 */

/*
 * Universal implementation of `getDebugDescription`-family functions for all
 * types.
 */
template <typename T>
std::string getDebugName(const T & /*object*/)
{
  return "Node";
}

template <typename T>
std::string getDebugValue(const T & /*object*/)
{
  return "";
}

template <typename T>
std::vector<T> getDebugChildren(const T & /*object*/, DebugStringConvertibleOptions /*options*/)
{
  return {};
}

template <typename T>
std::vector<T> getDebugProps(const T & /*object*/, DebugStringConvertibleOptions /*options*/)
{
  return {};
}

template <typename T>
std::string getDebugPropsDescription(const T &object, DebugStringConvertibleOptions options)
{
  if (options.depth >= options.maximumDepth) {
    return "";
  }

  std::string propsString = "";

  options.depth++;

  for (auto prop : getDebugProps(object, options)) {
    auto name = getDebugName(prop);
    auto value = getDebugValue(prop);
    auto children = getDebugPropsDescription(prop, options);
    auto valueAndChildren = value + (children.empty() ? "" : "(" + children + ")");
    propsString += " " + name + (valueAndChildren.empty() ? "" : "=" + valueAndChildren);
  }

  if (!propsString.empty()) {
    // Removing leading space character.
    propsString.erase(propsString.begin());
  }

  return propsString;
}

template <typename T>
std::string getDebugChildrenDescription(const T &object, DebugStringConvertibleOptions options)
{
  if (options.depth >= options.maximumDepth) {
    return "";
  }

  auto separator = options.format ? std::string{"\n"} : std::string{""};
  auto childrenString = std::string{""};
  options.depth++;

  for (auto child : getDebugChildren(object, options)) {
    childrenString += getDebugDescription(child, options) + separator;
  }

  if (!childrenString.empty() && !separator.empty()) {
    // Removing separator fragment.
    childrenString.erase(childrenString.end() - 1);
  }

  return childrenString;
}

template <typename T>
std::string getDebugDescription(const T &object, DebugStringConvertibleOptions options)
{
  auto nameString = getDebugName(object);
  auto valueString = getDebugValue(object);

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

  auto childrenString = getDebugChildrenDescription(object, options);
  auto propsString = getDebugPropsDescription(object, options);

  auto prefix = options.format ? std::string(options.depth * 2, ' ') : std::string{""};
  auto separator = options.format ? std::string{"\n"} : std::string{""};

  return prefix + "<" + nameString + (valueString.empty() ? "" : "=" + valueString) +
      (propsString.empty() ? "" : " " + propsString) +
      (childrenString.empty() ? "/>" : ">" + separator + childrenString + separator + prefix + "</" + nameString + ">");
}

/*
 * Functions of `getDebugDescription`-family for primitive types.
 */
// `int`
inline std::string getDebugDescription(int number, DebugStringConvertibleOptions /*options*/)
{
  return toString(number);
}

// `float`
inline std::string getDebugDescription(float number, DebugStringConvertibleOptions /*options*/)
{
  return toString(number);
}

// `double`
inline std::string getDebugDescription(double number, DebugStringConvertibleOptions /*options*/)
{
  return toString(number);
}

// `bool`
inline std::string getDebugDescription(bool boolean, DebugStringConvertibleOptions /*options*/)
{
  return toString(boolean);
}

// `void *`
inline std::string getDebugDescription(void *pointer, DebugStringConvertibleOptions /*options*/)
{
  return toString(pointer);
}

// `std::string`
inline std::string getDebugDescription(const std::string &string, DebugStringConvertibleOptions /*options*/)
{
  return string;
}

// `std::vector<T>`
template <typename T, typename... Ts>
std::string getDebugName(const std::vector<T, Ts...> & /*vector*/)
{
  return "List";
}

template <typename T, typename... Ts>
std::vector<T, Ts...> getDebugChildren(const std::vector<T, Ts...> &vector, DebugStringConvertibleOptions /*options*/)
{
  return vector;
}

// `std::array<T, Size>`
template <typename T, size_t Size>
std::string getDebugName(const std::array<T, Size> & /*array*/)
{
  return "List";
}

template <typename T, size_t Size>
std::vector<T> getDebugChildren(const std::array<T, Size> &array, DebugStringConvertibleOptions /*options*/)
{
  auto vector = std::vector<T>{};
  for (const auto &value : array) {
    vector.push_back(value);
  }
  return vector;
}

// `std::unordered_set<T>`
template <typename T, typename... Ts>
std::string getDebugName(const std::unordered_set<T, Ts...> & /*set*/)
{
  return "Set";
}

template <typename T, typename... Ts>
std::vector<T> getDebugChildren(const std::unordered_set<T, Ts...> &set, DebugStringConvertibleOptions /*options*/)
{
  auto vector = std::vector<T>{};
  vector.insert(vector.end(), set.begin(), set.end());
  return vector;
}

// `std::shared_ptr<T>`
template <typename T>
inline std::string getDebugDescription(const std::shared_ptr<T> &pointer, DebugStringConvertibleOptions options)
{
  return getDebugDescription((void *)pointer.get(), options) + "(shared)";
}

// `std::weak_ptr<T>`
template <typename T>
inline std::string getDebugDescription(const std::weak_ptr<T> &pointer, DebugStringConvertibleOptions options)
{
  return getDebugDescription((void *)pointer.lock().get(), options) + "(weak)";
}

// `std::unique_ptr<T>`
template <typename T>
inline std::string getDebugDescription(const std::unique_ptr<const T> &pointer, DebugStringConvertibleOptions options)
{
  return getDebugDescription((void *)pointer.get(), options) + "(unique)";
}

/*
 * Trivial container for `name`  and `value` pair that supports
 * static `DebugStringConvertible` informal interface.
 */
struct DebugStringConvertibleObject {
  std::string name;
  std::string value;
};

inline std::string getDebugName(const DebugStringConvertibleObject &object)
{
  return object.name;
}

inline std::string getDebugValue(const DebugStringConvertibleObject &object)
{
  return object.value;
}

#endif

} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JSIDynamic.h"

#include <glog/logging.h>

#include <folly/dynamic.h>
#include <jsi/jsi.h>

using namespace facebook::jsi;

namespace facebook {
namespace jsi {

namespace {

struct FromDynamic {
  FromDynamic(const folly::dynamic* dynArg, Object objArg)
      : dyn(dynArg), obj(std::move(objArg)) {}

  const folly::dynamic* dyn;
  Object obj;
};

// This converts one element.  If it's a collection, it gets pushed onto
// the stack for later processing.
Value valueFromDynamicShallow(
    Runtime& runtime,
    std::vector<FromDynamic>& stack,
    const folly::dynamic& dyn) {
  switch (dyn.type()) {
    case folly::dynamic::NULLT:
      return Value::null();
    case folly::dynamic::ARRAY: {
      Object arr = Array(runtime, dyn.size());
      Value ret = Value(runtime, arr);
      stack.emplace_back(&dyn, std::move(arr));
      return ret;
    }
    case folly::dynamic::BOOL:
      return Value(dyn.getBool());
    case folly::dynamic::DOUBLE:
      return dyn.getDouble();
    case folly::dynamic::INT64:
      return Value((double)dyn.getInt());
    case folly::dynamic::OBJECT: {
      auto obj = Object(runtime);
      Value ret = Value(runtime, obj);
      stack.emplace_back(&dyn, std::move(obj));
      return ret;
    }
    case folly::dynamic::STRING:
      return Value(String::createFromUtf8(runtime, dyn.getString()));
  }
  CHECK(false);
}

} // namespace

Value valueFromDynamic(Runtime& runtime, const folly::dynamic& dynInput) {
  std::vector<FromDynamic> stack;

  Value ret = valueFromDynamicShallow(runtime, stack, dynInput);

  while (!stack.empty()) {
    auto top = std::move(stack.back());
    stack.pop_back();

    switch (top.dyn->type()) {
      case folly::dynamic::ARRAY: {
        Array arr = std::move(top.obj).getArray(runtime);
        for (size_t i = 0; i < top.dyn->size(); ++i) {
          arr.setValueAtIndex(
              runtime,
              i,
              valueFromDynamicShallow(runtime, stack, (*top.dyn)[i]));
        }
        break;
      }
      case folly::dynamic::OBJECT: {
        Object obj = std::move(top.obj);
        // Storing a "__proto__" key into an object whose prototype is
        // Object.prototype calls the inherited __proto__ setter
        // (ES2026 10.1.9.2, step 6), which replaces the prototype with an
        // object or null value and drops any other value
        // (ES2026 20.1.3.8.2). JSON.parse makes the key an own property
        // instead (ES2026 13.2.5.6, step 2), so an object with that key is
        // filled while its prototype is null.
        //
        // JSCRuntime cuts property names at the first NUL, so on JSC a key
        // such as "__proto__\0x" is stored as "__proto__" too. This lookup
        // doesn't match it, so it can still call the setter.
        bool hasProtoKey = top.dyn->count("__proto__");
        Value prototype;
        if (hasProtoKey) {
          prototype = obj.getPrototype(runtime);
          obj.setPrototype(runtime, Value::null());
        }
        for (const auto& element : top.dyn->items()) {
          if (element.first.isNumber() || element.first.isString()) {
            obj.setProperty(
                runtime,
                PropNameID::forUtf8(runtime, element.first.asString()),
                valueFromDynamicShallow(runtime, stack, element.second));
          }
        }
        if (hasProtoKey) {
          obj.setPrototype(runtime, prototype);
        }
        break;
      }
      default:
        CHECK(false);
    }
  }

  return ret;
}

namespace {

struct FromValue {
#ifndef NDEBUG
  FromValue(folly::dynamic* dynArg, Object objArg, size_t depthArg)
      : dyn(dynArg), obj(std::move(objArg)), depth(depthArg) {}
#else
  FromValue(folly::dynamic* dynArg, Object objArg)
      : dyn(dynArg), obj(std::move(objArg)) {}
#endif

  folly::dynamic* dyn;
  Object obj;
#ifndef NDEBUG
  size_t depth;
#endif
};

// This converts one element.  If it's a collection, it gets pushed
// onto the stack for later processing.  The output is created by
// mutating the output argument, because we need its actual pointer to
// push onto the stack.
void dynamicFromValueShallow(
    Runtime& runtime,
    std::vector<FromValue>& stack,
    const jsi::Value& value,
#ifndef NDEBUG
    folly::dynamic& output,
    size_t depth) {
#else
    folly::dynamic& output) {
#endif
  if (value.isUndefined() || value.isNull()) {
    output = nullptr;
  } else if (value.isBool()) {
    output = value.getBool();
  } else if (value.isNumber()) {
    output = value.getNumber();
  } else if (value.isString()) {
    output = value.getString(runtime).utf8(runtime);
  } else if (value.isObject()) {
    Object obj = value.getObject(runtime);
    if (obj.isArray(runtime)) {
      output = folly::dynamic::array();
    } else if (obj.isFunction(runtime)) {
      throw JSError(runtime, "JS Functions are not convertible to dynamic");
    } else {
      output = folly::dynamic::object();
    }
#ifndef NDEBUG
    stack.emplace_back(&output, std::move(obj), depth);
#else
    stack.emplace_back(&output, std::move(obj));
#endif
  } else if (value.isBigInt()) {
    throw JSError(runtime, "JS BigInts are not convertible to dynamic");
  } else if (value.isSymbol()) {
    throw JSError(runtime, "JS Symbols are not convertible to dynamic");
  } else {
    throw JSError(runtime, "Value is not convertible to dynamic");
  }
}

} // namespace

folly::dynamic dynamicFromValue(
    Runtime& runtime,
    const Value& valueInput,
    const std::function<bool(const std::string&)>& filterObjectKeys) {
  std::vector<FromValue> stack;
#ifndef NDEBUG
  std::vector<FromValue> ancestors;
#endif
  folly::dynamic ret;

#ifndef NDEBUG
  dynamicFromValueShallow(runtime, stack, valueInput, ret, 0);
#else
  dynamicFromValueShallow(runtime, stack, valueInput, ret);
#endif

  while (!stack.empty()) {
    auto top = std::move(stack.back());
    stack.pop_back();

#ifndef NDEBUG
    // Detect cycles with Brent's algorithm: compare each object with its
    // nearest ancestor saved at depth 0, 1, 2, 4, 8, ...
    while (!ancestors.empty() && ancestors.back().depth >= top.depth) {
      ancestors.pop_back();
    }
    if (!ancestors.empty() &&
        Object::strictEquals(runtime, ancestors.back().obj, top.obj)) {
      throw JSError(runtime, "Cyclic JS values are not convertible to dynamic");
    }
#endif

    if (top.obj.isArray(runtime)) {
      // Inserting into a dyn can invalidate references into it, so we
      // need to insert new elements up front, then push stuff onto
      // the stack.
      Array array = top.obj.getArray(runtime);
      size_t arraySize = array.size(runtime);
      top.dyn->reserve(arraySize);
      for (size_t i = 0; i < arraySize; ++i) {
        top.dyn->push_back(nullptr);
      }
      for (size_t i = 0; i < arraySize; ++i) {
#ifndef NDEBUG
        dynamicFromValueShallow(
            runtime,
            stack,
            array.getValueAtIndex(runtime, i),
            top.dyn->at(i),
            top.depth + 1);
#else
        dynamicFromValueShallow(
            runtime, stack, array.getValueAtIndex(runtime, i), top.dyn->at(i));
#endif
      }
    } else {
      Array names = top.obj.getPropertyNames(runtime);
      std::vector<std::pair<std::string, jsi::Value>> props;
      for (size_t i = 0; i < names.size(runtime); ++i) {
        String name = names.getValueAtIndex(runtime, i).getString(runtime);
        Value prop = top.obj.getProperty(runtime, name);
        if (prop.isUndefined()) {
          continue;
        }
        auto nameStr = name.utf8(runtime);
        if (filterObjectKeys && filterObjectKeys(nameStr)) {
          continue;
        }
        // The JSC conversion uses JSON.stringify, which substitutes
        // null for a function, so we do the same here.  Just dropping
        // the pair might also work, but would require more testing.
        if (prop.isObject() && prop.getObject(runtime).isFunction(runtime)) {
          prop = Value::null();
        }
        props.emplace_back(std::move(nameStr), std::move(prop));
        top.dyn->insert(props.back().first, nullptr);
      }
      for (const auto& prop : props) {
#ifndef NDEBUG
        dynamicFromValueShallow(
            runtime, stack, prop.second, (*top.dyn)[prop.first], top.depth + 1);
#else
        dynamicFromValueShallow(
            runtime, stack, prop.second, (*top.dyn)[prop.first]);
#endif
      }
    }

#ifndef NDEBUG
    if ((top.depth & (top.depth - 1)) == 0) {
      ancestors.push_back(std::move(top));
    }
#endif
  }

  return ret;
}

} // namespace jsi
} // namespace facebook

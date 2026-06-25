/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RawPropsParser.h"

#include <react/debug/react_native_assert.h>
#include <react/renderer/core/RawProps.h>

#include <glog/logging.h>

namespace facebook::react {

// During parser initialization, Props structs are used to parse
// "fake"/empty objects, and `at` is called repeatedly which tells us
// which props are accessed during parsing, and in which order.
const RawValue* RawPropsParser::at(
    const RawProps& rawProps,
    std::string_view key) const noexcept {
  if (!ready_) [[unlikely]] {
    // Check against the same key being inserted more than once.
    // This happens commonly with nested Props structs, where the higher-level
    // struct may access all fields, and then the nested Props struct may
    // access fields a second (or third, etc) time.
    // Without this, multiple entries will be created for the same key, but
    // only the first access of the key will return a sensible value.
    // The complexity of this is (n + (n - 1) + (n - 2) + ... + (n - (n - 1) +
    // 1))) or n*n - (1/2)(n*(n+1)). If there are 100 props, this will result in
    // 4950 lookups and equality checks on initialization of the parser, which
    // happens exactly once per component.
    size_t size = keys_.size();
    for (size_t i = 0; i < size; i++) {
      if (keys_[i] == key) {
        return nullptr;
      }
    }
    // This is not thread-safe part; this happens only during initialization of
    // a `ComponentDescriptor` where it is actually safe.
    keys_.push_back(key);
    react_native_assert(size < std::numeric_limits<RawPropsValueIndex>::max());
    nameToIndex_.insert(key, static_cast<RawPropsValueIndex>(size));
    return nullptr;
  }

// Normally, keys are looked up in-order. For performance we can simply
// increment this key counter, and if the key is equal to the key at the next
// index, there's no need to do any lookups. However, it's possible for keys
// to be accessed out-of-order or multiple times, in which case we start
// searching again from index 0.
// To prevent infinite loops (which can occur if you look up a key that
// doesn't exist) we keep track of whether or not we've already looped around,
// and log and return nullptr if so. However, we ONLY do this in debug mode,
// where you're more likely to look up a nonexistent key as part of debugging.
// You can (and must) ensure infinite loops are not possible in production by:
// (1) constructing all props objects without conditionals, or (2) if there
// are conditionals, ensure that in the parsing setup case, the Props
// constructor will access _all_ possible props. To ensure this performance
// optimization is utilized, always access props in the same order every time.
// This is trivial if you have a simple Props constructor, but difficult or
// impossible if you have a shared sub-prop Struct that is used by multiple
// parent Props.
#ifdef REACT_NATIVE_DEBUG
  bool resetLoop = false;
#endif
  do {
    rawProps.keyIndexCursor_++;

    if (static_cast<size_t>(rawProps.keyIndexCursor_) >= keys_.size())
        [[unlikely]] {
#ifdef REACT_NATIVE_DEBUG
      if (resetLoop) {
        LOG(ERROR)
            << "Looked up property name which was not seen when preparing: "
            << key;
        return nullptr;
      }
      resetLoop = true;
#endif
      rawProps.keyIndexCursor_ = 0;
    }
  } while (key != keys_[rawProps.keyIndexCursor_]);

  auto valueIndex = rawProps.keyIndexToValueIndex_[rawProps.keyIndexCursor_];
  return valueIndex == kRawPropsValueIndexEmpty ? nullptr
                                                : &rawProps.values_[valueIndex];
}

void RawPropsParser::postPrepare() noexcept {
  ready_ = true;
  nameToIndex_.reindex();
}

void RawPropsParser::preparse(const RawProps& rawProps) const noexcept {
  const size_t keyCount = keys_.size();
  rawProps.keyIndexToValueIndex_.resize(keyCount, kRawPropsValueIndexEmpty);

  // Resetting the cursor, the next increment will give `0`.
  rawProps.keyIndexCursor_ = static_cast<int>(keyCount - 1);

  // If the Props constructor doesn't use ::at at all, we might be
  // able to skip this entirely (in those cases, the Props struct probably
  // uses setProp instead).
  if (keyCount == 0) {
    return;
  }

  switch (rawProps.mode_) {
    case RawProps::Mode::Empty:
      return;

    case RawProps::Mode::JSI: {
      auto& runtime = *rawProps.runtime_;
      if (!rawProps.value_.isObject()) {
        LOG(ERROR) << "Preparse props: rawProps value is not object";
      }
      react_native_assert(rawProps.value_.isObject());
      auto object = rawProps.value_.asObject(runtime);

      auto names = object.getPropertyNames(runtime);
      auto count = names.size(runtime);
      auto valueIndex = RawPropsValueIndex{0};

      for (size_t i = 0; i < count; i++) {
        auto nameValue = names.getValueAtIndex(runtime, i).getString(runtime);
        auto name = nameValue.utf8(runtime);
        auto keyIndex = nameToIndex_.at(name);

        if (keyIndex == kRawPropsValueIndexEmpty) {
          continue;
        }

        rawProps.keyIndexToValueIndex_[keyIndex] = valueIndex;

        auto value = object.getProperty(runtime, nameValue);
        rawProps.values_.emplace_back(runtime, std::move(value));
        valueIndex++;
      }

      break;
    }

    case RawProps::Mode::Dynamic: {
      const auto& dynamic = rawProps.dynamic_;
      auto valueIndex = RawPropsValueIndex{0};

      for (const auto& pair : dynamic.items()) {
        auto name = pair.first.getString();

        auto keyIndex = nameToIndex_.at(name);

        if (keyIndex == kRawPropsValueIndexEmpty) {
          continue;
        }

        rawProps.keyIndexToValueIndex_[keyIndex] = valueIndex;
        rawProps.values_.emplace_back(pair.second);
        valueIndex++;
      }
      break;
    }
  }
}

} // namespace facebook::react

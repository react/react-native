/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/bridging/Base.h>

#include <memory>
#include <optional>

namespace facebook::react {

template <>
struct Bridging<std::nullptr_t> {
  static std::nullptr_t fromJs(jsi::Runtime& rt, const jsi::Value& value) {
    if (value.isNull() || value.isUndefined()) {
      return nullptr;
    } else {
      throw jsi::JSError(rt, "Cannot convert value to nullptr");
    }
  }

  static std::nullptr_t toJs(jsi::Runtime& /*unused*/, std::nullptr_t) {
    return nullptr;
  }
};

template <typename T>
struct Bridging<std::optional<T>> {
  static std::optional<T> fromJs(
      jsi::Runtime& rt,
      const jsi::Value& value,
      const std::shared_ptr<CallInvoker>& jsInvoker) {
    if (value.isNull() || value.isUndefined()) {
      return {};
    }
    return bridging::fromJs<T>(rt, value, jsInvoker);
  }

  template <typename U>
  static std::optional<T> fromJs(
      jsi::Runtime& rt,
      const std::optional<U>& value,
      const std::shared_ptr<CallInvoker>& jsInvoker) {
    if (value) {
      return bridging::fromJs<T>(rt, *value, jsInvoker);
    }
    return {};
  }

  static jsi::Value toJs(
      jsi::Runtime& rt,
      const std::optional<T>& value,
      const std::shared_ptr<CallInvoker>& jsInvoker) {
    if (value) {
      return bridging::toJs(rt, *value, jsInvoker);
    }
    return jsi::Value::null();
  }
};

template <typename T>
struct Bridging<
    std::shared_ptr<T>,
    std::enable_if_t<!std::is_base_of_v<jsi::HostObject, T>>> {
  static jsi::Value toJs(
      jsi::Runtime& rt,
      const std::shared_ptr<T>& ptr,
      const std::shared_ptr<CallInvoker>& jsInvoker) {
    if (ptr) {
      return bridging::toJs(rt, *ptr, jsInvoker);
    }
    return jsi::Value::null();
  }
};

template <typename T>
struct Bridging<std::unique_ptr<T>> {
  static jsi::Value toJs(
      jsi::Runtime& rt,
      const std::unique_ptr<T>& ptr,
      const std::shared_ptr<CallInvoker>& jsInvoker) {
    if (ptr) {
      return bridging::toJs(rt, *ptr, jsInvoker);
    }
    return jsi::Value::null();
  }
};

template <typename T>
struct Bridging<std::weak_ptr<T>> {
  static jsi::Value toJs(
      jsi::Runtime& rt,
      const std::weak_ptr<T>& weakPtr,
      const std::shared_ptr<CallInvoker>& jsInvoker) {
    if (auto ptr = weakPtr.lock()) {
      return bridging::toJs(rt, *ptr, jsInvoker);
    }
    return jsi::Value::null();
  }
};

} // namespace facebook::react

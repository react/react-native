/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <mutex>
#include <optional>
#include <shared_mutex>
#include <string>
#include <unordered_map>

#include <react/debug/flags.h>
#include <react/debug/react_native_assert.h>

namespace facebook::react {

/*
 * General purpose dependency injection container.
 * Instance types must be copyable.
 */
class ContextContainer final {
 public:
  /*
   * Registers an instance of the particular type `T` in the container
   * using the provided `key`. Only one instance can be registered per key.
   * The method does nothing if given `key` already exists in the container.
   *
   * Convention is to use the plain base class name for the key, so for
   * example if the type `T` is `std::shared_ptr<const ReactNativeConfig>`,
   * then one would use `"ReactNativeConfig"` for the `key`, even if the
   * instance is actually a `shared_ptr` of derived class
   *`ReactNativeConfig`.
   */
  template <typename T>
  void insert(const std::string& key, const T& instance) const {
    std::unique_lock lock(mutex_);

    instances_.insert({key, std::make_shared<T>(instance)});
  }

  /*
   * Removes an instance stored for a given `key`.
   * Does nothing if the instance was not found.
   */
  void erase(const std::string& key) const {
    std::unique_lock lock(mutex_);

    instances_.erase(key);
  }

  /*
   * Updates the container with values from a given container.
   * Values with keys that already exist in the container will be replaced with
   * values from the given container.
   */
  void update(const ContextContainer& contextContainer) const {
    std::unique_lock lock(mutex_);

    for (const auto& pair : contextContainer.instances_) {
      instances_.erase(pair.first);
      instances_.insert(pair);
    }
  }

  /*
   * Returns a previously registered instance of the particular type `T`
   * for `key`.
   * Throws an exception if the instance could not be found.
   */
  template <typename T>
  T at(const std::string& key) const {
    std::shared_lock lock(mutex_);

    react_native_assert(
        instances_.find(key) != instances_.end() &&
        "ContextContainer doesn't have an instance for given key.");
    return *static_cast<T*>(instances_.at(key).get());
  }

  /*
   * Returns a (wrapped in an optional) previously registered instance of
   * the particular type `T` for given `key`.
   * Returns an empty optional if the instance could not be found.
   */
  template <typename T>
  std::optional<T> find(const std::string& key) const {
    std::shared_lock lock(mutex_);

    auto iterator = instances_.find(key);
    if (iterator == instances_.end()) {
      return {};
    }

    return *static_cast<T*>(iterator->second.get());
  }

 private:
  mutable std::shared_mutex mutex_;
  // Protected by mutex_`.
  mutable std::unordered_map<std::string, std::shared_ptr<void>> instances_;
};

} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <mutex>
#include <set>
#include "PerformanceEntry.h"

namespace facebook::react {

class PerformanceObserver;

/**
 * PerformanceObserverRegistry acts as a container for known performance
 * observer instances.
 *
 * You can queue performance entries through this registry, which then delegates
 * the entry to all registered observers.
 */
class PerformanceObserverRegistry {
 public:
  PerformanceObserverRegistry() = default;

  /**
   * Adds observer to the registry.
   */
  void addObserver(std::shared_ptr<PerformanceObserver> observer);

  /**
   * Removes observer from the registry.
   */
  void removeObserver(std::shared_ptr<PerformanceObserver> observer);

  /**
   * Delegates specified performance `entry` to all registered observers
   * in this registry.
   */
  void queuePerformanceEntry(const PerformanceEntry& entry);

 private:
  mutable std::mutex observersMutex_;
  std::set<
      std::shared_ptr<PerformanceObserver>,
      std::owner_less<std::shared_ptr<PerformanceObserver>>>
      observers_;
};

} // namespace facebook::react

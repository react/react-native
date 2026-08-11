/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <functional>
#include <mutex>

namespace facebook::react {

/**
 * A thread-safe dispatcher that ensures only the latest value is dispatched
 * to avoid overloading the target thread. Multiple rapid calls are coalesced
 * into a single dispatch operation merging the values.
 */
class MergedValueDispatcher {
 public:
  using DispatchFunction = std::function<void(std::function<void()>&&)>;
  using MergedValueFunction =
      std::function<void(std::unordered_map<Tag, folly::dynamic>&& tagToProps)>;

  /**
   * Creates a MergedValueDispatcher with the given dispatch function.
   *
   * @param dispatchFunction - function that dispatches to the target
   * thread.
   * @param latestValueFunction - function that will be called on the target
   * thread with all values merged.
   */
  explicit MergedValueDispatcher(
      DispatchFunction dispatchFunction,
      MergedValueFunction mergedValueFunction);

  /**
   * Dispatches the given value. If a dispatch is already pending, this will
   * merge with the pending value instead of creating a new dispatch.
   *
   * @param value - value to be dispatched.
   */
  void dispatch(const std::unordered_map<Tag, folly::dynamic>& value);

 private:
  DispatchFunction dispatchFunction_;
  MergedValueFunction mergedValueFunction_;
  std::mutex mutex_;
  bool hasPendingDispatch_{false};
  std::unordered_map<Tag, folly::dynamic> accumulatedValues_;
};

} // namespace facebook::react

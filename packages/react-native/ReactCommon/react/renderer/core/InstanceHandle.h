/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <memory>

namespace facebook::react {

class InstanceHandle {
 public:
  using Shared = std::shared_ptr<const InstanceHandle>;

  InstanceHandle(
      jsi::Runtime& runtime,
      const jsi::Value& instanceHandle,
      Tag tag);

  /*
   * Creates and returns the `instanceHandle`.
   * Returns `null` if the `instanceHandle` is not retained at this moment.
   */
  jsi::Value getInstanceHandle(jsi::Runtime& runtime) const;

  /*
   * Deprecated. Do not use.
   */
  Tag getTag() const;

 private:
  const jsi::WeakObject weakInstanceHandle_; // Protected by `jsi::Runtime &`.
  const Tag tag_;
};

} // namespace facebook::react

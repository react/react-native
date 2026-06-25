/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

namespace test {

struct ShadowNode {};

struct ComponentDescriptor {
  friend ShadowNode;

  virtual std::shared_ptr<const ShadowNode> clone() const = 0;
};

} // namespace test

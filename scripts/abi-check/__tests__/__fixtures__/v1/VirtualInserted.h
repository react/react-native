/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace facebook::react {

class VirtualInserted {
 public:
  virtual ~VirtualInserted();
  virtual void first();
  virtual void last();
};

} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/PrivateGuard.h>

namespace facebook::react {

/**
 * This interface is used for UI consistency, indicating the timeframe where
 * users should see the same revision of the shadow tree.
 */
class ShadowTreeRevisionConsistencyManager {
 public:
  virtual ~ShadowTreeRevisionConsistencyManager() = default;

  virtual void lockRevisions() = 0;
  virtual void unlockRevisions() = 0;
};

} // namespace facebook::react

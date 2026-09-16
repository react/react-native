/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <cinttypes>

namespace facebook::react::jsinspector_modern {

/**
 * Generates unique execution context IDs.
 */
class ExecutionContextManager {
 public:
  int32_t allocateExecutionContextId();

 private:
  int32_t nextExecutionContextId_{1};
};

} // namespace facebook::react::jsinspector_modern

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

namespace facebook::react::jsinspector_modern {

enum class HostCommand {
  /** Resumes JavaScript execution. */
  DebuggerResume,
  /** Steps over the statement. */
  DebuggerStepOver
};

} // namespace facebook::react::jsinspector_modern

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

namespace facebook::react {

enum class SubmitBehavior {
  Default,
  Submit,
  BlurAndSubmit,
  Newline,
};

} // namespace facebook::react

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <jsi/jsi.h>
#include <memory.h>

namespace facebook::jsc {

std::unique_ptr<jsi::Runtime> makeJSCRuntime();

} // namespace facebook::jsc

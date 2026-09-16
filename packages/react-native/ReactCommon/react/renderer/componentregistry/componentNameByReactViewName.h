/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>

#include <string>

namespace facebook::react {

/**
 * Provides mapping from old view name format to the new format.
 */
std::string componentNameByReactViewName(std::string viewName);

} // namespace facebook::react

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
 * Generates a random UUID version 4 string in the format
 * xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx (lowercase).
 */
std::string generateRandomUuidString();

} // namespace facebook::react

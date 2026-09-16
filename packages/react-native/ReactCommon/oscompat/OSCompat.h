/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/PrivateGuard.h>

#include <cstdint>

namespace facebook::react::oscompat {

uint64_t getCurrentProcessId();

uint64_t getCurrentThreadId();

} // namespace facebook::react::oscompat

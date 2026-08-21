/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// No header guards since it is legitimately possible to include this file more
// than once with and without REACT_NATIVE_DEBUG.

// react_native_expect is a non-fatal counterpart of react_native_assert.
// In debug builds, when an expectation fails, we log and move on.
// In release builds, react_native_expect is a noop.

// react_native_expect is appropriate for recoverable conditions that can be
// violated by user mistake (e.g. JS code passes an unexpected prop value).
// To enforce invariants that are internal to React Native, consider
// react_native_assert (or a stronger mechanism).
// Calling react_native_expect does NOT, by itself, guarantee that the user
// will see a helpful diagnostic (beyond a low level log). That concern is the
// caller's responsibility.

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>

#include "flags.h"

#undef react_native_expect

#ifndef REACT_NATIVE_DEBUG

#define react_native_expect(e) ((void)0)

#else // REACT_NATIVE_DEBUG

#include <glog/logging.h>
#include <cassert>

#define react_native_expect(cond)                           \
  if (!(cond)) {                                            \
    LOG(ERROR) << "react_native_expect failure: " << #cond; \
  }

#endif // REACT_NATIVE_DEBUG

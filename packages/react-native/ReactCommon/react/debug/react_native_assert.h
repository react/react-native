/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// No header guards since it is legitimately possible to include this file more
// than once with and without REACT_NATIVE_DEBUG.

// react_native_assert allows us to opt-in to specific asserts on Android and
// test before moving on. When all issues have been found, maybe we can use
// `UNDEBUG` flag to disable NDEBUG in debug builds on Android.

// Asserting is appropriate for conditions that:
//   1. May or may not be recoverable, and
//   2. imply there is a bug in React Native when violated.
// For recoverable conditions that can be violated by user mistake (e.g. JS
// code passes an unexpected prop value), consider react_native_expect instead.

#pragma once

#include "flags.h"

#undef react_native_assert

#ifndef REACT_NATIVE_DEBUG

#define react_native_assert(e) ((void)0)

#else // REACT_NATIVE_DEBUG

#ifdef __ANDROID__

#include <android/log.h>

#ifdef __cplusplus
extern "C" {
#endif // __cplusplus
void react_native_assert_fail(
    const char* func,
    const char* file,
    int line,
    const char* expr);
#ifdef __cplusplus
}
#endif // __cpusplus

#define react_native_assert(e) \
  ((e) ? (void)0 : react_native_assert_fail(__func__, __FILE__, __LINE__, #e))

#else // __ANDROID__

#include <glog/logging.h>
#include <cassert>

// For all platforms, but iOS+Xcode especially: flush logs because some might be
// lost on iOS if an assert is hit right after this. If you are trying to debug
// something actively and have added lots of LOG statements to track down an
// issue, there is race between flushing the final logs and stopping execution
// when the assert hits. Thus, if we know an assert will fail, we force flushing
// to happen right before the assert.
#define react_native_assert(cond)                           \
  if (!(cond)) {                                            \
    LOG(ERROR) << "react_native_assert failure: " << #cond; \
    google::FlushLogFiles(google::GLOG_INFO);               \
    assert(cond);                                           \
  }

#endif // platforms besides __ANDROID__

#endif // REACT_NATIVE_DEBUG

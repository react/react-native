/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>

//
// Preprocessor flags which control whether code meant for debugging the
// internals of React Native is included in the build. E.g. debug assertions.
//
// This flag is normally derived from NDEBUG, but may be set explicitly by
// defining `REACT_NATIVE_DEBUG` or `REACT_NATIVE_PRODUCTION`.
#if !(defined(REACT_NATIVE_DEBUG) || defined(REACT_NATIVE_PRODUCTION))
#ifdef NDEBUG
#define REACT_NATIVE_PRODUCTION
#else
#define REACT_NATIVE_DEBUG
#endif
#endif

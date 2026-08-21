/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

// =============================================================================
// Umbrella header for the `react/debug` module - public entry point.
//
//   #include <React/Debug.h>
//
// Re-exports the module's public interface headers. React Native's own code
// should keep using the fine-grained `<react/debug/...>` includes; only outside
// consumers use this umbrella.
//
// The `redbox/` headers are deliberately absent: they are implementation
// details of the dev-menu red box and carry no stability guarantee.
// =============================================================================

// Marks that the following headers are pulled in through the umbrella, so their
// shared guard (<react/cxxstableapi/UmbrellaGuard.h>) accepts them.
#define RN_UMBRELLA_CONTEXT

#include <react/debug/flags.h>
#include <react/debug/react_native_assert.h>
#include <react/debug/react_native_expect.h>

#undef RN_UMBRELLA_CONTEXT

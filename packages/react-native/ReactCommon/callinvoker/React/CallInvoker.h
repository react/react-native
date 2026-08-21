/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

// =============================================================================
// Umbrella header for the `callinvoker` module - public entry point.
//
//   #include <React/CallInvoker.h>
//
// Re-exports the module's public interface headers. React Native's own code
// should keep using the fine-grained `<ReactCommon/...>` includes; only outside
// consumers use this umbrella.
// =============================================================================

// Marks that the following headers are pulled in through the umbrella, so their
// shared guard (<react/cxxstableapi/UmbrellaGuard.h>) accepts them.
#define RN_UMBRELLA_CONTEXT

#include <ReactCommon/CallInvoker.h>
#include <ReactCommon/SchedulerPriority.h>

#undef RN_UMBRELLA_CONTEXT

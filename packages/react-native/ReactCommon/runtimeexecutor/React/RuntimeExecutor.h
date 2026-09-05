/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

// =============================================================================
// Umbrella header for the `runtimeexecutor` module - public entry point.
//
//   #include <React/RuntimeExecutor.h>
//
// Re-exports the module's public interface headers. React Native's own code
// should keep using the fine-grained `<ReactCommon/...>` includes; only outside
// consumers use this umbrella.
// =============================================================================

// Marks that the following headers are pulled in through the umbrella, so their
// shared guard (<react/cxxstableapi/UmbrellaGuard.h>) accepts them. The marker
// is saved and restored rather than defined and undefined: the scope ends at
// this block, so later *direct* includes in the same TU are still caught, and
// it nests inside an enclosing umbrella rather than disarming it.
#pragma push_macro("RN_UMBRELLA_CONTEXT")
#undef RN_UMBRELLA_CONTEXT
#define RN_UMBRELLA_CONTEXT 1

#include <ReactCommon/RuntimeExecutor.h>
#include <ReactCommon/RuntimeExecutorSyncUIThreadUtils.h>

#undef RN_UMBRELLA_CONTEXT
#pragma pop_macro("RN_UMBRELLA_CONTEXT")

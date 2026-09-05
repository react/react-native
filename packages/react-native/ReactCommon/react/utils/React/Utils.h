/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

// =============================================================================
// Umbrella header for the `react/utils` module - public entry point.
//
//   #include <React/Utils.h>
//
// Re-exports the module's public interface headers. React Native's own code
// should keep using the fine-grained `<react/utils/...>` includes; only outside
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

#include <react/utils/Base64.h>
#include <react/utils/ContextContainer.h>
#include <react/utils/FloatComparison.h>
#include <react/utils/LowPriorityExecutor.h>
#include <react/utils/ManagedObjectWrapper.h>
#include <react/utils/MoveWrapper.h>
#include <react/utils/OnScopeExit.h>
#include <react/utils/PackTraits.h>
#include <react/utils/RunLoopObserver.h>
#include <react/utils/SharedFunction.h>
#include <react/utils/SimpleThreadSafeCache.h>
#include <react/utils/Telemetry.h>
#include <react/utils/TemplateStringLiteral.h>
#include <react/utils/Uuid.h>
#include <react/utils/fnv1a.h>
#include <react/utils/hash_combine.h>
#include <react/utils/iequals.h>
#include <react/utils/jsi-utils.h>
#include <react/utils/toLower.h>
#include <react/utils/to_underlying.h>

#undef RN_UMBRELLA_CONTEXT
#pragma pop_macro("RN_UMBRELLA_CONTEXT")

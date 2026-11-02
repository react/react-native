/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

// =============================================================================
// Umbrella header for the `rawValue` module - public entry point.
//
//   #include <React/RawValue.h>
//
// `rawValue` is the slice of `react/renderer/core` that `react/renderer/graphics`
// depends on. It is built as its own target so the two modules do not form a
// dependency cycle; <React/RendererCore.h> re-exports it, so consumers that want
// the whole renderer core still only need that one umbrella.
//
// Re-exports the module's public interface headers. React Native's own code
// should keep using the fine-grained `<react/renderer/core/...>` includes,
// except in headers it exports to consumers: those are preprocessed in the
// consumer's translation unit, where the fine-grained include hits this
// module's <react/cxxstableapi/UmbrellaGuard.h>. `RN_ALLOW_FRAMEWORKS` does not
// suppress that guard, so a "for frameworks" header must reach this module
// through the umbrella.
// =============================================================================

// Marks that the following headers are pulled in through the umbrella, so their
// shared guard (<react/cxxstableapi/UmbrellaGuard.h>) accepts them. The marker
// is saved and restored rather than defined and undefined: the scope ends at
// this block, so a later *direct* include of a guarded header the umbrella did
// not already pull in is still caught, and it nests inside an enclosing
// umbrella rather than disarming it. The headers below are `#pragma once`, so
// re-including one of them directly is a silent no-op, not a guard hit.
#pragma push_macro("RN_UMBRELLA_CONTEXT")
#undef RN_UMBRELLA_CONTEXT
#define RN_UMBRELLA_CONTEXT 1

#include <react/renderer/core/RawPropsPrimitives.h>
#include <react/renderer/core/RawValue.h>

#undef RN_UMBRELLA_CONTEXT
#pragma pop_macro("RN_UMBRELLA_CONTEXT")

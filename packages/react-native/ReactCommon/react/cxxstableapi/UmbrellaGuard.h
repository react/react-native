/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// =============================================================================
// Shared "public API" guard for React Native's C++ stable API.
//
// Include this header at the top of every *public* module header (right after
// `#pragma once`):
//
//   #include <react/cxxstableapi/UmbrellaGuard.h>
//
// The guard turns a *direct* include of a public module header into a hard
// error, steering consumers to the module's umbrella header instead:
//
//   #include <React/<Module>.h>   // do this
//
// -----------------------------------------------------------------------------
// Macro contract (all `RN_*` macros are shared across modules)
//
//   RN_STRICT_API        Consumer opt-in master switch. Every guard in this
//                        directory is INERT unless the consuming build defines
//                        this macro. Shipping the guards therefore changes
//                        nothing for existing consumers — they only activate
//                        when a consumer opts into the strict public API by
//                        defining RN_STRICT_API.
//
//   RN_UMBRELLA_CONTEXT  Internal marker (implementation detail; consumers never
//                        set it). A module umbrella brackets its own `#include`s
//                        with it to signal the blessed inclusion path:
//                            #pragma push_macro("RN_UMBRELLA_CONTEXT")
//                            #undef RN_UMBRELLA_CONTEXT
//                            #define RN_UMBRELLA_CONTEXT 1
//                            #include <react/.../PublicHeaderA.h>
//                            #include <react/.../PublicHeaderB.h>
//                            #undef RN_UMBRELLA_CONTEXT
//                            #pragma pop_macro("RN_UMBRELLA_CONTEXT")
//                        Saving and restoring, rather than a bare
//                        `#define`/`#undef` pair, is what makes the scope both
//                        end at the umbrella -- later *direct* includes in the
//                        same translation unit are still caught -- and nest: an
//                        umbrella reached from inside another umbrella's
//                        context leaves the outer one armed. A bare `#undef`
//                        would disarm it, and every public header the outer
//                        umbrella included afterwards would hard-error.
//                        `scripts/add-cxxstableapi-guard.js --tier=public`
//                        emits this block; do not hand-write or "simplify" it.
//
//   RN_BUILDING          Defined by React Native's own build targets so internal
//                        sources may keep including the fine-grained headers
//                        directly.
//
// This header is intentionally NOT `#pragma once`-guarded: it must be
// re-evaluated on every inclusion so each direct include is checked.
// =============================================================================

#if defined(RN_STRICT_API) && !defined(RN_UMBRELLA_CONTEXT) && !defined(RN_BUILDING)
#error \
    "Do not include this React Native header directly. Include the module's umbrella header <React/<Module>.h> instead."
#endif

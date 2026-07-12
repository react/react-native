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
//                        set it). A module umbrella defines it around its own
//                        `#include`s to signal the blessed inclusion path:
//                            #define RN_UMBRELLA_CONTEXT
//                            #include <react/.../PublicHeaderA.h>
//                            #include <react/.../PublicHeaderB.h>
//                            #undef RN_UMBRELLA_CONTEXT
//                        The `#undef` matters: it keeps the marker scoped to the
//                        umbrella's includes so later *direct* includes in the
//                        same translation unit are still caught.
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

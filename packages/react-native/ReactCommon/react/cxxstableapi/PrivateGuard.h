/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// =============================================================================
// Shared "private" guard for React Native's C++ stable API.
//
// Include this header at the top of every *private* module header (right after
// `#pragma once`):
//
//   #include <react/cxxstableapi/PrivateGuard.h>
//
// Private headers are implementation details with no stability guarantee.
// Including one from outside React Native's own build is a hard error under
// enforcement; there is no consumer-facing escape hatch (unlike the
// for-frameworks guard) — only React Native's own sources, which define
// `RN_BUILDING`, may include these headers.
//
// See <react/cxxstableapi/UmbrellaGuard.h> for the full `RN_*` macro contract.
// In short:
//   RN_STRICT_API  Consumer opt-in master switch; the guard is inert without it.
//   RN_BUILDING    Set by React Native's own build.
//
// This header is intentionally NOT `#pragma once`-guarded: it must be
// re-evaluated on every inclusion so each direct include is checked.
// =============================================================================

#if defined(RN_STRICT_API) && !defined(RN_BUILDING)
#error \
    "This is a private React Native header and is not part of the public API. Do not include it directly; it has no stability guarantee."
#endif

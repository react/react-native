/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// =============================================================================
// Shared "for frameworks" guard for React Native's C++ stable API.
//
// Include this header at the top of every *for-frameworks* module header:
//
//   #include <react/cxxstableapi/FrameworksGuard.h>
//
// "For frameworks" headers are APIs intended for framework authors integrating
// React Native, not for ordinary app code. Including one directly emits a
// SUPPRESSIBLE warning under enforcement. A framework author acknowledges the
// usage by defining `RN_ALLOW_FRAMEWORKS`, which silences the warning.
//
// See <react/cxxstableapi/UmbrellaGuard.h> for the full `RN_*` macro contract.
// In short:
//   RN_STRICT_API        Consumer opt-in master switch; the guard is inert
//                        without it.
//   RN_ALLOW_FRAMEWORKS  Consumer opt-out acknowledging framework-tier usage.
//   RN_UMBRELLA_CONTEXT  Internal marker set by an umbrella around its includes.
//   RN_BUILDING          Set by React Native's own build.
//
// This header is intentionally NOT `#pragma once`-guarded: it must be
// re-evaluated on every inclusion so each direct include is checked.
// =============================================================================

#if defined(RN_STRICT_API) && !defined(RN_ALLOW_FRAMEWORKS) && !defined(RN_UMBRELLA_CONTEXT) && !defined(RN_BUILDING)
#warning \
    "This is a 'for frameworks' React Native API, intended for framework authors rather than app code. Include it via the module umbrella <React/<Module>.h>, or define RN_ALLOW_FRAMEWORKS to acknowledge framework-tier usage and silence this warning."
#endif

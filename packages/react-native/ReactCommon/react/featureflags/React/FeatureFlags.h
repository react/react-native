/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

// =============================================================================
// Umbrella header for the `react/featureflags` module - public entry point.
//
//   #include <React/FeatureFlags.h>
//
// Re-exports the module's public interface headers. React Native's own code
// should keep using the fine-grained `<react/featureflags/...>` includes,
// except in headers it exports to consumers: those are preprocessed in the
// consumer's translation unit, where the fine-grained include hits this
// module's <react/cxxstableapi/UmbrellaGuard.h>. `RN_ALLOW_FRAMEWORKS` does not
// suppress that guard, so a "for frameworks" header must reach this module
// through the umbrella.
//
// The headers below are generated from
// `scripts/featureflags/ReactNativeFeatureFlags.config.js`, but this file is
// not - keep it in sync by hand when the set of generated headers in
// `scripts/featureflags/generateCommonCxxModules.js` changes.
// =============================================================================

// Marks that the following headers are pulled in through the umbrella, so their
// shared guard (<react/cxxstableapi/UmbrellaGuard.h>) accepts them. The marker
// is saved and restored rather than defined and undefined: the scope ends at
// this block, so later *direct* includes in the same TU are still caught, and
// it nests inside an enclosing umbrella rather than disarming it.
#pragma push_macro("RN_UMBRELLA_CONTEXT")
#undef RN_UMBRELLA_CONTEXT
#define RN_UMBRELLA_CONTEXT 1

#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/featureflags/ReactNativeFeatureFlagsAccessor.h>
#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>
#include <react/featureflags/ReactNativeFeatureFlagsDynamicProvider.h>
#include <react/featureflags/ReactNativeFeatureFlagsOverridesOSSCanary.h>
#include <react/featureflags/ReactNativeFeatureFlagsOverridesOSSExperimental.h>
#include <react/featureflags/ReactNativeFeatureFlagsOverridesOSSStable.h>
#include <react/featureflags/ReactNativeFeatureFlagsProvider.h>

#undef RN_UMBRELLA_CONTEXT
#pragma pop_macro("RN_UMBRELLA_CONTEXT")

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

// =============================================================================
// Umbrella header for the `react/renderer/components/scrollview` module -
// public entry point.
//
//   #include <React/ScrollView.h>
//
// Re-exports the module's public interface headers. React Native's own code
// should keep using the fine-grained
// `<react/renderer/components/scrollview/...>` includes; only outside
// consumers use this umbrella.
// =============================================================================

// Marks that the following headers are pulled in through the umbrella, so their
// shared guard (<react/cxxstableapi/UmbrellaGuard.h>) accepts them.
#define RN_UMBRELLA_CONTEXT

#include <react/renderer/components/scrollview/BaseScrollViewProps.h>
#include <react/renderer/components/scrollview/HostPlatformScrollViewProps.h>
#include <react/renderer/components/scrollview/ScrollEvent.h>
#include <react/renderer/components/scrollview/ScrollViewComponentDescriptor.h>
#include <react/renderer/components/scrollview/ScrollViewEventEmitter.h>
#include <react/renderer/components/scrollview/ScrollViewProps.h>
#include <react/renderer/components/scrollview/ScrollViewShadowNode.h>
#include <react/renderer/components/scrollview/ScrollViewState.h>
#include <react/renderer/components/scrollview/conversions.h>
#include <react/renderer/components/scrollview/primitives.h>

#ifdef ANDROID
#include <react/renderer/components/scrollview/AndroidHorizontalScrollContentViewComponentDescriptor.h>
#include <react/renderer/components/scrollview/AndroidHorizontalScrollContentViewShadowNode.h>
#endif

#undef RN_UMBRELLA_CONTEXT

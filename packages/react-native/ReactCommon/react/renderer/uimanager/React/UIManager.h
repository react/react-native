/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

// =============================================================================
// Umbrella header for the `react/renderer/uimanager` module - public entry
// point.
//
//   #include <React/UIManager.h>
//
// Re-exports the module's public interface headers. React Native's own code
// should keep using the fine-grained `<react/renderer/uimanager/...>` includes;
// only outside consumers use this umbrella.
// =============================================================================

// Marks that the following headers are pulled in through the umbrella, so their
// shared guard (<react/cxxstableapi/UmbrellaGuard.h>) accepts them.
#define RN_UMBRELLA_CONTEXT

#include <react/renderer/uimanager/AppRegistryBinding.h>
#include <react/renderer/uimanager/LayoutAnimationStatusDelegate.h>
#include <react/renderer/uimanager/LayoutEventEmitter.h>
#include <react/renderer/uimanager/PointerEventsProcessor.h>
#include <react/renderer/uimanager/PointerHoverTracker.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerAnimationBackend.h>
#include <react/renderer/uimanager/UIManagerAnimationDelegate.h>
#include <react/renderer/uimanager/UIManagerBinding.h>
#include <react/renderer/uimanager/UIManagerCommitHook.h>
#include <react/renderer/uimanager/UIManagerDelegate.h>
#include <react/renderer/uimanager/UIManagerMountHook.h>
#include <react/renderer/uimanager/UIManagerNativeAnimatedDelegate.h>
#include <react/renderer/uimanager/UIManagerViewTransitionDelegate.h>
#include <react/renderer/uimanager/primitives.h>

#undef RN_UMBRELLA_CONTEXT

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

// =============================================================================
// Umbrella header for the `react/renderer/components/view` module - public
// entry point.
//
//   #include <React/View.h>
//
// Re-exports the module's public interface headers. React Native's own code
// should keep using the fine-grained `<react/renderer/components/view/...>`
// includes; only outside consumers use this umbrella.
// =============================================================================

// Marks that the following headers are pulled in through the umbrella, so their
// shared guard (<react/cxxstableapi/UmbrellaGuard.h>) accepts them. Scoped to
// this block so later *direct* includes in the same TU are still caught.
#define RN_UMBRELLA_CONTEXT

#if defined(__APPLE__)
#include <TargetConditionals.h>
#endif

#include <react/renderer/components/view/AccessibilityPrimitives.h>
#include <react/renderer/components/view/AccessibilityProps.h>
#include <react/renderer/components/view/BackgroundImagePropsConversions.h>
#include <react/renderer/components/view/BaseTouch.h>
#include <react/renderer/components/view/BaseViewEventEmitter.h>
#include <react/renderer/components/view/BaseViewProps.h>
#include <react/renderer/components/view/BoxShadowPropsConversions.h>
#include <react/renderer/components/view/CSSConversions.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/components/view/FilterPropsConversions.h>
#include <react/renderer/components/view/HostPlatformTouch.h>
#include <react/renderer/components/view/HostPlatformViewEventEmitter.h>
#include <react/renderer/components/view/HostPlatformViewProps.h>
#include <react/renderer/components/view/HostPlatformViewTraitsInitializer.h>
#include <react/renderer/components/view/LayoutConformanceComponentDescriptor.h>
#include <react/renderer/components/view/LayoutConformanceProps.h>
#include <react/renderer/components/view/LayoutConformanceShadowNode.h>
#include <react/renderer/components/view/PointerEvent.h>
#include <react/renderer/components/view/Touch.h>
#include <react/renderer/components/view/TouchEvent.h>
#include <react/renderer/components/view/TouchEventEmitter.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/components/view/ViewEventEmitter.h>
#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/components/view/ViewPropsInterpolation.h>
#include <react/renderer/components/view/ViewShadowNode.h>
#include <react/renderer/components/view/YogaLayoutableShadowNode.h>
#include <react/renderer/components/view/YogaStylableProps.h>
#include <react/renderer/components/view/accessibilityPropsConversions.h>
#include <react/renderer/components/view/conversions.h>
#include <react/renderer/components/view/primitives.h>
#include <react/renderer/components/view/propsConversions.h>

#ifdef ANDROID
#include <react/renderer/components/view/NativeDrawable.h>
#endif

#if defined(TARGET_OS_OSX) && TARGET_OS_OSX
#include <react/renderer/components/view/HostPlatformViewEvents.h>
#include <react/renderer/components/view/KeyEvent.h>
#include <react/renderer/components/view/MouseEvent.h>
#endif

#ifdef USE_WINUI_FABRIC
#include <react/renderer/components/view/KeyEvent.h>
#include <react/renderer/components/view/WindowsViewEvents.h>
#endif

#undef RN_UMBRELLA_CONTEXT

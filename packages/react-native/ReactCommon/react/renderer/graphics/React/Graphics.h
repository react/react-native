/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

// =============================================================================
// Umbrella header for the `react/renderer/graphics` module - public entry
// point.
//
//   #include <React/Graphics.h>
//
// Re-exports the module's public interface headers. React Native's own code
// should keep using the fine-grained `<react/renderer/graphics/...>` includes;
// only outside consumers use this umbrella.
// =============================================================================

// Marks that the following headers are pulled in through the umbrella, so their
// shared guard (<react/cxxstableapi/UmbrellaGuard.h>) accepts them. The marker
// is saved and restored rather than defined and undefined: the scope ends at
// this block, so later *direct* includes in the same TU are still caught, and
// it nests inside an enclosing umbrella rather than disarming it.
#pragma push_macro("RN_UMBRELLA_CONTEXT")
#undef RN_UMBRELLA_CONTEXT
#define RN_UMBRELLA_CONTEXT 1

#include <react/renderer/graphics/BackgroundImage.h>
#include <react/renderer/graphics/BackgroundPosition.h>
#include <react/renderer/graphics/BackgroundRepeat.h>
#include <react/renderer/graphics/BackgroundSize.h>
#include <react/renderer/graphics/BlendMode.h>
#include <react/renderer/graphics/BoxShadow.h>
#include <react/renderer/graphics/Color.h>
#include <react/renderer/graphics/ColorComponents.h>
#include <react/renderer/graphics/ColorStop.h>
#include <react/renderer/graphics/Filter.h>
#include <react/renderer/graphics/Float.h>
#include <react/renderer/graphics/HostPlatformColor.h>
#include <react/renderer/graphics/Isolation.h>
#include <react/renderer/graphics/LinearGradient.h>
#include <react/renderer/graphics/PlatformColorParser.h>
#include <react/renderer/graphics/Point.h>
#include <react/renderer/graphics/RadialGradient.h>
#include <react/renderer/graphics/Rect.h>
#include <react/renderer/graphics/RectangleCorners.h>
#include <react/renderer/graphics/RectangleEdges.h>
#include <react/renderer/graphics/Size.h>
#include <react/renderer/graphics/Transform.h>
#include <react/renderer/graphics/TransformUtils.h>
#include <react/renderer/graphics/ValueUnit.h>
#include <react/renderer/graphics/Vector.h>
#include <react/renderer/graphics/fromRawValueShared.h>
#include <react/renderer/graphics/rounding.h>

#ifdef ANDROID
#include <react/renderer/graphics/configurePlatformColorCacheInvalidationHook.h>
#endif

#if defined(__APPLE__) && defined(__OBJC__)
#include <react/renderer/graphics/RCTPlatformColorUtils.h>
#endif

#undef RN_UMBRELLA_CONTEXT
#pragma pop_macro("RN_UMBRELLA_CONTEXT")

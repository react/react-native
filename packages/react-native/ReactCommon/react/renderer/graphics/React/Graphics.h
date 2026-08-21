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
// shared guard (<react/cxxstableapi/UmbrellaGuard.h>) accepts them.
#define RN_UMBRELLA_CONTEXT

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

#undef RN_UMBRELLA_CONTEXT

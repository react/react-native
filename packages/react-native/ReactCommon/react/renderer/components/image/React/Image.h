/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

// =============================================================================
// Umbrella header for the `react/renderer/components/image` module - public entry point.
//
//   #include <React/Image.h>
//
// Re-exports the module's public interface headers. React Native's own code
// should keep using the fine-grained `<react/renderer/components/image/...>` includes; only outside
// consumers use this umbrella.
// =============================================================================

// Marks that the following headers are pulled in through the umbrella, so their
// shared guard (<react/cxxstableapi/UmbrellaGuard.h>) accepts them.
#define RN_UMBRELLA_CONTEXT

#include <react/renderer/components/image/ImageComponentDescriptor.h>
#include <react/renderer/components/image/ImageEventEmitter.h>
#include <react/renderer/components/image/ImageProps.h>
#include <react/renderer/components/image/ImageShadowNode.h>
#include <react/renderer/components/image/ImageState.h>
#include <react/renderer/components/image/conversions.h>

#undef RN_UMBRELLA_CONTEXT

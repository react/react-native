/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

// =============================================================================
// Umbrella header for the `react/renderer/components/root` module - public
// entry point.
//
//   #include <React/Root.h>
//
// Re-exports the module's public interface headers. React Native's own code
// should keep using the fine-grained `<react/renderer/components/root/...>`
// includes; only outside consumers use this umbrella.
// =============================================================================

// Marks that the following headers are pulled in through the umbrella, so their
// shared guard (<react/cxxstableapi/UmbrellaGuard.h>) accepts them.
#define RN_UMBRELLA_CONTEXT

#include <react/renderer/components/root/RootComponentDescriptor.h>
#include <react/renderer/components/root/RootProps.h>
#include <react/renderer/components/root/RootShadowNode.h>

#undef RN_UMBRELLA_CONTEXT

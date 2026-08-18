/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

// =============================================================================
// Umbrella header for the `react/renderer/components/text` module - public
// entry point.
//
//   #include <React/Text.h>
//
// Re-exports the module's public interface headers. React Native's own code
// should keep using the fine-grained `<react/renderer/components/text/...>`
// includes; only outside consumers use this umbrella.
// =============================================================================

// Marks that the following headers are pulled in through the umbrella, so their
// shared guard (<react/cxxstableapi/UmbrellaGuard.h>) accepts them.
#define RN_UMBRELLA_CONTEXT

#include <react/renderer/components/text/BaseParagraphComponentDescriptor.h>
#include <react/renderer/components/text/BaseParagraphProps.h>
#include <react/renderer/components/text/BaseTextProps.h>
#include <react/renderer/components/text/BaseTextShadowNode.h>
#include <react/renderer/components/text/HostPlatformParagraphProps.h>
#include <react/renderer/components/text/ParagraphComponentDescriptor.h>
#include <react/renderer/components/text/ParagraphEventEmitter.h>
#include <react/renderer/components/text/ParagraphProps.h>
#include <react/renderer/components/text/ParagraphShadowNode.h>
#include <react/renderer/components/text/ParagraphState.h>
#include <react/renderer/components/text/RawTextComponentDescriptor.h>
#include <react/renderer/components/text/RawTextProps.h>
#include <react/renderer/components/text/RawTextShadowNode.h>
#include <react/renderer/components/text/SelectableParagraphComponentDescriptor.h>
#include <react/renderer/components/text/SelectableParagraphShadowNode.h>
#include <react/renderer/components/text/TextComponentDescriptor.h>
#include <react/renderer/components/text/TextEffectComponentDescriptor.h>
#include <react/renderer/components/text/TextEffectProps.h>
#include <react/renderer/components/text/TextEffectShadowNode.h>
#include <react/renderer/components/text/TextProps.h>
#include <react/renderer/components/text/TextShadowNode.h>
#include <react/renderer/components/text/stateConversions.h>

#ifdef ANDROID
#include <react/renderer/components/text/conversions.h>
#include <react/renderer/components/text/primitives.h>
#endif

#undef RN_UMBRELLA_CONTEXT

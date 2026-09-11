/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

// =============================================================================
// Umbrella header for the `react/renderer/core` module - public entry point.
//
//   #include <React/RendererCore.h>
//
// Re-exports the module's public interface headers. React Native's own code
// should keep using the fine-grained `<react/renderer/core/...>` includes; only
// outside consumers use this umbrella.
// =============================================================================

// Marks that the following headers are pulled in through the umbrella, so their
// shared guard (<react/cxxstableapi/UmbrellaGuard.h>) accepts them. The marker
// is saved and restored rather than defined and undefined: the scope ends at
// this block, so later *direct* includes in the same TU are still caught, and
// it nests inside an enclosing umbrella rather than disarming it.
#pragma push_macro("RN_UMBRELLA_CONTEXT")
#undef RN_UMBRELLA_CONTEXT
#define RN_UMBRELLA_CONTEXT 1

#include <react/renderer/core/ComponentDescriptor.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/core/ConcreteShadowNode.h>
#include <react/renderer/core/ConcreteState.h>
#include <react/renderer/core/DynamicEventPayload.h>
#include <react/renderer/core/DynamicPointerEvent.h>
#include <react/renderer/core/DynamicPropsUtilities.h>
#include <react/renderer/core/EventBeat.h>
#include <react/renderer/core/EventDispatcher.h>
#include <react/renderer/core/EventEmitter.h>
#include <react/renderer/core/EventListener.h>
#include <react/renderer/core/EventLogger.h>
#include <react/renderer/core/EventPayload.h>
#include <react/renderer/core/EventPayloadType.h>
#include <react/renderer/core/EventPipe.h>
#include <react/renderer/core/EventQueue.h>
#include <react/renderer/core/EventQueueProcessor.h>
#include <react/renderer/core/EventTarget.h>
#include <react/renderer/core/InstanceHandle.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/core/LayoutMetrics.h>
#include <react/renderer/core/LayoutPrimitives.h>
#include <react/renderer/core/LayoutableShadowNode.h>
#include <react/renderer/core/Props.h>
#include <react/renderer/core/PropsMacros.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawEvent.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/core/RawPropsKeyMap.h>
#include <react/renderer/core/RawPropsParser.h>
#include <react/renderer/core/RawPropsPrimitives.h>
#include <react/renderer/core/RawValue.h>
#include <react/renderer/core/ReactEventPriority.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/core/ReactRootViewTagGenerator.h>
#include <react/renderer/core/Sealable.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/core/ShadowNodeFamily.h>
#include <react/renderer/core/ShadowNodeFragment.h>
#include <react/renderer/core/ShadowNodeTraits.h>
#include <react/renderer/core/State.h>
#include <react/renderer/core/StateData.h>
#include <react/renderer/core/StatePipe.h>
#include <react/renderer/core/StateUpdate.h>
#include <react/renderer/core/ValueFactory.h>
#include <react/renderer/core/ValueFactoryEventPayload.h>
#include <react/renderer/core/conversions.h>
#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/core/propsConversions.h>

#undef RN_UMBRELLA_CONTEXT
#pragma pop_macro("RN_UMBRELLA_CONTEXT")

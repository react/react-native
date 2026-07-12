/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type EventTarget from '../../webapis/dom/events/EventTarget';

import {
  customBubblingEventTypes,
  customDirectEventTypes,
} from '../../../../Libraries/Renderer/shims/ReactNativeViewConfigRegistry';
import * as ReactNativeFeatureFlags from '../../featureflags/ReactNativeFeatureFlags';
import {
  setBubbledPropName,
  setCapturedPropName,
  setEventInitTimeStamp,
} from '../../webapis/dom/events/internals/EventInternals';
import {dispatchTrustedEvent} from '../../webapis/dom/events/internals/EventTargetInternals';
import LegacySyntheticEvent from './LegacySyntheticEvent';
import {topLevelTypeToEventType} from './ReactNativeEventTypeMapping';
import {
  processResponderEvent,
  rethrowCaughtError,
} from './ReactNativeResponder';

/**
 * Dispatches a native event through the EventTarget-based dispatch system.
 * This handles:
 * 1. Responder negotiation (touch handling, grant/release lifecycle)
 * 2. Normal event dispatch via dispatchTrustedEvent (capture/bubble phases)
 *
 * Called from the React renderer's dispatchEvent when
 * enableNativeEventTargetEventDispatching is enabled.
 */
export default function dispatchNativeEvent(
  target: EventTarget,
  type: string,
  payload: {[string]: unknown},
): void {
  // Process responder events before normal event dispatch.
  processResponderEvent(type, target, payload);

  try {
    // Normal EventTarget dispatch
    const bubbleConfig = customBubblingEventTypes[type];
    const directConfig = customDirectEventTypes[type];

    // Skip events that are not registered in the view config
    if (bubbleConfig != null || directConfig != null) {
      // Honor `skipBubbling` declared in the view config: when set, the bubble
      // phase only fires on the target itself (matching the legacy renderer's
      // behavior). The synthesized event reports `bubbles: false`, which causes
      // the EventTarget bubble loop to short-circuit after dispatching to the
      // target. Capture-phase listeners are unaffected.
      const bubbles =
        bubbleConfig != null &&
        bubbleConfig.phasedRegistrationNames.skipBubbling !== true;

      // A "direct" event is one registered only in the direct-event config
      // (e.g. `onLayout`): it neither bubbles nor captures. When the feature
      // flag is enabled, tag it so the EventTarget dispatch takes the fast
      // target-only path. Note that bubbling events with `skipBubbling` (e.g.
      // `onPointerEnter`) still have a capture phase and are NOT direct.
      const isDirect = bubbleConfig == null && directConfig != null;
      const rnIsDirect =
        isDirect && ReactNativeFeatureFlags.enableDirectEventsInEventTarget();

      const eventType = topLevelTypeToEventType(type);
      const options: {
        bubbles: boolean,
        cancelable: boolean,
        rnIsDirect?: boolean,
      } = {
        bubbles,
        cancelable: true,
        rnIsDirect,
      };

      // Preserve the native event timestamp for backwards compatibility.
      const nativeTimestamp = payload.timeStamp ?? payload.timestamp;
      if (typeof nativeTimestamp === 'number') {
        setEventInitTimeStamp(options, nativeTimestamp);
      }

      const syntheticEvent = new LegacySyntheticEvent(
        eventType,
        options,
        payload,
        bubbleConfig ?? directConfig,
      );

      // Pre-resolve the React prop names ("onFoo" / "onFooCapture") once per
      // dispatch and stash them on the event so per-ancestor
      // `EVENT_TARGET_GET_DECLARATIVE_LISTENER_KEY` lookups can read them
      // directly, avoiding the per-call `getEventTypePropName` hash lookup.
      if (bubbleConfig != null) {
        const phasedRegistrationNames = bubbleConfig.phasedRegistrationNames;
        setBubbledPropName(
          syntheticEvent,
          phasedRegistrationNames.bubbled ?? null,
        );
        setCapturedPropName(
          syntheticEvent,
          phasedRegistrationNames.captured ?? null,
        );
      } else if (directConfig != null) {
        setBubbledPropName(
          syntheticEvent,
          directConfig.registrationName ?? null,
        );
        setCapturedPropName(syntheticEvent, null);
      }

      // Pass `rethrowListenerErrors: true` so the first listener error is
      // rethrown synchronously (matching the legacy plugin path) rather than
      // deferred to a new task, keeping it catchable by React error boundaries
      // and the native event call.
      dispatchTrustedEvent(target, syntheticEvent, true);
    }
  } finally {
    // Rethrow the first error caught during responder lifecycle dispatch,
    // after all dispatching is complete. This matches the old system's
    // runEventsInBatch → rethrowCaughtError pattern. Running it in a `finally`
    // ensures a pending responder error is never left to leak into a later
    // dispatch even if the normal dispatch above threw synchronously.
    rethrowCaughtError();
  }
}

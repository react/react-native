/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

/**
 * Maps between React Native event naming conventions:
 *
 * - topLevelType: "topPointerUp" (native event pipeline from C++)
 * - eventType: "pointerup" (EventTarget / addEventListener)
 * - propName: "onPointerUp" / "onPointerUpCapture" (React props)
 *
 * Also provides a reverse mapping from EventTarget event types to React prop
 * names, built lazily from the view config registry.
 */

import {
  customBubblingEventTypes,
  customDirectEventTypes,
} from '../../../../Libraries/Renderer/shims/ReactNativeViewConfigRegistry';

type EventPropNames = {
  bubbled: string | null,
  captured: string | null,
};

// Cache of already-resolved event types.
const eventTypeToProps: {[string]: EventPropNames} = {};

/**
 * Converts a topLevelType (e.g., "topPointerUp") to a DOM event type
 * (e.g., "pointerup"). Strips the "top" prefix and lowercases the result.
 */
export function topLevelTypeToEventType(topLevelType: string): string {
  const fourthChar = topLevelType.charCodeAt(3);
  if (
    topLevelType.startsWith('top') &&
    fourthChar >= 65 /* A */ &&
    fourthChar <= 90 /* Z */
  ) {
    return topLevelType.slice(3).toLowerCase();
  }
  return topLevelType;
}

function findEventPropNames(eventType: string): EventPropNames | null {
  for (const topLevelType in customBubblingEventTypes) {
    if (topLevelTypeToEventType(topLevelType) === eventType) {
      const config = customBubblingEventTypes[topLevelType];
      const phasedRegistrationNames = config.phasedRegistrationNames;
      if (phasedRegistrationNames != null) {
        return {
          bubbled: phasedRegistrationNames.bubbled ?? null,
          captured: phasedRegistrationNames.captured ?? null,
        };
      }
    }
  }

  for (const topLevelType in customDirectEventTypes) {
    if (topLevelTypeToEventType(topLevelType) === eventType) {
      const config = customDirectEventTypes[topLevelType];
      if (config.registrationName != null) {
        return {
          bubbled: config.registrationName,
          captured: null,
        };
      }
    }
  }

  return null;
}

/**
 * Returns the React prop name for a given EventTarget event type and phase.
 *
 * For example:
 *   getEventTypePropName("pointerup", false) → "onPointerUp"
 *   getEventTypePropName("pointerup", true) → "onPointerUpCapture"
 *   getEventTypePropName("layout", false) → "onLayout" (direct event)
 *   getEventTypePropName("layout", true) → null (direct events have no capture)
 */
export function getEventTypePropName(
  eventType: string,
  isCapture: boolean,
): string | null {
  const cached = eventTypeToProps[eventType];
  if (cached !== undefined) {
    return isCapture ? cached.captured : cached.bubbled;
  }
  const entry = findEventPropNames(eventType);
  if (entry != null) {
    eventTypeToProps[eventType] = entry;
    return isCapture ? entry.captured : entry.bubbled;
  }
  return null;
}

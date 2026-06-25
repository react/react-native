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
import type {ReadOnlyNodeWithEventTarget} from '../../webapis/dom/nodes/ReadOnlyNode';
import type {DispatchConfig} from './LegacySyntheticEvent';
import type {TouchEvent} from './ResponderTouchHistoryStore';

import {getFabricUIManager} from '../../../../Libraries/ReactNative/FabricUIManager';
import {
  setCurrentTarget,
  setTarget,
} from '../../webapis/dom/events/internals/EventInternals';
import {getEventTargetParent} from '../../webapis/dom/events/internals/EventTargetInternals';
import {
  getCurrentProps,
  getNativeElementReference,
} from '../../webapis/dom/nodes/internals/NodeInternals';
import ReadOnlyElement from '../../webapis/dom/nodes/ReadOnlyElement';
import ResponderEvent from './ResponderEvent';
import ResponderTouchHistoryStore from './ResponderTouchHistoryStore';

/**
 * This module is a re-implementation of the responder system from the
 * React Native renderer in React:
 * https://github.com/facebook/react/blob/00f063c31d60308f8e4e0fd349b89ed043b9ea54/packages/react-native-renderer/src/legacy-events/ResponderEventPlugin.js
 */

/**
 * Extract a responder event handler from props by name.
 * Props are typed as {[string]: unknown} because they come from the
 * reconciler; the typeof check ensures we only return actual functions.
 */
function getHandler(
  node: ReadOnlyElement,
  propName: string,
): ((event: ResponderEvent) => unknown) | void {
  const handler = getCurrentProps(node)[propName];
  if (typeof handler === 'function') {
    // $FlowFixMe[incompatible-use] props values are unknown
    const typedHandler: (event: ResponderEvent) => unknown = handler;
    return typedHandler;
  }
  return undefined;
}

// Temporary cast until ReadOnlyNode extends EventTarget ungated.
function asEventTarget(node: ReadOnlyElement): ReadOnlyNodeWithEventTarget {
  // $FlowFixMe[incompatible-type]
  const eventTarget: ReadOnlyNodeWithEventTarget = node;
  return eventTarget;
}

// The currently active responder (tracked as a public instance)
let responderNode: ReadOnlyElement | null = null;

/**
 * Count of current touches. A textInput should become responder iff the
 * selection changes while there is a touch on the screen.
 */
let trackedTouchCount = 0;

function isStartish(topLevelType: string): boolean {
  return topLevelType === 'topTouchStart';
}

function isMoveish(topLevelType: string): boolean {
  return topLevelType === 'topTouchMove';
}

function isEndish(topLevelType: string): boolean {
  return topLevelType === 'topTouchEnd' || topLevelType === 'topTouchCancel';
}

// Routes through the event-dispatch parent cache (shared with
// `EventTarget.getEventPath`) and stops the walk when the parent is not
// an element (e.g., when reaching the document at the top of the tree).
function getResponderParentElement(
  node: ReadOnlyElement,
): ReadOnlyElement | null {
  // `ReadOnlyElement` extends `EventTarget` at runtime when the new
  // event-dispatching pipeline is enabled (the only case this module runs in).
  // $FlowFixMe[incompatible-type]
  const eventTarget: EventTarget = node;
  const parent = getEventTargetParent(eventTarget);
  if (parent instanceof ReadOnlyElement) {
    return parent;
  }
  return null;
}

/**
 * Return the lowest common ancestor of A and B, or null if they are in
 * different trees.
 */
function getLowestCommonAncestor(
  instA: ReadOnlyElement,
  instB: ReadOnlyElement,
): ReadOnlyElement | null {
  // Fast paths using contains (backed by native compareDocumentPosition)
  if (instA.contains(instB)) {
    return instA;
  }
  if (instB.contains(instA)) {
    return instB;
  }

  // Walk up from A until we find an ancestor that contains B
  let current: ?ReadOnlyElement = getResponderParentElement(instA);
  while (current != null) {
    if (current.contains(instB)) {
      return current;
    }
    current = getResponderParentElement(current);
  }

  return null;
}

function changeResponder(
  nextNode: ReadOnlyElement | null,
  blockNativeResponder: boolean,
): void {
  const oldNode = responderNode;
  responderNode = nextNode;

  const uiManager = getFabricUIManager();
  if (oldNode != null) {
    const shadowNode = getNativeElementReference(oldNode);
    if (shadowNode != null) {
      uiManager?.setIsJSResponder(shadowNode, false, blockNativeResponder);
    }
  }
  if (nextNode != null) {
    const shadowNode = getNativeElementReference(nextNode);
    if (shadowNode != null) {
      uiManager?.setIsJSResponder(shadowNode, true, blockNativeResponder);
    }
  }
}

/**
 * Determine the negotiation event name for a given topLevelType.
 */
function getShouldSetEventName(topLevelType: string): string {
  if (isStartish(topLevelType)) {
    return 'startShouldSetResponder';
  } else if (isMoveish(topLevelType)) {
    return 'moveShouldSetResponder';
  } else if (topLevelType === 'topSelectionChange') {
    return 'selectionChangeShouldSetResponder';
  } else {
    return 'scrollShouldSetResponder';
  }
}

const startDependencies = ['topTouchStart'];
const moveDependencies = ['topTouchMove'];
const endDependencies = ['topTouchCancel', 'topTouchEnd'];

const responderEventTypes: {[string]: DispatchConfig} = {
  /**
   * On a `touchStart`/`mouseDown`, is it desired that this element become the
   * responder?
   */
  startShouldSetResponder: {
    phasedRegistrationNames: {
      bubbled: 'onStartShouldSetResponder',
      captured: 'onStartShouldSetResponderCapture',
    },
    dependencies: startDependencies,
  },

  /**
   * On a `scroll`, is it desired that this element become the responder? This
   * is usually not needed, but should be used to retroactively infer that a
   * `touchStart` had occurred during momentum scroll. During a momentum scroll,
   * a touch start will be immediately followed by a scroll event if the view is
   * currently scrolling.
   */
  scrollShouldSetResponder: {
    phasedRegistrationNames: {
      bubbled: 'onScrollShouldSetResponder',
      captured: 'onScrollShouldSetResponderCapture',
    },
    dependencies: ['topScroll'],
  },

  /**
   * On text selection change, should this element become the responder? This
   * is needed for text inputs or other views with native selection, so the
   * JS view can claim the responder.
   */
  selectionChangeShouldSetResponder: {
    phasedRegistrationNames: {
      bubbled: 'onSelectionChangeShouldSetResponder',
      captured: 'onSelectionChangeShouldSetResponderCapture',
    },
    dependencies: ['topSelectionChange'],
  },

  /**
   * On a `touchMove`/`mouseMove`, is it desired that this element become the
   * responder?
   */
  moveShouldSetResponder: {
    phasedRegistrationNames: {
      bubbled: 'onMoveShouldSetResponder',
      captured: 'onMoveShouldSetResponderCapture',
    },
    dependencies: moveDependencies,
  },

  /**
   * Direct responder events dispatched directly to responder. Do not bubble.
   */
  responderStart: {
    registrationName: 'onResponderStart',
    dependencies: startDependencies,
  },
  responderMove: {
    registrationName: 'onResponderMove',
    dependencies: moveDependencies,
  },
  responderEnd: {
    registrationName: 'onResponderEnd',
    dependencies: endDependencies,
  },
  responderRelease: {
    registrationName: 'onResponderRelease',
    dependencies: endDependencies,
  },
  responderTerminationRequest: {
    registrationName: 'onResponderTerminationRequest',
    dependencies: [],
  },
  responderGrant: {
    registrationName: 'onResponderGrant',
    dependencies: [],
  },
  responderReject: {
    registrationName: 'onResponderReject',
    dependencies: [],
  },
  responderTerminate: {
    registrationName: 'onResponderTerminate',
    dependencies: [],
  },
};

/**
 * Run negotiation by walking the public instance tree. Performs capture phase
 * (root→target) then bubble phase (target→root), calling handlers from
 * `getCurrentProps(node)`. The first handler that returns `true` wins.
 */
function negotiateResponder(
  target: ReadOnlyElement,
  topLevelType: string,
  nativeEvent: {[string]: unknown},
): ReadOnlyElement | null {
  const shouldSetEventName = getShouldSetEventName(topLevelType);

  // Determine the negotiation dispatch target
  let negotiationNode: ReadOnlyElement | null;
  let skipSelf = false;
  if (responderNode == null) {
    negotiationNode = target;
  } else {
    negotiationNode = getLowestCommonAncestor(responderNode, target);
    if (negotiationNode == null) {
      return null;
    }
    if (negotiationNode === responderNode) {
      skipSelf = true;
    }
  }

  const dispatchNode: ReadOnlyElement | null = skipSelf
    ? getResponderParentElement(negotiationNode)
    : negotiationNode;
  if (dispatchNode == null) {
    return null;
  }

  // Build ancestor path (root to dispatch node)
  const path: Array<ReadOnlyElement> = [];
  let node: ?ReadOnlyElement = dispatchNode;
  while (node != null) {
    path.unshift(node);
    node = getResponderParentElement(node);
  }

  const dispatchConfig = responderEventTypes[shouldSetEventName];
  const event = new ResponderEvent(
    shouldSetEventName,
    {bubbles: true, cancelable: true},
    nativeEvent,
    dispatchConfig,
    ResponderTouchHistoryStore.touchHistory,
  );
  setTarget(event, asEventTarget(target));

  // Use prop names from the dispatch config
  const {phasedRegistrationNames} = dispatchConfig;
  if (phasedRegistrationNames == null) {
    return null;
  }
  const bubblePropName = phasedRegistrationNames.bubbled;
  const capturePropName = phasedRegistrationNames.captured;

  // Capture phase: root → target
  for (let i = 0; i < path.length; i++) {
    const currentNode = path[i];
    const handler = getHandler(currentNode, capturePropName);
    if (handler != null) {
      setCurrentTarget(event, asEventTarget(currentNode));
      if (handler(event) === true) {
        setCurrentTarget(event, null);
        return currentNode;
      }
    }
  }

  // Bubble phase: target → root
  for (let i = path.length - 1; i >= 0; i--) {
    const currentNode = path[i];
    const handler = getHandler(currentNode, bubblePropName);
    if (handler != null) {
      setCurrentTarget(event, asEventTarget(currentNode));
      if (handler(event) === true) {
        setCurrentTarget(event, null);
        return currentNode;
      }
    }
  }

  setCurrentTarget(event, null);
  return null;
}

/**
 * Tracks the first error thrown by a lifecycle handler during dispatch.
 * Matches the old system's catch-and-rethrow pattern: all handlers run to
 * completion even if one throws, then the first error is rethrown.
 */
let _caughtError: unknown = null;
let _hasError: boolean = false;

export function rethrowCaughtError(): void {
  if (_hasError) {
    const error = _caughtError;
    _hasError = false;
    _caughtError = null;
    throw error;
  }
}

/**
 * Dispatch a lifecycle responder event by calling the handler directly from
 * props. Sets `currentTarget` before calling the handler (fixes the bug where
 * Pressability's `_responderID` was null). Returns the handler's return value
 * so callers can inspect it (e.g. `onResponderGrant` returning `true` blocks
 * native). Errors are caught per-handler so remaining dispatches continue.
 */
function dispatchResponderEvent(
  node: ReadOnlyElement,
  eventName: string,
  nativeEvent: {[string]: unknown},
  eventTarget: ReadOnlyElement | null,
): unknown {
  const dispatchConfig = responderEventTypes[eventName];
  const {registrationName} = dispatchConfig;
  if (registrationName == null) {
    return undefined;
  }
  const handler = getHandler(node, registrationName);
  if (handler == null) {
    return undefined;
  }

  const event = new ResponderEvent(
    eventName,
    {bubbles: false, cancelable: true},
    nativeEvent,
    dispatchConfig,
    ResponderTouchHistoryStore.touchHistory,
  );

  setTarget(event, eventTarget != null ? asEventTarget(eventTarget) : null);
  setCurrentTarget(event, asEventTarget(node));
  let result: unknown;
  try {
    result = handler(event);
  } catch (error) {
    if (!_hasError) {
      _hasError = true;
      _caughtError = error;
    }
  }
  setCurrentTarget(event, null);

  return result;
}

/**
 * A transfer is a negotiation between a currently set responder and the next
 * element to claim responder status.
 */
function canTriggerTransfer(
  topLevelType: string,
  target: ReadOnlyElement | null,
  nativeEvent: {[string]: unknown},
): boolean {
  return (
    target != null &&
    ((topLevelType === 'topScroll' &&
      nativeEvent.responderIgnoreScroll !== true) ||
      (trackedTouchCount > 0 && topLevelType === 'topSelectionChange') ||
      isStartish(topLevelType) ||
      isMoveish(topLevelType))
  );
}

/**
 * Returns whether or not this touch end event makes it such that there are no
 * longer any touches that started inside of descendants of the current
 * responder.
 */
function noResponderTouches(nativeEvent: {[string]: unknown}): boolean {
  const touches = nativeEvent.touches;
  return !Array.isArray(touches) || touches.length === 0;
}

/**
 *
 * Responder System:
 * ----------------
 *
 * - A global, solitary "interaction lock" on a view.
 * - If a node becomes the responder, it should convey visual feedback
 *   immediately to indicate so, either by highlighting or moving accordingly.
 * - To be the responder means, that touches are exclusively important to that
 *   responder view, and no other view.
 * - While touches are still occurring, the responder lock can be transferred to
 *   a new view, but only to increasingly "higher" views (meaning ancestors of
 *   the current responder).
 *
 * Responder being granted:
 * ------------------------
 *
 * - Touch starts, moves, and scrolls can cause an ID to become the responder.
 * - We capture/bubble `startShouldSetResponder`/`moveShouldSetResponder` to
 *   the "appropriate place".
 * - If nothing is currently the responder, the "appropriate place" is the
 *   initiating event's `targetID`.
 * - If something *is* already the responder, the "appropriate place" is the
 *   first common ancestor of the event target and the current `responderInst`.
 * - Some negotiation happens: See the timing diagram below.
 * - Scrolled views automatically become responder. The reasoning is that a
 *   platform scroll view that isn't built on top of the responder system has
 *   began scrolling, and the active responder must now be notified that the
 *   interaction is no longer locked to it - the system has taken over.
 *
 * - Responder being released:
 *   As soon as no more touches that *started* inside of descendants of the
 *   *current* responderInst, an `onResponderRelease` event is dispatched to the
 *   current responder, and the responder lock is released.
 *
 * TODO:
 * - on "end", a callback hook for `onResponderEndShouldRemainResponder` that
 *   determines if the responder lock should remain.
 * - If a view shouldn't "remain" the responder, any active touches should by
 *   default be considered "dead" and do not influence future negotiations or
 *   bubble paths. It should be as if those touches do not exist.
 * -- For multitouch: Usually a translate-z will choose to "remain" responder
 *  after one out of many touches ended. For translate-y, usually the view
 *  doesn't wish to "remain" responder after one of many touches end.
 * - Consider building this on top of a `stopPropagation` model similar to
 *   `W3C` events.
 * - Ensure that `onResponderTerminate` is called on touch cancels, whether or
 *   not `onResponderTerminationRequest` returns `true` or `false`.
 *
 */

/*                                             Negotiation Performed
                                             +-----------------------+
                                            /                         \
Process low level events to    +     Current Responder      +   wantsResponderID
determine who to perform negot-|   (if any exists at all)   |
iation/transition              | Otherwise just pass through|
-------------------------------+----------------------------+------------------+
Bubble to find first ID        |                            |
to return true:wantsResponderID|                            |
                               |                            |
     +-------------+           |                            |
     | onTouchStart|           |                            |
     +------+------+     none  |                            |
            |            return|                            |
+-----------v-------------+true| +------------------------+ |
|onStartShouldSetResponder|----->|onResponderStart (cur)  |<-----------+
+-----------+-------------+    | +------------------------+ |          |
            |                  |                            | +--------+-------+
            | returned true for|       false:REJECT +-------->|onResponderReject
            | wantsResponderID |                    |       | +----------------+
            | (now attempt     | +------------------+-----+ |
            |  handoff)        | |   onResponder          | |
            +------------------->|      TerminationRequest| |
                               | +------------------+-----+ |
                               |                    |       | +----------------+
                               |         true:GRANT +-------->|onResponderGrant|
                               |                            | +--------+-------+
                               | +------------------------+ |          |
                               | |   onResponderTerminate |<-----------+
                               | +------------------+-----+ |
                               |                    |       | +----------------+
                               |                    +-------->|onResponderStart|
                               |                            | +----------------+
Bubble to find first ID        |                            |
to return true:wantsResponderID|                            |
                               |                            |
     +-------------+           |                            |
     | onTouchMove |           |                            |
     +------+------+     none  |                            |
            |            return|                            |
+-----------v-------------+true| +------------------------+ |
|onMoveShouldSetResponder |----->|onResponderMove (cur)   |<-----------+
+-----------+-------------+    | +------------------------+ |          |
            |                  |                            | +--------+-------+
            | returned true for|       false:REJECT +-------->|onResponderRejec|
            | wantsResponderID |                    |       | +----------------+
            | (now attempt     | +------------------+-----+ |
            |  handoff)        | |   onResponder          | |
            +------------------->|      TerminationRequest| |
                               | +------------------+-----+ |
                               |                    |       | +----------------+
                               |         true:GRANT +-------->|onResponderGrant|
                               |                            | +--------+-------+
                               | +------------------------+ |          |
                               | |   onResponderTerminate |<-----------+
                               | +------------------+-----+ |
                               |                    |       | +----------------+
                               |                    +-------->|onResponderMove |
                               |                            | +----------------+
                               |                            |
                               |                            |
      Some active touch started|                            |
      inside current responder | +------------------------+ |
      +------------------------->|      onResponderEnd    | |
      |                        | +------------------------+ |
  +---+---------+              |                            |
  | onTouchEnd  |              |                            |
  +---+---------+              |                            |
      |                        | +------------------------+ |
      +------------------------->|     onResponderEnd     | |
      No active touches started| +-----------+------------+ |
      inside current responder |             |              |
                               |             v              |
                               | +------------------------+ |
                               | |    onResponderRelease  | |
                               | +------------------------+ |
                               |                            |
                               +                            + */

/**
 * Returns whether a top-level event is one that the responder system needs to
 * observe. Used as a fast-path in `processResponderEvent`: most events
 * (`pointerup`, `pointermove`, `layout`, etc.) are not responder-relevant and
 * — when no responder is currently set — produce no work.
 */
function isResponderRelevantTopLevelType(topLevelType: string): boolean {
  return match (topLevelType) {
    | 'topTouchStart'
    | 'topTouchMove'
    | 'topTouchEnd'
    | 'topTouchCancel'
    | 'topScroll'
    | 'topSelectionChange' => true,
    _ => false,
  };
}

/**
 * Process a native event through the responder system.
 */
export function processResponderEvent(
  topLevelType: string,
  eventTarget: EventTarget | null,
  nativeEvent: {[string]: unknown},
): void {
  // Fast path: if this event isn't one the responder system cares about and
  // there is no active responder, exit immediately. This is the dominant case
  // for non-touch events (pointer*, layout, etc.) on apps without an active
  // gesture, and saves the touch counting + ResponderTouchHistoryStore +
  // canTriggerTransfer work.
  if (responderNode == null && !isResponderRelevantTopLevelType(topLevelType)) {
    return;
  }

  // Track touch count
  if (isStartish(topLevelType)) {
    trackedTouchCount += 1;
  } else if (isEndish(topLevelType)) {
    if (trackedTouchCount >= 0) {
      trackedTouchCount -= 1;
    } else {
      if (__DEV__) {
        console.warn(
          'Ended a touch event which was not counted in `trackedTouchCount`.',
        );
      }
      return;
    }
  }

  if (
    isStartish(topLevelType) ||
    isMoveish(topLevelType) ||
    isEndish(topLevelType)
  ) {
    // $FlowFixMe[incompatible-type] nativeEvent has touch fields for touch top-level types
    const touchEvent: TouchEvent = nativeEvent;
    ResponderTouchHistoryStore.recordTouchTrack(topLevelType, touchEvent);
  }

  const target: ReadOnlyElement | null =
    eventTarget instanceof ReadOnlyElement ? eventTarget : null;

  // Negotiation: determine if a new responder should be set
  if (canTriggerTransfer(topLevelType, target, nativeEvent) && target != null) {
    const wantsResponderNode = negotiateResponder(
      target,
      topLevelType,
      nativeEvent,
    );

    if (wantsResponderNode != null && wantsResponderNode !== responderNode) {
      // A new view wants to become responder.
      // onResponderGrant returning true means block native responder.
      const grantResult = dispatchResponderEvent(
        wantsResponderNode,
        'responderGrant',
        nativeEvent,
        target,
      );
      const blockNativeResponder = grantResult === true;

      if (responderNode != null) {
        const currentResponder = responderNode;
        // Ask current responder if it will terminate.
        // onResponderTerminationRequest returning false means refuse.
        const terminationResult = dispatchResponderEvent(
          currentResponder,
          'responderTerminationRequest',
          nativeEvent,
          target,
        );
        const shouldSwitch = terminationResult !== false;

        if (shouldSwitch) {
          dispatchResponderEvent(
            currentResponder,
            'responderTerminate',
            nativeEvent,
            target,
          );
          changeResponder(wantsResponderNode, blockNativeResponder);
        } else {
          dispatchResponderEvent(
            wantsResponderNode,
            'responderReject',
            nativeEvent,
            target,
          );
        }
      } else {
        changeResponder(wantsResponderNode, blockNativeResponder);
      }
    }
  }

  // Dispatch lifecycle events to the active responder
  if (responderNode != null) {
    const activeResponder = responderNode;
    if (isStartish(topLevelType)) {
      dispatchResponderEvent(
        activeResponder,
        'responderStart',
        nativeEvent,
        target,
      );
    } else if (isMoveish(topLevelType)) {
      dispatchResponderEvent(
        activeResponder,
        'responderMove',
        nativeEvent,
        target,
      );
    } else if (isEndish(topLevelType)) {
      dispatchResponderEvent(
        activeResponder,
        'responderEnd',
        nativeEvent,
        target,
      );

      if (topLevelType === 'topTouchCancel') {
        dispatchResponderEvent(
          activeResponder,
          'responderTerminate',
          nativeEvent,
          target,
        );
        changeResponder(null, false);
      } else if (noResponderTouches(nativeEvent)) {
        dispatchResponderEvent(
          activeResponder,
          'responderRelease',
          nativeEvent,
          target,
        );
        changeResponder(null, false);
      }
    }
  }
}

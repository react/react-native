/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {GestureResponderEvent} from '../../Libraries/Types/CoreEventTypes';

/**
 * Gesture recognition on mobile devices is much more complicated than web.
 * A touch can go through several phases as the app determines what the user's intention is.
 * For example, the app needs to determine if the touch is scrolling, sliding on a widget, or tapping.
 * This can even change during the duration of a touch. There can also be multiple simultaneous touches.
 *
 * The touch responder system is needed to allow components to negotiate these touch interactions
 * without any additional knowledge about their parent or child components.
 * This system is implemented in ResponderEventPlugin.js, which contains further details and documentation.
 *
 * Best Practices
 * Users can feel huge differences in the usability of web apps vs. native, and this is one of the big causes.
 * Every action should have the following attributes:
 *      Feedback/highlighting- show the user what is handling their touch, and what will happen when they release the gesture
 *      Cancel-ability- when making an action, the user should be able to abort it mid-touch by dragging their finger away
 *
 * These features make users more comfortable while using an app,
 * because it allows people to experiment and interact without fear of making mistakes.
 *
 * TouchableHighlight and Touchable*
 * The responder system can be complicated to use.
 * So we have provided an abstract Touchable implementation for things that should be "tappable".
 * This uses the responder system and allows you to easily configure tap interactions declaratively.
 * Use TouchableHighlight anywhere where you would use a button or link on web.
 */
export interface GestureResponderHandlers {
  /**
   * A view can become the touch responder by implementing the correct negotiation methods.
   * There are two methods to ask the view if it wants to become responder:
   */

  /**
   * Does this view want to become responder on the start of a touch?
   */
  onStartShouldSetResponder?:
    ((event: GestureResponderEvent) => boolean) | undefined;

  /**
   * Called for every touch move on the View when it is not the responder: does this view want to "claim" touch responsiveness?
   */
  onMoveShouldSetResponder?:
    ((event: GestureResponderEvent) => boolean) | undefined;

  /**
   * If the View returns true and attempts to become the responder, one of the following will happen:
   */

  onResponderEnd?: ((event: GestureResponderEvent) => void) | undefined;

  /**
   * The View is now responding for touch events.
   * This is the time to highlight and show the user what is happening
   */
  onResponderGrant?: ((event: GestureResponderEvent) => void) | undefined;

  /**
   * Something else is the responder right now and will not release it
   */
  onResponderReject?: ((event: GestureResponderEvent) => void) | undefined;

  /**
   * If the view is responding, the following handlers can be called:
   */

  /**
   * The user is moving their finger
   */
  onResponderMove?: ((event: GestureResponderEvent) => void) | undefined;

  /**
   * Fired at the end of the touch, ie "touchUp"
   */
  onResponderRelease?: ((event: GestureResponderEvent) => void) | undefined;

  onResponderStart?: ((event: GestureResponderEvent) => void) | undefined;

  /**
   *  Something else wants to become responder.
   *  Should this view release the responder? Returning true allows release
   */
  onResponderTerminationRequest?:
    ((event: GestureResponderEvent) => boolean) | undefined;

  /**
   * The responder has been taken from the View.
   * Might be taken by other views after a call to onResponderTerminationRequest,
   * or might be taken by the OS without asking (happens with control center/ notification center on iOS)
   */
  onResponderTerminate?: ((event: GestureResponderEvent) => void) | undefined;

  /**
   * onStartShouldSetResponder and onMoveShouldSetResponder are called with a bubbling pattern,
   * where the deepest node is called first.
   * That means that the deepest component will become responder when multiple Views return true for *ShouldSetResponder handlers.
   * This is desirable in most cases, because it makes sure all controls and buttons are usable.
   *
   * However, sometimes a parent will want to make sure that it becomes responder.
   * This can be handled by using the capture phase.
   * Before the responder system bubbles up from the deepest component,
   * it will do a capture phase, firing on*ShouldSetResponderCapture.
   * So if a parent View wants to prevent the child from becoming responder on a touch start,
   * it should have a onStartShouldSetResponderCapture handler which returns true.
   */
  onStartShouldSetResponderCapture?:
    ((event: GestureResponderEvent) => boolean) | undefined;

  /**
   * onStartShouldSetResponder and onMoveShouldSetResponder are called with a bubbling pattern,
   * where the deepest node is called first.
   * That means that the deepest component will become responder when multiple Views return true for *ShouldSetResponder handlers.
   * This is desirable in most cases, because it makes sure all controls and buttons are usable.
   *
   * However, sometimes a parent will want to make sure that it becomes responder.
   * This can be handled by using the capture phase.
   * Before the responder system bubbles up from the deepest component,
   * it will do a capture phase, firing on*ShouldSetResponderCapture.
   * So if a parent View wants to prevent the child from becoming responder on a touch start,
   * it should have a onStartShouldSetResponderCapture handler which returns true.
   */
  onMoveShouldSetResponderCapture?:
    ((event: GestureResponderEvent) => boolean) | undefined;
}

/**
 * React Native also implements unstable_batchedUpdates
 */
export function unstable_batchedUpdates<A, R>(callback: (a: A) => R, a: A): R;
export function unstable_batchedUpdates<R>(callback: () => R): R;

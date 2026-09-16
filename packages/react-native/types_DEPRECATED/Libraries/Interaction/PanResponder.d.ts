/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {GestureResponderHandlers} from '../../public/ReactNativeRenderer';
import {GestureResponderEvent} from '../Types/CoreEventTypes';

export interface PanResponderGestureState {
  /**
   *  ID of the gestureState- persisted as long as there at least one touch on
   */
  stateID: number;

  /**
   *  the latest screen coordinates of the recently-moved touch
   */
  moveX: number;

  /**
   *  the latest screen coordinates of the recently-moved touch
   */
  moveY: number;

  /**
   * the screen coordinates of the responder grant
   */
  x0: number;

  /**
   * the screen coordinates of the responder grant
   */
  y0: number;

  /**
   * accumulated distance of the gesture since the touch started
   */
  dx: number;

  /**
   * accumulated distance of the gesture since the touch started
   */
  dy: number;

  /**
   * current velocity of the gesture
   */
  vx: number;

  /**
   * current velocity of the gesture
   */
  vy: number;

  /**
   * Number of touches currently on screen
   */
  numberActiveTouches: number;

  // All `gestureState` accounts for timeStamps up until:
  _accountsForMovesUpTo: number;
}

/**
 * @see documentation of GestureResponderHandlers
 */
export interface PanResponderCallbacks {
  onMoveShouldSetPanResponder?:
    | ((
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => boolean)
    | undefined;
  onStartShouldSetPanResponder?:
    | ((
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => boolean)
    | undefined;
  onPanResponderGrant?:
    | ((
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => void)
    | undefined;
  onPanResponderMove?:
    | ((
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => void)
    | undefined;
  onPanResponderRelease?:
    | ((
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => void)
    | undefined;
  onPanResponderTerminate?:
    | ((
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => void)
    | undefined;

  onMoveShouldSetPanResponderCapture?:
    | ((
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => boolean)
    | undefined;
  onStartShouldSetPanResponderCapture?:
    | ((
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => boolean)
    | undefined;
  onPanResponderReject?:
    | ((
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => void)
    | undefined;
  onPanResponderStart?:
    | ((
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => void)
    | undefined;
  onPanResponderEnd?:
    | ((
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => void)
    | undefined;
  onPanResponderTerminationRequest?:
    | ((
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => boolean)
    | undefined;
  onShouldBlockNativeResponder?:
    | ((
        e: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => boolean)
    | undefined;
}

export interface PanResponderInstance {
  panHandlers: GestureResponderHandlers;
}

/**
 * PanResponder reconciles several touches into a single gesture.
 * It makes single-touch gestures resilient to extra touches,
 * and can be used to recognize simple multi-touch gestures.
 *
 * It provides a predictable wrapper of the responder handlers provided by the gesture responder system.
 * For each handler, it provides a new gestureState object alongside the normal event.
 */
export interface PanResponderStatic {
  /**
   * @param config Enhanced versions of all of the responder callbacks
   * that provide not only the typical `ResponderSyntheticEvent`, but also the
   * `PanResponder` gesture state.  Simply replace the word `Responder` with
   * `PanResponder` in each of the typical `onResponder*` callbacks. For
   * example, the `config` object would look like:
   *
   *  - `onMoveShouldSetPanResponder: (e, gestureState) => {...}`
   *  - `onMoveShouldSetPanResponderCapture: (e, gestureState) => {...}`
   *  - `onStartShouldSetPanResponder: (e, gestureState) => {...}`
   *  - `onStartShouldSetPanResponderCapture: (e, gestureState) => {...}`
   *  - `onPanResponderReject: (e, gestureState) => {...}`
   *  - `onPanResponderGrant: (e, gestureState) => {...}`
   *  - `onPanResponderStart: (e, gestureState) => {...}`
   *  - `onPanResponderEnd: (e, gestureState) => {...}`
   *  - `onPanResponderRelease: (e, gestureState) => {...}`
   *  - `onPanResponderMove: (e, gestureState) => {...}`
   *  - `onPanResponderTerminate: (e, gestureState) => {...}`
   *  - `onPanResponderTerminationRequest: (e, gestureState) => {...}`
   *  - `onShouldBlockNativeResponder: (e, gestureState) => {...}`
   *
   *  In general, for events that have capture equivalents, we update the
   *  gestureState once in the capture phase and can use it in the bubble phase
   *  as well.
   *
   *  Be careful with onStartShould* callbacks. They only reflect updated
   *  `gestureState` for start/end events that bubble/capture to the Node.
   *  Once the node is the responder, you can rely on every start/end event
   *  being processed by the gesture and `gestureState` being updated
   *  accordingly. (numberActiveTouches) may not be totally accurate unless you
   *  are the responder.
   */
  create(config: PanResponderCallbacks): PanResponderInstance;
}

export const PanResponder: PanResponderStatic;
export type PanResponder = PanResponderStatic;

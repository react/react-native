/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {GestureResponderEvent} from '../Types/CoreEventTypes';

const TouchHistoryMath = require('./TouchHistoryMath').default;

const currentCentroidXOfTouchesChangedAfter =
  TouchHistoryMath.currentCentroidXOfTouchesChangedAfter;
const currentCentroidYOfTouchesChangedAfter =
  TouchHistoryMath.currentCentroidYOfTouchesChangedAfter;
const previousCentroidXOfTouchesChangedAfter =
  TouchHistoryMath.previousCentroidXOfTouchesChangedAfter;
const previousCentroidYOfTouchesChangedAfter =
  TouchHistoryMath.previousCentroidYOfTouchesChangedAfter;
const currentCentroidX = TouchHistoryMath.currentCentroidX;
const currentCentroidY = TouchHistoryMath.currentCentroidY;

/**
 * `PanResponder` reconciles several touches into a single gesture. It makes
 * single-touch gestures resilient to extra touches, and can be used to
 * recognize simple multi-touch gestures.
 *
 * It provides a predictable wrapper of the responder handlers provided by the
 * [gesture responder system](docs/gesture-responder-system.html).
 * For each handler, it provides a new `gestureState` object alongside the
 * native event object:
 *
 * ```
 * onPanResponderMove: (event, gestureState) => {}
 * ```
 *
 * A native event is a synthetic touch event with the following form:
 *
 *  - `nativeEvent`
 *      + `changedTouches` - Array of all touch events that have changed since the last event
 *      + `identifier` - The ID of the touch
 *      + `locationX` - The X position of the touch, relative to the element
 *      + `locationY` - The Y position of the touch, relative to the element
 *      + `pageX` - The X position of the touch, relative to the root element
 *      + `pageY` - The Y position of the touch, relative to the root element
 *      + `target` - The node id of the element receiving the touch event
 *      + `timestamp` - A time identifier for the touch, useful for velocity calculation
 *      + `touches` - Array of all current touches on the screen
 *
 * A `gestureState` object has the following:
 *
 *  - `stateID` - ID of the gestureState- persisted as long as there at least
 *     one touch on screen
 *  - `moveX` - the latest screen coordinates of the recently-moved touch
 *  - `moveY` - the latest screen coordinates of the recently-moved touch
 *  - `x0` - the screen coordinates of the responder grant
 *  - `y0` - the screen coordinates of the responder grant
 *  - `dx` - accumulated distance of the gesture since the touch started
 *  - `dy` - accumulated distance of the gesture since the touch started
 *  - `vx` - current velocity of the gesture
 *  - `vy` - current velocity of the gesture
 *  - `numberActiveTouches` - Number of touches currently on screen
 *
 * ### Basic Usage
 *
 * ```
 *   componentWillMount: function() {
 *     this._panResponder = PanResponder.create({
 *       // Ask to be the responder:
 *       onStartShouldSetPanResponder: (evt, gestureState) => true,
 *       onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
 *       onMoveShouldSetPanResponder: (evt, gestureState) => true,
 *       onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
 *
 *       onPanResponderGrant: (evt, gestureState) => {
 *         // The gesture has started. Show visual feedback so the user knows
 *         // what is happening!
 *
 *         // gestureState.d{x,y} will be set to zero now
 *       },
 *       onPanResponderMove: (evt, gestureState) => {
 *         // The most recent move distance is gestureState.move{X,Y}
 *
 *         // The accumulated gesture distance since becoming responder is
 *         // gestureState.d{x,y}
 *       },
 *       onPanResponderTerminationRequest: (evt, gestureState) => true,
 *       onPanResponderRelease: (evt, gestureState) => {
 *         // The user has released all touches while this view is the
 *         // responder. This typically means a gesture has succeeded
 *       },
 *       onPanResponderTerminate: (evt, gestureState) => {
 *         // Another component has become the responder, so this gesture
 *         // should be cancelled
 *       },
 *       onShouldBlockNativeResponder: (evt, gestureState) => {
 *         // Returns whether this component should block native components from becoming the JS
 *         // responder. Returns true by default. Is currently only supported on android.
 *         return true;
 *       },
 *     });
 *   },
 *
 *   render: function() {
 *     return (
 *       <View {...this._panResponder.panHandlers} />
 *     );
 *   },
 *
 * ```
 *
 * ### Working Example
 *
 * To see it in action, try the
 * [PanResponder example in RNTester](https://github.com/facebook/react-native/blob/HEAD/packages/rn-tester/js/examples/PanResponder/PanResponderExample.js)
 */

export type PanResponderGestureState = {
  /**
   * ID of the gestureState - persisted as long as there at least one touch on screen
   */
  stateID: number,

  /**
   * The latest screen coordinates of the recently-moved touch
   */
  moveX: number,

  /**
   * The latest screen coordinates of the recently-moved touch
   */
  moveY: number,

  /**
   * The screen coordinates of the responder grant
   */
  x0: number,

  /**
   * The screen coordinates of the responder grant
   */
  y0: number,

  /**
   * Accumulated distance of the gesture since the touch started
   */
  dx: number,

  /**
   * Accumulated distance of the gesture since the touch started
   */
  dy: number,

  /**
   * Current velocity of the gesture
   */
  vx: number,

  /**
   * Current velocity of the gesture
   */
  vy: number,

  /**
   * Number of touches currently on screen
   */
  numberActiveTouches: number,

  /**
   * All `gestureState` accounts for timeStamps up until this value
   *
   * @private
   */
  _accountsForMovesUpTo: number,
};

type ActiveCallback = (
  event: GestureResponderEvent,
  gestureState: PanResponderGestureState,
) => boolean;

type PassiveCallback = (
  event: GestureResponderEvent,
  gestureState: PanResponderGestureState,
) => unknown;

export type GestureResponderHandlerMethods = {
  onMoveShouldSetResponder: (event: GestureResponderEvent) => boolean,
  onMoveShouldSetResponderCapture: (event: GestureResponderEvent) => boolean,
  onResponderEnd: (event: GestureResponderEvent) => void,
  onResponderGrant: (event: GestureResponderEvent) => boolean,
  onResponderMove: (event: GestureResponderEvent) => void,
  onResponderReject: (event: GestureResponderEvent) => void,
  onResponderRelease: (event: GestureResponderEvent) => void,
  onResponderStart: (event: GestureResponderEvent) => void,
  onResponderTerminate: (event: GestureResponderEvent) => void,
  onResponderTerminationRequest: (event: GestureResponderEvent) => boolean,
  onStartShouldSetResponder: (event: GestureResponderEvent) => boolean,
  onStartShouldSetResponderCapture: (event: GestureResponderEvent) => boolean,
};

export type PanResponderCallbacks = Readonly<{
  onMoveShouldSetPanResponder?: ?ActiveCallback,
  onMoveShouldSetPanResponderCapture?: ?ActiveCallback,
  onStartShouldSetPanResponder?: ?ActiveCallback,
  onStartShouldSetPanResponderCapture?: ?ActiveCallback,
  /**
   * The body of `onResponderGrant` returns a bool, but the vast majority of
   * callsites return void and this TODO notice is found in it:
   *   TODO: t7467124 investigate if this can be removed
   */
  onPanResponderGrant?: ?(PassiveCallback | ActiveCallback),
  onPanResponderReject?: ?PassiveCallback,
  onPanResponderStart?: ?PassiveCallback,
  onPanResponderEnd?: ?PassiveCallback,
  onPanResponderRelease?: ?PassiveCallback,
  onPanResponderMove?: ?PassiveCallback,
  onPanResponderTerminate?: ?PassiveCallback,
  onPanResponderTerminationRequest?: ?ActiveCallback,
  onShouldBlockNativeResponder?: ?ActiveCallback,
}>;

const PanResponder = {
  /**
   *
   * A graphical explanation of the touch data flow:
   *
   * +----------------------------+             +--------------------------------+
   * | ResponderTouchHistoryStore |             |TouchHistoryMath                |
   * +----------------------------+             +----------+---------------------+
   * |Global store of touchHistory|             |Allocation-less math util       |
   * |including activeness, start |             |on touch history (centroids     |
   * |position, prev/cur position.|             |and multitouch movement etc)    |
   * |                            |             |                                |
   * +----^-----------------------+             +----^---------------------------+
   *      |                                          |
   *      | (records relevant history                |
   *      |  of touches relevant for                 |
   *      |  implementing higher level               |
   *      |  gestures)                               |
   *      |                                          |
   * +----+-----------------------+             +----|---------------------------+
   * | ResponderEventPlugin       |             |    |   Your App/Component      |
   * +----------------------------+             +----|---------------------------+
   * |Negotiates which view gets  | Low level   |    |             High level    |
   * |onResponderMove events.     | events w/   |  +-+-------+     events w/     |
   * |Also records history into   | touchHistory|  |   Pan   |     multitouch +  |
   * |ResponderTouchHistoryStore. +---------------->Responder+-----> accumulative|
   * +----------------------------+ attached to |  |         |     distance and  |
   *                                 each event |  +---------+     velocity.     |
   *                                            |                                |
   *                                            |                                |
   *                                            +--------------------------------+
   *
   *
   *
   * Gesture that calculates cumulative movement over time in a way that just
   * "does the right thing" for multiple touches. The "right thing" is very
   * nuanced. When moving two touches in opposite directions, the cumulative
   * distance is zero in each dimension. When two touches move in parallel five
   * pixels in the same direction, the cumulative distance is five, not ten. If
   * two touches start, one moves five in a direction, then stops and the other
   * touch moves fives in the same direction, the cumulative distance is ten.
   *
   * This logic requires a kind of processing of time "clusters" of touch events
   * so that two touch moves that essentially occur in parallel but move every
   * other frame respectively, are considered part of the same movement.
   *
   * Explanation of some of the non-obvious fields:
   *
   * - moveX/moveY: If no move event has been observed, then `(moveX, moveY)` is
   *   invalid. If a move event has been observed, `(moveX, moveY)` is the
   *   centroid of the most recently moved "cluster" of active touches.
   *   (Currently all move have the same timeStamp, but later we should add some
   *   threshold for what is considered to be "moving"). If a palm is
   *   accidentally counted as a touch, but a finger is moving greatly, the palm
   *   will move slightly, but we only want to count the single moving touch.
   * - x0/y0: Centroid location (non-cumulative) at the time of becoming
   *   responder.
   * - dx/dy: Cumulative touch distance - not the same thing as sum of each touch
   *   distance. Accounts for touch moves that are clustered together in time,
   *   moving the same direction. Only valid when currently responder (otherwise,
   *   it only represents the drag distance below the threshold).
   * - vx/vy: Velocity.
   */

  _initializeGestureState(gestureState: PanResponderGestureState) {
    gestureState.moveX = 0;
    gestureState.moveY = 0;
    gestureState.x0 = 0;
    gestureState.y0 = 0;
    gestureState.dx = 0;
    gestureState.dy = 0;
    gestureState.vx = 0;
    gestureState.vy = 0;
    gestureState.numberActiveTouches = 0;
    // All `gestureState` accounts for timeStamps up until:
    gestureState._accountsForMovesUpTo = 0;
  },

  /**
   * This is nuanced and is necessary. It is incorrect to continuously take all
   * active *and* recently moved touches, find the centroid, and track how that
   * result changes over time. Instead, we must take all recently moved
   * touches, and calculate how the centroid has changed just for those
   * recently moved touches, and append that change to an accumulator. This is
   * to (at least) handle the case where the user is moving three fingers, and
   * then one of the fingers stops but the other two continue.
   *
   * This is very different than taking all of the recently moved touches and
   * storing their centroid as `dx/dy`. For correctness, we must *accumulate
   * changes* in the centroid of recently moved touches.
   *
   * There is also some nuance with how we handle multiple moved touches in a
   * single event. With the way `ReactNativeEventEmitter` dispatches touches as
   * individual events, multiple touches generate two 'move' events, each of
   * them triggering `onResponderMove`. But with the way `PanResponder` works,
   * all of the gesture inference is performed on the first dispatch, since it
   * looks at all of the touches (even the ones for which there hasn't been a
   * native dispatch yet). Therefore, `PanResponder` does not call
   * `onResponderMove` passed the first dispatch. This diverges from the
   * typical responder callback pattern (without using `PanResponder`), but
   * avoids more dispatches than necessary.
   */
  _updateGestureStateOnMove(
    gestureState: PanResponderGestureState,
    touchHistory: GestureResponderEvent['touchHistory'],
  ) {
    gestureState.numberActiveTouches = touchHistory.numberActiveTouches;
    gestureState.moveX = currentCentroidXOfTouchesChangedAfter(
      touchHistory,
      gestureState._accountsForMovesUpTo,
    );
    gestureState.moveY = currentCentroidYOfTouchesChangedAfter(
      touchHistory,
      gestureState._accountsForMovesUpTo,
    );
    const movedAfter = gestureState._accountsForMovesUpTo;
    const prevX = previousCentroidXOfTouchesChangedAfter(
      touchHistory,
      movedAfter,
    );
    const x = currentCentroidXOfTouchesChangedAfter(touchHistory, movedAfter);
    const prevY = previousCentroidYOfTouchesChangedAfter(
      touchHistory,
      movedAfter,
    );
    const y = currentCentroidYOfTouchesChangedAfter(touchHistory, movedAfter);
    const nextDX = gestureState.dx + (x - prevX);
    const nextDY = gestureState.dy + (y - prevY);

    // TODO: This must be filtered intelligently.
    const dt =
      touchHistory.mostRecentTimeStamp - gestureState._accountsForMovesUpTo;
    gestureState.vx = (nextDX - gestureState.dx) / dt;
    gestureState.vy = (nextDY - gestureState.dy) / dt;

    gestureState.dx = nextDX;
    gestureState.dy = nextDY;
    gestureState._accountsForMovesUpTo = touchHistory.mostRecentTimeStamp;
  },

  /**
   * @param {object} config Enhanced versions of all of the responder callbacks
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
  create(config: PanResponderCallbacks): {
    getInteractionHandle: () => ?number,
    panHandlers: GestureResponderHandlerMethods,
  } {
    const gestureState: PanResponderGestureState = {
      // Useful for debugging
      stateID: Math.random(),
      moveX: 0,
      moveY: 0,
      x0: 0,
      y0: 0,
      dx: 0,
      dy: 0,
      vx: 0,
      vy: 0,
      numberActiveTouches: 0,
      _accountsForMovesUpTo: 0,
    };
    const panHandlers: GestureResponderHandlerMethods = {
      onStartShouldSetResponder(event: GestureResponderEvent): boolean {
        return config.onStartShouldSetPanResponder == null
          ? false
          : config.onStartShouldSetPanResponder(event, gestureState);
      },
      onMoveShouldSetResponder(event: GestureResponderEvent): boolean {
        return config.onMoveShouldSetPanResponder == null
          ? false
          : config.onMoveShouldSetPanResponder(event, gestureState);
      },
      onStartShouldSetResponderCapture(event: GestureResponderEvent): boolean {
        // TODO: Actually, we should reinitialize the state any time
        // touches.length increases from 0 active to > 0 active.
        if (event.nativeEvent.touches.length === 1) {
          PanResponder._initializeGestureState(gestureState);
        }
        gestureState.numberActiveTouches =
          event.touchHistory.numberActiveTouches;
        return config.onStartShouldSetPanResponderCapture != null
          ? config.onStartShouldSetPanResponderCapture(event, gestureState)
          : false;
      },

      onMoveShouldSetResponderCapture(event: GestureResponderEvent): boolean {
        const touchHistory = event.touchHistory;
        // Responder system incorrectly dispatches should* to current responder
        // Filter out any touch moves past the first one - we would have
        // already processed multi-touch geometry during the first event.
        if (
          gestureState._accountsForMovesUpTo ===
          touchHistory.mostRecentTimeStamp
        ) {
          return false;
        }
        PanResponder._updateGestureStateOnMove(gestureState, touchHistory);
        return config.onMoveShouldSetPanResponderCapture
          ? config.onMoveShouldSetPanResponderCapture(event, gestureState)
          : false;
      },

      onResponderGrant(event: GestureResponderEvent): boolean {
        gestureState.x0 = currentCentroidX(event.touchHistory);
        gestureState.y0 = currentCentroidY(event.touchHistory);
        gestureState.dx = 0;
        gestureState.dy = 0;
        if (config.onPanResponderGrant) {
          config.onPanResponderGrant(event, gestureState);
        }
        // TODO: t7467124 investigate if this can be removed
        return config.onShouldBlockNativeResponder == null
          ? true
          : config.onShouldBlockNativeResponder(event, gestureState);
      },

      onResponderReject(event: GestureResponderEvent): void {
        config.onPanResponderReject?.call(undefined, event, gestureState);
      },

      onResponderRelease(event: GestureResponderEvent): void {
        config.onPanResponderRelease?.call(undefined, event, gestureState);
        PanResponder._initializeGestureState(gestureState);
      },

      onResponderStart(event: GestureResponderEvent): void {
        const touchHistory = event.touchHistory;
        gestureState.numberActiveTouches = touchHistory.numberActiveTouches;
        if (config.onPanResponderStart) {
          config.onPanResponderStart(event, gestureState);
        }
      },

      onResponderMove(event: GestureResponderEvent): void {
        const touchHistory = event.touchHistory;
        // Guard against the dispatch of two touch moves when there are two
        // simultaneously changed touches.
        if (
          gestureState._accountsForMovesUpTo ===
          touchHistory.mostRecentTimeStamp
        ) {
          return;
        }
        // Filter out any touch moves past the first one - we would have
        // already processed multi-touch geometry during the first event.
        PanResponder._updateGestureStateOnMove(gestureState, touchHistory);
        if (config.onPanResponderMove) {
          config.onPanResponderMove(event, gestureState);
        }
      },

      onResponderEnd(event: GestureResponderEvent): void {
        const touchHistory = event.touchHistory;
        gestureState.numberActiveTouches = touchHistory.numberActiveTouches;
        config.onPanResponderEnd?.call(undefined, event, gestureState);
      },

      onResponderTerminate(event: GestureResponderEvent): void {
        config.onPanResponderTerminate?.call(undefined, event, gestureState);
        PanResponder._initializeGestureState(gestureState);
      },

      onResponderTerminationRequest(event: GestureResponderEvent): boolean {
        return config.onPanResponderTerminationRequest == null
          ? true
          : config.onPanResponderTerminationRequest(event, gestureState);
      },
    };
    return {
      panHandlers,
      getInteractionHandle(): ?number {
        // TODO: Deprecate and delete this method.
        return null;
      },
    };
  },
};

export type PanResponderInstance = ReturnType<(typeof PanResponder)['create']>;

export default PanResponder;

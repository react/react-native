/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {EdgeInsetsProp} from '../../StyleSheet/EdgeInsetsPropType';
import type {ColorValue} from '../../StyleSheet/StyleSheet';
import type {
  BlurEvent,
  FocusEvent,
  GestureResponderEvent,
} from '../../Types/CoreEventTypes';

import {PressabilityDebugView} from '../../Pressability/PressabilityDebug';
import UIManager from '../../ReactNative/UIManager';
import Platform from '../../Utilities/Platform';
import SoundManager from '../Sound/SoundManager';
import BoundingDimensions from './BoundingDimensions';
import Position from './Position';
import * as React from 'react';

const extractSingleTouch = (nativeEvent: {
  readonly changedTouches: ReadonlyArray<GestureResponderEvent['nativeEvent']>,
  readonly force?: number,
  readonly identifier: number,
  readonly locationX: number,
  readonly locationY: number,
  readonly pageX: number,
  readonly pageY: number,
  readonly target: ?number,
  readonly timestamp: number,
  readonly touches: ReadonlyArray<GestureResponderEvent['nativeEvent']>,
}) => {
  const touches = nativeEvent.touches;
  const changedTouches = nativeEvent.changedTouches;
  const hasTouches = touches && touches.length > 0;
  const hasChangedTouches = changedTouches && changedTouches.length > 0;

  return !hasTouches && hasChangedTouches
    ? changedTouches[0]
    : hasTouches
      ? touches[0]
      : nativeEvent;
};

/**
 * Touchable states.
 */

const States = {
  NOT_RESPONDER: 'NOT_RESPONDER', // Not the responder
  RESPONDER_INACTIVE_PRESS_IN: 'RESPONDER_INACTIVE_PRESS_IN', // Responder, inactive, in the `PressRect`
  RESPONDER_INACTIVE_PRESS_OUT: 'RESPONDER_INACTIVE_PRESS_OUT', // Responder, inactive, out of `PressRect`
  RESPONDER_ACTIVE_PRESS_IN: 'RESPONDER_ACTIVE_PRESS_IN', // Responder, active, in the `PressRect`
  RESPONDER_ACTIVE_PRESS_OUT: 'RESPONDER_ACTIVE_PRESS_OUT', // Responder, active, out of `PressRect`
  RESPONDER_ACTIVE_LONG_PRESS_IN: 'RESPONDER_ACTIVE_LONG_PRESS_IN', // Responder, active, in the `PressRect`, after long press threshold
  RESPONDER_ACTIVE_LONG_PRESS_OUT: 'RESPONDER_ACTIVE_LONG_PRESS_OUT', // Responder, active, out of `PressRect`, after long press threshold
  ERROR: 'ERROR',
};

type TouchableState =
  | typeof States.NOT_RESPONDER
  | typeof States.RESPONDER_INACTIVE_PRESS_IN
  | typeof States.RESPONDER_INACTIVE_PRESS_OUT
  | typeof States.RESPONDER_ACTIVE_PRESS_IN
  | typeof States.RESPONDER_ACTIVE_PRESS_OUT
  | typeof States.RESPONDER_ACTIVE_LONG_PRESS_IN
  | typeof States.RESPONDER_ACTIVE_LONG_PRESS_OUT
  | typeof States.ERROR;

/*
 * Quick lookup map for states that are considered to be "active"
 */

const baseStatesConditions = {
  NOT_RESPONDER: false,
  RESPONDER_INACTIVE_PRESS_IN: false,
  RESPONDER_INACTIVE_PRESS_OUT: false,
  RESPONDER_ACTIVE_PRESS_IN: false,
  RESPONDER_ACTIVE_PRESS_OUT: false,
  RESPONDER_ACTIVE_LONG_PRESS_IN: false,
  RESPONDER_ACTIVE_LONG_PRESS_OUT: false,
  ERROR: false,
};

const IsActive = {
  ...baseStatesConditions,
  RESPONDER_ACTIVE_PRESS_OUT: true,
  RESPONDER_ACTIVE_PRESS_IN: true,
};

/**
 * Quick lookup for states that are considered to be "pressing" and are
 * therefore eligible to result in a "selection" if the press stops.
 */
const IsPressingIn = {
  ...baseStatesConditions,
  RESPONDER_INACTIVE_PRESS_IN: true,
  RESPONDER_ACTIVE_PRESS_IN: true,
  RESPONDER_ACTIVE_LONG_PRESS_IN: true,
};

const IsLongPressingIn = {
  ...baseStatesConditions,
  RESPONDER_ACTIVE_LONG_PRESS_IN: true,
};

/**
 * Inputs to the state machine.
 */
const Signals = {
  DELAY: 'DELAY',
  RESPONDER_GRANT: 'RESPONDER_GRANT',
  RESPONDER_RELEASE: 'RESPONDER_RELEASE',
  RESPONDER_TERMINATED: 'RESPONDER_TERMINATED',
  ENTER_PRESS_RECT: 'ENTER_PRESS_RECT',
  LEAVE_PRESS_RECT: 'LEAVE_PRESS_RECT',
  LONG_PRESS_DETECTED: 'LONG_PRESS_DETECTED',
};

type Signal =
  | typeof Signals.DELAY
  | typeof Signals.RESPONDER_GRANT
  | typeof Signals.RESPONDER_RELEASE
  | typeof Signals.RESPONDER_TERMINATED
  | typeof Signals.ENTER_PRESS_RECT
  | typeof Signals.LEAVE_PRESS_RECT
  | typeof Signals.LONG_PRESS_DETECTED;

/**
 * Mapping from States x Signals => States
 */
const Transitions = {
  NOT_RESPONDER: {
    DELAY: States.ERROR,
    RESPONDER_GRANT: States.RESPONDER_INACTIVE_PRESS_IN,
    RESPONDER_RELEASE: States.ERROR,
    RESPONDER_TERMINATED: States.ERROR,
    ENTER_PRESS_RECT: States.ERROR,
    LEAVE_PRESS_RECT: States.ERROR,
    LONG_PRESS_DETECTED: States.ERROR,
  },
  RESPONDER_INACTIVE_PRESS_IN: {
    DELAY: States.RESPONDER_ACTIVE_PRESS_IN,
    RESPONDER_GRANT: States.ERROR,
    RESPONDER_RELEASE: States.NOT_RESPONDER,
    RESPONDER_TERMINATED: States.NOT_RESPONDER,
    ENTER_PRESS_RECT: States.RESPONDER_INACTIVE_PRESS_IN,
    LEAVE_PRESS_RECT: States.RESPONDER_INACTIVE_PRESS_OUT,
    LONG_PRESS_DETECTED: States.ERROR,
  },
  RESPONDER_INACTIVE_PRESS_OUT: {
    DELAY: States.RESPONDER_ACTIVE_PRESS_OUT,
    RESPONDER_GRANT: States.ERROR,
    RESPONDER_RELEASE: States.NOT_RESPONDER,
    RESPONDER_TERMINATED: States.NOT_RESPONDER,
    ENTER_PRESS_RECT: States.RESPONDER_INACTIVE_PRESS_IN,
    LEAVE_PRESS_RECT: States.RESPONDER_INACTIVE_PRESS_OUT,
    LONG_PRESS_DETECTED: States.ERROR,
  },
  RESPONDER_ACTIVE_PRESS_IN: {
    DELAY: States.ERROR,
    RESPONDER_GRANT: States.ERROR,
    RESPONDER_RELEASE: States.NOT_RESPONDER,
    RESPONDER_TERMINATED: States.NOT_RESPONDER,
    ENTER_PRESS_RECT: States.RESPONDER_ACTIVE_PRESS_IN,
    LEAVE_PRESS_RECT: States.RESPONDER_ACTIVE_PRESS_OUT,
    LONG_PRESS_DETECTED: States.RESPONDER_ACTIVE_LONG_PRESS_IN,
  },
  RESPONDER_ACTIVE_PRESS_OUT: {
    DELAY: States.ERROR,
    RESPONDER_GRANT: States.ERROR,
    RESPONDER_RELEASE: States.NOT_RESPONDER,
    RESPONDER_TERMINATED: States.NOT_RESPONDER,
    ENTER_PRESS_RECT: States.RESPONDER_ACTIVE_PRESS_IN,
    LEAVE_PRESS_RECT: States.RESPONDER_ACTIVE_PRESS_OUT,
    LONG_PRESS_DETECTED: States.ERROR,
  },
  RESPONDER_ACTIVE_LONG_PRESS_IN: {
    DELAY: States.ERROR,
    RESPONDER_GRANT: States.ERROR,
    RESPONDER_RELEASE: States.NOT_RESPONDER,
    RESPONDER_TERMINATED: States.NOT_RESPONDER,
    ENTER_PRESS_RECT: States.RESPONDER_ACTIVE_LONG_PRESS_IN,
    LEAVE_PRESS_RECT: States.RESPONDER_ACTIVE_LONG_PRESS_OUT,
    LONG_PRESS_DETECTED: States.RESPONDER_ACTIVE_LONG_PRESS_IN,
  },
  RESPONDER_ACTIVE_LONG_PRESS_OUT: {
    DELAY: States.ERROR,
    RESPONDER_GRANT: States.ERROR,
    RESPONDER_RELEASE: States.NOT_RESPONDER,
    RESPONDER_TERMINATED: States.NOT_RESPONDER,
    ENTER_PRESS_RECT: States.RESPONDER_ACTIVE_LONG_PRESS_IN,
    LEAVE_PRESS_RECT: States.RESPONDER_ACTIVE_LONG_PRESS_OUT,
    LONG_PRESS_DETECTED: States.ERROR,
  },
  error: {
    DELAY: States.NOT_RESPONDER,
    RESPONDER_GRANT: States.RESPONDER_INACTIVE_PRESS_IN,
    RESPONDER_RELEASE: States.NOT_RESPONDER,
    RESPONDER_TERMINATED: States.NOT_RESPONDER,
    ENTER_PRESS_RECT: States.NOT_RESPONDER,
    LEAVE_PRESS_RECT: States.NOT_RESPONDER,
    LONG_PRESS_DETECTED: States.NOT_RESPONDER,
  },
};

// ==== Typical Constants for integrating into UI components ====
// var HIT_EXPAND_PX = 20;
// var HIT_VERT_OFFSET_PX = 10;
const HIGHLIGHT_DELAY_MS = 130;

const PRESS_EXPAND_PX = 20;

const LONG_PRESS_THRESHOLD = 500;

const LONG_PRESS_DELAY_MS = LONG_PRESS_THRESHOLD - HIGHLIGHT_DELAY_MS;

const LONG_PRESS_ALLOWED_MOVEMENT = 10;

// Default amount "active" region protrudes beyond box

/**
 * By convention, methods prefixed with underscores are meant to be @private,
 * and not @protected. Mixers shouldn't access them - not even to provide them
 * as callback handlers.
 *
 *
 * ========== Geometry =========
 * `Touchable` only assumes that there exists a `HitRect` node. The `PressRect`
 * is an abstract box that is extended beyond the `HitRect`.
 *
 *  +--------------------------+
 *  |                          | - "Start" events in `HitRect` cause `HitRect`
 *  |  +--------------------+  |   to become the responder.
 *  |  |  +--------------+  |  | - `HitRect` is typically expanded around
 *  |  |  |              |  |  |   the `VisualRect`, but shifted downward.
 *  |  |  |  VisualRect  |  |  | - After pressing down, after some delay,
 *  |  |  |              |  |  |   and before letting up, the Visual React
 *  |  |  +--------------+  |  |   will become "active". This makes it eligible
 *  |  |     HitRect        |  |   for being highlighted (so long as the
 *  |  +--------------------+  |   press remains in the `PressRect`).
 *  |        PressRect     o   |
 *  +----------------------|---+
 *           Out Region    |
 *                         +-----+ This gap between the `HitRect` and
 *                                 `PressRect` allows a touch to move far away
 *                                 from the original hit rect, and remain
 *                                 highlighted, and eligible for a "Press".
 *                                 Customize this via
 *                                 `touchableGetPressRectOffset()`.
 *
 *
 *
 * ======= State Machine =======
 *
 * +-------------+ <---+ RESPONDER_RELEASE
 * |NOT_RESPONDER|
 * +-------------+ <---+ RESPONDER_TERMINATED
 *     +
 *     | RESPONDER_GRANT (HitRect)
 *     v
 * +---------------------------+  DELAY   +-------------------------+  T + DELAY     +------------------------------+
 * |RESPONDER_INACTIVE_PRESS_IN|+-------->|RESPONDER_ACTIVE_PRESS_IN| +------------> |RESPONDER_ACTIVE_LONG_PRESS_IN|
 * +---------------------------+          +-------------------------+                +------------------------------+
 *     +            ^                         +           ^                                 +           ^
 *     |LEAVE_      |ENTER_                   |LEAVE_     |ENTER_                           |LEAVE_     |ENTER_
 *     |PRESS_RECT  |PRESS_RECT               |PRESS_RECT |PRESS_RECT                       |PRESS_RECT |PRESS_RECT
 *     |            |                         |           |                                 |           |
 *     v            +                         v           +                                 v           +
 * +----------------------------+  DELAY  +--------------------------+               +-------------------------------+
 * |RESPONDER_INACTIVE_PRESS_OUT|+------->|RESPONDER_ACTIVE_PRESS_OUT|               |RESPONDER_ACTIVE_LONG_PRESS_OUT|
 * +----------------------------+         +--------------------------+               +-------------------------------+
 *
 * T + DELAY => LONG_PRESS_DELAY_MS + DELAY
 *
 * Not drawn are the side effects of each transition. The most important side
 * effect is the `touchableHandlePress` abstract method invocation that occurs
 * when a responder is released while in either of the "Press" states.
 *
 * The other important side effects are the highlight abstract method
 * invocations (internal callbacks) to be implemented by the mixer.
 *
 *
 * @lends Touchable.prototype
 */
const TouchableMixinImpl = {
  componentDidMount: function () {
    if (!Platform.isTV) {
      return;
    }
  },

  /**
   * Clear all timeouts on unmount
   */
  /* $FlowFixMe[missing-this-annot] The 'this' type annotation(s) required by
   * Flow's LTI update could not be added via codemod */
  componentWillUnmount: function () {
    this.touchableDelayTimeout && clearTimeout(this.touchableDelayTimeout);
    this.longPressDelayTimeout && clearTimeout(this.longPressDelayTimeout);
    this.pressOutDelayTimeout && clearTimeout(this.pressOutDelayTimeout);
  },

  /**
   * It's prefer that mixins determine state in this way, having the class
   * explicitly mix the state in the one and only `getInitialState` method.
   *
   * @return {object} State object to be placed inside of
   * `this.state.touchable`.
   */
  touchableGetInitialState: function (): {
    touchable: {
      touchState: ?TouchableState,
      responderID: ?GestureResponderEvent['currentTarget'],
    },
  } {
    return {
      touchable: {touchState: undefined, responderID: null},
    };
  },

  // ==== Hooks to Gesture Responder system ====
  /**
   * Must return true if embedded in a native platform scroll view.
   */
  /* $FlowFixMe[missing-this-annot] The 'this' type annotation(s) required by
   * Flow's LTI update could not be added via codemod */
  touchableHandleResponderTerminationRequest: function (): any {
    return !this.props.rejectResponderTermination;
  },

  /**
   * Must return true to start the process of `Touchable`.
   */
  /* $FlowFixMe[missing-this-annot] The 'this' type annotation(s) required by
   * Flow's LTI update could not be added via codemod */
  touchableHandleStartShouldSetResponder: function (): any {
    return !this.props.disabled;
  },

  /**
   * Return true to cancel press on long press.
   */
  touchableLongPressCancelsPress: function (): boolean {
    return true;
  },

  /**
   * Place as callback for a DOM element's `onResponderGrant` event.
   * @param {NativeSyntheticEvent} e Synthetic event from event system.
   *
   */
  /* $FlowFixMe[missing-this-annot] The 'this' type annotation(s) required by
   * Flow's LTI update could not be added via codemod */
  touchableHandleResponderGrant: function (e: GestureResponderEvent) {
    const dispatchID = e.currentTarget;
    // Since e is used in a callback invoked on another event loop
    // (as in setTimeout etc), we need to call e.persist() on the
    // event to make sure it doesn't get reused in the event object pool.
    e.persist();

    this.pressOutDelayTimeout && clearTimeout(this.pressOutDelayTimeout);
    this.pressOutDelayTimeout = null;

    this.state.touchable.touchState = States.NOT_RESPONDER;
    this.state.touchable.responderID = dispatchID;
    this._receiveSignal(Signals.RESPONDER_GRANT, e);
    let delayMS =
      this.touchableGetHighlightDelayMS !== undefined
        ? Math.max(this.touchableGetHighlightDelayMS(), 0)
        : HIGHLIGHT_DELAY_MS;
    delayMS = isNaN(delayMS) ? HIGHLIGHT_DELAY_MS : delayMS;
    if (delayMS !== 0) {
      this.touchableDelayTimeout = setTimeout(
        this._handleDelay.bind(this, e),
        delayMS,
      );
    } else {
      this._handleDelay(e);
    }

    let longDelayMS =
      this.touchableGetLongPressDelayMS !== undefined
        ? Math.max(this.touchableGetLongPressDelayMS(), 10)
        : LONG_PRESS_DELAY_MS;
    longDelayMS = isNaN(longDelayMS) ? LONG_PRESS_DELAY_MS : longDelayMS;
    this.longPressDelayTimeout = setTimeout(
      this._handleLongDelay.bind(this, e),
      longDelayMS + delayMS,
    );
  },

  /**
   * Place as callback for a DOM element's `onResponderRelease` event.
   */
  /* $FlowFixMe[missing-this-annot] The 'this' type annotation(s) required by
   * Flow's LTI update could not be added via codemod */
  touchableHandleResponderRelease: function (e: GestureResponderEvent) {
    this.pressInLocation = null;
    this._receiveSignal(Signals.RESPONDER_RELEASE, e);
  },

  /**
   * Place as callback for a DOM element's `onResponderTerminate` event.
   */
  /* $FlowFixMe[missing-this-annot] The 'this' type annotation(s) required by
   * Flow's LTI update could not be added via codemod */
  touchableHandleResponderTerminate: function (e: GestureResponderEvent) {
    this.pressInLocation = null;
    this._receiveSignal(Signals.RESPONDER_TERMINATED, e);
  },

  /**
   * Place as callback for a DOM element's `onResponderMove` event.
   */
  /* $FlowFixMe[missing-this-annot] The 'this' type annotation(s) required by
   * Flow's LTI update could not be added via codemod */
  touchableHandleResponderMove: function (e: GestureResponderEvent) {
    // Measurement may not have returned yet.
    if (!this.state.touchable.positionOnActivate) {
      return;
    }

    const positionOnActivate = this.state.touchable.positionOnActivate;
    const dimensionsOnActivate = this.state.touchable.dimensionsOnActivate;
    const pressRectOffset = this.touchableGetPressRectOffset
      ? this.touchableGetPressRectOffset()
      : {
          left: PRESS_EXPAND_PX,
          right: PRESS_EXPAND_PX,
          top: PRESS_EXPAND_PX,
          bottom: PRESS_EXPAND_PX,
        };

    let pressExpandLeft = pressRectOffset.left;
    let pressExpandTop = pressRectOffset.top;
    let pressExpandRight = pressRectOffset.right;
    let pressExpandBottom = pressRectOffset.bottom;

    const hitSlop = this.touchableGetHitSlop
      ? this.touchableGetHitSlop()
      : null;

    if (hitSlop) {
      pressExpandLeft += hitSlop.left || 0;
      pressExpandTop += hitSlop.top || 0;
      pressExpandRight += hitSlop.right || 0;
      pressExpandBottom += hitSlop.bottom || 0;
    }

    const touch = extractSingleTouch(e.nativeEvent);
    const pageX = touch && touch.pageX;
    const pageY = touch && touch.pageY;

    if (this.pressInLocation) {
      const movedDistance = this._getDistanceBetweenPoints(
        pageX,
        pageY,
        this.pressInLocation.pageX,
        this.pressInLocation.pageY,
      );
      if (movedDistance > LONG_PRESS_ALLOWED_MOVEMENT) {
        this._cancelLongPressDelayTimeout();
      }
    }

    const isTouchWithinActive =
      pageX > positionOnActivate.left - pressExpandLeft &&
      pageY > positionOnActivate.top - pressExpandTop &&
      pageX <
        positionOnActivate.left +
          dimensionsOnActivate.width +
          pressExpandRight &&
      pageY <
        positionOnActivate.top +
          dimensionsOnActivate.height +
          pressExpandBottom;
    if (isTouchWithinActive) {
      const prevState = this.state.touchable.touchState;
      this._receiveSignal(Signals.ENTER_PRESS_RECT, e);
      const curState = this.state.touchable.touchState;
      if (
        curState === States.RESPONDER_INACTIVE_PRESS_IN &&
        prevState !== States.RESPONDER_INACTIVE_PRESS_IN
      ) {
        // fix for t7967420
        this._cancelLongPressDelayTimeout();
      }
    } else {
      this._cancelLongPressDelayTimeout();
      this._receiveSignal(Signals.LEAVE_PRESS_RECT, e);
    }
  },

  /**
   * Invoked when the item receives focus. Mixers might override this to
   * visually distinguish the `VisualRect` so that the user knows that it
   * currently has the focus. Most platforms only support a single element being
   * focused at a time, in which case there may have been a previously focused
   * element that was blurred just prior to this. This can be overridden when
   * using `Touchable.Mixin.withoutDefaultFocusAndBlur`.
   */
  /* $FlowFixMe[missing-this-annot] The 'this' type annotation(s) required by
   * Flow's LTI update could not be added via codemod */
  touchableHandleFocus: function (e: FocusEvent) {
    this.props.onFocus && this.props.onFocus(e);
  },

  /**
   * Invoked when the item loses focus. Mixers might override this to
   * visually distinguish the `VisualRect` so that the user knows that it
   * no longer has focus. Most platforms only support a single element being
   * focused at a time, in which case the focus may have moved to another.
   * This can be overridden when using
   * `Touchable.Mixin.withoutDefaultFocusAndBlur`.
   */
  /* $FlowFixMe[missing-this-annot] The 'this' type annotation(s) required by
   * Flow's LTI update could not be added via codemod */
  touchableHandleBlur: function (e: BlurEvent) {
    this.props.onBlur && this.props.onBlur(e);
  },

  // ==== Abstract Application Callbacks ====

  /**
   * Invoked when the item should be highlighted. Mixers should implement this
   * to visually distinguish the `VisualRect` so that the user knows that
   * releasing a touch will result in a "selection" (analog to click).
   *
   * @abstract
   * touchableHandleActivePressIn: function,
   */

  /**
   * Invoked when the item is "active" (in that it is still eligible to become
   * a "select") but the touch has left the `PressRect`. Usually the mixer will
   * want to unhighlight the `VisualRect`. If the user (while pressing) moves
   * back into the `PressRect` `touchableHandleActivePressIn` will be invoked
   * again and the mixer should probably highlight the `VisualRect` again. This
   * event will not fire on an `touchEnd/mouseUp` event, only move events while
   * the user is depressing the mouse/touch.
   *
   * @abstract
   * touchableHandleActivePressOut: function
   */

  /**
   * Invoked when the item is "selected" - meaning the interaction ended by
   * letting up while the item was either in the state
   * `RESPONDER_ACTIVE_PRESS_IN` or `RESPONDER_INACTIVE_PRESS_IN`.
   *
   * @abstract
   * touchableHandlePress: function
   */

  /**
   * Invoked when the item is long pressed - meaning the interaction ended by
   * letting up while the item was in `RESPONDER_ACTIVE_LONG_PRESS_IN`. If
   * `touchableHandleLongPress` is *not* provided, `touchableHandlePress` will
   * be called as it normally is. If `touchableHandleLongPress` is provided, by
   * default any `touchableHandlePress` callback will not be invoked. To
   * override this default behavior, override `touchableLongPressCancelsPress`
   * to return false. As a result, `touchableHandlePress` will be called when
   * lifting up, even if `touchableHandleLongPress` has also been called.
   *
   * @abstract
   * touchableHandleLongPress: function
   */

  /**
   * Returns the number of millis to wait before triggering a highlight.
   *
   * @abstract
   * touchableGetHighlightDelayMS: function
   */

  /**
   * Returns the amount to extend the `HitRect` into the `PressRect`. Positive
   * numbers mean the size expands outwards.
   *
   * @abstract
   * touchableGetPressRectOffset: function
   */

  // ==== Internal Logic ====

  /**
   * Measures the `HitRect` node on activation. The Bounding rectangle is with
   * respect to viewport - not page, so adding the `pageXOffset/pageYOffset`
   * should result in points that are in the same coordinate system as an
   * event's `globalX/globalY` data values.
   *
   * - Consider caching this for the lifetime of the component, or possibly
   *   being able to share this cache between any `ScrollMap` view.
   *
   * @sideeffects
   * @private
   */
  /* $FlowFixMe[missing-this-annot] The 'this' type annotation(s) required by
   * Flow's LTI update could not be added via codemod */
  _remeasureMetricsOnActivation: function () {
    const responderID = this.state.touchable.responderID;
    if (responderID == null) {
      return;
    }

    if (typeof responderID === 'number') {
      UIManager.measure(responderID, this._handleQueryLayout);
    } else {
      responderID.measure(this._handleQueryLayout);
    }
  },

  /* $FlowFixMe[missing-this-annot] The 'this' type annotation(s) required by
   * Flow's LTI update could not be added via codemod */
  _handleQueryLayout: function (
    l: number,
    t: number,
    w: number,
    h: number,
    globalX: number,
    globalY: number,
  ) {
    //don't do anything UIManager failed to measure node
    if (!l && !t && !w && !h && !globalX && !globalY) {
      return;
    }
    this.state.touchable.positionOnActivate &&
      // $FlowFixMe[prop-missing]
      Position.release(this.state.touchable.positionOnActivate);
    this.state.touchable.dimensionsOnActivate &&
      // $FlowFixMe[prop-missing]
      BoundingDimensions.release(this.state.touchable.dimensionsOnActivate);
    // $FlowFixMe[prop-missing]
    this.state.touchable.positionOnActivate = Position.getPooled(
      globalX,
      globalY,
    );
    // $FlowFixMe[prop-missing]
    this.state.touchable.dimensionsOnActivate = BoundingDimensions.getPooled(
      w,
      h,
    );
  },

  /* $FlowFixMe[missing-this-annot] The 'this' type annotation(s) required by
   * Flow's LTI update could not be added via codemod */
  _handleDelay: function (e: GestureResponderEvent) {
    this.touchableDelayTimeout = null;
    this._receiveSignal(Signals.DELAY, e);
  },

  /* $FlowFixMe[missing-this-annot] The 'this' type annotation(s) required by
   * Flow's LTI update could not be added via codemod */
  _handleLongDelay: function (e: GestureResponderEvent) {
    this.longPressDelayTimeout = null;
    const curState = this.state.touchable.touchState;
    if (
      curState === States.RESPONDER_ACTIVE_PRESS_IN ||
      curState === States.RESPONDER_ACTIVE_LONG_PRESS_IN
    ) {
      this._receiveSignal(Signals.LONG_PRESS_DETECTED, e);
    }
  },

  /**
   * Receives a state machine signal, performs side effects of the transition
   * and stores the new state. Validates the transition as well.
   *
   * @param {Signals} signal State machine signal.
   * @throws Error if invalid state transition or unrecognized signal.
   * @sideeffects
   */
  /* $FlowFixMe[missing-this-annot] The 'this' type annotation(s) required by
   * Flow's LTI update could not be added via codemod */
  _receiveSignal: function (signal: Signal, e: GestureResponderEvent) {
    const responderID = this.state.touchable.responderID;
    const curState = this.state.touchable.touchState;
    const nextState = Transitions[curState] && Transitions[curState][signal];
    if (!responderID && signal === Signals.RESPONDER_RELEASE) {
      return;
    }
    if (!nextState) {
      throw new Error(
        'Unrecognized signal `' +
          signal +
          '` or state `' +
          curState +
          '` for Touchable responder `' +
          typeof this.state.touchable.responderID ===
        'number'
          ? this.state.touchable.responderID
          : 'host component' + '`',
      );
    }
    if (nextState === States.ERROR) {
      throw new Error(
        'Touchable cannot transition from `' +
          curState +
          '` to `' +
          signal +
          '` for responder `' +
          typeof this.state.touchable.responderID ===
        'number'
          ? this.state.touchable.responderID
          : '<<host component>>' + '`',
      );
    }
    if (curState !== nextState) {
      this._performSideEffectsForTransition(curState, nextState, signal, e);
      this.state.touchable.touchState = nextState;
    }
  },

  /* $FlowFixMe[missing-this-annot] The 'this' type annotation(s) required by
   * Flow's LTI update could not be added via codemod */
  _cancelLongPressDelayTimeout: function () {
    this.longPressDelayTimeout && clearTimeout(this.longPressDelayTimeout);
    this.longPressDelayTimeout = null;
  },

  _isHighlight: function (state: TouchableState): boolean {
    return (
      state === States.RESPONDER_ACTIVE_PRESS_IN ||
      state === States.RESPONDER_ACTIVE_LONG_PRESS_IN
    );
  },

  /* $FlowFixMe[missing-this-annot] The 'this' type annotation(s) required by
   * Flow's LTI update could not be added via codemod */
  _savePressInLocation: function (e: GestureResponderEvent) {
    const touch = extractSingleTouch(e.nativeEvent);
    const pageX = touch && touch.pageX;
    const pageY = touch && touch.pageY;
    const locationX = touch && touch.locationX;
    const locationY = touch && touch.locationY;
    this.pressInLocation = {pageX, pageY, locationX, locationY};
  },

  _getDistanceBetweenPoints: function (
    aX: number,
    aY: number,
    bX: number,
    bY: number,
  ): number {
    const deltaX = aX - bX;
    const deltaY = aY - bY;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  },

  /**
   * Will perform a transition between touchable states, and identify any
   * highlighting or unhighlighting that must be performed for this particular
   * transition.
   *
   * @param {States} curState Current Touchable state.
   * @param {States} nextState Next Touchable state.
   * @param {Signal} signal Signal that triggered the transition.
   * @param {Event} e Native event.
   * @sideeffects
   */
  /* $FlowFixMe[missing-this-annot] The 'this' type annotation(s) required by
   * Flow's LTI update could not be added via codemod */
  _performSideEffectsForTransition: function (
    curState: TouchableState,
    nextState: TouchableState,
    signal: Signal,
    e: GestureResponderEvent,
  ) {
    const curIsHighlight = this._isHighlight(curState);
    const newIsHighlight = this._isHighlight(nextState);

    const isFinalSignal =
      signal === Signals.RESPONDER_TERMINATED ||
      signal === Signals.RESPONDER_RELEASE;

    if (isFinalSignal) {
      this._cancelLongPressDelayTimeout();
    }

    const isInitialTransition =
      curState === States.NOT_RESPONDER &&
      nextState === States.RESPONDER_INACTIVE_PRESS_IN;

    /* $FlowFixMe[invalid-computed-prop] Natural Inference rollout. See
     * https://fburl.com/workplace/6291gfvu */
    const isActiveTransition = !IsActive[curState] && IsActive[nextState];
    if (isInitialTransition || isActiveTransition) {
      this._remeasureMetricsOnActivation();
    }

    /* $FlowFixMe[invalid-computed-prop] Natural Inference rollout. See
     * https://fburl.com/workplace/6291gfvu */
    if (IsPressingIn[curState] && signal === Signals.LONG_PRESS_DETECTED) {
      this.touchableHandleLongPress && this.touchableHandleLongPress(e);
    }

    if (newIsHighlight && !curIsHighlight) {
      this._startHighlight(e);
    } else if (!newIsHighlight && curIsHighlight) {
      this._endHighlight(e);
    }

    /* $FlowFixMe[invalid-computed-prop] Natural Inference rollout. See
     * https://fburl.com/workplace/6291gfvu */
    if (IsPressingIn[curState] && signal === Signals.RESPONDER_RELEASE) {
      const hasLongPressHandler = !!this.props.onLongPress;
      const pressIsLongButStillCallOnPress =
        /* $FlowFixMe[invalid-computed-prop] Natural Inference rollout. See
         * https://fburl.com/workplace/6291gfvu */
        IsLongPressingIn[curState] && // We *are* long pressing.. // But either has no long handler
        (!hasLongPressHandler || !this.touchableLongPressCancelsPress()); // or we're told to ignore it.

      const shouldInvokePress =
        /* $FlowFixMe[invalid-computed-prop] Natural Inference rollout. See
         * https://fburl.com/workplace/6291gfvu */
        !IsLongPressingIn[curState] || pressIsLongButStillCallOnPress;
      if (shouldInvokePress && this.touchableHandlePress) {
        if (!newIsHighlight && !curIsHighlight) {
          // we never highlighted because of delay, but we should highlight now
          this._startHighlight(e);
          this._endHighlight(e);
        }
        if (Platform.OS === 'android' && !this.props.touchSoundDisabled) {
          SoundManager.playTouchSound();
        }
        this.touchableHandlePress(e);
      }
    }

    this.touchableDelayTimeout && clearTimeout(this.touchableDelayTimeout);
    this.touchableDelayTimeout = null;
  },

  /* $FlowFixMe[missing-this-annot] The 'this' type annotation(s) required by
   * Flow's LTI update could not be added via codemod */
  _startHighlight: function (e: GestureResponderEvent) {
    this._savePressInLocation(e);
    this.touchableHandleActivePressIn && this.touchableHandleActivePressIn(e);
  },

  /* $FlowFixMe[missing-this-annot] The 'this' type annotation(s) required by
   * Flow's LTI update could not be added via codemod */
  _endHighlight: function (e: GestureResponderEvent) {
    if (this.touchableHandleActivePressOut) {
      if (
        this.touchableGetPressOutDelayMS &&
        this.touchableGetPressOutDelayMS()
      ) {
        this.pressOutDelayTimeout = setTimeout(() => {
          this.touchableHandleActivePressOut(e);
        }, this.touchableGetPressOutDelayMS());
      } else {
        this.touchableHandleActivePressOut(e);
      }
    }
  },

  withoutDefaultFocusAndBlur: {} as {...},
};

/**
 * Provide an optional version of the mixin where `touchableHandleFocus` and
 * `touchableHandleBlur` can be overridden. This allows appropriate defaults to
 * be set on TV platforms, without breaking existing implementations of
 * `Touchable`.
 */
const {
  touchableHandleFocus,
  touchableHandleBlur,
  ...TouchableMixinWithoutDefaultFocusAndBlur
} = TouchableMixinImpl;
TouchableMixinImpl.withoutDefaultFocusAndBlur =
  TouchableMixinWithoutDefaultFocusAndBlur;

/**
 * `Touchable`: Taps done right.
 *
 * You hook your `ResponderEventPlugin` events into `Touchable`. `Touchable`
 * will measure time/geometry and tells you when to give feedback to the user.
 *
 * ====================== Touchable Tutorial ===============================
 * The `Touchable` mixin helps you handle the "press" interaction. It analyzes
 * the geometry of elements, and observes when another responder (scroll view
 * etc) has stolen the touch lock. It notifies your component when it should
 * give feedback to the user. (bouncing/highlighting/unhighlighting).
 *
 * - When a touch was activated (typically you highlight)
 * - When a touch was deactivated (typically you unhighlight)
 * - When a touch was "pressed" - a touch ended while still within the geometry
 *   of the element, and no other element (like scroller) has "stolen" touch
 *   lock ("responder") (Typically you bounce the element).
 *
 * A good tap interaction isn't as simple as you might think. There should be a
 * slight delay before showing a highlight when starting a touch. If a
 * subsequent touch move exceeds the boundary of the element, it should
 * unhighlight, but if that same touch is brought back within the boundary, it
 * should rehighlight again. A touch can move in and out of that boundary
 * several times, each time toggling highlighting, but a "press" is only
 * triggered if that touch ends while within the element's boundary and no
 * scroller (or anything else) has stolen the lock on touches.
 *
 * To create a new type of component that handles interaction using the
 * `Touchable` mixin, do the following:
 *
 * - Initialize the `Touchable` state.
 *
 *   getInitialState: function() {
 *     return merge(this.touchableGetInitialState(), yourComponentState);
 *   }
 *
 * - Choose the rendered component who's touches should start the interactive
 *   sequence. On that rendered node, forward all `Touchable` responder
 *   handlers. You can choose any rendered node you like. Choose a node whose
 *   hit target you'd like to instigate the interaction sequence:
 *
 *   // In render function:
 *   return (
 *     <View
 *       onStartShouldSetResponder={this.touchableHandleStartShouldSetResponder}
 *       onResponderTerminationRequest={this.touchableHandleResponderTerminationRequest}
 *       onResponderGrant={this.touchableHandleResponderGrant}
 *       onResponderMove={this.touchableHandleResponderMove}
 *       onResponderRelease={this.touchableHandleResponderRelease}
 *       onResponderTerminate={this.touchableHandleResponderTerminate}>
 *       <View>
 *         Even though the hit detection/interactions are triggered by the
 *         wrapping (typically larger) node, we usually end up implementing
 *         custom logic that highlights this inner one.
 *       </View>
 *     </View>
 *   );
 *
 * - You may set up your own handlers for each of these events, so long as you
 *   also invoke the `touchable*` handlers inside of your custom handler.
 *
 * - Implement the handlers on your component class in order to provide
 *   feedback to the user. See documentation for each of these class methods
 *   that you should implement.
 *
 *   touchableHandlePress: function() {
 *      this.performBounceAnimation();  // or whatever you want to do.
 *   },
 *   touchableHandleActivePressIn: function() {
 *     this.beginHighlighting(...);  // Whatever you like to convey activation
 *   },
 *   touchableHandleActivePressOut: function() {
 *     this.endHighlighting(...);  // Whatever you like to convey deactivation
 *   },
 *
 * - There are more advanced methods you can implement (see documentation below):
 *   touchableGetHighlightDelayMS: function() {
 *     return 20;
 *   }
 *   // In practice, *always* use a predeclared constant (conserve memory).
 *   touchableGetPressRectOffset: function() {
 *     return {top: 20, left: 20, right: 20, bottom: 100};
 *   }
 */
const TouchableImpl = {
  Mixin: TouchableMixinImpl,
  /**
   * Renders a debugging overlay to visualize touch target with hitSlop (might not work on Android).
   */
  renderDebugView: ({
    color,
    hitSlop,
  }: {
    color: ColorValue,
    hitSlop?: EdgeInsetsProp,
    ...
  }): null | React.Node => {
    if (__DEV__) {
      return <PressabilityDebugView color={color} hitSlop={hitSlop} />;
    }
    return null;
  },
};

export default TouchableImpl;

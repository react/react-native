/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';
import {Insets} from '../../../public/Insets';
import {GestureResponderEvent} from '../../Types/CoreEventTypes';

/**
 * //FIXME: need to find documentation on which component is a TTouchable and can implement that interface
 * @see React.DOMAttributes
 */
export interface Touchable {
  onTouchStart?: ((event: GestureResponderEvent) => void) | undefined;
  onTouchMove?: ((event: GestureResponderEvent) => void) | undefined;
  onTouchEnd?: ((event: GestureResponderEvent) => void) | undefined;
  onTouchCancel?: ((event: GestureResponderEvent) => void) | undefined;
  onTouchEndCapture?: ((event: GestureResponderEvent) => void) | undefined;
}

export const Touchable: {
  TOUCH_TARGET_DEBUG: boolean;
  renderDebugView: (config: {
    color: string | number;
    hitSlop?: Insets | undefined;
  }) => React.ReactElement | null;
};

/**
 * @see https://github.com/facebook/react-native/blob/0.34-stable\Libraries\Components\Touchable\Touchable.js
 */
interface TouchableMixin {
  /**
   * Invoked when the item should be highlighted. Mixers should implement this
   * to visually distinguish the `VisualRect` so that the user knows that
   * releasing a touch will result in a "selection" (analog to click).
   */
  touchableHandleActivePressIn(e: GestureResponderEvent): void;

  /**
   * Invoked when the item is "active" (in that it is still eligible to become
   * a "select") but the touch has left the `PressRect`. Usually the mixer will
   * want to unhighlight the `VisualRect`. If the user (while pressing) moves
   * back into the `PressRect` `touchableHandleActivePressIn` will be invoked
   * again and the mixer should probably highlight the `VisualRect` again. This
   * event will not fire on an `touchEnd/mouseUp` event, only move events while
   * the user is depressing the mouse/touch.
   */
  touchableHandleActivePressOut(e: GestureResponderEvent): void;

  /**
   * Invoked when the item is "selected" - meaning the interaction ended by
   * letting up while the item was either in the state
   * `RESPONDER_ACTIVE_PRESS_IN` or `RESPONDER_INACTIVE_PRESS_IN`.
   */
  touchableHandlePress(e: GestureResponderEvent): void;

  /**
   * Invoked when the item is long pressed - meaning the interaction ended by
   * letting up while the item was in `RESPONDER_ACTIVE_LONG_PRESS_IN`. If
   * `touchableHandleLongPress` is *not* provided, `touchableHandlePress` will
   * be called as it normally is. If `touchableHandleLongPress` is provided, by
   * default any `touchableHandlePress` callback will not be invoked. To
   * override this default behavior, override `touchableLongPressCancelsPress`
   * to return false. As a result, `touchableHandlePress` will be called when
   * lifting up, even if `touchableHandleLongPress` has also been called.
   */
  touchableHandleLongPress(e: GestureResponderEvent): void;

  /**
   * Returns the amount to extend the `HitRect` into the `PressRect`. Positive
   * numbers mean the size expands outwards.
   */
  touchableGetPressRectOffset(): Insets;

  /**
   * Returns the number of millis to wait before triggering a highlight.
   */
  touchableGetHighlightDelayMS(): number;

  // These methods are undocumented but still being used by TouchableMixin internals
  touchableGetLongPressDelayMS(): number;
  touchableGetPressOutDelayMS(): number;
  touchableGetHitSlop(): Insets;
}

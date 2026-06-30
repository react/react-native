/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {HostInstance} from '../../src/private/types/HostInstance';

export type NativeSyntheticEvent<out T> = Readonly<{
  bubbles: ?boolean,
  cancelable: ?boolean,
  currentTarget: number | HostInstance,
  defaultPrevented: ?boolean,
  dispatchConfig: Readonly<{
    registrationName: string,
  }>,
  eventPhase: ?number,
  preventDefault: () => void,
  isDefaultPrevented: () => boolean,
  stopPropagation: () => void,
  isPropagationStopped: () => boolean,
  isTrusted: ?boolean,
  nativeEvent: T,
  persist: () => void,
  target: ?number | HostInstance,
  timeStamp: number,
  type: ?string,
}>;

export type ResponderSyntheticEvent<T> = Readonly<{
  ...NativeSyntheticEvent<T>,
  touchHistory: Readonly<{
    indexOfSingleActiveTouch: number,
    mostRecentTimeStamp: number,
    numberActiveTouches: number,
    touchBank: ReadonlyArray<
      Readonly<{
        touchActive: boolean,
        startPageX: number,
        startPageY: number,
        startTimeStamp: number,
        currentPageX: number,
        currentPageY: number,
        currentTimeStamp: number,
        previousPageX: number,
        previousPageY: number,
        previousTimeStamp: number,
      }>,
    >,
  }>,
}>;

export type LayoutRectangle = Readonly<{
  x: number,
  y: number,
  width: number,
  height: number,
}>;

export type TextLayoutLine = Readonly<{
  ...LayoutRectangle,
  ascender: number,
  capHeight: number,
  descender: number,
  text: string,
  xHeight: number,
}>;

export type LayoutChangeEvent = NativeSyntheticEvent<
  Readonly<{
    layout: LayoutRectangle,
  }>,
>;

/**
 * @deprecated Use `TextLayoutEvent` instead.
 */
type TextLayoutEventData = Readonly<{
  lines: Array<TextLayoutLine>,
}>;

export type TextLayoutEvent = NativeSyntheticEvent<TextLayoutEventData>;

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/UIEvent
 */
export interface NativeUIEvent {
  /**
   * Returns a long with details about the event, depending on the event type.
   */
  readonly detail: number;
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
 */
export interface NativeMouseEvent extends NativeUIEvent {
  /**
   * The X coordinate of the mouse pointer in global (screen) coordinates.
   */
  readonly screenX: number;
  /**
   * The Y coordinate of the mouse pointer in global (screen) coordinates.
   */
  readonly screenY: number;
  /**
   * The X coordinate of the mouse pointer relative to the whole document.
   */
  readonly pageX: number;
  /**
   * The Y coordinate of the mouse pointer relative to the whole document.
   */
  readonly pageY: number;
  /**
   * The X coordinate of the mouse pointer in local (DOM content) coordinates.
   */
  readonly clientX: number;
  /**
   * The Y coordinate of the mouse pointer in local (DOM content) coordinates.
   */
  readonly clientY: number;
  /**
   * Alias for NativeMouseEvent.clientX
   */
  readonly x: number;
  /**
   * Alias for NativeMouseEvent.clientY
   */
  readonly y: number;
  /**
   * Returns true if the control key was down when the mouse event was fired.
   */
  readonly ctrlKey: boolean;
  /**
   * Returns true if the shift key was down when the mouse event was fired.
   */
  readonly shiftKey: boolean;
  /**
   * Returns true if the alt key was down when the mouse event was fired.
   */
  readonly altKey: boolean;
  /**
   * Returns true if the meta key was down when the mouse event was fired.
   */
  readonly metaKey: boolean;
  /**
   * The button number that was pressed (if applicable) when the mouse event was fired.
   */
  readonly button: number;
  /**
   * The buttons being depressed (if any) when the mouse event was fired.
   */
  readonly buttons: number;
  /**
   * The secondary target for the event, if there is one.
   */
  readonly relatedTarget: null | number | HostInstance;
  // offset is proposed: https://drafts.csswg.org/cssom-view/#extensions-to-the-mouseevent-interface
  /**
   * The X coordinate of the mouse pointer between that event and the padding edge of the target node
   */
  readonly offsetX: number;
  /**
   * The Y coordinate of the mouse pointer between that event and the padding edge of the target node
   */
  readonly offsetY: number;
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent
 */
export interface NativePointerEvent extends NativeMouseEvent {
  /**
   * A unique identifier for the pointer causing the event.
   */
  readonly pointerId: number;
  /**
   * The width (magnitude on the X axis), in CSS pixels, of the contact geometry of the pointer
   */
  readonly width: number;
  /**
   * The height (magnitude on the Y axis), in CSS pixels, of the contact geometry of the pointer.
   */
  readonly height: number;
  /**
   * The normalized pressure of the pointer input in the range 0 to 1, where 0 and 1 represent
   * the minimum and maximum pressure the hardware is capable of detecting, respectively.
   */
  readonly pressure: number;
  /**
   * The normalized tangential pressure of the pointer input (also known as barrel pressure or
   * cylinder stress) in the range -1 to 1, where 0 is the neutral position of the control.
   */
  readonly tangentialPressure: number;
  /**
   * The plane angle (in degrees, in the range of -90 to 90) between the Y–Z plane and the plane
   * containing both the pointer (e.g. pen stylus) axis and the Y axis.
   */
  readonly tiltX: number;
  /**
   * The plane angle (in degrees, in the range of -90 to 90) between the X–Z plane and the plane
   * containing both the pointer (e.g. pen stylus) axis and the X axis.
   */
  readonly tiltY: number;
  /**
   * The clockwise rotation of the pointer (e.g. pen stylus) around its major axis in degrees,
   * with a value in the range 0 to 359.
   */
  readonly twist: number;
  /**
   * Indicates the device type that caused the event (mouse, pen, touch, etc.)
   */
  readonly pointerType: string;
  /**
   * Indicates if the pointer represents the primary pointer of this pointer type.
   */
  readonly isPrimary: boolean;
}

export type PointerEvent = NativeSyntheticEvent<NativePointerEvent>;

export type NativeTouchEvent = Readonly<{
  /**
   * Array of all touch events that have changed since the last event
   */
  changedTouches: ReadonlyArray<NativeTouchEvent>,
  /**
   * 3D Touch reported force
   * @platform ios
   */
  force?: number,
  /**
   * The ID of the touch
   */
  identifier: number,
  /**
   * The X position of the touch, relative to the element
   */
  locationX: number,
  /**
   * The Y position of the touch, relative to the element
   */
  locationY: number,
  /**
   * The X position of the touch, relative to the screen
   */
  pageX: number,
  /**
   * The Y position of the touch, relative to the screen
   */
  pageY: number,
  /**
   * The node id of the element receiving the touch event
   */
  target: ?number,
  /**
   * A time identifier for the touch, useful for velocity calculation
   */
  timestamp: number,
  /**
   * Array of all current touches on the screen
   */
  touches: ReadonlyArray<NativeTouchEvent>,
}>;

export type GestureResponderEvent = ResponderSyntheticEvent<NativeTouchEvent>;

export type NativeScrollRectangle = Readonly<{
  bottom: number,
  left: number,
  right: number,
  top: number,
}>;

export type NativeScrollPoint = Readonly<{
  y: number,
  x: number,
}>;

export type NativeScrollVelocity = Readonly<{
  y: number,
  x: number,
}>;

export type NativeScrollSize = Readonly<{
  height: number,
  width: number,
}>;

export type NativeScrollEvent = Readonly<{
  contentInset: NativeScrollRectangle,
  contentOffset: NativeScrollPoint,
  contentSize: NativeScrollSize,
  layoutMeasurement: NativeScrollSize,
  velocity?: NativeScrollVelocity,
  zoomScale?: number,
  responderIgnoreScroll?: boolean,
  /**
   * @platform ios
   */
  targetContentOffset?: NativeScrollPoint,
}>;

export type ScrollEvent = NativeSyntheticEvent<NativeScrollEvent>;

export type TargetedEvent = Readonly<{
  target: number,
  ...
}>;

export type BlurEvent = NativeSyntheticEvent<TargetedEvent>;

export type FocusEvent = NativeSyntheticEvent<TargetedEvent>;

export type MouseEvent = NativeSyntheticEvent<
  Readonly<{
    clientX: number,
    clientY: number,
    pageX: number,
    pageY: number,
    timestamp: number,
  }>,
>;

export type KeyEvent = Readonly<{
  /**
   * The actual key that was pressed. For example, F would be "f" or "F" depending on the shift key.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
   */
  key: string,
  /**
   * The key code of the key that was pressed. For example, F would be "KeyF"
   * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
   */
  code: string,
  altKey: boolean,
  ctrlKey: boolean,
  metaKey: boolean,
  shiftKey: boolean,
  /**
   * A boolean value that is true if the given key is being held down such that it is automatically repeating.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/repeat
   */
  repeat?: boolean,
  /**
   * Returns a boolean value indicating if the event is fired within a composition session
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CompositionEvent/isComposing
   */
  isComposing?: boolean,
}>;

export type KeyUpEvent = NativeSyntheticEvent<KeyEvent>;

export type KeyDownEvent = NativeSyntheticEvent<KeyEvent>;

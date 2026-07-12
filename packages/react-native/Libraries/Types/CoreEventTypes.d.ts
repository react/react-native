/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';
import {HostInstance} from '../../types/public/ReactNativeTypes';

export interface LayoutRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

// @see TextProps.onLayout
export type LayoutChangeEvent = NativeSyntheticEvent<{layout: LayoutRectangle}>;

interface TextLayoutLine {
  ascender: number;
  capHeight: number;
  descender: number;
  height: number;
  text: string;
  width: number;
  x: number;
  xHeight: number;
  y: number;
}

/**
 * @deprecated Use `TextLayoutEvent` instead.
 */
export interface TextLayoutEventData extends TargetedEvent {
  lines: TextLayoutLine[];
}

/**
 * @see TextProps.onTextLayout
 */
export type TextLayoutEvent = NativeSyntheticEvent<TextLayoutEventData>;

// Similar to React.SyntheticEvent except for nativeEvent
export interface NativeSyntheticEvent<T> extends React.BaseSyntheticEvent<
  T,
  HostInstance,
  HostInstance
> {}

export interface NativeTouchEvent {
  /**
   * Array of all touch events that have changed since the last event
   */
  changedTouches: NativeTouchEvent[];

  /**
   * The ID of the touch
   */
  identifier: string;

  /**
   * The X position of the touch, relative to the element
   */
  locationX: number;

  /**
   * The Y position of the touch, relative to the element
   */
  locationY: number;

  /**
   * The X position of the touch, relative to the screen
   */
  pageX: number;

  /**
   * The Y position of the touch, relative to the screen
   */
  pageY: number;

  /**
   * The node id of the element receiving the touch event
   */
  target: string;

  /**
   * A time identifier for the touch, useful for velocity calculation
   */
  timestamp: number;

  /**
   * Array of all current touches on the screen
   */
  touches: NativeTouchEvent[];

  /**
   * 3D Touch reported force
   * @platform ios
   */
  force?: number | undefined;
}

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

export interface GestureResponderEvent extends NativeSyntheticEvent<NativeTouchEvent> {}

export interface MouseEvent extends NativeSyntheticEvent<NativeMouseEvent> {}

export interface TargetedEvent {
  target: number;
}

export type BlurEvent = NativeSyntheticEvent<TargetedEvent>;

export type FocusEvent = NativeSyntheticEvent<TargetedEvent>;

export interface PointerEvents {
  onPointerEnter?: ((event: PointerEvent) => void) | undefined;
  onPointerEnterCapture?: ((event: PointerEvent) => void) | undefined;
  onPointerLeave?: ((event: PointerEvent) => void) | undefined;
  onPointerLeaveCapture?: ((event: PointerEvent) => void) | undefined;
  onPointerMove?: ((event: PointerEvent) => void) | undefined;
  onPointerMoveCapture?: ((event: PointerEvent) => void) | undefined;
  onPointerCancel?: ((event: PointerEvent) => void) | undefined;
  onPointerCancelCapture?: ((event: PointerEvent) => void) | undefined;
  onPointerDown?: ((event: PointerEvent) => void) | undefined;
  onPointerDownCapture?: ((event: PointerEvent) => void) | undefined;
  onPointerUp?: ((event: PointerEvent) => void) | undefined;
  onPointerUpCapture?: ((event: PointerEvent) => void) | undefined;
  onPointerOver?: ((event: PointerEvent) => void) | undefined;
  onPointerOverCapture?: ((event: PointerEvent) => void) | undefined;
  onPointerOut?: ((event: PointerEvent) => void) | undefined;
  onPointerOutCapture?: ((event: PointerEvent) => void) | undefined;
  onGotPointerCapture?: ((event: PointerEvent) => void) | undefined;
  onGotPointerCaptureCapture?: ((event: PointerEvent) => void) | undefined;
  onLostPointerCapture?: ((event: PointerEvent) => void) | undefined;
  onLostPointerCaptureCapture?: ((event: PointerEvent) => void) | undefined;
}

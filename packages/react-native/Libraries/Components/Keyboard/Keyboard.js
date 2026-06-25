/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {EventSubscription} from '../../vendor/emitter/EventEmitter';

import NativeEventEmitter from '../../EventEmitter/NativeEventEmitter';
import LayoutAnimation from '../../LayoutAnimation/LayoutAnimation';
import dismissKeyboard from '../../Utilities/dismissKeyboard';
import Platform from '../../Utilities/Platform';
import NativeKeyboardObserver from './NativeKeyboardObserver';

export type KeyboardEventName = keyof KeyboardEventDefinitions;

export type KeyboardEventEasing =
  | 'easeIn'
  | 'easeInEaseOut'
  | 'easeOut'
  | 'linear'
  | 'keyboard';

export type KeyboardMetrics = Readonly<{
  screenX: number,
  screenY: number,
  width: number,
  height: number,
}>;

export type KeyboardEvent = AndroidKeyboardEvent | IOSKeyboardEvent;

type BaseKeyboardEvent = {
  duration: number,
  easing: KeyboardEventEasing,
  endCoordinates: KeyboardMetrics,
};

export type AndroidKeyboardEvent = Readonly<{
  ...BaseKeyboardEvent,
  duration: 0,
  easing: 'keyboard',
}>;

export type IOSKeyboardEvent = Readonly<{
  ...BaseKeyboardEvent,
  startCoordinates: KeyboardMetrics,
  isEventFromThisApp: boolean,
}>;

type KeyboardEventDefinitions = {
  keyboardWillShow: [KeyboardEvent],
  keyboardDidShow: [KeyboardEvent],
  keyboardWillHide: [KeyboardEvent],
  keyboardDidHide: [KeyboardEvent],
  keyboardWillChangeFrame: [KeyboardEvent],
  keyboardDidChangeFrame: [KeyboardEvent],
};

/**
 * `Keyboard` module to control keyboard events.
 *
 * ### Usage
 *
 * The Keyboard module allows you to listen for native events and react to them, as
 * well as make changes to the keyboard, like dismissing it.
 *
 *```
 * import React, { Component } from 'react';
 * import { Keyboard, TextInput } from 'react-native';
 *
 * class Example extends Component {
 *   componentWillMount () {
 *     this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
 *     this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
 *   }
 *
 *   componentWillUnmount () {
 *     this.keyboardDidShowListener.remove();
 *     this.keyboardDidHideListener.remove();
 *   }
 *
 *   _keyboardDidShow () {
 *     alert('Keyboard Shown');
 *   }
 *
 *   _keyboardDidHide () {
 *     alert('Keyboard Hidden');
 *   }
 *
 *   render() {
 *     return (
 *       <TextInput
 *         onSubmitEditing={Keyboard.dismiss}
 *       />
 *     );
 *   }
 * }
 *```
 */

class KeyboardImpl {
  _currentlyShowing: ?KeyboardEvent;

  _emitter: NativeEventEmitter<KeyboardEventDefinitions> =
    new NativeEventEmitter(
      // T88715063: NativeEventEmitter only used this parameter on iOS. Now it uses it on all platforms, so this code was modified automatically to preserve its behavior
      // If you want to use the native module on other platforms, please remove this condition and test its behavior
      Platform.OS !== 'ios' ? null : NativeKeyboardObserver,
    );

  constructor() {
    this.addListener('keyboardDidShow', ev => {
      this._currentlyShowing = ev;
    });
    this.addListener('keyboardDidHide', _ev => {
      this._currentlyShowing = null;
    });
  }

  /**
   * The `addListener` function connects a JavaScript function to an identified native
   * keyboard notification event.
   *
   * This function then returns the reference to the listener.
   *
   * @param {string} eventName The `nativeEvent` is the string that identifies the event you're listening for.  This
   *can be any of the following:
   *
   * - `keyboardWillShow`
   * - `keyboardDidShow`
   * - `keyboardWillHide`
   * - `keyboardDidHide`
   * - `keyboardWillChangeFrame`
   * - `keyboardDidChangeFrame`
   *
   * Android versions prior to API 30 rely on observing layout changes when
   * `android:windowSoftInputMode` is set to `adjustResize` or `adjustPan`.
   *
   * `keyboardWillShow` as well as `keyboardWillHide` are not available on Android since there is
   * no native corresponding event.
   *
   * @param {function} callback function to be called when the event fires.
   */
  addListener<K extends keyof KeyboardEventDefinitions>(
    eventType: K,
    listener: (...KeyboardEventDefinitions[K]) => unknown,
    context?: unknown,
  ): EventSubscription {
    return this._emitter.addListener(eventType, listener);
  }

  /**
   * Removes all listeners for a specific event type.
   *
   * @param {string} eventType The native event string listeners are watching which will be removed.
   */
  removeAllListeners<K extends keyof KeyboardEventDefinitions>(
    eventType: ?K,
  ): void {
    this._emitter.removeAllListeners(eventType);
  }

  /**
   * Dismisses the active keyboard and removes focus.
   */
  dismiss(): void {
    dismissKeyboard();
  }

  /**
   * Whether the keyboard is last known to be visible.
   */
  isVisible(): boolean {
    return !!this._currentlyShowing;
  }

  /**
   * Return the metrics of the soft-keyboard if visible.
   */
  metrics(): ?KeyboardMetrics {
    return this._currentlyShowing?.endCoordinates;
  }

  /**
   * Useful for syncing TextInput (or other keyboard accessory view) size of
   * position changes with keyboard movements.
   */
  scheduleLayoutAnimation(event: KeyboardEvent): void {
    const {duration, easing} = event;
    if (duration != null && duration !== 0) {
      LayoutAnimation.configureNext({
        duration: duration,
        update: {
          duration: duration,
          type: (easing != null && LayoutAnimation.Types[easing]) || 'keyboard',
        },
      });
    }
  }
}

const Keyboard: KeyboardImpl = new KeyboardImpl();

export default Keyboard;

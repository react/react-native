/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostInstance} from '../../../src/private/types/HostInstance';
import type {EventSubscription} from '../../vendor/emitter/EventEmitter';

import RCTDeviceEventEmitter from '../../EventEmitter/RCTDeviceEventEmitter';
import {sendAccessibilityEvent} from '../../ReactNative/RendererProxy';
import Platform from '../../Utilities/Platform';
import legacySendAccessibilityEvent from './legacySendAccessibilityEvent';
import NativeAccessibilityInfoAndroid from './NativeAccessibilityInfo';
import NativeAccessibilityManagerIOS from './NativeAccessibilityManager';

// Events that are only supported on Android.
type AccessibilityEventDefinitionsAndroid = {
  accessibilityServiceChanged: [boolean],
  highTextContrastChanged: [boolean],
};

// Events that are only supported on iOS.
type AccessibilityEventDefinitionsIOS = {
  announcementFinished: [{announcement: string, success: boolean}],
  boldTextChanged: [boolean],
  darkerSystemColorsChanged: [boolean],
  reduceTransparencyChanged: [boolean],
};

type AccessibilityEventDefinitions = {
  ...AccessibilityEventDefinitionsAndroid,
  ...AccessibilityEventDefinitionsIOS,
  change: [boolean], // screenReaderChanged
  grayscaleChanged: [boolean],
  invertColorsChanged: [boolean],
  reduceMotionChanged: [boolean],
  screenReaderChanged: [boolean],
};

type AccessibilityEventTypes =
  'click' | 'focus' | 'viewHoverEnter' | 'windowStateChange';

// Mapping of public event names to platform-specific event names.
const EventNames: Map<keyof AccessibilityEventDefinitions, string> =
  Platform.OS === 'android'
    ? new Map([
        ['change', 'touchExplorationDidChange'],
        ['reduceMotionChanged', 'reduceMotionDidChange'],
        ['highTextContrastChanged', 'highTextContrastDidChange'],
        ['screenReaderChanged', 'touchExplorationDidChange'],
        ['accessibilityServiceChanged', 'accessibilityServiceDidChange'],
        ['invertColorsChanged', 'invertColorDidChange'],
        ['grayscaleChanged', 'grayscaleModeDidChange'],
      ])
    : new Map([
        ['announcementFinished', 'announcementFinished'],
        ['boldTextChanged', 'boldTextChanged'],
        ['change', 'screenReaderChanged'],
        ['grayscaleChanged', 'grayscaleChanged'],
        ['invertColorsChanged', 'invertColorsChanged'],
        ['reduceMotionChanged', 'reduceMotionChanged'],
        ['reduceTransparencyChanged', 'reduceTransparencyChanged'],
        ['screenReaderChanged', 'screenReaderChanged'],
        ['darkerSystemColorsChanged', 'darkerSystemColorsChanged'],
      ]);

/**
 * Provides information about the device's accessibility features, such as whether a screen reader is active. Can be used to query the current state and register for change notifications.
 *
 * @see https://reactnative.dev/docs/accessibilityinfo
 */
const AccessibilityInfo = {
  /**
   * Query whether bold text is currently enabled.
   *
   * Returns a promise which resolves to a boolean.
   * The result is `true` when bold text is enabled and `false` otherwise.
   *
   * @platform ios
   */
  isBoldTextEnabled(): Promise<boolean> {
    if (Platform.OS === 'android') {
      return Promise.resolve(false);
    } else {
      return new Promise((resolve, reject) => {
        if (NativeAccessibilityManagerIOS != null) {
          NativeAccessibilityManagerIOS.getCurrentBoldTextState(
            resolve,
            reject,
          );
        } else {
          reject(new Error('NativeAccessibilityManagerIOS is not available'));
        }
      });
    }
  },

  /**
   * Query whether grayscale is currently enabled.
   *
   * Returns a promise which resolves to a boolean.
   * The result is `true` when grayscale is enabled and `false` otherwise.
   *
   * @platform ios
   */
  isGrayscaleEnabled(): Promise<boolean> {
    if (Platform.OS === 'android') {
      return new Promise((resolve, reject) => {
        if (NativeAccessibilityInfoAndroid?.isGrayscaleEnabled != null) {
          NativeAccessibilityInfoAndroid.isGrayscaleEnabled(resolve);
        } else {
          reject(
            new Error(
              'NativeAccessibilityInfoAndroid.isGrayscaleEnabled is not available',
            ),
          );
        }
      });
    } else {
      return new Promise((resolve, reject) => {
        if (NativeAccessibilityManagerIOS != null) {
          NativeAccessibilityManagerIOS.getCurrentGrayscaleState(
            resolve,
            reject,
          );
        } else {
          reject(new Error('NativeAccessibilityManagerIOS is not available'));
        }
      });
    }
  },

  /**
   * Query whether inverted colors are currently enabled.
   *
   * Returns a promise which resolves to a boolean.
   * The result is `true` when invert color is enabled and `false` otherwise.
   *
   * @platform ios
   */
  isInvertColorsEnabled(): Promise<boolean> {
    if (Platform.OS === 'android') {
      return new Promise((resolve, reject) => {
        if (NativeAccessibilityInfoAndroid?.isInvertColorsEnabled != null) {
          NativeAccessibilityInfoAndroid.isInvertColorsEnabled(resolve);
        } else {
          reject(
            new Error(
              'NativeAccessibilityInfoAndroid.isInvertColorsEnabled is not available',
            ),
          );
        }
      });
    } else {
      return new Promise((resolve, reject) => {
        if (NativeAccessibilityManagerIOS != null) {
          NativeAccessibilityManagerIOS.getCurrentInvertColorsState(
            resolve,
            reject,
          );
        } else {
          reject(new Error('NativeAccessibilityManagerIOS is not available'));
        }
      });
    }
  },

  /**
   * Query whether reduced motion is currently enabled.
   *
   * Returns a promise which resolves to a boolean.
   * The result is `true` when a reduce motion is enabled and `false` otherwise.
   */
  isReduceMotionEnabled(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (Platform.OS === 'android') {
        if (NativeAccessibilityInfoAndroid != null) {
          NativeAccessibilityInfoAndroid.isReduceMotionEnabled(resolve);
        } else {
          reject(new Error('NativeAccessibilityInfoAndroid is not available'));
        }
      } else {
        if (NativeAccessibilityManagerIOS != null) {
          NativeAccessibilityManagerIOS.getCurrentReduceMotionState(
            resolve,
            reject,
          );
        } else {
          reject(new Error('NativeAccessibilityManagerIOS is not available'));
        }
      }
    });
  },

  /**
   * Query whether high text contrast is currently enabled.
   *
   * Returns a promise which resolves to a boolean.
   * The result is `true` when high text contrast is enabled and `false` otherwise.
   *
   * @platform android
   */
  isHighTextContrastEnabled(): Promise<boolean> {
    if (Platform.OS === 'android') {
      return new Promise((resolve, reject) => {
        if (NativeAccessibilityInfoAndroid?.isHighTextContrastEnabled != null) {
          NativeAccessibilityInfoAndroid.isHighTextContrastEnabled(resolve);
        } else {
          reject(
            new Error(
              'NativeAccessibilityInfoAndroid.isHighTextContrastEnabled is not available',
            ),
          );
        }
      });
    } else {
      return Promise.resolve(false);
    }
  },

  /**
   * Query whether darker system colors is currently enabled.
   *
   * Returns a promise which resolves to a boolean.
   * The result is `true` when darker system colors is enabled and `false` otherwise.
   *
   * @platform ios
   */
  isDarkerSystemColorsEnabled(): Promise<boolean> {
    if (Platform.OS === 'android') {
      return Promise.resolve(false);
    } else {
      return new Promise((resolve, reject) => {
        if (
          NativeAccessibilityManagerIOS?.getCurrentDarkerSystemColorsState !=
          null
        ) {
          NativeAccessibilityManagerIOS.getCurrentDarkerSystemColorsState(
            resolve,
            reject,
          );
        } else {
          reject(
            new Error(
              'NativeAccessibilityManagerIOS.getCurrentDarkerSystemColorsState is not available',
            ),
          );
        }
      });
    }
  },

  /**
   * Query whether cross-fade transitions are preferred over slide transitions.
   *
   * Returns a promise which resolves to a boolean.
   * The result is `true` when cross-fade transitions are preferred and `false` otherwise.
   *
   * @platform ios
   */
  prefersCrossFadeTransitions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      return Promise.resolve(false);
    } else {
      return new Promise((resolve, reject) => {
        if (
          NativeAccessibilityManagerIOS?.getCurrentPrefersCrossFadeTransitionsState !=
          null
        ) {
          NativeAccessibilityManagerIOS.getCurrentPrefersCrossFadeTransitionsState(
            resolve,
            reject,
          );
        } else {
          reject(
            new Error(
              'NativeAccessibilityManagerIOS.getCurrentPrefersCrossFadeTransitionsState is not available',
            ),
          );
        }
      });
    }
  },

  /**
   * Query whether reduced transparency is currently enabled.
   *
   * Returns a promise which resolves to a boolean.
   * The result is `true` when a reduce transparency is enabled and `false` otherwise.
   *
   * @platform ios
   */
  isReduceTransparencyEnabled(): Promise<boolean> {
    if (Platform.OS === 'android') {
      return Promise.resolve(false);
    } else {
      return new Promise((resolve, reject) => {
        if (NativeAccessibilityManagerIOS != null) {
          NativeAccessibilityManagerIOS.getCurrentReduceTransparencyState(
            resolve,
            reject,
          );
        } else {
          reject(new Error('NativeAccessibilityManagerIOS is not available'));
        }
      });
    }
  },

  /**
   * Query whether a screen reader is currently enabled.
   *
   * Returns a promise which resolves to a boolean.
   * The result is `true` when a screen reader is enabled and `false` otherwise.
   */
  isScreenReaderEnabled(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (Platform.OS === 'android') {
        if (NativeAccessibilityInfoAndroid != null) {
          NativeAccessibilityInfoAndroid.isTouchExplorationEnabled(resolve);
        } else {
          reject(new Error('NativeAccessibilityInfoAndroid is not available'));
        }
      } else {
        if (NativeAccessibilityManagerIOS != null) {
          NativeAccessibilityManagerIOS.getCurrentVoiceOverState(
            resolve,
            reject,
          );
        } else {
          reject(new Error('NativeAccessibilityManagerIOS is not available'));
        }
      }
    });
  },

  /**
   * Query whether Accessibility Service is currently enabled.
   *
   * Returns a promise which resolves to a boolean.
   * The result is `true` when any service is enabled and `false` otherwise.
   *
   * @platform android
   */
  isAccessibilityServiceEnabled(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (Platform.OS === 'android') {
        if (
          NativeAccessibilityInfoAndroid != null &&
          NativeAccessibilityInfoAndroid.isAccessibilityServiceEnabled != null
        ) {
          NativeAccessibilityInfoAndroid.isAccessibilityServiceEnabled(resolve);
        } else {
          reject(
            new Error(
              'NativeAccessibilityInfoAndroid.isAccessibilityServiceEnabled is not available',
            ),
          );
        }
      } else {
        reject(
          new Error(
            'isAccessibilityServiceEnabled is only available on Android',
          ),
        );
      }
    });
  },

  /**
   * Add an event handler. Supported events:
   *
   * - `reduceMotionChanged`: Fires when the state of the reduce motion toggle changes.
   *   The argument to the event handler is a boolean. The boolean is `true` when a reduce
   *   motion is enabled (or when "Transition Animation Scale" in "Developer options" is
   *   "Animation off") and `false` otherwise.
   * - `screenReaderChanged`: Fires when the state of the screen reader changes. The argument
   *   to the event handler is a boolean. The boolean is `true` when a screen
   *   reader is enabled and `false` otherwise.
   * - `grayscaleChanged`: Fires when the state of the gray scale toggle changes.
   *   The argument to the event handler is a boolean. The boolean is `true` when gray scale
   *   is enabled and `false` otherwise.
   * - `invertColorsChanged`: Fires when the state of the invert colors toggle
   *   changes. The argument to the event handler is a boolean. The boolean is `true` when invert
   *   colors is enabled and `false` otherwise.
   *
   * These events are only supported on iOS:
   *
   * - `boldTextChanged`: iOS-only event. Fires when the state of the bold text toggle changes.
   *   The argument to the event handler is a boolean. The boolean is `true` when a bold text
   *   is enabled and `false` otherwise.
   * - `reduceTransparencyChanged`: iOS-only event. Fires when the state of the reduce transparency
   *   toggle changes.  The argument to the event handler is a boolean. The boolean is `true`
   *   when a reduce transparency is enabled and `false` otherwise.
   * - `announcementFinished`: iOS-only event. Fires when the screen reader has
   *   finished making an announcement. The argument to the event handler is a
   *   dictionary with these keys:
   *     - `announcement`: The string announced by the screen reader.
   *     - `success`: A boolean indicating whether the announcement was
   *       successfully made.
   * - `darkerSystemColorsChanged`: iOS-only event. Fires when the state of the dark system colors
   *   toggle changes. The argument to the event handler is a boolean. The boolean is `true` when
   *   dark system colors is enabled and `false` otherwise.
   *
   * These events are only supported on Android:
   *
   * - `highTextContrastChanged`: Android-only event. Fires when the state of the high text contrast
   *   toggle changes. The argument to the event handler is a boolean. The boolean is `true` when
   *   high text contrast is enabled and `false` otherwise.
   */
  addEventListener<K extends keyof AccessibilityEventDefinitions>(
    eventName: K,
    // $FlowFixMe[incompatible-type] - Flow bug with unions and generics (T128099423)
    handler: (...AccessibilityEventDefinitions[K]) => void,
  ): EventSubscription {
    const deviceEventName = EventNames.get(eventName);
    return deviceEventName == null
      ? {remove(): void {}}
      : // $FlowFixMe[incompatible-type]
        RCTDeviceEventEmitter.addListener(deviceEventName, handler);
  },

  /**
   * Set accessibility focus to a React component.
   *
   * @deprecated Use `sendAccessibilityEvent` with eventType `focus` instead.
   */
  setAccessibilityFocus(reactTag: number): void {
    legacySendAccessibilityEvent(reactTag, 'focus');
  },

  /**
   * Trigger an accessibility event on a host instance. The `eventType` can be
   * `'focus'`, `'click'`, `'viewHoverEnter'`, or `'windowStateChange'`.
   */
  sendAccessibilityEvent(
    handle: HostInstance,
    eventType: AccessibilityEventTypes,
  ) {
    // iOS only supports 'focus' event types
    if (Platform.OS === 'ios' && eventType === 'click') {
      return;
    }
    // route through React renderer to distinguish between Fabric and non-Fabric handles
    sendAccessibilityEvent(handle, eventType);
  },

  /**
   * Post a string to be announced by the screen reader.
   */
  announceForAccessibility(announcement: string): void {
    if (Platform.OS === 'android') {
      NativeAccessibilityInfoAndroid?.announceForAccessibility(announcement);
    } else {
      NativeAccessibilityManagerIOS?.announceForAccessibility(announcement);
    }
  },

  /**
   * Post a string to be announced by the screen reader with options.
   *
   * - `announcement`: The string announced by the screen reader.
   * - `options`: An object that configures the reading options.
   *   - `queue`: The announcement will be queued behind existing announcements. iOS only.
   *   - `priority`: The priority of the announcement. Possible values: 'low' | 'default' | 'high'.
   *     High priority announcements will interrupt any ongoing speech and cannot be interrupted.
   *     Default priority announcements will interrupt any ongoing speech but can be interrupted.
   *     Low priority announcements will not interrupt ongoing speech and can be interrupted.
   *     (iOS only).
   */
  announceForAccessibilityWithOptions(
    announcement: string,
    options: {queue?: boolean, priority?: 'low' | 'default' | 'high'},
  ): void {
    if (Platform.OS === 'android') {
      NativeAccessibilityInfoAndroid?.announceForAccessibility(announcement);
    } else {
      if (NativeAccessibilityManagerIOS?.announceForAccessibilityWithOptions) {
        NativeAccessibilityManagerIOS?.announceForAccessibilityWithOptions(
          announcement,
          options,
        );
      } else {
        NativeAccessibilityManagerIOS?.announceForAccessibility(announcement);
      }
    }
  },

  /**
   * Get the recommended timeout in milliseconds the user needs, as specified
   * in the device's Accessibility settings.
   *
   * @platform android
   */
  getRecommendedTimeoutMillis(originalTimeout: number): Promise<number> {
    if (Platform.OS === 'android') {
      return new Promise((resolve, reject) => {
        if (
          NativeAccessibilityInfoAndroid?.getRecommendedTimeoutMillis != null
        ) {
          NativeAccessibilityInfoAndroid.getRecommendedTimeoutMillis(
            originalTimeout,
            resolve,
          );
        } else {
          resolve(originalTimeout);
        }
      });
    } else {
      return Promise.resolve(originalTimeout);
    }
  },
};

export default AccessibilityInfo;

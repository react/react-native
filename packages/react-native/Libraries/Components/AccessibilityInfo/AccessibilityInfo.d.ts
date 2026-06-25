/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {HostInstance} from '../../../types/public/ReactNativeTypes';
import {EmitterSubscription} from '../../vendor/emitter/EventEmitter';

type AccessibilityChangeEventName =
  /** Android only */
  | 'accessibilityServiceChanged'
  /** iOS only */
  | 'boldTextChanged'
  /** @deprecated Maps to 'screenReaderChanged' */
  | 'change'
  /** iOS only */
  | 'darkerSystemColorsChanged'
  | 'grayscaleChanged'
  /** Android only */
  | 'highTextContrastChanged'
  | 'invertColorsChanged'
  | 'reduceMotionChanged'
  /** iOS only */
  | 'reduceTransparencyChanged'
  | 'screenReaderChanged';

type AccessibilityChangeEvent = boolean;

type AccessibilityChangeEventHandler = (
  event: AccessibilityChangeEvent,
) => void;

type AccessibilityAnnouncementEventName = 'announcementFinished'; // iOS-only Event

type AccessibilityAnnouncementFinishedEvent = {
  announcement: string;
  success: boolean;
};

type AccessibilityAnnouncementFinishedEventHandler = (
  event: AccessibilityAnnouncementFinishedEvent,
) => void;

type AccessibilityEventTypes =
  | 'click'
  | 'focus'
  | 'viewHoverEnter'
  | 'windowStateChange';

/**
 * @see https://reactnative.dev/docs/accessibilityinfo
 */
export interface AccessibilityInfoStatic {
  /**
   * Query whether bold text is currently enabled.
   *
   * @platform ios
   */
  isBoldTextEnabled: () => Promise<boolean>;

  /**
   * Query whether grayscale is currently enabled.
   *
   * @platform ios
   */
  isGrayscaleEnabled: () => Promise<boolean>;

  /**
   * Query whether invert colors is currently enabled.
   *
   * @platform ios
   */
  isInvertColorsEnabled: () => Promise<boolean>;

  /**
   * Query whether reduce motion is currently enabled.
   */
  isReduceMotionEnabled: () => Promise<boolean>;

  /**
   *
   * Query whether high text contrast is currently enabled.
   *
   * @platform android
   */
  isHighTextContrastEnabled: () => Promise<boolean>;

  /**
   * Query whether darker system colors is currently enabled.
   *
   * @platform ios
   */
  isDarkerSystemColorsEnabled: () => Promise<boolean>;

  /**
   * Query whether reduce motion and prefer cross-fade transitions settings are currently enabled.
   *
   * Returns a promise which resolves to a boolean.
   * The result is `true` when  prefer cross-fade transitions is enabled and `false` otherwise.
   */
  prefersCrossFadeTransitions(): Promise<boolean>;

  /**
   * Query whether reduce transparency is currently enabled.
   *
   * @platform ios
   */
  isReduceTransparencyEnabled: () => Promise<boolean>;

  /**
   * Query whether a screen reader is currently enabled.
   */
  isScreenReaderEnabled: () => Promise<boolean>;

  /**
   * Query whether Accessibility Service is currently enabled.
   *
   * Returns a promise which resolves to a boolean.
   * The result is `true` when any service is enabled and `false` otherwise.
   *
   * @platform android
   */
  isAccessibilityServiceEnabled(): Promise<boolean>;

  /**
   * Add an event handler. Supported events:
   * - announcementFinished: iOS-only event. Fires when the screen reader has finished making an announcement.
   *                         The argument to the event handler is a dictionary with these keys:
   *                          - announcement: The string announced by the screen reader.
   *                          - success: A boolean indicating whether the announcement was successfully made.
   * - AccessibilityEventName constants other than announcementFinished: Fires on accessibility feature change.
   *            The argument to the event handler is a boolean.
   *            The boolean is true when the related event's feature is enabled and false otherwise.
   *
   */
  addEventListener(
    eventName: AccessibilityChangeEventName,
    handler: AccessibilityChangeEventHandler,
  ): EmitterSubscription;
  addEventListener(
    eventName: AccessibilityAnnouncementEventName,
    handler: AccessibilityAnnouncementFinishedEventHandler,
  ): EmitterSubscription;

  /**
   * Set accessibility focus to a react component.
   */
  setAccessibilityFocus: (reactTag: number) => void;

  /**
   * Post a string to be announced by the screen reader.
   */
  announceForAccessibility: (announcement: string) => void;

  /**
   * Post a string to be announced by the screen reader.
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
    options: {
      queue?: boolean | undefined;
      priority?: 'low' | 'default' | 'high' | undefined;
    },
  ): void;

  /**
   * Gets the timeout in millisecond that the user needs.
   * This value is set in "Time to take action (Accessibility timeout)" of "Accessibility" settings.
   *
   * @platform android
   */
  getRecommendedTimeoutMillis: (originalTimeout: number) => Promise<number>;
  sendAccessibilityEvent: (
    handle: HostInstance,
    eventType: AccessibilityEventTypes,
  ) => void;
}

export const AccessibilityInfo: AccessibilityInfoStatic;
export type AccessibilityInfo = AccessibilityInfoStatic;

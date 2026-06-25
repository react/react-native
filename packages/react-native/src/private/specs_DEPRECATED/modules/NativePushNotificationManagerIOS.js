/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {TurboModule} from '../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

type Permissions = {
  alert: boolean,
  badge: boolean,
  sound: boolean,
};

type Notification = {
  readonly alertTitle?: ?string,
  readonly alertBody?: ?string,
  readonly userInfo?: ?Object,
  /**
   * Identifier for the notification category. See the [Apple documentation](https://developer.apple.com/documentation/usernotifications/declaring_your_actionable_notification_types)
   * for more details.
   */
  readonly category?: ?string,
  /**
   * Actual type: string | number
   *
   * Schedule notifications using EITHER `fireDate` or `fireIntervalSeconds`.
   * If both are specified, `fireDate` takes precedence.
   * If you use `presentLocalNotification`, both will be ignored
   * and the notification will be shown immediately.
   */
  readonly fireDate?: ?number,
  /**
   * Seconds from now to display the notification.
   *
   * Schedule notifications using EITHER `fireDate` or `fireIntervalSeconds`.
   * If both are specified, `fireDate` takes precedence.
   * If you use `presentLocalNotification`, both will be ignored
   * and the notification will be shown immediately.
   */
  readonly fireIntervalSeconds?: ?number,
  /** Badge count to display on the app icon. */
  readonly applicationIconBadgeNumber?: ?number,
  /** Whether to silence the notification sound. */
  readonly isSilent?: ?boolean,
  /**
   * Custom notification sound. Can only be set when creating notifications.
   * This will be null for notifications retrieved via
   * getScheduledLocalNotifications or getDeliveredNotifications.
   */
  readonly soundName?: ?string,
};

export interface Spec extends TurboModule {
  readonly getConstants: () => {};
  readonly onFinishRemoteNotification: (
    notificationId: string,
    /**
     * Type:
     *  'UIBackgroundFetchResultNewData' |
     *  'UIBackgroundFetchResultNoData' |
     *  'UIBackgroundFetchResultFailed'
     */
    fetchResult: string,
  ) => void;
  readonly setApplicationIconBadgeNumber: (num: number) => void;
  readonly getApplicationIconBadgeNumber: (
    callback: (num: number) => void,
  ) => void;
  readonly requestPermissions: (permission: {
    readonly alert: boolean,
    readonly badge: boolean,
    readonly sound: boolean,
  }) => Promise<Permissions>;
  readonly abandonPermissions: () => void;
  readonly checkPermissions: (
    callback: (permissions: Permissions) => void,
  ) => void;
  readonly presentLocalNotification: (notification: Notification) => void;
  readonly scheduleLocalNotification: (notification: Notification) => void;
  readonly cancelAllLocalNotifications: () => void;
  readonly cancelLocalNotifications: (userInfo: Object) => void;
  readonly getInitialNotification: () => Promise<?Notification>;
  readonly getScheduledLocalNotifications: (
    callback: (notification: Notification) => void,
  ) => void;
  readonly removeAllDeliveredNotifications: () => void;
  readonly removeDeliveredNotifications: (identifiers: Array<string>) => void;
  readonly getDeliveredNotifications: (
    callback: (notification: Array<Notification>) => void,
  ) => void;
  readonly getAuthorizationStatus: (
    callback: (authorizationStatus: number) => void,
  ) => void;
  readonly addListener: (eventType: string) => void;
  readonly removeListeners: (count: number) => void;
}

export default TurboModuleRegistry.get<Spec>(
  'PushNotificationManager',
) as ?Spec;

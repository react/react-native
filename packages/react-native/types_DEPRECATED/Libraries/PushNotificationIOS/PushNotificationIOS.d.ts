/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

export interface PushNotificationPermissions {
  alert?: boolean | undefined;
  badge?: boolean | undefined;
  sound?: boolean | undefined;
}

export interface PushNotification {
  /**
   * An alias for `getAlert` to get the notification's main message string
   */
  getMessage(): string | Object;

  /**
   * Gets the sound string from the `aps` object
   */
  getSound(): string;

  /**
   * Gets the category string from the `aps` object
   */
  getCategory(): string;

  /**
   * Gets the notification's main message from the `aps` object
   */
  getAlert(): string | Object;

  /**
   * Gets the content-available number from the `aps` object
   */
  getContentAvailable(): number;

  /**
   * Gets the badge count number from the `aps` object
   */
  getBadgeCount(): number;

  /**
   * Gets the data object on the notif
   */
  getData(): Object;

  /**
   * Gets the thread ID on the notif
   */
  getThreadId(): string;

  /**
   * iOS Only
   * Signifies remote notification handling is complete
   */
  finish(result: string): void;
}

type PresentLocalNotificationDetails = {
  alertBody: string;
  alertAction: string;
  alertTitle?: string | undefined;
  soundName?: string | undefined;
  category?: string | undefined;
  userInfo?: Object | undefined;
  applicationIconBadgeNumber?: number | undefined;
};

type ScheduleLocalNotificationDetails = {
  alertAction?: string | undefined;
  alertBody?: string | undefined;
  alertTitle?: string | undefined;
  applicationIconBadgeNumber?: number | undefined;
  category?: string | undefined;
  fireDate?: number | string | undefined;
  isSilent?: boolean | undefined;
  repeatInterval?:
    'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | undefined;
  soundName?: string | undefined;
  userInfo?: Object | undefined;
};

export type PushNotificationEventName =
  'notification' | 'localNotification' | 'register' | 'registrationError';

type FetchResult = {
  NewData: 'UIBackgroundFetchResultNewData';
  NoData: 'UIBackgroundFetchResultNoData';
  ResultFailed: 'UIBackgroundFetchResultFailed';
};

/**
 * Handle push notifications for your app, including permission handling and icon badge number.
 * @see https://reactnative.dev/docs/pushnotificationios#content
 *
 * //FIXME: BGR: The documentation seems completely off compared to the actual js implementation. I could never get the example to run
 */
export interface PushNotificationIOSStatic {
  /**
   * Schedules the localNotification for immediate presentation.
   * details is an object containing:
   * alertBody : The message displayed in the notification alert.
   * alertAction : The "action" displayed beneath an actionable notification. Defaults to "view";
   * soundName : The sound played when the notification is fired (optional).
   * category : The category of this notification, required for actionable notifications (optional).
   * userInfo : An optional object containing additional notification data.
   * applicationIconBadgeNumber (optional) : The number to display as the app's icon badge. The default value of this property is 0, which means that no badge is displayed.
   */
  presentLocalNotification(details: PresentLocalNotificationDetails): void;

  /**
   * Schedules the localNotification for future presentation.
   * details is an object containing:
   * fireDate : The date and time when the system should deliver the notification.
   * alertBody : The message displayed in the notification alert.
   * alertAction : The "action" displayed beneath an actionable notification. Defaults to "view";
   * soundName : The sound played when the notification is fired (optional).
   * category : The category of this notification, required for actionable notifications (optional).
   * userInfo : An optional object containing additional notification data.
   * applicationIconBadgeNumber (optional) : The number to display as the app's icon badge. Setting the number to 0 removes the icon badge.
   */
  scheduleLocalNotification(details: ScheduleLocalNotificationDetails): void;

  /**
   * Cancels all scheduled localNotifications
   */
  cancelAllLocalNotifications(): void;

  /**
   * Remove all delivered notifications from Notification Center.
   */
  removeAllDeliveredNotifications(): void;

  /**
   * Provides you with a list of the app’s notifications that are still displayed in Notification Center.
   */
  getDeliveredNotifications(callback: (notifications: Object[]) => void): void;

  /**
   * Removes the specified notifications from Notification Center
   */
  removeDeliveredNotifications(identifiers: string[]): void;

  /**
   * Cancel local notifications.
   * Optionally restricts the set of canceled notifications to those notifications whose userInfo fields match the corresponding fields in the userInfo argument.
   */
  cancelLocalNotifications(userInfo: Object): void;

  /**
   * Sets the badge number for the app icon on the home screen
   */
  setApplicationIconBadgeNumber(number: number): void;

  /**
   * Gets the current badge number for the app icon on the home screen
   */
  getApplicationIconBadgeNumber(callback: (badge: number) => void): void;

  /**
   * Gets the local notifications that are currently scheduled.
   */
  getScheduledLocalNotifications(
    callback: (notifications: ScheduleLocalNotificationDetails[]) => void,
  ): void;

  /**
   * Attaches a listener to remote notifications while the app is running in the
   * foreground or the background.
   *
   * The handler will get be invoked with an instance of `PushNotificationIOS`
   *
   * The type MUST be 'notification'
   */
  addEventListener(
    type: 'notification' | 'localNotification',
    handler: (notification: PushNotification) => void,
  ): void;

  /**
   * Fired when the user registers for remote notifications.
   *
   * The handler will be invoked with a hex string representing the deviceToken.
   *
   * The type MUST be 'register'
   */
  addEventListener(
    type: 'register',
    handler: (deviceToken: string) => void,
  ): void;

  /**
   * Fired when the user fails to register for remote notifications.
   * Typically occurs when APNS is having issues, or the device is a simulator.
   *
   * The handler will be invoked with {message: string, code: number, details: any}.
   *
   * The type MUST be 'registrationError'
   */
  addEventListener(
    type: 'registrationError',
    handler: (error: {message: string; code: number; details: any}) => void,
  ): void;

  /**
   * Removes the event listener. Do this in `componentWillUnmount` to prevent
   * memory leaks
   */
  removeEventListener(
    type: PushNotificationEventName,
    handler:
      | ((notification: PushNotification) => void)
      | ((deviceToken: string) => void)
      | ((error: {message: string; code: number; details: any}) => void),
  ): void;

  /**
   * Requests all notification permissions from iOS, prompting the user's
   * dialog box.
   */
  requestPermissions(permissions?: PushNotificationPermissions[]): void;

  /**
   * Requests all notification permissions from iOS, prompting the user's
   * dialog box.
   */
  requestPermissions(
    permissions?: PushNotificationPermissions,
  ): Promise<PushNotificationPermissions>;

  /**
   * Unregister for all remote notifications received via Apple Push
   * Notification service.
   * You should call this method in rare circumstances only, such as when
   * a new version of the app removes support for all types of remote
   * notifications. Users can temporarily prevent apps from receiving
   * remote notifications through the Notifications section of the
   * Settings app. Apps unregistered through this method can always
   * re-register.
   */
  abandonPermissions(): void;

  /**
   * See what push permissions are currently enabled. `callback` will be
   * invoked with a `permissions` object:
   *
   *  - `alert` :boolean
   *  - `badge` :boolean
   *  - `sound` :boolean
   */
  checkPermissions(
    callback: (permissions: PushNotificationPermissions) => void,
  ): void;

  /**
   * This method returns a promise that resolves to either the notification
   * object if the app was launched by a push notification, or `null` otherwise.
   */
  getInitialNotification(): Promise<PushNotification | null>;

  /**
   * iOS fetch results that best describe the result of a finished remote notification handler.
   * For a list of possible values, see `PushNotificationIOS.FetchResult`.
   */
  FetchResult: FetchResult;
}

/**
 * PushNotificationIOS has been extracted from react-native core and will be removed in a future release.
 * It can now be installed and imported from `@react-native-community/push-notification-ios` instead of 'react-native'.
 * @see https://github.com/react-native-community/react-native-push-notification-ios
 * @deprecated
 */
export const PushNotificationIOS: PushNotificationIOSStatic;
/**
 * PushNotificationIOS has been extracted from react-native core and will be removed in a future release.
 * It can now be installed and imported from `@react-native-community/push-notification-ios` instead of 'react-native'.
 * @see https://github.com/react-native-community/react-native-push-notification-ios
 * @deprecated
 */
export type PushNotificationIOS = PushNotificationIOSStatic;

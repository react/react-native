/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {EventSubscription} from '../vendor/emitter/EventEmitter';

import NativeEventEmitter from '../EventEmitter/NativeEventEmitter';
import Platform from '../Utilities/Platform';
import NativeIntentAndroid from './NativeIntentAndroid';
import NativeLinkingManager from './NativeLinkingManager';
import invariant from 'invariant';
import nullthrows from 'nullthrows';

type LinkingEventDefinitions = {
  url: [{url: string}],
};

class LinkingImpl extends NativeEventEmitter<LinkingEventDefinitions> {
  constructor() {
    super(Platform.OS === 'ios' ? nullthrows(NativeLinkingManager) : undefined);
  }

  /**
   * Add a handler to Linking changes by listening to the `url` event type
   * and providing the handler
   *
   * See https://reactnative.dev/docs/linking#addeventlistener
   */
  addEventListener<K extends keyof LinkingEventDefinitions>(
    eventType: K,
    listener: (...LinkingEventDefinitions[K]) => unknown,
  ): EventSubscription {
    return this.addListener(eventType, listener);
  }

  /**
   * Try to open the given `url` with any of the installed apps.
   * You can use other URLs, like a location (e.g. "geo:37.484847,-122.148386"), a contact, or any other URL that can be opened with the installed apps.
   * NOTE: This method will fail if the system doesn't know how to open the specified URL. If you're passing in a non-http(s) URL, it's best to check {@code canOpenURL} first.
   * NOTE: For web URLs, the protocol ("http://", "https://") must be set accordingly!
   *
   * See https://reactnative.dev/docs/linking#openurl
   */
  openURL(url: string): Promise<void> {
    this._validateURL(url);
    if (Platform.OS === 'android') {
      return nullthrows(NativeIntentAndroid).openURL(url);
    } else {
      return nullthrows(NativeLinkingManager).openURL(url);
    }
  }

  /**
   * Determine whether or not an installed app can handle a given URL.
   * NOTE: For web URLs, the protocol ("http://", "https://") must be set accordingly!
   * NOTE: As of iOS 9, your app needs to provide the LSApplicationQueriesSchemes key inside Info.plist.
   * @param URL the URL to open
   *
   * See https://reactnative.dev/docs/linking#canopenurl
   */
  canOpenURL(url: string): Promise<boolean> {
    this._validateURL(url);
    if (Platform.OS === 'android') {
      return nullthrows(NativeIntentAndroid).canOpenURL(url);
    } else {
      return nullthrows(NativeLinkingManager).canOpenURL(url);
    }
  }

  /**
   * Open the Settings app and displays the app’s custom settings, if it has any.
   *
   * See https://reactnative.dev/docs/linking#opensettings
   */
  openSettings(): Promise<void> {
    if (Platform.OS === 'android') {
      return nullthrows(NativeIntentAndroid).openSettings();
    } else {
      return nullthrows(NativeLinkingManager).openSettings();
    }
  }

  /**
   * If the app launch was triggered by an app link,
   * it will give the link url, otherwise it will give `null`
   * NOTE: To support deep linking on Android, refer http://developer.android.com/training/app-indexing/deep-linking.html#handling-intents
   *
   * See https://reactnative.dev/docs/linking#getinitialurl
   */
  getInitialURL(): Promise<?string> {
    return Platform.OS === 'android'
      ? nullthrows(NativeIntentAndroid).getInitialURL()
      : nullthrows(NativeLinkingManager).getInitialURL();
  }

  /**
   * Sends an Android Intent - a broad surface to express Android functions.  Useful for deep-linking to settings pages,
   * opening an SMS app with a message draft in place, and more.  See https://developer.android.com/reference/kotlin/android/content/Intent?hl=en
   *
   * @platform android
   *
   * See https://reactnative.dev/docs/linking#sendintent
   */
  sendIntent(
    action: string,
    extras?: Array<{
      key: string,
      value: string | number | boolean,
      ...
    }>,
  ): Promise<void> {
    if (Platform.OS === 'android') {
      return nullthrows(NativeIntentAndroid).sendIntent(action, extras);
    } else {
      return new Promise((resolve, reject) => reject(new Error('Unsupported')));
    }
  }

  _validateURL(url: string): void {
    invariant(
      typeof url === 'string',
      'Invalid URL: should be a string. Was: ' + url,
    );
    invariant(url, 'Invalid URL: cannot be empty');
  }
}

const Linking: LinkingImpl = new LinkingImpl();

/**
 * `Linking` gives you a general interface to interact with both incoming
 * and outgoing app links.
 *
 * See https://reactnative.dev/docs/linking
 */
export default Linking;

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
   * Listen for incoming URL changes.
   */
  addEventListener<K extends keyof LinkingEventDefinitions>(
    eventType: K,
    listener: (...LinkingEventDefinitions[K]) => unknown,
  ): EventSubscription {
    return this.addListener(eventType, listener);
  }

  /**
   * Open the given URL with any installed app that can handle it. This
   * includes URLs such as locations (e.g. "geo:37.484847,-122.148386"),
   * contacts, or any other URL that can be opened with installed apps.
   *
   * This method will fail if the system doesn't know how to open the
   * specified URL. If you're passing in a non-http(s) URL, it's best to
   * check `canOpenURL` first. For web URLs, the protocol ("http://",
   * "https://") must be set accordingly.
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
   * Check whether an installed app can handle a given URL. For web URLs,
   * the protocol ("http://", "https://") must be set accordingly. As of
   * iOS 9, your app needs to provide the `LSApplicationQueriesSchemes`
   * key inside Info.plist.
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
   * Open the device Settings app and display the app’s custom settings, if
   * it has any.
   */
  openSettings(): Promise<void> {
    if (Platform.OS === 'android') {
      return nullthrows(NativeIntentAndroid).openSettings();
    } else {
      return nullthrows(NativeLinkingManager).openSettings();
    }
  }

  /**
   * Get the URL that launched the app, or `null` if it was not launched from
   * a link. To support deep linking on Android, see
   * https://developer.android.com/training/app-indexing/deep-linking.html#handling-intents.
   */
  getInitialURL(): Promise<?string> {
    return Platform.OS === 'android'
      ? nullthrows(NativeIntentAndroid).getInitialURL()
      : nullthrows(NativeLinkingManager).getInitialURL();
  }

  /**
   * Launch an Android intent with optional extras. Useful for deep-linking
   * to settings pages, opening an SMS app with a message draft in place,
   * and more. See https://developer.android.com/reference/kotlin/android/content/Intent.
   *
   * @platform android
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
 * General interface to interact with both incoming and outgoing app links,
 * including deep links and universal links.
 *
 * @see https://reactnative.dev/docs/linking
 */
export default Linking;

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
   * Open app settings.
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
   *
   * See https://reactnative.dev/docs/linking#getinitialurl
   */
  getInitialURL(): Promise<?string> {
    return Platform.OS === 'android'
      ? nullthrows(NativeIntentAndroid).getInitialURL()
      : nullthrows(NativeLinkingManager).getInitialURL();
  }

  /*
   * Launch an Android intent with extras (optional)
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

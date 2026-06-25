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
import NativeDevSettings from '../NativeModules/specs/NativeDevSettings';
import Platform from '../Utilities/Platform';

/**
 * The DevSettings module exposes methods for customizing settings for developers in development.
 */
let DevSettings: {
  /**
   * Adds a custom menu item to the developer menu.
   *
   * @param title - The title of the menu item. Is internally used as id and should therefore be unique.
   * @param handler - The callback invoked when pressing the menu item.
   */
  addMenuItem(title: string, handler: () => unknown): void,
  /**
   * Reload the application.
   *
   * @param reason
   */
  reload(reason?: string): void,
  onFastRefresh(): void,
} = {
  addMenuItem(title: string, handler: () => unknown): void {},
  reload(reason?: string): void {},
  onFastRefresh(): void {},
};

type DevSettingsEventDefinitions = {
  didPressMenuItem: [{title: string}],
};

if (__DEV__) {
  const emitter = new NativeEventEmitter<DevSettingsEventDefinitions>(
    // T88715063: NativeEventEmitter only used this parameter on iOS. Now it uses it on all platforms, so this code was modified automatically to preserve its behavior
    // If you want to use the native module on other platforms, please remove this condition and test its behavior
    Platform.OS !== 'ios' ? null : NativeDevSettings,
  );
  const subscriptions = new Map<string, EventSubscription>();

  DevSettings = {
    addMenuItem(title: string, handler: () => unknown): void {
      // Make sure items are not added multiple times. This can
      // happen when hot reloading the module that registers the
      // menu items. The title is used as the id which means we
      // don't support multiple items with the same name.
      let subscription = subscriptions.get(title);
      if (subscription != null) {
        subscription.remove();
      } else {
        NativeDevSettings.addMenuItem(title);
      }

      subscription = emitter.addListener('didPressMenuItem', event => {
        if (event.title === title) {
          handler();
        }
      });
      subscriptions.set(title, subscription);
    },
    reload(reason?: string): void {
      if (NativeDevSettings.reloadWithReason != null) {
        NativeDevSettings.reloadWithReason(reason ?? 'Uncategorized from JS');
      } else {
        NativeDevSettings.reload();
      }
    },
    onFastRefresh(): void {
      NativeDevSettings.onFastRefresh?.();
    },
  };
}

export default DevSettings;

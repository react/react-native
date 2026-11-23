/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  BackHandlerOptions,
  BackHandlerSubscription,
  BackPressEventName,
} from '../BackHandler';
import type {HardwareBackPressEvent} from '../HardwareBackPressEvent';

import {HardwareBackPressEvent as HardwareBackPressEventClass} from '../HardwareBackPressEvent';

const _backPressSubscriptions = new Set<
  (event: HardwareBackPressEvent) => ?boolean,
>();

const BackHandler = {
  exitApp: jest.fn() as () => void,

  addEventListener: function (
    eventName: BackPressEventName,
    handler: (event: HardwareBackPressEvent) => ?boolean,
    _options?: BackHandlerOptions,
  ): BackHandlerSubscription {
    _backPressSubscriptions.add(handler);
    return {
      remove: () => {
        _backPressSubscriptions.delete(handler);
      },
      setInterceptEnabled: (_enabled: boolean) => {},
    };
  },

  mockPressBack: function () {
    const event = new HardwareBackPressEventClass();
    let invokeDefault = true;
    const subscriptions = [..._backPressSubscriptions].reverse();
    for (let i = 0; i < subscriptions.length; ++i) {
      if (subscriptions[i](event)) {
        invokeDefault = false;
        break;
      }
    }

    if (invokeDefault) {
      BackHandler.exitApp();
    }
  },
};

export default BackHandler;

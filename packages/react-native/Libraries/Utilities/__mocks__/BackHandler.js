/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {BackPressEventName} from '../BackHandler';
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
  ): {remove: () => void, ...} {
    _backPressSubscriptions.add(handler);
    return {
      remove: () => {
        _backPressSubscriptions.delete(handler);
      },
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

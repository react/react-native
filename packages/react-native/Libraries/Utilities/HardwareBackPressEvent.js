/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {EventInit} from '../../src/private/webapis/dom/events/Event';

import Event from '../../src/private/webapis/dom/events/Event';

/**
 * Event dispatched when the hardware back button is pressed on Android.
 */
export class HardwareBackPressEvent extends Event {
  constructor(options?: ?EventInit) {
    super('hardwareBackPress', options);
  }
}

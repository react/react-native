/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {EventInit} from '../../webapis/dom/events/Event';
import type {DispatchConfig} from './LegacySyntheticEvent';
import type {TouchHistory} from './ResponderTouchHistoryStore';

import LegacySyntheticEvent from './LegacySyntheticEvent';

// flowlint unsafe-getters-setters:off

/**
 * Event class for responder system events. Extends LegacySyntheticEvent with
 * a `touchHistory` field that tracks active touch positions.
 */
export default class ResponderEvent extends LegacySyntheticEvent {
  _touchHistory: TouchHistory;

  constructor(
    type: string,
    options: EventInit,
    nativeEvent: {[string]: unknown},
    dispatchConfig: ?DispatchConfig,
    touchHistory: TouchHistory,
  ) {
    super(type, options, nativeEvent, dispatchConfig);
    this._touchHistory = touchHistory;
  }

  get touchHistory(): TouchHistory {
    return this._touchHistory;
  }
}

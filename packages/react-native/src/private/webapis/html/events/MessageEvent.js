/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

/**
 * This module implements the `MessageEvent` interface from the HTML spec.
 * See https://html.spec.whatwg.org/multipage/comms.html#messageevent.
 */

// flowlint unsafe-getters-setters:off

import type {EventInit} from '../../dom/events/Event';

import Event from '../../dom/events/Event';

export interface MessageEventInit extends EventInit {
  readonly data?: unknown;
  readonly origin?: string;
  readonly lastEventId?: string;
  // Unsupported
  // +source?: MessageEventSource,
  // Unsupported
  // +ports?: Array<MessagePort>,
}

export default class MessageEvent extends Event {
  _data: unknown;
  _origin: string;
  _lastEventId: string;

  constructor(type: string, options?: ?MessageEventInit) {
    super(type, options);

    this._data = options?.data;
    this._origin = String(options?.origin ?? '');
    this._lastEventId = String(options?.lastEventId ?? '');
  }

  get data(): unknown {
    return this._data;
  }

  get origin(): string {
    return this._origin;
  }

  get lastEventId(): string {
    return this._lastEventId;
  }
}

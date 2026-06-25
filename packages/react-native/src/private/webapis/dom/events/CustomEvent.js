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
 * This module implements the `CustomEvent` interface from the DOM.
 * See https://dom.spec.whatwg.org/#interface-customevent.
 */

// flowlint unsafe-getters-setters:off

import type {EventInit} from './Event';

import Event from './Event';

export interface CustomEventInit extends EventInit {
  readonly detail?: unknown;
}

export default class CustomEvent extends Event {
  _detail: unknown;

  constructor(type: string, options?: ?CustomEventInit) {
    super(type, options);

    this._detail = options?.detail;
  }

  get detail(): unknown {
    return this._detail;
  }
}

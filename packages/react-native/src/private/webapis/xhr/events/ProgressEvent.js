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
 * This module implements the `ProgressEvent` interface from `XMLHttpRequest`.
 * See https://xhr.spec.whatwg.org/#interface-progressevent.
 */

// flowlint unsafe-getters-setters:off

import type {EventInit} from '../../dom/events/Event';

import Event from '../../dom/events/Event';

export interface ProgressEventInit extends EventInit {
  readonly lengthComputable: boolean;
  readonly loaded: number;
  readonly total: number;
}

export default class ProgressEvent extends Event {
  _lengthComputable: boolean;
  _loaded: number;
  _total: number;

  constructor(type: string, options?: ?ProgressEventInit) {
    super(type, options);

    this._lengthComputable = Boolean(options?.lengthComputable);
    this._loaded = Number(options?.loaded) || 0;
    this._total = Number(options?.total) || 0;
  }

  get lengthComputable(): boolean {
    return this._lengthComputable;
  }

  get loaded(): number {
    return this._loaded;
  }

  get total(): number {
    return this._total;
  }
}

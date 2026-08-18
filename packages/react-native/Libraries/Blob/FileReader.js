/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {EventCallback} from '../../src/private/webapis/dom/events/EventTarget';
import type Blob from './Blob';

import Event from '../../src/private/webapis/dom/events/Event';
import {
  getEventHandlerAttribute,
  setEventHandlerAttribute,
} from '../../src/private/webapis/dom/events/EventHandlerAttributes';
import EventTarget from '../../src/private/webapis/dom/events/EventTarget';
import DOMException from '../../src/private/webapis/errors/DOMException';
import NativeFileReaderModule from './NativeFileReaderModule';
import {toByteArray} from 'base64-js';

type ReadyState =
  | 0 // EMPTY
  | 1 // LOADING
  | 2; // DONE

type ReaderResult = string | ArrayBuffer;

const EMPTY = 0;
const LOADING = 1;
const DONE = 2;

class FileReader extends EventTarget {
  static EMPTY: number = EMPTY;
  static LOADING: number = LOADING;
  static DONE: number = DONE;

  EMPTY: number = EMPTY;
  LOADING: number = LOADING;
  DONE: number = DONE;

  _readyState: ReadyState;
  _error: ?DOMException;
  _result: ?ReaderResult;
  _aborted: boolean = false;
  _readId: number = 0;
  // Keep the Blob strongly referenced until the native read settles. If the
  // caller drops its own reference the Blob can be GC'd mid-read. Its
  // BlobCollector finalizer then frees the native buffer and the read fails
  // with "The specified blob is invalid".
  _blob: ?Blob;

  constructor() {
    super();
    this._reset();
  }

  _reset(): void {
    this._readyState = EMPTY;
    this._error = null;
    this._result = null;
    this._blob = null;
  }

  _startRead(methodName: string): number {
    if (this._readyState === LOADING) {
      throw new DOMException(
        `Failed to execute '${methodName}' on 'FileReader': The object is already busy reading Blobs.`,
        'InvalidStateError',
      );
    }
    this._aborted = false;
    this._error = null;
    this._result = null;
    const readId = ++this._readId;
    this._setReadyState(LOADING);
    return readId;
  }

  _setReadyState(newState: ReadyState) {
    this._readyState = newState;
    this.dispatchEvent(new Event('readystatechange'));
    if (newState === LOADING) {
      this.dispatchEvent(new Event('loadstart'));
    } else if (newState === DONE) {
      if (this._aborted) {
        this.dispatchEvent(new Event('abort'));
      } else if (this._error) {
        this.dispatchEvent(new Event('error'));
      } else {
        this.dispatchEvent(new Event('load'));
      }
      if (this._readyState !== LOADING) {
        this.dispatchEvent(new Event('loadend'));
      }
    }
  }

  _toDOMException(error: unknown): DOMException {
    if (error instanceof DOMException) {
      return error;
    }
    if (error instanceof Error) {
      return new DOMException(error.message, 'NotReadableError');
    }
    return new DOMException(String(error), 'NotReadableError');
  }

  readAsArrayBuffer(blob: ?Blob): void {
    if (blob == null) {
      throw new TypeError(
        "Failed to execute 'readAsArrayBuffer' on 'FileReader': parameter 1 is not of type 'Blob'",
      );
    }

    const readId = this._startRead('readAsArrayBuffer');
    // Skip if this read is no longer current: a synchronous loadstart or
    // readystatechange handler may have aborted or started another read during
    // _startRead, so setting _blob here would leak or clobber the newer read's.
    if (readId === this._readId) {
      this._blob = blob;
    }

    NativeFileReaderModule.readAsDataURL(blob.data).then(
      (text: string) => {
        if (readId !== this._readId) {
          return;
        }
        this._blob = null;

        const base64 = text.split(',')[1];
        const typedArray = toByteArray(base64);

        this._result = typedArray.buffer;
        this._setReadyState(DONE);
      },
      error => {
        if (readId !== this._readId) {
          return;
        }
        this._blob = null;
        this._error = this._toDOMException(error);
        this._setReadyState(DONE);
      },
    );
  }

  readAsDataURL(blob: ?Blob): void {
    if (blob == null) {
      throw new TypeError(
        "Failed to execute 'readAsDataURL' on 'FileReader': parameter 1 is not of type 'Blob'",
      );
    }

    const readId = this._startRead('readAsDataURL');
    if (readId === this._readId) {
      this._blob = blob;
    }

    NativeFileReaderModule.readAsDataURL(blob.data).then(
      (text: string) => {
        if (readId !== this._readId) {
          return;
        }
        this._blob = null;
        this._result = text;
        this._setReadyState(DONE);
      },
      error => {
        if (readId !== this._readId) {
          return;
        }
        this._blob = null;
        this._error = this._toDOMException(error);
        this._setReadyState(DONE);
      },
    );
  }

  readAsText(blob: ?Blob, encoding: string = 'UTF-8'): void {
    if (blob == null) {
      throw new TypeError(
        "Failed to execute 'readAsText' on 'FileReader': parameter 1 is not of type 'Blob'",
      );
    }

    const readId = this._startRead('readAsText');
    if (readId === this._readId) {
      this._blob = blob;
    }

    NativeFileReaderModule.readAsText(blob.data, encoding).then(
      (text: string) => {
        if (readId !== this._readId) {
          return;
        }
        this._blob = null;
        this._result = text;
        this._setReadyState(DONE);
      },
      error => {
        if (readId !== this._readId) {
          return;
        }
        this._blob = null;
        this._error = this._toDOMException(error);
        this._setReadyState(DONE);
      },
    );
  }

  abort() {
    this._result = null;
    if (this._readyState === LOADING) {
      this._aborted = true;
      this._readId++;
      // The abandoned read's callbacks bail out on the readId check without
      // clearing _blob, so release it here, before dispatching the abort event
      // whose handler may start a new read that sets _blob again.
      this._blob = null;
      this._setReadyState(DONE);
    }
  }

  get readyState(): ReadyState {
    return this._readyState;
  }

  get error(): ?DOMException {
    return this._error;
  }

  get result(): ?ReaderResult {
    return this._result;
  }

  get onabort(): EventCallback | null {
    return getEventHandlerAttribute(this, 'abort');
  }

  set onabort(listener: ?EventCallback) {
    setEventHandlerAttribute(this, 'abort', listener);
  }

  get onerror(): EventCallback | null {
    return getEventHandlerAttribute(this, 'error');
  }

  set onerror(listener: ?EventCallback) {
    setEventHandlerAttribute(this, 'error', listener);
  }

  get onload(): EventCallback | null {
    return getEventHandlerAttribute(this, 'load');
  }

  set onload(listener: ?EventCallback) {
    setEventHandlerAttribute(this, 'load', listener);
  }

  get onloadstart(): EventCallback | null {
    return getEventHandlerAttribute(this, 'loadstart');
  }

  set onloadstart(listener: ?EventCallback) {
    setEventHandlerAttribute(this, 'loadstart', listener);
  }

  get onloadend(): EventCallback | null {
    return getEventHandlerAttribute(this, 'loadend');
  }

  set onloadend(listener: ?EventCallback) {
    setEventHandlerAttribute(this, 'loadend', listener);
  }

  get onprogress(): EventCallback | null {
    return getEventHandlerAttribute(this, 'progress');
  }

  set onprogress(listener: ?EventCallback) {
    setEventHandlerAttribute(this, 'progress', listener);
  }
}

export default FileReader;

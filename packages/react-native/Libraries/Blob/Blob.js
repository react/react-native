/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {BlobData, BlobOptions} from './BlobTypes';

/**
 * Opaque JS representation of some binary data in native.
 *
 * The API is modeled after the W3C Blob API, with one caveat
 * regarding explicit deallocation. Refer to the `close()`
 * method for further details.
 *
 * Example usage in a React component:
 *
 *   class WebSocketImage extends React.Component {
 *      state = {blob: null};
 *      componentDidMount() {
 *        let ws = this.ws = new WebSocket(...);
 *        ws.binaryType = 'blob';
 *        ws.onmessage = (event) => {
 *          if (this.state.blob) {
 *            this.state.blob.close();
 *          }
 *          this.setState({blob: event.data});
 *        };
 *      }
 *      componentUnmount() {
 *        if (this.state.blob) {
 *          this.state.blob.close();
 *        }
 *        this.ws.close();
 *      }
 *      render() {
 *        if (!this.state.blob) {
 *          return <View />;
 *        }
 *        return <Image source={{uri: URL.createObjectURL(this.state.blob)}} />;
 *      }
 *   }
 *
 * Reference: https://developer.mozilla.org/en-US/docs/Web/API/Blob
 */
class Blob {
  _data: ?BlobData;

  /**
   * Constructor for JS consumers.
   * Currently we only support creating Blobs from other Blobs.
   * Reference: https://developer.mozilla.org/en-US/docs/Web/API/Blob/Blob
   */
  constructor(parts: Array<Blob | string> = [], options?: BlobOptions) {
    const BlobManager = require('./BlobManager').default;
    this.data = BlobManager.createFromParts(parts, options).data;
  }

  /*
   * This method is used to create a new Blob object containing
   * the data in the specified range of bytes of the source Blob.
   * Reference: https://developer.mozilla.org/en-US/docs/Web/API/Blob/slice
   */
  // $FlowFixMe[unsafe-getters-setters]
  set data(data: ?BlobData) {
    this._data = data;
  }

  // $FlowFixMe[unsafe-getters-setters]
  get data(): BlobData {
    if (!this._data) {
      throw new Error('Blob has been closed and is no longer available');
    }

    return this._data;
  }

  slice(start?: number, end?: number, contentType?: string = ''): Blob {
    const BlobManager = require('./BlobManager').default;
    let {offset, size} = this.data;

    if (typeof start === 'number') {
      if (start < 0) {
        // A negative start is relative to the end of the blob.
        // $FlowFixMe[reassign-const]
        start = Math.max(this.size + start, 0);
      }
      if (start > size) {
        // $FlowFixMe[reassign-const]
        start = size;
      }
      offset += start;
      size -= start;

      if (typeof end === 'number') {
        if (end < 0) {
          // $FlowFixMe[reassign-const]
          end = this.size + end;
        }
        if (end > this.size) {
          // $FlowFixMe[reassign-const]
          end = this.size;
        }
        // Clamp to 0 so an end that precedes start yields an empty blob.
        size = Math.max(end - start, 0);
      }
    }
    return BlobManager.createFromOptions({
      blobId: this.data.blobId,
      offset,
      size,
      type: contentType,
      /* Since `blob.slice()` creates a new view onto the same binary
       * data as the original blob, we should re-use the same collector
       * object so that the underlying resource gets deallocated when
       * the last view into the data is released, not the first.
       */
      __collector: this.data.__collector,
    });
  }

  /**
   * This method is in the standard, but not actually implemented by
   * any browsers at this point. It's important for how Blobs work in
   * React Native, however, since we cannot de-allocate resources automatically,
   * so consumers need to explicitly de-allocate them.
   *
   * Note that the semantics around Blobs created via `blob.slice()`
   * and `new Blob([blob])` are different. `blob.slice()` creates a
   * new *view* onto the same binary data, so calling `close()` on any
   * of those views is enough to deallocate the data, whereas
   * `new Blob([blob, ...])` actually copies the data in memory.
   */
  close() {
    const BlobManager = require('./BlobManager').default;
    BlobManager.release(this.data.blobId);
    this.data = null;
  }

  /**
   * Size of the data contained in the Blob object, in bytes.
   */
  // $FlowFixMe[unsafe-getters-setters]
  get size(): number {
    return this.data.size;
  }

  /*
   * String indicating the MIME type of the data contained in the Blob.
   * If the type is unknown, this string is empty.
   */
  // $FlowFixMe[unsafe-getters-setters]
  get type(): string {
    return this.data.type || '';
  }
}

export default Blob;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import typeof BlobT from './Blob';
import type {BlobCollector, BlobData, BlobOptions, BlobPart} from './BlobTypes';
import type {BlobPart as NativeBlobPart} from './NativeBlobModule';

import NativeBlobModule from './NativeBlobModule';
import invariant from 'invariant';

const Blob: BlobT = require('./Blob').default;
const BlobRegistry = require('./BlobRegistry');

/*eslint-disable no-bitwise */
/*eslint-disable eqeqeq */

/**
 * Based on the rfc4122-compliant solution posted at
 * http://stackoverflow.com/questions/105034
 */
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// **Temporary workaround**
// TODO(#24654): Use turbomodules for the Blob module.
// Blob collector is a jsi::HostObject that is used by native to know
// when the a Blob instance is deallocated. This allows to free the
// underlying native resources. This is a hack to workaround the fact
// that the current bridge infra doesn't allow to track js objects
// deallocation. Ideally the whole Blob object should be a jsi::HostObject.
function createBlobCollector(blobId: string): BlobCollector | null {
  if (global.__blobCollectorProvider == null) {
    return null;
  } else {
    return global.__blobCollectorProvider(blobId);
  }
}

/**
 * Module to manage blobs. Wrapper around the native blob module.
 */
class BlobManager {
  /**
   * If the native blob module is available.
   */
  static isAvailable: boolean = !!NativeBlobModule;

  /**
   * Create blob from existing array of blobs.
   */
  static createFromParts(parts: Array<BlobPart>, options?: BlobOptions): Blob {
    invariant(NativeBlobModule, 'NativeBlobModule is available.');
    const blobId = uuidv4();
    const binaryParts: Array<ArrayBuffer> = [];
    let size = 0;

    const nativeParts: Array<NativeBlobPart> = [];

    for (const part of parts) {
      if (part instanceof Blob) {
        size += part.size;
        nativeParts.push({type: 'blob', data: part.data});
        continue;
      }

      if (
        typeof part !== 'string' &&
        (part instanceof ArrayBuffer || ArrayBuffer.isView(part))
      ) {
        const byteSize = part.byteLength;
        size += byteSize;

        // A detached or empty buffer contributes no bytes, and `slice` throws on
        // a detached buffer — so there is nothing to send.
        if (byteSize === 0) {
          continue;
        }

        const index = binaryParts.length;
        // Forwarded without copying here. A JS-heap `ArrayBuffer` is copied
        // during argument conversion, because `createFromParts` is asynchronous
        // — see `convertJSIArrayBufferToJArrayBuffer` and
        // `convertJSIArrayBufferToRCTArrayBuffer`. A native-backed one is
        // aliased instead, per the TurboModule zero-copy contract, so it is
        // snapshotted only once the call reaches the module thread.
        //
        // A whole buffer therefore goes as-is; only a partial view is sliced,
        // because the wire format carries whole buffers.
        let source: ArrayBuffer;
        if (part instanceof ArrayBuffer) {
          source = part;
        } else {
          const buffer = part.buffer;
          const byteOffset = part.byteOffset;
          source =
            byteOffset === 0 && byteSize === buffer.byteLength
              ? buffer
              : buffer.slice(byteOffset, byteOffset + byteSize);
        }
        binaryParts.push(source);
        nativeParts.push({type: 'binaryPart', data: index});
        continue;
      }

      const text = String(part);
      size += global.unescape(encodeURI(text)).length;
      nativeParts.push({type: 'string', data: text});
    }

    NativeBlobModule.createFromParts(nativeParts, binaryParts, blobId);

    return BlobManager.createFromOptions({
      blobId,
      offset: 0,
      size,
      type: options ? options.type : '',
      lastModified: options ? options.lastModified : Date.now(),
    });
  }

  /**
   * Create blob instance from blob data from native.
   * Used internally by modules like XHR, WebSocket, etc.
   */
  static createFromOptions(options: BlobData): Blob {
    BlobRegistry.register(options.blobId);
    // $FlowFixMe[prop-missing]
    // $FlowFixMe[unsafe-object-assign]
    return Object.assign(Object.create(Blob.prototype), {
      data:
        // Reuse the collector instance when creating from an existing blob.
        // This will make sure that the underlying resource is only deallocated
        // when all blobs that refer to it are deallocated.
        options.__collector == null
          ? {
              ...options,
              __collector: createBlobCollector(options.blobId),
            }
          : options,
    });
  }

  /**
   * Deallocate resources for a blob.
   */
  static release(blobId: string): void {
    invariant(NativeBlobModule, 'NativeBlobModule is available.');

    BlobRegistry.unregister(blobId);
    if (BlobRegistry.has(blobId)) {
      return;
    }
    NativeBlobModule.release(blobId);
  }

  /**
   * Inject the blob content handler in the networking module to support blob
   * requests and responses.
   */
  static addNetworkingHandler(): void {
    invariant(NativeBlobModule, 'NativeBlobModule is available.');

    NativeBlobModule.addNetworkingHandler();
  }

  /**
   * Indicate the websocket should return a blob for incoming binary
   * messages.
   */
  static addWebSocketHandler(socketId: number): void {
    invariant(NativeBlobModule, 'NativeBlobModule is available.');

    NativeBlobModule.addWebSocketHandler(socketId);
  }

  /**
   * Indicate the websocket should no longer return a blob for incoming
   * binary messages.
   */
  static removeWebSocketHandler(socketId: number): void {
    invariant(NativeBlobModule, 'NativeBlobModule is available.');

    NativeBlobModule.removeWebSocketHandler(socketId);
  }

  /**
   * Send a blob message to a websocket.
   */
  static sendOverSocket(blob: Blob, socketId: number): void {
    invariant(NativeBlobModule, 'NativeBlobModule is available.');

    NativeBlobModule.sendOverSocket(blob.data, socketId);
  }
}

export default BlobManager;

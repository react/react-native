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

jest.mock('../../BatchedBridge/NativeModules', () => ({
  __esModule: true,
  default: {
    BlobModule: require('../__mocks__/BlobModule').default,
  },
}));

describe('BlobManager', function () {
  let Blob;
  let BlobManager;
  let MockBlobModule;

  beforeEach(() => {
    jest.resetModules();
    Blob = require('../Blob').default;
    BlobManager = require('../BlobManager').default;
    MockBlobModule = require('../__mocks__/BlobModule').default;
    MockBlobModule.createFromParts.mockClear();
  });

  it('should create blob from parts', () => {
    const blob = BlobManager.createFromParts([], {
      lastModified: 0,
      type: 'text/html',
    });
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('text/html');
  });

  it('should pass ArrayBuffer parts as binaryParts to createFromParts', () => {
    const bytes = Uint8Array.from([1, 2, 3, 4]);
    const buffer = bytes.buffer;

    const blob = BlobManager.createFromParts([buffer]);

    expect(blob.size).toBe(4);

    expect(MockBlobModule.createFromParts).toHaveBeenCalledTimes(1);
    const [parts, binaryParts, blobId] =
      MockBlobModule.createFromParts.mock.calls[0];

    expect(binaryParts).toHaveLength(1);
    // Forwarded uncopied; a JS-heap buffer is copied during argument conversion.
    expect(binaryParts[0]).toBe(buffer);
    expect(Array.from(new Uint8Array(binaryParts[0]))).toEqual([1, 2, 3, 4]);

    expect(parts).toHaveLength(1);
    expect(parts[0]).toEqual({
      type: 'binaryPart',
      data: 0,
    });

    expect(blob.data.blobId).toBe(blobId);
  });

  it('should forward a full-length ArrayBufferView without copying', () => {
    const bytes = Uint8Array.from([1, 2, 3, 4]);

    const blob = BlobManager.createFromParts([bytes]);

    expect(blob.size).toBe(4);

    expect(MockBlobModule.createFromParts).toHaveBeenCalledTimes(1);
    const [, binaryParts] = MockBlobModule.createFromParts.mock.calls[0];

    expect(binaryParts).toHaveLength(1);
    expect(binaryParts[0]).toBe(bytes.buffer);
    expect(Array.from(new Uint8Array(binaryParts[0]))).toEqual([1, 2, 3, 4]);
  });

  // Whether mutating the source after createFromParts changes the forwarded
  // bytes is decided in C++ (convertJSIArrayBufferToJArrayBuffer and
  // convertJSIArrayBufferToRCTArrayBuffer): a JS-heap buffer is copied on this
  // asynchronous call, a native-backed one is aliased per the zero-copy
  // contract. Neither is observable from Jest.

  it('should preserve ArrayBufferView offset and size when storing binary parts', () => {
    const bytes = Uint8Array.from([9, 8, 7, 6, 5]);
    const view = bytes.subarray(1, 4);

    const blob = BlobManager.createFromParts([view]);

    expect(blob.size).toBe(3);

    expect(MockBlobModule.createFromParts).toHaveBeenCalledTimes(1);
    const [parts, binaryParts] = MockBlobModule.createFromParts.mock.calls[0];

    expect(binaryParts).toHaveLength(1);
    // Partial views must be sliced; native receives whole buffers only.
    expect(binaryParts[0]).not.toBe(bytes.buffer);
    expect(Array.from(new Uint8Array(binaryParts[0]))).toEqual([8, 7, 6]);

    expect(parts[0]).toEqual({
      type: 'binaryPart',
      data: 0,
    });
  });

  it('should store each binary part as a separate entry in binaryParts', () => {
    const blob = BlobManager.createFromParts([
      'A',
      Uint8Array.from([66, 67]).buffer,
    ]);

    expect(blob.size).toBe(3);

    expect(MockBlobModule.createFromParts).toHaveBeenCalledTimes(1);
    const [parts, binaryParts] = MockBlobModule.createFromParts.mock.calls[0];

    // One binary part for the ArrayBuffer, none for the string
    expect(binaryParts).toHaveLength(1);
    expect(binaryParts[0].byteLength).toBe(2);

    expect(parts).toHaveLength(2);
    expect(parts[0]).toEqual({type: 'string', data: 'A'});
    expect(parts[1]).toEqual({type: 'binaryPart', data: 0});
  });

  it('should use native createFromParts when parts include blobs', () => {
    const binaryBlob = BlobManager.createFromParts([
      Uint8Array.from([1, 2, 3]).buffer,
    ]);

    MockBlobModule.createFromParts.mockClear();

    const blob = BlobManager.createFromParts([binaryBlob, 'A']);

    expect(blob.size).toBe(4);
    expect(MockBlobModule.createFromParts).toHaveBeenCalledTimes(1);
    const [parts, binaryParts] = MockBlobModule.createFromParts.mock.calls[0];

    expect(binaryParts).toEqual([]);
    expect(parts).toHaveLength(2);
    expect(parts[0]).toMatchObject({
      type: 'blob',
      data: binaryBlob.data,
    });
    expect(parts[1]).toEqual({
      data: 'A',
      type: 'string',
    });
  });

  it('should omit empty ArrayBuffer parts', () => {
    const blob = BlobManager.createFromParts([
      new ArrayBuffer(0),
      Uint8Array.from([1, 2]),
    ]);

    expect(blob.size).toBe(2);
    expect(MockBlobModule.createFromParts).toHaveBeenCalledTimes(1);
    const [parts, binaryParts] = MockBlobModule.createFromParts.mock.calls[0];

    expect(binaryParts).toHaveLength(1);
    expect(parts).toEqual([{type: 'binaryPart', data: 0}]);
  });

  it('should omit a detached ArrayBuffer part', () => {
    const ab = new ArrayBuffer(8);
    // $FlowFixMe[cannot-resolve-name] Node's structuredClone is not in RN's Flow libs.
    structuredClone(ab, {transfer: [ab]});

    const blob = BlobManager.createFromParts([ab]);

    expect(blob.size).toBe(0);
    expect(MockBlobModule.createFromParts).toHaveBeenCalledTimes(1);
    const [parts, binaryParts] = MockBlobModule.createFromParts.mock.calls[0];

    expect(binaryParts).toEqual([]);
    expect(parts).toEqual([]);
  });
});

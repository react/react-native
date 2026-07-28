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

import type Event from '../../../src/private/webapis/dom/events/Event';

const Blob = require('../Blob').default;
const FileReader = require('../FileReader').default;
const NativeFileReaderModule = require('../NativeFileReaderModule').default;

jest.mock('../../BatchedBridge/NativeModules', () => ({
  __esModule: true,
  default: {
    BlobModule: require('../__mocks__/BlobModule').default,
    FileReaderModule: require('../__mocks__/FileReaderModule').default,
  },
}));

describe('FileReader', function () {
  it('should read blob as text', async () => {
    const e = await new Promise<Event>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = resolve;
      reader.onerror = reject;
      reader.readAsText(new Blob());
    });
    // $FlowFixMe[prop-missing]
    expect(e.target?.result).toBe('');
  });

  it('should read blob as data URL', async () => {
    const e = await new Promise<Event>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = resolve;
      reader.onerror = reject;
      reader.readAsDataURL(new Blob());
    });
    // $FlowFixMe[prop-missing]
    expect(e.target?.result).toBe('data:text/plain;base64,NDI=');
  });

  it('should be in the LOADING state while a read is in progress', () => {
    const reader = new FileReader();
    expect(reader.readyState).toBe(FileReader.EMPTY);
    reader.readAsText(new Blob());
    // The native read resolves on a later microtask, so the reader should
    // report LOADING synchronously after the read starts.
    expect(reader.readyState).toBe(FileReader.LOADING);
  });

  it('should dispatch abort and loadend when aborted during a read', () => {
    const reader = new FileReader();
    let aborted = false;
    let loadended = false;
    reader.onabort = () => {
      aborted = true;
    };
    reader.onloadend = () => {
      loadended = true;
    };
    reader.readAsText(new Blob());
    reader.abort();
    expect(aborted).toBe(true);
    expect(loadended).toBe(true);
    expect(reader.readyState).toBe(FileReader.DONE);
    expect(reader.result).toBe(null);
  });

  it('should preserve a read started by an abort handler', async () => {
    const reader = new FileReader();
    let loadendCount = 0;
    const replacementRead = new Promise<void>(resolve => {
      reader.onloadend = () => {
        loadendCount++;
        resolve();
      };
    });
    reader.onabort = () => {
      reader.readAsText(new Blob());
    };

    reader.readAsText(new Blob());
    reader.abort();

    expect(reader.readyState).toBe(FileReader.LOADING);
    expect(loadendCount).toBe(0);

    await replacementRead;
    expect(reader.readyState).toBe(FileReader.DONE);
    expect(reader.result).toBe('');
    expect(loadendCount).toBe(1);
  });

  it('should clear stale result and error when starting a read', async () => {
    const reader = new FileReader();
    const readAsText = jest.spyOn(NativeFileReaderModule, 'readAsText');

    const successfulRead = new Promise<void>(resolve => {
      reader.onloadend = () => resolve();
    });
    reader.readAsText(new Blob());
    await successfulRead;
    expect(reader.result).toBe('');

    const error = new Error('read failed');
    readAsText.mockRejectedValueOnce(error);
    const failedRead = new Promise<void>(resolve => {
      reader.onloadend = () => resolve();
    });
    reader.readAsText(new Blob());
    expect(reader.result).toBe(null);
    expect(reader.error).toBe(null);
    await failedRead;
    expect(reader.error).toBe(error);

    readAsText.mockReturnValueOnce(new Promise(() => {}));
    reader.readAsText(new Blob());
    expect(reader.result).toBe(null);
    expect(reader.error).toBe(null);

    readAsText.mockRestore();
  });

  it('should read blob as ArrayBuffer', async () => {
    const e = await new Promise<Event>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = resolve;
      reader.onerror = reject;
      reader.readAsArrayBuffer(new Blob());
    });
    // $FlowFixMe[prop-missing]
    const ab = e.target?.result;
    expect(ab?.byteLength).toBe(2);
    // $FlowFixMe[cannot-resolve-name]
    expect(new TextDecoder().decode(ab)).toBe('42');
  });
});

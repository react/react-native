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

import DOMException from '../../../src/private/webapis/errors/DOMException';

const FileReaderModuleMock = require('../__mocks__/FileReaderModule').default;
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
  afterEach(() => {
    jest.restoreAllMocks();
  });

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
    expect(reader.error).toBeInstanceOf(DOMException);
    expect(reader.error?.message).toBe(error.message);

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

  it('fires lifecycle events in spec order for a successful read', async () => {
    const reader = new FileReader();
    const events: Array<string> = [];
    const done = new Promise<void>(resolve => {
      for (const type of ['loadstart', 'load', 'loadend']) {
        reader.addEventListener(type, () => {
          events.push(type);
          if (type === 'loadend') {
            resolve();
          }
        });
      }
      reader.readAsText(new Blob());
    });
    await done;
    expect(events).toEqual(['loadstart', 'load', 'loadend']);
  });

  it('fires loadstart with the reader in the LOADING state', async () => {
    const reader = new FileReader();
    let stateAtLoadStart: ?number = null;
    const done = new Promise<Event>(resolve => {
      reader.onloadstart = () => {
        stateAtLoadStart = reader.readyState;
      };
      reader.onload = resolve;
      reader.readAsText(new Blob());
    });
    await done;
    expect(stateAtLoadStart).toBe(FileReader.LOADING);
  });

  it('does not dispatch a progress event (native reads are atomic)', async () => {
    const reader = new FileReader();
    let progressed = false;
    const done = new Promise<Event>((resolve, reject) => {
      reader.onprogress = () => {
        progressed = true;
      };
      reader.onload = resolve;
      reader.onerror = reject;
      reader.readAsText(new Blob());
    });
    await done;
    expect(progressed).toBe(false);
  });

  it('dispatches readystatechange for EMPTY -> LOADING -> DONE', async () => {
    const reader = new FileReader();
    const states: Array<number> = [];
    const done = new Promise<Event>(resolve => {
      reader.addEventListener('readystatechange', () => {
        states.push(reader.readyState);
      });
      reader.onload = resolve;
      reader.readAsText(new Blob());
    });
    await done;
    expect(states).toEqual([FileReader.LOADING, FileReader.DONE]);
  });

  it('fires error and loadend (not load) when the native read rejects', async () => {
    jest
      .spyOn(FileReaderModuleMock, 'readAsText')
      .mockRejectedValueOnce(new Error('read failed'));

    const reader = new FileReader();
    let loaded = false;
    let errored = false;
    const done = new Promise<Event>(resolve => {
      reader.onload = () => {
        loaded = true;
      };
      reader.onerror = () => {
        errored = true;
      };
      reader.onloadend = resolve;
      reader.readAsText(new Blob());
    });
    await done;
    expect(errored).toBe(true);
    expect(loaded).toBe(false);
    expect(reader.readyState).toBe(FileReader.DONE);
    expect(reader.result).toBe(null);
  });

  it('exposes a read failure as a DOMException', async () => {
    jest
      .spyOn(FileReaderModuleMock, 'readAsText')
      .mockRejectedValueOnce(new Error('read failed'));

    const reader = new FileReader();
    await new Promise<Event>(resolve => {
      reader.onloadend = resolve;
      reader.readAsText(new Blob());
    });
    expect(reader.error).toBeInstanceOf(DOMException);
    expect(reader.error?.name).toBe('NotReadableError');
  });

  it('throws InvalidStateError when a read starts while LOADING', () => {
    const reader = new FileReader();
    reader.readAsText(new Blob());
    expect(reader.readyState).toBe(FileReader.LOADING);

    let thrown: unknown = null;
    try {
      reader.readAsText(new Blob());
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(DOMException);
    if (thrown instanceof DOMException) {
      expect(thrown.name).toBe('InvalidStateError');
    }
    // The in-flight read is untouched.
    expect(reader.readyState).toBe(FileReader.LOADING);
  });

  it('throws a TypeError when the blob is null', () => {
    const reader = new FileReader();
    expect(() => reader.readAsText(null)).toThrow(TypeError);
    expect(reader.readyState).toBe(FileReader.EMPTY);
  });

  it('should retain the blob until the read resolves', async () => {
    let resolveRead: string => void = () => {};
    const spy = jest
      .spyOn(FileReaderModuleMock, 'readAsText')
      .mockImplementation(
        () =>
          new Promise(resolve => {
            resolveRead = resolve;
          }),
      );

    const reader = new FileReader();
    const blob = new Blob();
    const loadend = new Promise<Event>(resolve => {
      reader.onloadend = resolve;
    });
    reader.readAsText(blob);
    // $FlowFixMe[prop-missing] - accessing private state for the test
    expect(reader._blob).toBe(blob);

    resolveRead('');
    await loadend;
    // $FlowFixMe[prop-missing] - accessing private state for the test
    expect(reader._blob).toBe(null);

    spy.mockRestore();
  });

  it('should release the blob when the read rejects', async () => {
    let rejectRead: Error => void = () => {};
    const spy = jest
      .spyOn(FileReaderModuleMock, 'readAsText')
      .mockImplementation(
        () =>
          new Promise((resolve, reject) => {
            rejectRead = reject;
          }),
      );

    const reader = new FileReader();
    const blob = new Blob();
    const loadend = new Promise<Event>(resolve => {
      reader.onloadend = resolve;
    });
    reader.readAsText(blob);
    // $FlowFixMe[prop-missing] - accessing private state for the test
    expect(reader._blob).toBe(blob);

    rejectRead(new Error('nope'));
    await loadend;
    // $FlowFixMe[prop-missing] - accessing private state for the test
    expect(reader._blob).toBe(null);

    spy.mockRestore();
  });

  it('should release the blob when a pending read is aborted', () => {
    const spy = jest
      .spyOn(FileReaderModuleMock, 'readAsText')
      .mockImplementation(() => new Promise(() => {}));

    const reader = new FileReader();
    const blob = new Blob();
    reader.readAsText(blob);
    // $FlowFixMe[prop-missing] - accessing private state for the test
    expect(reader._blob).toBe(blob);

    reader.abort();
    // $FlowFixMe[prop-missing] - accessing private state for the test
    expect(reader._blob).toBe(null);

    spy.mockRestore();
  });

  it('should keep retaining the new blob when a stale read settles after abort', async () => {
    const resolvers: Array<(string) => void> = [];
    const spy = jest
      .spyOn(FileReaderModuleMock, 'readAsText')
      .mockImplementation(
        () =>
          new Promise(resolve => {
            resolvers.push(resolve);
          }),
      );

    const reader = new FileReader();
    const staleBlob = new Blob();
    reader.readAsText(staleBlob);
    reader.abort();

    const newBlob = new Blob();
    reader.readAsText(newBlob);
    // $FlowFixMe[prop-missing] - accessing private state for the test
    expect(reader._blob).toBe(newBlob);

    // Settle the first (aborted) read; it must not drop the new blob.
    resolvers[0]('');
    await Promise.resolve();
    // $FlowFixMe[prop-missing] - accessing private state for the test
    expect(reader._blob).toBe(newBlob);

    spy.mockRestore();
  });
});

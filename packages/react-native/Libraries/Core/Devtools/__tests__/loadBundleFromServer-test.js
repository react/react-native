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

import {
  LoadBundleFromServerError,
  LoadBundleFromServerRequestError,
} from '../loadBundleFromServer';
import invariant from 'invariant';

jest.mock('../../../Utilities/HMRClient');

jest.mock('../../../Core/Devtools/getDevServer', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    url: 'localhost:8042/',
    fullBundleUrl:
      'http://localhost:8042/EntryPoint.bundle?platform=' +
      jest.requireActual<$FlowFixMe>('react-native').Platform.OS +
      '&dev=true&minify=false&unusedExtraParam=42',
    bundleLoadedFromServer: true,
  })),
}));

const loadingViewMock = {
  showMessage: jest.fn(),
  hide: jest.fn(),
};
jest.mock('../../../Utilities/DevLoadingView', () => ({
  __esModule: true,
  default: loadingViewMock,
}));

const REQUEST_ID = 1;

const sendRequest = jest.fn(
  (
    method,
    trackingName,
    url,
    headers,
    data,
    responseType,
    incrementalUpdates,
    timeout,
    callback,
    withCredentials,
  ) => {
    callback(REQUEST_ID);
  },
);

const removeListener = jest.fn();
const addListener = jest.fn((name, fn) => {
  if (name === 'didReceiveNetworkData') {
    void Promise.resolve().then(() => fn([REQUEST_ID, mockDataResponse]));
  } else if (name === 'didCompleteNetworkResponse') {
    void Promise.resolve().then(() => fn([REQUEST_ID, mockRequestError]));
  } else if (name === 'didReceiveNetworkResponse') {
    void Promise.resolve().then(() => fn([REQUEST_ID, null, mockHeaders]));
  }
  return {remove: removeListener};
});

jest.mock('../../../Network/RCTNetworking', () => ({
  __esModule: true,
  default: {
    sendRequest,
    addListener,
  },
}));

let loadBundleFromServer: (bundlePathAndQuery: string) => Promise<void>;

let mockHeaders: {'Content-Type': string};
let mockDataResponse;
let mockRequestError = null;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  loadBundleFromServer = require('../loadBundleFromServer').default;
});

test('loadBundleFromServer will throw for JSON responses', async () => {
  mockHeaders = {'Content-Type': 'application/json'};
  mockDataResponse = JSON.stringify({message: 'Error thrown from Metro'});
  mockRequestError = null;

  const error: unknown = await loadBundleFromServer(
    '/Fail.bundle?platform=ios',
  ).catch(e => e);

  invariant(
    error instanceof LoadBundleFromServerError,
    'Expected a LoadBundleFromServerError',
  );
  expect(error.message).toBe('Could not load bundle');
  expect(error.cause).toBe('Error thrown from Metro');
});

test('loadBundleFromServer will throw LoadBundleFromServerError for request errors', async () => {
  mockHeaders = {'Content-Type': 'application/json'};
  mockDataResponse = '';
  mockRequestError = 'Some error';

  const error: unknown = await loadBundleFromServer(
    '/Fail.bundle?platform=ios',
  ).catch(e => e);

  invariant(
    error instanceof LoadBundleFromServerRequestError,
    'Expected a LoadBundleFromServerRequestError',
  );
  expect(error.message).toBe('Could not load bundle');
  expect(error.cause).toBe('Some error');
});

test('loadBundleFromServer successfully requests a bundle (root bundle)', async () => {
  mockDataResponse = '"code";';
  mockHeaders = {'Content-Type': 'application/javascript'};
  mockRequestError = null;

  await loadBundleFromServer(
    '/Banana.bundle?platform=ios&dev=true&minify=false&unusedExtraParam=42&modulesOnly=true&runModule=false',
  );

  expect(sendRequest.mock.calls).toEqual([
    [
      'GET',
      'asyncRequest',
      'localhost:8042/Banana.bundle?platform=ios&dev=true&minify=false&unusedExtraParam=42&modulesOnly=true&runModule=false',
      {},
      '',
      'text',
      true,
      0,
      expect.any(Function),
      true,
    ],
  ]);

  expect(addListener).toHaveBeenCalledTimes(4);
  expect(removeListener).toHaveBeenCalledTimes(addListener.mock.calls.length);
});

test('loadBundleFromServer successfully requests a bundle (subdir bundle)', async () => {
  mockDataResponse = '"code";';
  mockHeaders = {'Content-Type': 'application/javascript'};
  mockRequestError = null;

  await loadBundleFromServer(
    '/Tiny/Apple.bundle?platform=ios&dev=true&minify=false&unusedExtraParam=42&modulesOnly=true&runModule=false',
  );

  expect(sendRequest.mock.calls).toEqual([
    [
      'GET',
      'asyncRequest',
      'localhost:8042/Tiny/Apple.bundle?platform=ios&dev=true&minify=false&unusedExtraParam=42&modulesOnly=true&runModule=false',
      {},
      '',
      'text',
      true,
      0,
      expect.any(Function),
      true,
    ],
  ]);

  expect(addListener).toHaveBeenCalledTimes(4);
  expect(removeListener).toHaveBeenCalledTimes(addListener.mock.calls.length);
});

test('shows and hides the loading view around a request', async () => {
  mockDataResponse = '"code";';
  mockHeaders = {'Content-Type': 'application/javascript'};
  mockRequestError = null;

  const promise = loadBundleFromServer(
    '/Banana.bundle?platform=ios&dev=true&minify=false&unusedExtraParam=42&modulesOnly=true&runModule=false',
  );

  expect(loadingViewMock.showMessage).toHaveBeenCalledTimes(1);
  expect(loadingViewMock.hide).not.toHaveBeenCalled();
  loadingViewMock.showMessage.mockClear();
  loadingViewMock.hide.mockClear();

  await promise;

  expect(loadingViewMock.showMessage).not.toHaveBeenCalled();
  expect(loadingViewMock.hide).toHaveBeenCalledTimes(1);
});

test('shows and hides the loading view around concurrent requests', async () => {
  mockDataResponse = '"code";';
  mockHeaders = {'Content-Type': 'application/javascript'};
  mockRequestError = null;

  const promise1 = loadBundleFromServer(
    '/Banana.bundle?platform=ios&dev=true&minify=false&unusedExtraParam=42&modulesOnly=true&runModule=false',
  );
  const promise2 = loadBundleFromServer(
    '/Apple.bundle?platform=ios&dev=true&minify=false&unusedExtraParam=42&modulesOnly=true&runModule=false',
  );

  expect(loadingViewMock.showMessage).toHaveBeenCalledTimes(2);
  expect(loadingViewMock.hide).not.toHaveBeenCalled();
  loadingViewMock.showMessage.mockClear();
  loadingViewMock.hide.mockClear();

  await promise1;
  await promise2;
  expect(loadingViewMock.hide).toHaveBeenCalledTimes(1);
});

test('loadBundleFromServer does not cache errors', async () => {
  mockHeaders = {'Content-Type': 'application/json'};
  mockDataResponse = JSON.stringify({message: 'Error thrown from Metro'});
  mockRequestError = null;

  await expect(
    loadBundleFromServer('/Fail.bundle?platform=ios'),
  ).rejects.toThrow();

  mockDataResponse = '"code";';
  mockHeaders = {'Content-Type': 'application/javascript'};
  mockRequestError = null;

  await expect(
    loadBundleFromServer('/Fail.bundle?platform=ios'),
  ).resolves.not.toThrow();
});

test('loadBundleFromServer caches successful fetches', async () => {
  mockDataResponse = '"code";';
  mockHeaders = {'Content-Type': 'application/javascript'};
  mockRequestError = null;

  const promise1 = loadBundleFromServer(
    '/Banana.bundle?platform=ios&dev=true&minify=false&unusedExtraParam=42&modulesOnly=true&runModule=false',
  );

  // Request again in the same tick = same promise
  const promise2 = loadBundleFromServer(
    '/Banana.bundle?platform=ios&dev=true&minify=false&unusedExtraParam=42&modulesOnly=true&runModule=false',
  );
  expect(promise2).toBe(promise1);

  await promise1;

  // Request again once resolved = still the same promise
  const promise3 = loadBundleFromServer(
    '/Banana.bundle?platform=ios&dev=true&minify=false&unusedExtraParam=42&modulesOnly=true&runModule=false',
  );
  expect(promise3).toBe(promise1);

  await promise2;

  expect(sendRequest).toBeCalledTimes(1);
});

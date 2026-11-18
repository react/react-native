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

type Handler = (payload: unknown) => void;

interface MockClient {
  emit(event: string, payload: unknown): void;
}

const mockClients: Array<MockClient> = [];

jest.mock('metro-runtime/src/modules/HMRClient', () => {
  return class {
    enabled: boolean = false;
    handlers: Map<string, Handler> = new Map();
    constructor() {
      mockClients.push(this);
    }
    on(event: string, handler: Handler) {
      this.handlers.set(event, handler);
    }
    emit(event: string, payload: unknown) {
      this.handlers.get(event)?.(payload);
    }
    isEnabled(): boolean {
      return this.enabled;
    }
    enable() {
      this.enabled = true;
    }
    disable() {
      this.enabled = false;
    }
    hasPendingUpdates(): boolean {
      return false;
    }
    send() {}
    close() {}
  };
});
jest.mock('../../Core/Devtools/getDevServer', () => ({
  __esModule: true,
  default: () => ({
    bundleLoadedFromServer: true,
    fullBundleUrl: 'http://localhost:8081/index.bundle?platform=ios',
    url: 'http://localhost:8081/',
  }),
}));
jest.mock('../DevLoadingView', () => ({
  __esModule: true,
  default: {showMessage: jest.fn(), hide: jest.fn()},
}));
jest.mock('../../LogBox/LogBox', () => ({
  __esModule: true,
  default: {clearAllLogs: jest.fn()},
}));
jest.mock('../../NativeModules/specs/NativeRedBox', () => ({
  __esModule: true,
  default: null,
}));
jest.mock('../../Core/NativeExceptionsManager', () => ({
  __esModule: true,
  default: {dismissRedbox: jest.fn()},
}));

describe('HMRClient', () => {
  let onUpdate;

  beforeEach(() => {
    jest.resetModules();
    mockClients.length = 0;
    onUpdate = jest.fn();
    global.__HMR_UPDATE_REPORTER__ = {onUpdate};
  });

  afterEach(() => {
    delete global.__HMR_UPDATE_REPORTER__;
  });

  function setUp(isEnabled: boolean) {
    const HMRClient = require('../HMRClient').default;
    HMRClient.setup('ios', 'index.bundle', 'localhost', 8081, isEnabled);
    return mockClients[0];
  }

  function applyUpdate(client: MockClient, update: unknown) {
    client.emit('update-start', {isInitialUpdate: false});
    client.emit('update', update);
    client.emit('update-done', {changeId: 'change'});
  }

  it('reports the revision of an applied update once it is done', () => {
    const client = setUp(true);

    client.emit('update-start', {isInitialUpdate: false});
    client.emit('update', {isInitialUpdate: false, revisionId: 'rev-2'});
    expect(onUpdate).not.toHaveBeenCalled();
    client.emit('update-done', {changeId: 'change'});

    expect(onUpdate.mock.calls).toEqual([[{revisionId: 'rev-2'}]]);
  });

  it('reports an update that Fast Refresh stashed', () => {
    const client = setUp(false);

    applyUpdate(client, {isInitialUpdate: false, revisionId: 'rev-3'});

    expect(onUpdate.mock.calls).toEqual([[{revisionId: 'rev-3'}]]);
  });

  it('reports the initial update and one without a revision', () => {
    const client = setUp(true);

    applyUpdate(client, {isInitialUpdate: true, revisionId: 'rev-1'});
    applyUpdate(client, {isInitialUpdate: false});

    expect(onUpdate.mock.calls).toEqual([
      [{revisionId: 'rev-1'}],
      [{revisionId: undefined}],
    ]);
  });

  it('keeps handling updates when the reporter throws', () => {
    onUpdate.mockImplementation(() => {
      throw new Error('reporter failed');
    });
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const DevLoadingView = require('../DevLoadingView').default;
    const client = setUp(true);

    expect(() =>
      applyUpdate(client, {isInitialUpdate: false, revisionId: 'rev-2'}),
    ).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(DevLoadingView.hide).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('handles an update as before when no reporter is installed', () => {
    delete global.__HMR_UPDATE_REPORTER__;
    const client = setUp(true);
    const LogBox = require('../../LogBox/LogBox').default;
    const NativeExceptionsManager =
      require('../../Core/NativeExceptionsManager').default;

    applyUpdate(client, {isInitialUpdate: false, revisionId: 'rev-2'});

    expect(NativeExceptionsManager.dismissRedbox).toHaveBeenCalledTimes(1);
    expect(LogBox.clearAllLogs).toHaveBeenCalledTimes(1);
  });
});

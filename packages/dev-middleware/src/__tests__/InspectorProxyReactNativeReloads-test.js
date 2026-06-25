/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {fetchJson} from './FetchUtils';
import {createDebuggerMock} from './InspectorDebuggerUtils';
import {createDeviceMock} from './InspectorDeviceUtils';
import {createAndConnectTarget} from './InspectorProtocolUtils';
import {withAbortSignalForEachTest} from './ResourceUtils';
import {withServerForEachTest} from './ServerUtils';
import invariant from 'invariant';
import until from 'wait-for-expect';

// WebSocket is unreliable when using fake timers.
jest.useRealTimers();

jest.setTimeout(10000);

describe('inspector proxy React Native reloads', () => {
  const serverRef = withServerForEachTest({
    logger: undefined,
  });
  const autoCleanup = withAbortSignalForEachTest();
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('routing messages from the debugger to the latest React Native page', async () => {
    let device1, debugger_;
    try {
      /***
       * Connect a device with one React Native page.
       */
      device1 = await createDeviceMock(
        `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
        autoCleanup.signal,
      );
      device1.getPages.mockImplementation(() => [
        {
          app: 'bar',
          id: 'originalPage-initial',
          // NOTE: 'React' is a magic string used to detect React Native pages.
          title: 'React Native (mock)',
          vm: 'vm',
        },
      ]);
      let pageList;
      await until(async () => {
        pageList = (await fetchJson(
          `${serverRef.serverBaseUrl}/json`,
          // $FlowFixMe[unclear-type]
        )) as any;
        expect(pageList.length).toBeGreaterThan(0);
      });
      invariant(pageList != null, '');

      /***
       * The proxy reports *two* pages.
       */
      const syntheticPage = pageList.find(
        ({title}) =>
          // NOTE: Magic string used for the synthetic page that has a stable ID
          title === 'React Native Experimental (Improved Chrome Reloads)',
      );
      const originalPage = pageList.find(
        ({title}) => title === 'React Native (mock)',
      );
      expect(syntheticPage).not.toBeUndefined();
      expect(originalPage).not.toBeUndefined();
      expect(originalPage.id).toContain('originalPage-initial');
      expect(syntheticPage.id).not.toEqual(originalPage.id);

      // Connect to the synthetic page
      debugger_ = await createDebuggerMock(
        syntheticPage.webSocketDebuggerUrl,
        autoCleanup.signal,
      );

      debugger_.send({
        method: 'Console.enable',
        id: 0,
      });

      await until(() =>
        expect(device1.wrappedEventParsed).toBeCalledWith({
          pageId: 'originalPage-initial',
          sessionId: expect.any(String),
          wrappedEvent: {
            method: 'Console.enable',
            id: 0,
          },
        }),
      );

      /**
       * Replace our original page with a new one.
       */
      device1.getPages.mockImplementation(() => [
        {
          app: 'bar',
          id: 'originalPage-updated',
          // NOTE: 'React' is a magic string used to detect React Native pages.
          title: 'React Native (mock)',
          vm: 'vm',
        },
      ]);
      await until(async () => {
        pageList = (await fetchJson(
          `${serverRef.serverBaseUrl}/json`,
          // $FlowFixMe[unclear-type]
        )) as any;
        expect(pageList).toContainEqual(
          expect.objectContaining({
            id: expect.stringContaining('originalPage-updated'),
          }),
        );
      });

      /**
       * We can reuse our existing debugger connection to the synthetic page.
       * Messages will be routed to the updated page.
       */
      debugger_.send({
        method: 'Console.disable',
        id: 1,
      });

      await until(() =>
        expect(device1.wrappedEventParsed).toBeCalledWith({
          pageId: 'originalPage-updated',
          sessionId: expect.any(String),
          wrappedEvent: {
            method: 'Console.disable',
            id: 1,
          },
        }),
      );
    } finally {
      device1?.close();
      debugger_?.close();
    }
  });

  test('routing messages from the latest React Native page to the debugger', async () => {
    let device1, debugger_;
    try {
      /***
       * Connect a device with one React Native page.
       */
      device1 = await createDeviceMock(
        `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
        autoCleanup.signal,
      );
      device1.getPages.mockImplementation(() => [
        {
          app: 'bar',
          id: 'originalPage-initial',
          // NOTE: 'React' is a magic string used to detect React Native pages.
          title: 'React Native (mock)',
          vm: 'vm',
        },
      ]);
      let pageList;
      await until(async () => {
        pageList = (await fetchJson(
          `${serverRef.serverBaseUrl}/json`,
          // $FlowFixMe[unclear-type]
        )) as any;
        expect(pageList.length).toBeGreaterThan(0);
      });
      invariant(pageList != null, '');

      /***
       * The proxy reports *two* pages.
       */
      const syntheticPage = pageList.find(
        ({title}) =>
          // NOTE: Magic string used for the synthetic page that has a stable ID
          title === 'React Native Experimental (Improved Chrome Reloads)',
      );
      const originalPage = pageList.find(
        ({title}) => title === 'React Native (mock)',
      );
      expect(syntheticPage).not.toBeUndefined();
      expect(originalPage).not.toBeUndefined();
      expect(originalPage.id).toContain('originalPage-initial');
      expect(syntheticPage.id).not.toEqual(originalPage.id);

      // Connect to the synthetic page
      debugger_ = await createDebuggerMock(
        syntheticPage.webSocketDebuggerUrl,
        autoCleanup.signal,
      );

      device1.sendWrappedEvent('originalPage-initial', {
        error: 'Mock error',
      });

      await until(() =>
        expect(debugger_.handle).toBeCalledWith({
          error: 'Mock error',
        }),
      );

      /**
       * Replace our original page with a new one.
       */
      device1.getPages.mockImplementation(() => [
        {
          app: 'bar',
          id: 'originalPage-updated',
          // NOTE: 'React' is a magic string used to detect React Native pages.
          title: 'React Native (mock)',
          vm: 'vm',
        },
      ]);
      await until(async () => {
        pageList = (await fetchJson(
          `${serverRef.serverBaseUrl}/json`,
          // $FlowFixMe[unclear-type]
        )) as any;
        expect(pageList).toContainEqual(
          expect.objectContaining({
            id: expect.stringContaining('originalPage-updated'),
          }),
        );
      });

      /**
       * We can reuse our existing debugger connection to the synthetic page.
       * Messages from the updated page will be routed to the debugger.
       */
      device1.sendWrappedEvent('originalPage-updated', {
        error: 'Another mock error',
      });

      await until(() =>
        expect(debugger_.handle).toBeCalledWith({
          error: 'Another mock error',
        }),
      );
    } finally {
      device1?.close();
      debugger_?.close();
    }
  });

  test('injecting setup messages after a reload', async () => {
    let device1, debugger_;
    try {
      /***
       * Connect a device with one React Native page.
       */
      device1 = await createDeviceMock(
        `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
        autoCleanup.signal,
      );
      device1.getPages.mockImplementation(() => [
        {
          app: 'bar',
          id: 'originalPage-initial',
          // NOTE: 'React' is a magic string used to detect React Native pages.
          title: 'React Native (mock)',
          vm: 'vm',
        },
      ]);
      let pageList;
      await until(async () => {
        pageList = (await fetchJson(
          `${serverRef.serverBaseUrl}/json`,
          // $FlowFixMe[unclear-type]
        )) as any;
        expect(pageList.length).toBeGreaterThan(0);
      });
      invariant(pageList != null, '');

      const syntheticPage = pageList.find(
        ({title}) =>
          // NOTE: Magic string used for the synthetic page that has a stable ID
          title === 'React Native Experimental (Improved Chrome Reloads)',
      );
      expect(syntheticPage).not.toBeUndefined();

      // Connect to the synthetic page
      debugger_ = await createDebuggerMock(
        syntheticPage.webSocketDebuggerUrl,
        autoCleanup.signal,
      );

      /**
       * Replace our original page with a new one.
       */
      device1.getPages.mockImplementation(() => [
        {
          app: 'bar',
          id: 'originalPage-updated',
          // NOTE: 'React' is a magic string used to detect React Native pages.
          title: 'React Native (mock)',
          vm: 'vm',
        },
      ]);

      /**
       * The new page receives setup messages from the proxy.
       */
      device1.wrappedEventParsed.mockClear();
      await until(async () => {
        expect(device1.wrappedEventParsed).toBeCalledWith({
          pageId: 'originalPage-updated',
          sessionId: expect.any(String),
          wrappedEvent: {
            method: 'Runtime.enable',
            id: expect.any(Number),
          },
        });
        expect(device1.wrappedEventParsed).toBeCalledWith({
          pageId: 'originalPage-updated',
          sessionId: expect.any(String),
          wrappedEvent: {
            method: 'Debugger.enable',
            id: expect.any(Number),
          },
        });
      });

      /**
       * When the new page notifies us about the new execution context, the
       * proxy first injects a notification about the old context(s) going
       * away, and also asks the new page to resume (under the assumption that
       * it starts in a paused state).
       */
      device1.sendWrappedEvent('originalPage-updated', {
        method: 'Runtime.executionContextCreated',
      });
      debugger_.handle.mockClear();
      device1.wrappedEventParsed.mockClear();
      await until(() => {
        expect(debugger_.handle.mock.calls).toEqual([
          // NOTE: The messages need to arrive in this exact order.
          [
            {
              method: 'Runtime.executionContextsCleared',
            },
          ],
          [
            expect.objectContaining({
              method: 'Runtime.executionContextCreated',
            }),
          ],
        ]);
      });
      await until(() => {
        expect(device1.wrappedEventParsed).toBeCalledWith({
          pageId: 'originalPage-updated',
          sessionId: expect.any(String),
          wrappedEvent: expect.objectContaining({
            method: 'Debugger.resume',
            id: expect.any(Number),
          }),
        });
      });
    } finally {
      device1?.close();
      debugger_?.close();
    }
  });

  test('device disconnect event results in a nonstandard "reload" message to the debugger', async () => {
    const {device, debugger_, sessionId} = await createAndConnectTarget(
      serverRef,
      autoCleanup.signal,
      {
        app: 'bar-app',
        id: 'page1',
        title: 'bar-title',
        vm: 'bar-vm',
      },
    );

    try {
      device.send({
        event: 'disconnect',
        payload: {
          pageId: 'page1',
          sessionId,
        },
      });
      await until(() =>
        expect(debugger_.handle).toBeCalledWith({
          method: 'reload',
        }),
      );
    } finally {
      device.close();
    }
  });

  test("disabled when target has 'nativePageReloads' capability flag", async () => {
    let device1;
    try {
      /***
       * Connect a device with one React Native page.
       */
      device1 = await createDeviceMock(
        `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
        autoCleanup.signal,
      );
      device1.getPages.mockImplementation(() => [
        {
          app: 'bar',
          id: 'originalPage-initial',
          // NOTE: 'React' is a magic string used to detect React Native pages
          // in legacy mode.
          title: 'React Native (mock)',
          capabilities: {
            nativePageReloads: true,
          },
          vm: 'vm',
        },
      ]);
      let pageList;
      await until(async () => {
        pageList = (await fetchJson(
          `${serverRef.serverBaseUrl}/json`,
          // $FlowFixMe[unclear-type]
        )) as any;
        expect(pageList.length).toBeGreaterThan(0);
      });
      invariant(pageList != null, '');

      /**
       * The proxy reports just one page, without the synthetic page reported
       * in legacy mode.
       */

      expect(pageList).toEqual([
        expect.objectContaining({
          id: expect.stringContaining('originalPage-initial'),
          title: 'React Native (mock)',
        }),
      ]);

      /**
       * Replace our original page with a new one.
       */
      device1.getPages.mockImplementation(() => [
        {
          app: 'bar',
          id: 'originalPage-updated',
          // NOTE: 'React' is a magic string used to detect React Native pages.
          title: 'React Native (mock)',
          capabilities: {
            nativePageReloads: true,
          },
          vm: 'vm',
        },
      ]);
      await until(async () => {
        pageList = (await fetchJson(
          `${serverRef.serverBaseUrl}/json`,
          // $FlowFixMe[unclear-type]
        )) as any;
        expect(pageList).toContainEqual(
          expect.objectContaining({
            id: expect.stringContaining('originalPage-updated'),
          }),
        );
      });

      /**
       * There's still just one page reported.
       */
      expect(pageList).toEqual([
        expect.objectContaining({
          id: expect.stringContaining('originalPage-updated'),
          title: 'React Native (mock)',
        }),
      ]);
    } finally {
      device1?.close();
    }
  });
});

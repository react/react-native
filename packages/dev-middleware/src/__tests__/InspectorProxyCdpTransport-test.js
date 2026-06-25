/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  ConnectRequest,
  DisconnectRequest,
  JsonPagesListResponse,
  PageDescription,
} from '../inspector-proxy/types';

import {fetchJson} from './FetchUtils';
import {createDebuggerMock} from './InspectorDebuggerUtils';
import {createDeviceMock} from './InspectorDeviceUtils';
import {sendFromDebuggerToTarget} from './InspectorProtocolUtils';
import {withAbortSignalForEachTest} from './ResourceUtils';
import {withServerForEachTest} from './ServerUtils';
import nullthrows from 'nullthrows';
import until from 'wait-for-expect';

// WebSocket is unreliable when using fake timers.
jest.useRealTimers();

jest.setTimeout(10000);

describe.each(['HTTP', 'HTTPS'])(
  'inspector proxy CDP transport over %s',
  protocol => {
    const serverRef = withServerForEachTest({
      logger: undefined,
      secure: protocol === 'HTTPS',
    });
    const autoCleanup = withAbortSignalForEachTest();
    afterEach(() => {
      jest.clearAllMocks();
    });

    test('connection/disconnection and message from debugger to device', async () => {
      const device1 = await createDeviceMock(
        `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
        autoCleanup.signal,
      );
      try {
        device1.getPages.mockImplementation(() => [
          {
            app: 'bar-app',
            id: 'page1',
            title: 'bar-title',
            vm: 'bar-vm',
          },
        ]);

        let pageList: JsonPagesListResponse = [];
        await until(async () => {
          pageList = (await fetchJson(
            `${serverRef.serverBaseUrl}/json`,
            // $FlowFixMe[unclear-type]
          )) as any;
          expect(pageList).toHaveLength(1);
        });
        const [{webSocketDebuggerUrl}] = pageList;
        expect(webSocketDebuggerUrl).toBeDefined();

        const debugger_ = await createDebuggerMock(
          webSocketDebuggerUrl,
          autoCleanup.signal,
        );
        try {
          await until(() => expect(device1.connect).toBeCalled());

          debugger_.send({
            method: 'Runtime.enable',
            id: 0,
          });

          await until(() => expect(device1.wrappedEvent).toBeCalled());

          expect(device1.wrappedEventParsed).toBeCalledWith({
            pageId: 'page1',
            sessionId: expect.any(String),
            wrappedEvent: {
              method: 'Runtime.enable',
              id: 0,
            },
          });

          debugger_.close();

          await until(() => expect(device1.disconnect).toBeCalled());
        } finally {
          debugger_.close();
        }
      } finally {
        device1.close();
      }
    });

    test('message and disconnection from device to debugger', async () => {
      const device1 = await createDeviceMock(
        `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
        autoCleanup.signal,
      );
      try {
        device1.getPages.mockImplementation(() => [
          {
            app: 'bar-app',
            id: 'page1',
            title: 'bar-title',
            vm: 'bar-vm',
          },
        ]);

        let pageList: Array<PageDescription> = [];
        await until(async () => {
          pageList = (await fetchJson(
            `${serverRef.serverBaseUrl}/json`,
            // $FlowFixMe[unclear-type]
          )) as any;
          expect(pageList).toHaveLength(1);
        });
        const [{webSocketDebuggerUrl}] = pageList;
        expect(webSocketDebuggerUrl).toBeDefined();

        const debugger_ = await createDebuggerMock(
          webSocketDebuggerUrl,
          autoCleanup.signal,
        );
        let debuggerSocketClosed = false;
        debugger_.socket.once('close', () => {
          debuggerSocketClosed = true;
        });
        try {
          await until(() => expect(device1.connect).toBeCalled());

          device1.sendWrappedEvent('page1', {
            id: 0,
          });

          await until(() => expect(debugger_.handle).toBeCalledWith({id: 0}));

          device1.close();

          await until(() => expect(debuggerSocketClosed).toBe(true));
        } finally {
          debugger_.close();
        }
      } finally {
        device1.close();
      }
    });

    test('multiple debuggers to the same page on the same device', async () => {
      let device, debugger1, debugger2;
      try {
        // Connect a device to the proxy.
        device = await createDeviceMock(
          `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
          autoCleanup.signal,
        );
        // Capture a log of events so we can assert on their order later.
        const events: Array<
          | ConnectRequest
          | DisconnectRequest
          | {event: 'create-debugger-mock', name: string},
        > = [];
        device.disconnect.mockImplementation(message => {
          events.push(message);
        });
        device.connect.mockImplementation(message => {
          events.push(message);
        });
        // Set up the page.
        device.getPages.mockImplementation(() => [
          {
            app: 'bar-app',
            id: 'page1',
            title: 'bar-title',
            vm: 'bar-vm',
          },
        ]);
        let pageList: Array<PageDescription> = [];
        await until(async () => {
          pageList = (await fetchJson(
            `${serverRef.serverBaseUrl}/json`,
            // $FlowFixMe[unclear-type]
          )) as any;
          expect(pageList).toHaveLength(1);
        });
        const [{webSocketDebuggerUrl}] = pageList;

        // Connect the first debugger and send a message.
        events.push({event: 'create-debugger-mock', name: 'debugger1'});
        debugger1 = await createDebuggerMock(
          webSocketDebuggerUrl,
          autoCleanup.signal,
        );
        await sendFromDebuggerToTarget(debugger1, device, 'page1', {
          method: 'Runtime.enable',
          id: 0,
        });

        // Connect the second debugger.
        events.push({event: 'create-debugger-mock', name: 'debugger2'});
        debugger2 = await createDebuggerMock(
          webSocketDebuggerUrl,
          autoCleanup.signal,
        );

        // The first debugger gets disconnected. TODO: In the future, we should
        // amend the protocol to allow for multiple debuggers to connect at the
        // same time.
        await until(async () => {
          expect([
            // CLOSING
            3,
            // CLOSED
            4,
          ]).toContain(debugger1.socket.readyState);
        });

        // Send a message from the second debugger.
        await sendFromDebuggerToTarget(debugger2, device, 'page1', {
          method: 'Debugger.enable',
          id: 1,
        });

        // Check the order of `connect` and `disconnect` events received by the
        // device. `create-debugger-mock` events are included for convenience.
        expect(events).toEqual([
          {
            event: 'create-debugger-mock',
            name: 'debugger1',
          },
          {
            event: 'connect',
            payload: {
              pageId: 'page1',
              sessionId: expect.any(String),
            },
          },
          {
            event: 'create-debugger-mock',
            name: 'debugger2',
          },
          {
            // NOTE: For debugger1
            event: 'disconnect',
            payload: {
              pageId: 'page1',
              sessionId: expect.any(String),
            },
          },
          {
            // NOTE: For debugger2
            event: 'connect',
            payload: {
              pageId: 'page1',
              sessionId: expect.any(String),
            },
          },
        ]);
        // Verify that disconnect and second connect use different session IDs
        // (disconnect is for first debugger, connect is for second debugger)
        const disconnectEvent = nullthrows(
          events.find(e => e.event === 'disconnect'),
        );
        const connectEvents = events.filter(e => e.event === 'connect');
        expect(connectEvents).toHaveLength(2);
        expect(disconnectEvent.payload.sessionId).toBe(
          connectEvents[0].payload.sessionId,
        );
        expect(disconnectEvent?.payload.sessionId).not.toBe(
          connectEvents[1].payload.sessionId,
        );
      } finally {
        device?.close();
        debugger1?.close();
        debugger2?.close();
      }
    });

    test('debugger connection to a nonexistent page is rejected', async () => {
      let device, debugger_;
      try {
        device = await createDeviceMock(
          `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
          autoCleanup.signal,
        );
        // Set up a page.
        device.getPages.mockImplementation(() => [
          {
            app: 'bar-app',
            id: 'page1',
            title: 'bar-title',
            vm: 'bar-vm',
          },
        ]);
        let pageList: Array<PageDescription> = [];
        await until(async () => {
          pageList = (await fetchJson(
            `${serverRef.serverBaseUrl}/json`,
            // $FlowFixMe[unclear-type]
          )) as any;
          expect(pageList).toHaveLength(1);
        });
        const [{webSocketDebuggerUrl}] = pageList;

        // Connect the debugger to a nonexistent page.
        debugger_ = await createDebuggerMock(
          webSocketDebuggerUrl.replaceAll('page1', 'some-other-id'),
          autoCleanup.signal,
        );

        // The debugger gets disconnected automatically.
        await until(async () => {
          expect([
            // CLOSING
            3,
            // CLOSED
            4,
          ]).toContain(debugger_.socket.readyState);
        });

        expect(device.connect).not.toHaveBeenCalled();
        expect(device.disconnect).not.toHaveBeenCalled();
      } finally {
        device?.close();
        debugger_?.close();
      }
    });

    test('debugger connection to a nonexistent page does not kill the current debugger connection', async () => {
      let device, debugger1, debugger2;
      try {
        device = await createDeviceMock(
          `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
          autoCleanup.signal,
        );
        // Set up a page.
        device.getPages.mockImplementation(() => [
          {
            app: 'bar-app',
            id: 'page1',
            title: 'bar-title',
            vm: 'bar-vm',
          },
        ]);
        let pageList: Array<PageDescription> = [];
        await until(async () => {
          pageList = (await fetchJson(
            `${serverRef.serverBaseUrl}/json`,
            // $FlowFixMe[unclear-type]
          )) as any;
          expect(pageList).toHaveLength(1);
        });
        const [{webSocketDebuggerUrl}] = pageList;

        // Connect the first debugger.
        debugger1 = await createDebuggerMock(
          webSocketDebuggerUrl,
          autoCleanup.signal,
        );

        // Connect a second debugger to a nonexistent page.
        debugger2 = await createDebuggerMock(
          webSocketDebuggerUrl.replaceAll('page1', 'some-other-id'),
          autoCleanup.signal,
        );

        // The second debugger gets disconnected automatically.
        await until(async () => {
          expect([
            // CLOSING
            3,
            // CLOSED
            4,
          ]).toContain(debugger2.socket.readyState);
        });

        // We can still send messages through the first debugger.
        await sendFromDebuggerToTarget(debugger1, device, 'page1', {
          method: 'Runtime.enable',
          id: 0,
        });

        expect(device.connect).toHaveBeenCalledWith({
          event: 'connect',
          payload: {
            pageId: 'page1',
            sessionId: expect.any(String),
          },
        });
        expect(device.disconnect).not.toHaveBeenCalled();
      } finally {
        device?.close();
        debugger1?.close();
        debugger2?.close();
      }
    });

    test.each([
      'http://[::]:8081',
      'http://[::]:3213',
      'http://localhost',
      'http://0.0.0.0:111',
    ])(
      'debugger connection with allowed origins: %s can be established',
      async origin => {
        const device1 = await createDeviceMock(
          `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
          autoCleanup.signal,
        );
        try {
          device1.getPages.mockImplementation(() => [
            {
              app: 'bar-app',
              id: 'page1',
              title: 'bar-title',
              vm: 'bar-vm',
            },
          ]);

          let pageList: JsonPagesListResponse = [];
          await until(async () => {
            pageList = (await fetchJson(
              `${serverRef.serverBaseUrl}/json`,
              // $FlowFixMe[unclear-type]
            )) as any;
            expect(pageList).toHaveLength(1);
          });
          const [{webSocketDebuggerUrl}] = pageList;
          expect(webSocketDebuggerUrl).toBeDefined();

          await expect(
            createDebuggerMock(webSocketDebuggerUrl, autoCleanup.signal, {
              ...(origin ? {Origin: origin} : {}),
            }),
          ).resolves.toBeDefined();
        } finally {
          device1.close();
        }
      },
    );

    test.each([
      undefined,
      '',
      'invalid',
      'justhost.com',
      'http://attacker.com',
      'http://attacker.com:8083',
    ])(
      'debugger connection with invalid / different origin: %s is rejected',
      async origin => {
        const device1 = await createDeviceMock(
          `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
          autoCleanup.signal,
        );
        try {
          device1.getPages.mockImplementation(() => [
            {
              app: 'bar-app',
              id: 'page1',
              title: 'bar-title',
              vm: 'bar-vm',
            },
          ]);

          let pageList: JsonPagesListResponse = [];
          await until(async () => {
            pageList = (await fetchJson(
              `${serverRef.serverBaseUrl}/json`,
              // $FlowFixMe[unclear-type]
            )) as any;
            expect(pageList).toHaveLength(1);
          });
          const [{webSocketDebuggerUrl}] = pageList;
          expect(webSocketDebuggerUrl).toBeDefined();

          await expect(
            createDebuggerMock(webSocketDebuggerUrl, autoCleanup.signal, {
              ...(origin ? {Origin: origin} : {}),
            }),
          ).rejects.toThrow('Unexpected server response: 401');
        } finally {
          device1.close();
        }
      },
    );

    describe('session ID handling', () => {
      test('each debugger connection receives a unique session ID', async () => {
        let device, debugger1, debugger2;
        try {
          device = await createDeviceMock(
            `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
            autoCleanup.signal,
          );
          device.getPages.mockImplementation(() => [
            {
              app: 'bar-app',
              id: 'page1',
              title: 'bar-title',
              vm: 'bar-vm',
            },
          ]);
          let pageList: Array<PageDescription> = [];
          await until(async () => {
            pageList = (await fetchJson(
              `${serverRef.serverBaseUrl}/json`,
              // $FlowFixMe[unclear-type]
            )) as any;
            expect(pageList).toHaveLength(1);
          });
          const [{webSocketDebuggerUrl}] = pageList;

          // Collect all connect events
          const connectEvents: Array<
            Readonly<{
              event: string,
              payload: Readonly<{pageId: string, sessionId?: string}>,
            }>,
          > = [];
          device.connect.mockImplementation(message => {
            connectEvents.push(message);
          });

          // Connect first debugger
          debugger1 = await createDebuggerMock(
            webSocketDebuggerUrl,
            autoCleanup.signal,
          );
          await until(() => expect(device.connect).toBeCalled());

          // Connect second debugger to the same page
          debugger2 = await createDebuggerMock(
            webSocketDebuggerUrl,
            autoCleanup.signal,
          );
          await until(() => expect(connectEvents).toHaveLength(2));

          // Verify session IDs are unique
          const sessionId1 = connectEvents[0].payload.sessionId;
          const sessionId2 = connectEvents[1].payload.sessionId;
          expect(sessionId1).toEqual(expect.any(String));
          expect(sessionId2).toEqual(expect.any(String));
          expect(sessionId1).not.toEqual(sessionId2);
        } finally {
          device?.close();
          debugger1?.close();
          debugger2?.close();
        }
      });

      test('session ID is included in all wrappedEvent messages from debugger to device', async () => {
        let device, debugger_;
        try {
          device = await createDeviceMock(
            `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
            autoCleanup.signal,
          );
          device.getPages.mockImplementation(() => [
            {
              app: 'bar-app',
              id: 'page1',
              title: 'bar-title',
              vm: 'bar-vm',
            },
          ]);
          let pageList: Array<PageDescription> = [];
          await until(async () => {
            pageList = (await fetchJson(
              `${serverRef.serverBaseUrl}/json`,
              // $FlowFixMe[unclear-type]
            )) as any;
            expect(pageList).toHaveLength(1);
          });
          const [{webSocketDebuggerUrl}] = pageList;

          debugger_ = await createDebuggerMock(
            webSocketDebuggerUrl,
            autoCleanup.signal,
          );
          await until(() => expect(device.connect).toBeCalled());

          // Get the session ID from the connect event
          const connectPayload = device.connect.mock.calls[0][0].payload;
          const sessionId = connectPayload.sessionId;

          // Send multiple messages and verify they all have the same sessionId
          debugger_.send({method: 'Runtime.enable', id: 1});
          debugger_.send({method: 'Debugger.enable', id: 2});
          debugger_.send({method: 'Console.enable', id: 3});

          await until(() =>
            expect(device.wrappedEvent).toHaveBeenCalledTimes(3),
          );

          // All messages should have the same sessionId
          device.wrappedEventParsed.mock.calls.forEach(call => {
            expect(call[0].sessionId).toBe(sessionId);
          });
        } finally {
          device?.close();
          debugger_?.close();
        }
      });

      test('disconnect event includes the session ID', async () => {
        let device, debugger_;
        try {
          device = await createDeviceMock(
            `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
            autoCleanup.signal,
          );
          device.getPages.mockImplementation(() => [
            {
              app: 'bar-app',
              id: 'page1',
              title: 'bar-title',
              vm: 'bar-vm',
            },
          ]);
          let pageList: Array<PageDescription> = [];
          await until(async () => {
            pageList = (await fetchJson(
              `${serverRef.serverBaseUrl}/json`,
              // $FlowFixMe[unclear-type]
            )) as any;
            expect(pageList).toHaveLength(1);
          });
          const [{webSocketDebuggerUrl}] = pageList;

          debugger_ = await createDebuggerMock(
            webSocketDebuggerUrl,
            autoCleanup.signal,
          );
          await until(() => expect(device.connect).toBeCalled());

          // Get the session ID from the connect event
          const connectPayload = device.connect.mock.calls[0][0].payload;
          const sessionId = connectPayload.sessionId;

          // Close the debugger
          debugger_.close();

          // Verify disconnect includes the sessionId
          await until(() => expect(device.disconnect).toBeCalled());
          expect(device.disconnect).toHaveBeenCalledWith({
            event: 'disconnect',
            payload: {
              pageId: 'page1',
              sessionId,
            },
          });
        } finally {
          device?.close();
          debugger_?.close();
        }
      });

      test('page with supportsMultipleDebuggers allows concurrent debugger connections', async () => {
        let device, debugger1, debugger2;
        try {
          device = await createDeviceMock(
            `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
            autoCleanup.signal,
          );
          // Page with supportsMultipleDebuggers capability
          device.getPages.mockImplementation(() => [
            {
              app: 'bar-app',
              id: 'page1',
              title: 'bar-title',
              vm: 'bar-vm',
              capabilities: {
                supportsMultipleDebuggers: true,
              },
            },
          ]);
          let pageList: Array<PageDescription> = [];
          await until(async () => {
            pageList = (await fetchJson(
              `${serverRef.serverBaseUrl}/json`,
              // $FlowFixMe[unclear-type]
            )) as any;
            expect(pageList).toHaveLength(1);
          });
          const [{webSocketDebuggerUrl}] = pageList;

          // Collect all connect and disconnect events
          const events: Array<ConnectRequest | DisconnectRequest> = [];
          device.connect.mockImplementation(message => {
            events.push(message);
          });
          device.disconnect.mockImplementation(message => {
            events.push(message);
          });

          // Connect first debugger
          debugger1 = await createDebuggerMock(
            webSocketDebuggerUrl,
            autoCleanup.signal,
          );
          await until(() => expect(device.connect).toBeCalledTimes(1));

          // Connect second debugger - should NOT kick out first
          debugger2 = await createDebuggerMock(
            webSocketDebuggerUrl,
            autoCleanup.signal,
          );
          await until(() => expect(device.connect).toBeCalledTimes(2));

          // Verify first debugger is still open (not kicked out)
          expect(debugger1.socket.readyState).toBe(1); // OPEN

          // Verify no disconnect events were sent
          expect(device.disconnect).not.toHaveBeenCalled();

          // Verify we have two connect events with unique session IDs
          expect(events).toHaveLength(2);
          expect(events[0].event).toBe('connect');
          expect(events[1].event).toBe('connect');
          expect(events[0].payload.sessionId).not.toEqual(
            events[1].payload.sessionId,
          );

          // Both debuggers can send messages independently
          debugger1.send({method: 'Runtime.enable', id: 1});
          debugger2.send({method: 'Debugger.enable', id: 2});

          await until(() =>
            expect(device.wrappedEvent).toHaveBeenCalledTimes(2),
          );

          // Verify messages came from different sessions
          const wrappedCalls = device.wrappedEventParsed.mock.calls;
          expect(wrappedCalls[0][0].sessionId).toBe(
            events[0].payload.sessionId,
          );
          expect(wrappedCalls[1][0].sessionId).toBe(
            events[1].payload.sessionId,
          );
        } finally {
          device?.close();
          debugger1?.close();
          debugger2?.close();
        }
      });
    });
  },
);

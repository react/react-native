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
} from '../inspector-proxy/types';

import {fetchJson} from './FetchUtils';
import {createDebuggerMock} from './InspectorDebuggerUtils';
import {createDeviceMock} from './InspectorDeviceUtils';
import {withAbortSignalForEachTest} from './ResourceUtils';
import {createServer} from './ServerUtils';
import until from 'wait-for-expect';

// WebSocket is unreliable when using fake timers.
jest.useRealTimers();

jest.setTimeout(10000);

describe('inspector proxy concurrent sessions', () => {
  const autoCleanup = withAbortSignalForEachTest();

  describe('enableStandaloneFuseboxShell experiment disabled', () => {
    test('connecting a second debugger disconnects the first', async () => {
      // Create a server with the experiment disabled
      const {server} = await createServer({
        logger: undefined,
        unstable_experiments: {
          enableStandaloneFuseboxShell: false,
        },
      });
      const serverBaseUrl = `http://localhost:${server.address().port}`;
      const serverBaseWsUrl = `ws://localhost:${server.address().port}`;

      let device, debugger1, debugger2;
      try {
        device = await createDeviceMock(
          `${serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
          autoCleanup.signal,
        );
        const events: Array<ConnectRequest | DisconnectRequest> = [];
        device.connect.mockImplementation(message => {
          events.push(message);
        });
        device.disconnect.mockImplementation(message => {
          events.push(message);
        });
        device.getPages.mockImplementation(() => [
          {
            id: 'page1',
            app: 'bar-app',
            title: 'bar-title',
          },
        ]);

        // Wait for page to be listed
        let pageList: JsonPagesListResponse = [];
        await until(async () => {
          pageList = (await fetchJson(
            `${serverBaseUrl}/json`,
            // $FlowFixMe[unclear-type]
          )) as any;
          expect(pageList).toHaveLength(1);
        });

        const webSocketDebuggerUrl = pageList[0].webSocketDebuggerUrl;

        // Connect first debugger
        debugger1 = await createDebuggerMock(
          webSocketDebuggerUrl,
          autoCleanup.signal,
        );
        await until(() => expect(device.connect).toHaveBeenCalledTimes(1));

        // Connect second debugger - this should disconnect the first one
        // because multi-session is disabled
        debugger2 = await createDebuggerMock(
          webSocketDebuggerUrl,
          autoCleanup.signal,
        );

        // First debugger should be disconnected
        await until(() =>
          expect([3, 4]).toContain(debugger1.socket.readyState),
        );

        // Second debugger should be open
        expect(debugger2.socket.readyState).toBe(1); // OPEN

        // Device should receive disconnect for the first session before
        // connect for the second
        await until(() => expect(events).toHaveLength(3));
        const [connect1, disconnect1, connect2] = events;
        expect(connect1).toEqual({
          event: 'connect',
          payload: {pageId: 'page1', sessionId: expect.any(String)},
        });
        expect(disconnect1).toEqual({
          event: 'disconnect',
          payload: {pageId: 'page1', sessionId: connect1.payload.sessionId},
        });
        expect(connect2).toEqual({
          event: 'connect',
          payload: {pageId: 'page1', sessionId: expect.any(String)},
        });
        expect(connect2.payload.sessionId).not.toBe(connect1.payload.sessionId);
      } finally {
        device?.close();
        debugger1?.close();
        debugger2?.close();
        server.close();
      }
    });
  });
});

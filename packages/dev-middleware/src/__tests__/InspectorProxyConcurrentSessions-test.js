/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {JsonPagesListResponse} from '../inspector-proxy/types';

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
    test('page reporting supportsMultipleDebuggers:true is treated as false', async () => {
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
        // Connect a device with a page that explicitly reports supportsMultipleDebuggers: true
        device = await createDeviceMock(
          `${serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
          autoCleanup.signal,
        );
        device.getPages.mockImplementation(() => [
          {
            id: 'page1',
            app: 'bar-app',
            title: 'bar-title',
            vm: 'bar-vm',
            capabilities: {
              supportsMultipleDebuggers: true,
            },
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

        // Verify the capability is reported as false in the page list
        expect(
          pageList[0].reactNative?.capabilities?.supportsMultipleDebuggers,
        ).toBe(false);

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

        // Device should have received disconnect for first session and connect for second
        await until(() => expect(device.disconnect).toHaveBeenCalledTimes(1));
        await until(() => expect(device.connect).toHaveBeenCalledTimes(2));
      } finally {
        device?.close();
        debugger1?.close();
        debugger2?.close();
        server.close();
      }
    });
  });
});

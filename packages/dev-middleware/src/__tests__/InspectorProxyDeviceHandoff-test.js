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
  GetPagesResponse,
  JsonPagesListResponse,
} from '../inspector-proxy/types';
import type {DeviceMock} from './InspectorDeviceUtils';

import {fetchJson} from './FetchUtils';
import {createDebuggerMock} from './InspectorDebuggerUtils';
import {createDeviceMock} from './InspectorDeviceUtils';
import {sendFromDebuggerToTarget} from './InspectorProtocolUtils';
import {withAbortSignalForEachTest} from './ResourceUtils';
import {withServerForEachTest} from './ServerUtils';
import until from 'wait-for-expect';

// WebSocket is unreliable when using fake timers.
jest.useRealTimers();

jest.setTimeout(10000);

const PAGE_DEFAULTS = {
  app: 'bar-app',
  id: 'page1',
  title: 'bar-title',
  vm: 'bar-vm',
};

describe('inspector-proxy device socket handoff', () => {
  const serverRef = withServerForEachTest({
    logger: undefined,
  });
  const autoCleanup = withAbortSignalForEachTest();
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('device ID collision with no debugger connected', async () => {
    let device1, device2;
    try {
      ({device: device1} = await connectDevice(
        '/inspector/device?device=device&name=foo&app=bar',
        [
          {
            ...PAGE_DEFAULTS,
            vm: 'bar-vm',
          },
        ],
      ));

      ({device: device2} = await connectDevice(
        '/inspector/device?device=device&name=foo&app=bar',
        [
          {
            ...PAGE_DEFAULTS,
            vm: 'bar-vm-updated',
          },
        ],
      ));

      // There's no debugger-->page connection to disconnect.
      expect(device1.disconnect).not.toBeCalled();

      // NOTE: It seems arbitrary that we don't close device1's socket here,
      // but that is the current behavior.
      expect(device1.socket.readyState).toBe(/* OPEN */ 1);
    } finally {
      device1?.close();
      device2?.close();
    }
  });

  test('device ID collision with a debugger connected', async () => {
    let device1, device2, debugger_, webSocketDebuggerUrl;
    try {
      ({
        device: device1,
        pageList: [{webSocketDebuggerUrl}],
      } = await connectDevice(
        '/inspector/device?device=device&name=foo&app=bar',
        [
          {
            ...PAGE_DEFAULTS,
            vm: 'bar-vm',
          },
        ],
      ));

      debugger_ = await createDebuggerMock(
        webSocketDebuggerUrl,
        autoCleanup.signal,
      );

      ({device: device2} = await connectDevice(
        '/inspector/device?device=device&name=foo&app=bar',
        [
          {
            ...PAGE_DEFAULTS,
            vm: 'bar-vm-updated',
          },
        ],
      ));

      // Even having handed off the debugger connection to device2, we don't
      // send a `disconnect` event for it to device1. We may want to change
      // this behavior in the future.
      expect(device1.disconnect).not.toBeCalled();

      expect([
        // CLOSING
        3,
        // CLOSED
        4,
      ]).toContain(device1.socket.readyState);

      // We can successfully send a message from the debugger to device2, even
      // though the initial debugger connection was to device1.
      device1.wrappedEventParsed.mockClear();
      const receivedByDevice2 = await sendFromDebuggerToTarget(
        debugger_,
        device2,
        'page1',
        {
          method: 'Console.enable',
          id: 0,
        },
      );
      expect(receivedByDevice2).toEqual({
        method: 'Console.enable',
        id: 0,
      });
      expect(device1.wrappedEventParsed).not.toBeCalled();
    } finally {
      device1?.close();
      device2?.close();
      debugger_?.close();
    }
  });

  test('device ID collision with multiple debuggers connected restores all connections', async () => {
    let device1, device2, debugger1, debugger2, webSocketDebuggerUrl;
    try {
      // Connect device with a page that supports multiple debuggers
      ({
        device: device1,
        pageList: [{webSocketDebuggerUrl}],
      } = await connectDevice(
        '/inspector/device?device=device&name=foo&app=bar',
        [
          {
            ...PAGE_DEFAULTS,
            vm: 'bar-vm',
            capabilities: {
              supportsMultipleDebuggers: true,
            },
          },
        ],
      ));

      // Connect two debuggers to the same page
      debugger1 = await createDebuggerMock(
        webSocketDebuggerUrl,
        autoCleanup.signal,
      );
      await until(() => expect(device1.connect).toBeCalledTimes(1));

      debugger2 = await createDebuggerMock(
        webSocketDebuggerUrl,
        autoCleanup.signal,
      );
      await until(() => expect(device1.connect).toBeCalledTimes(2));

      // Both debuggers should be open
      expect(debugger1.socket.readyState).toBe(1); // OPEN
      expect(debugger2.socket.readyState).toBe(1); // OPEN

      // Now simulate device ID collision (device reconnects with same ID)
      ({device: device2} = await connectDevice(
        '/inspector/device?device=device&name=foo&app=bar',
        [
          {
            ...PAGE_DEFAULTS,
            vm: 'bar-vm-updated',
            capabilities: {
              supportsMultipleDebuggers: true,
            },
          },
        ],
      ));

      // Device1 socket should be closed
      expect([3, 4]).toContain(device1.socket.readyState);

      // Both debugger sockets should still be open (handed off to device2)
      expect(debugger1.socket.readyState).toBe(1); // OPEN
      expect(debugger2.socket.readyState).toBe(1); // OPEN

      // Device2 should have received connect events for both debuggers
      await until(() => expect(device2.connect).toBeCalledTimes(2));

      // Both debuggers should be able to send messages to device2
      device1.wrappedEventParsed.mockClear();

      const receivedByDevice2FromDebugger1 = await sendFromDebuggerToTarget(
        debugger1,
        device2,
        'page1',
        {
          method: 'Runtime.enable',
          id: 1,
        },
      );
      expect(receivedByDevice2FromDebugger1).toEqual({
        method: 'Runtime.enable',
        id: 1,
      });

      const receivedByDevice2FromDebugger2 = await sendFromDebuggerToTarget(
        debugger2,
        device2,
        'page1',
        {
          method: 'Debugger.enable',
          id: 2,
        },
      );
      expect(receivedByDevice2FromDebugger2).toEqual({
        method: 'Debugger.enable',
        id: 2,
      });

      // Messages should not have been received by device1
      expect(device1.wrappedEventParsed).not.toBeCalled();

      // Verify the two messages to device2 have different session IDs
      const wrappedCalls = device2.wrappedEventParsed.mock.calls;
      expect(wrappedCalls).toHaveLength(2);
      expect(wrappedCalls[0][0].sessionId).not.toEqual(
        wrappedCalls[1][0].sessionId,
      );
    } finally {
      device1?.close();
      device2?.close();
      debugger1?.close();
      debugger2?.close();
    }
  });

  test.each([
    ['app', 'name'],
    ['name', 'app'],
  ])(
    'device ID collision with no debugger connected, same %s and differing %s',
    async (sameParam, differingParam) => {
      let device1, device2, debugger_, webSocketDebuggerUrl;
      try {
        ({device: device1} = await connectDevice(
          `/inspector/device?device=device&${sameParam}=foo&${differingParam}=bar`,
          [
            {
              ...PAGE_DEFAULTS,
              vm: 'bar-vm',
            },
          ],
        ));

        ({
          device: device2,
          pageList: [{webSocketDebuggerUrl}],
        } = await connectDevice(
          `/inspector/device?device=device&${sameParam}=foo&${differingParam}=BAZ`,
          [
            {
              ...PAGE_DEFAULTS,
              vm: 'bar-vm-updated',
            },
          ],
        ));

        expect([
          // CLOSING
          3,
          // CLOSED
          4,
        ]).toContain(device1.socket.readyState);

        debugger_ = await createDebuggerMock(
          webSocketDebuggerUrl,
          autoCleanup.signal,
        );

        device1.wrappedEventParsed.mockClear();
        const receivedByDevice2 = await sendFromDebuggerToTarget(
          debugger_,
          device2,
          'page1',
          {
            method: 'Console.enable',
            id: 0,
          },
        );
        expect(receivedByDevice2).toEqual({
          method: 'Console.enable',
          id: 0,
        });
        expect(device1.wrappedEventParsed).not.toBeCalled();
      } finally {
        device1?.close();
        device2?.close();
        debugger_?.close();
      }
    },
  );

  test.each([
    ['app', 'name'],
    ['name', 'app'],
  ])(
    'device ID collision with a debugger connected, same %s and differing %s',
    async (sameParam, differingParam) => {
      let device1, device2, debugger_, webSocketDebuggerUrl;
      try {
        ({
          device: device1,
          pageList: [{webSocketDebuggerUrl}],
        } = await connectDevice(
          `/inspector/device?device=device&${sameParam}=foo&${differingParam}=bar`,
          [
            {
              ...PAGE_DEFAULTS,
              vm: 'bar-vm',
            },
          ],
        ));
        debugger_ = await createDebuggerMock(
          webSocketDebuggerUrl,
          autoCleanup.signal,
        );
        ({
          device: device2,
          pageList: [{webSocketDebuggerUrl}],
        } = await connectDevice(
          `/inspector/device?device=device&${sameParam}=foo&${differingParam}=BAZ`,
          [
            {
              ...PAGE_DEFAULTS,
              vm: 'bar-vm-updated',
            },
          ],
        ));

        expect([
          // CLOSING
          3,
          // CLOSED
          4,
        ]).toContain(debugger_.socket.readyState);

        // NOTE: It seems arbitrary that we don't send a `disconnect` message to
        // device1.
        expect(device1.disconnect).not.toBeCalled();

        expect([
          // CLOSING
          3,
          // CLOSED
          4,
        ]).toContain(device1.socket.readyState);

        debugger_ = await createDebuggerMock(
          webSocketDebuggerUrl,
          autoCleanup.signal,
        );
        device1.wrappedEventParsed.mockClear();
        const receivedByDevice2 = await sendFromDebuggerToTarget(
          debugger_,
          device2,
          'page1',
          {
            method: 'Console.enable',
            id: 0,
          },
        );
        expect(receivedByDevice2).toEqual({
          method: 'Console.enable',
          id: 0,
        });
        expect(device1.wrappedEventParsed).not.toBeCalled();
      } finally {
        device1?.close();
        device2?.close();
        debugger_?.close();
      }
    },
  );

  // Helper function to create a DeviceMock and wait for its pages to be
  // reported by /json.
  async function connectDevice(
    wsUrlPath: string,
    pageListSpec: GetPagesResponse['payload'],
  ): Promise<{
    device: DeviceMock,
    pageList: JsonPagesListResponse,
  }> {
    let device;
    try {
      device = await createDeviceMock(
        serverRef.serverBaseWsUrl + wsUrlPath,
        autoCleanup.signal,
      );
      device.getPages.mockImplementation(() => pageListSpec);
      let pageList: JsonPagesListResponse = [];
      await until(async () => {
        pageList = (await fetchJson(
          `${serverRef.serverBaseUrl}/json`,
          // $FlowFixMe[unclear-type]
        )) as any;
        expect(pageList).toEqual(
          expect.arrayContaining(
            pageListSpec.map(pageSpec =>
              expect.objectContaining({
                description: pageSpec.app,
                id: expect.stringContaining(pageSpec.id),
                title: pageSpec.title,
                vm: pageSpec.vm,
              }),
            ),
          ),
        );
      });
      return {
        device,
        pageList,
      };
    } catch (e) {
      device?.close();
      throw e;
    }
  }
});

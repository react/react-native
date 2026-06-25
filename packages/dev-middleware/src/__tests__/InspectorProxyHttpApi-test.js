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
  JsonPagesListResponse,
  JsonVersionResponse,
} from '../inspector-proxy/types';
import type {DevToolLauncher} from '../types/DevToolLauncher';

import {fetchJson, requestLocal} from './FetchUtils';
import {createDeviceMock} from './InspectorDeviceUtils';
import {withAbortSignalForEachTest} from './ResourceUtils';
import {withServerForEachTest} from './ServerUtils';

// Must be greater than PAGES_POLLING_INTERVAL in `Device.js`
const PAGES_POLLING_DELAY = 2100;

jest.useFakeTimers();

const mockDevToolLauncher: DevToolLauncher = {
  launchDebuggerAppWindow: jest
    .fn<[string], Promise<void>>()
    .mockImplementation(() => Promise.resolve()),
};

describe('inspector proxy HTTP API', () => {
  const serverRef = withServerForEachTest({
    logger: undefined,
    unstable_experiments: {
      enableStandaloneFuseboxShell: false,
    },
    unstable_toolLauncher: mockDevToolLauncher,
  });
  const autoCleanup = withAbortSignalForEachTest();
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('/json/version endpoint', () => {
    test('returns version', async () => {
      const json = await fetchJson<JsonVersionResponse>(
        `${serverRef.serverBaseUrl}/json/version`,
      );
      expect(json).toMatchSnapshot();
    });
  });

  describe.each(['/json', '/json/list'])('%s endpoint', endpoint => {
    test('empty on start', async () => {
      const json = await fetchJson<JsonPagesListResponse>(
        `${serverRef.serverBaseUrl}${endpoint}`,
      );
      expect(json).toEqual([]);
    });

    test('updates page details through polling', async () => {
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

        jest.advanceTimersByTime(PAGES_POLLING_DELAY);

        const jsonBefore = await fetchJson<JsonPagesListResponse>(
          `${serverRef.serverBaseUrl}${endpoint}`,
        );

        device1.getPages.mockImplementation(() => [
          {
            app: 'bar-app',
            id: 'page1-updated',
            title: 'bar-title-updated',
            vm: 'bar-vm-updated',
          },
        ]);

        jest.advanceTimersByTime(PAGES_POLLING_DELAY);

        const jsonAfter = await fetchJson<JsonPagesListResponse>(
          `${serverRef.serverBaseUrl}${endpoint}`,
        );

        expect(jsonBefore).toEqual([
          expect.objectContaining({
            id: 'device1-page1',
            title: 'bar-title',
            vm: 'bar-vm',
          }),
        ]);

        expect(jsonAfter).toEqual([
          expect.objectContaining({
            id: 'device1-page1-updated',
            title: 'bar-title-updated',
            vm: 'bar-vm-updated',
          }),
        ]);
      } finally {
        device1.close();
      }
    });

    test('returns to empty on device disconnect', async () => {
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

        jest.advanceTimersByTime(PAGES_POLLING_DELAY);

        const jsonBefore = await fetchJson<JsonPagesListResponse>(
          `${serverRef.serverBaseUrl}${endpoint}`,
        );

        device1.close();

        const jsonAfter = await fetchJson<JsonPagesListResponse>(
          `${serverRef.serverBaseUrl}${endpoint}`,
        );

        expect(jsonBefore).toEqual([
          expect.objectContaining({
            id: 'device1-page1',
            title: 'bar-title',
            vm: 'bar-vm',
          }),
        ]);

        expect(jsonAfter).toEqual([]);
      } finally {
        device1.close();
      }
    });

    test('reports pages from two connected devices', async () => {
      const device1 = await createDeviceMock(
        `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
        autoCleanup.signal,
      );

      device1.getPages.mockImplementation(() => [
        {
          app: 'bar-app',
          id: 'page1',
          title: 'bar-title',
          vm: 'bar-vm',
        },
      ]);

      const device2 = await createDeviceMock(
        `${serverRef.serverBaseWsUrl}/inspector/device?device=device2&name=foo&app=bar`,
        autoCleanup.signal,
      );
      device2.getPages.mockImplementation(() => [
        {
          app: 'bar-app',
          id: 'page1',
          title: 'bar-title',
        },
      ]);

      // Ensure polling has happened a few times
      jest.advanceTimersByTime(10 * PAGES_POLLING_DELAY);

      try {
        const json = await fetchJson<JsonPagesListResponse>(
          `${serverRef.serverBaseUrl}${endpoint}`,
        );
        expect(json).toEqual([
          {
            appId: 'bar-app',
            description: 'bar-app',
            deviceName: 'foo',
            devtoolsFrontendUrl: expect.any(String),
            id: 'device1-page1',
            reactNative: {
              capabilities: {
                supportsMultipleDebuggers: false,
              },
              logicalDeviceId: 'device1',
            },
            title: 'bar-title',
            type: 'node',
            vm: 'bar-vm',
            webSocketDebuggerUrl: expect.any(String),
          },
          {
            appId: 'bar-app',
            description: 'bar-app',
            deviceName: 'foo',
            devtoolsFrontendUrl: expect.any(String),
            id: 'device2-page1',
            reactNative: {
              capabilities: {
                supportsMultipleDebuggers: false,
              },
              logicalDeviceId: 'device2',
            },
            title: 'bar-title',
            type: 'node',
            webSocketDebuggerUrl: expect.any(String),
          },
        ]);
      } finally {
        device1.close();
        device2.close();
      }
    });

    test('removes pages with duplicate IDs', async () => {
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
          {
            app: 'bar-app-other',
            id: 'page1',
            title: 'bar-title-other',
            vm: 'bar-vm-other',
          },
        ]);

        jest.advanceTimersByTime(PAGES_POLLING_DELAY);

        const json = await fetchJson<JsonPagesListResponse>(
          `${serverRef.serverBaseUrl}${endpoint}`,
        );

        expect(json).toEqual([
          expect.objectContaining({
            id: 'device1-page1',
            title: 'bar-title-other',
            vm: 'bar-vm-other',
          }),
        ]);
      } finally {
        device1.close();
      }
    });

    describe('HTTP vs HTTPS', () => {
      const secureServerRef = withServerForEachTest({
        logger: undefined,
        secure: true,
      });

      test('uses `wss` scheme and param if server is HTTPS', async () => {
        const page = {
          app: 'bar-app',
          id: 'page1',
          title: 'bar-title',
          vm: 'bar-vm',
        };

        let deviceHttp, deviceHttps;

        try {
          deviceHttp = await createDeviceMock(
            `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
            autoCleanup.signal,
          );
          deviceHttp.getPages.mockImplementation(() => [page]);

          deviceHttps = await createDeviceMock(
            `${secureServerRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
            autoCleanup.signal,
          );
          deviceHttps.getPages.mockImplementation(() => [page]);

          jest.advanceTimersByTime(PAGES_POLLING_DELAY);

          const [pageHttp] = await fetchJson<JsonPagesListResponse>(
            `${serverRef.serverBaseUrl}${endpoint}`,
          );
          const [pageHttps] = await fetchJson<JsonPagesListResponse>(
            `${secureServerRef.serverBaseUrl}${endpoint}`,
          );

          expect(pageHttp.webSocketDebuggerUrl).toMatch(/^ws:\/\//);
          expect(pageHttps.webSocketDebuggerUrl).toMatch(/^wss:\/\//);
          expect(pageHttp.devtoolsFrontendUrl).toMatch(/[&?]ws=/);
          expect(pageHttps.devtoolsFrontendUrl).toMatch(/[&?]wss=/);
        } finally {
          deviceHttp?.close();
          deviceHttps?.close();
        }
      });
    });

    test('handles Unicode data safely', async () => {
      const device = await createDeviceMock(
        `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
        autoCleanup.signal,
      );
      try {
        device.getPages.mockImplementation(() => [
          {
            app: 'bar-app 📱',
            id: 'page1 🛂',
            title: 'bar-title 📰',
            vm: 'bar-vm 🤖',
          },
        ]);

        jest.advanceTimersByTime(PAGES_POLLING_DELAY);

        const json = await fetchJson<JsonPagesListResponse>(
          `${serverRef.serverBaseUrl}${endpoint}`,
        );
        expect(json).toEqual([
          expect.objectContaining({
            description: 'bar-app 📱',
            deviceName: 'foo',
            id: 'device1-page1 🛂',
            title: 'bar-title 📰',
            vm: 'bar-vm 🤖',
          }),
        ]);
      } finally {
        device.close();
      }
    });

    test('includes a valid Content-Length header', async () => {
      // NOTE: This test is needed because chrome://inspect's HTTP client is picky
      // and doesn't accept responses without a Content-Length header.
      const device = await createDeviceMock(
        `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
        autoCleanup.signal,
      );
      try {
        device.getPages.mockImplementation(() => [
          {
            app: 'bar-app',
            id: 'page1',
            title: 'bar-title',
            vm: 'bar-vm',
          },
        ]);

        jest.advanceTimersByTime(PAGES_POLLING_DELAY);

        const response = await requestLocal(
          `${serverRef.serverBaseUrl}${endpoint}`,
        );
        expect(response.headers.get('Content-Length')).not.toBeNull();
      } finally {
        device.close();
      }
    });
  });

  describe('/open-debugger endpoint', () => {
    test('opens requested device using device and target query params', async () => {
      // Connect a device to use when opening the debugger
      const device = await createDeviceMock(
        `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
        autoCleanup.signal,
      );
      device.getPages.mockImplementation(() => [
        {
          app: 'bar-app',
          id: 'page1',
          title: 'bar-title',
          vm: 'bar-vm',
          capabilities: {
            // Ensure the device target can be found when launching the debugger
            nativePageReloads: true,
          },
        },
      ]);
      jest.advanceTimersByTime(PAGES_POLLING_DELAY);

      try {
        // Fetch the target information for the device
        const pageListResponse = await fetchJson<JsonPagesListResponse>(
          `${serverRef.serverBaseUrl}/json`,
        );
        // Select the first target from the page list response
        expect(pageListResponse.length).toBeGreaterThanOrEqual(1);
        const firstPage = pageListResponse[0];

        // Build the URL for the debugger
        const openUrl = new URL('/open-debugger', serverRef.serverBaseUrl);
        openUrl.searchParams.set(
          'device',
          firstPage.reactNative.logicalDeviceId,
        );
        openUrl.searchParams.set('target', firstPage.id);
        // Request to open the debugger for the first device
        const response = await requestLocal(openUrl.toString(), {
          method: 'POST',
        });

        // Ensure the request was handled properly
        expect(response.statusCode).toBe(200);
        // Ensure the debugger was launched
        expect(
          mockDevToolLauncher.launchDebuggerAppWindow,
        ).toHaveBeenCalledWith(expect.any(String));
      } finally {
        device.close();
      }
    });
  });
});

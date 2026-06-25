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
import type {
  DebuggerShellPreparationResult,
  DevToolLauncher,
} from '../types/DevToolLauncher';

import {fetchJson, requestLocal} from './FetchUtils';
import {createDeviceMock} from './InspectorDeviceUtils';
import {withAbortSignalForEachTest} from './ResourceUtils';
import {withServerForEachTest} from './ServerUtils';

// Must be greater than PAGES_POLLING_INTERVAL in `Device.js`
const PAGES_POLLING_DELAY = 2100;

jest.useFakeTimers();

async function setupDevice(
  serverRef: {readonly serverBaseWsUrl: string, ...},
  signal: AbortSignal,
) {
  const device = await createDeviceMock(
    `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
    signal,
  );
  device.getPages.mockImplementation(() => [
    {
      app: 'bar-app',
      id: 'page1',
      title: 'bar-title',
      vm: 'bar-vm',
      capabilities: {
        nativePageReloads: true,
      },
    },
  ]);
  jest.advanceTimersByTime(PAGES_POLLING_DELAY);

  return device;
}

function setupToolLauncherWithFuseboxShell(
  prepareDebuggerShell: () => Promise<DebuggerShellPreparationResult>,
) {
  const ToolLauncherWithFuseboxShell: DevToolLauncher = {
    launchDebuggerAppWindow: async (url: string) => {},
    launchDebuggerShell: () => {
      throw new Error('Not implemented');
    },
    prepareDebuggerShell,
  };

  const prepareDebuggerShellSpy = jest.spyOn(
    ToolLauncherWithFuseboxShell,
    'prepareDebuggerShell',
  );

  return {
    ToolLauncherWithFuseboxShell,
    prepareDebuggerShellSpy,
  };
}

describe('enableStandaloneFuseboxShell experiment', () => {
  const autoCleanup = withAbortSignalForEachTest();

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('/open-debugger endpoint', () => {
    describe('success', () => {
      const {ToolLauncherWithFuseboxShell, prepareDebuggerShellSpy} =
        setupToolLauncherWithFuseboxShell(() =>
          Promise.resolve({code: 'success'}),
        );
      const server = withServerForEachTest({
        logger: undefined,
        unstable_toolLauncher: ToolLauncherWithFuseboxShell,
        unstable_experiments: {
          enableStandaloneFuseboxShell: true,
        },
      });

      test('launches the shell with a frontend URL and stable window key', async () => {
        // Connect a device to use when opening the debugger
        const device = await setupDevice(server, autoCleanup.signal);

        const launchDebuggerAppWindowSpy = jest
          .spyOn(ToolLauncherWithFuseboxShell, 'launchDebuggerAppWindow')
          .mockResolvedValue();
        const showFuseboxShellSpy = jest
          .spyOn(ToolLauncherWithFuseboxShell, 'launchDebuggerShell')
          .mockResolvedValue();

        try {
          // Fetch the target information for the device
          const pageListResponse = await fetchJson<JsonPagesListResponse>(
            `${server.serverBaseUrl}/json`,
          );
          // Select the first target from the page list response
          expect(pageListResponse.length).toBeGreaterThanOrEqual(1);
          const firstPage = pageListResponse[0];

          // Build the URL for the debugger
          const openUrl = new URL('/open-debugger', server.serverBaseUrl);
          openUrl.searchParams.set('launchId', 'launch1');
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

          // Debugger was launched but will fail to prepare standalone shell
          expect(prepareDebuggerShellSpy).toHaveBeenCalled();

          // Ensure the debugger was launched using the standalone shell API
          expect(showFuseboxShellSpy).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(String),
          );

          // No call to the regular browser launcher since standalone shell should be used
          expect(launchDebuggerAppWindowSpy).not.toHaveBeenCalled();

          const firstWindowKey = showFuseboxShellSpy.mock.calls[0][1];

          showFuseboxShellSpy.mockClear();
          openUrl.searchParams.set('launchId', 'launch2');

          const anotherResponse = await requestLocal(openUrl.toString(), {
            method: 'POST',
          });

          // Ensure the request was handled properly
          expect(anotherResponse.statusCode).toBe(200);

          // Ensure the debugger was launched using the standalone shell API and the same window key
          expect(showFuseboxShellSpy).toHaveBeenCalledWith(
            expect.any(String),
            firstWindowKey,
          );

          // Ensure the debugger preparation function was called, just one time, during middleware initialization
          expect(showFuseboxShellSpy).toHaveBeenCalledTimes(1);

          // No fallback needed
          expect(launchDebuggerAppWindowSpy).not.toHaveBeenCalled();
        } finally {
          device.close();
        }
      });
    });

    describe('prepareDebuggerShell failures', () => {
      const {ToolLauncherWithFuseboxShell, prepareDebuggerShellSpy} =
        setupToolLauncherWithFuseboxShell(() =>
          Promise.resolve({code: 'platform_not_supported'}),
        );
      const server = withServerForEachTest({
        logger: undefined,
        unstable_toolLauncher: ToolLauncherWithFuseboxShell,
        unstable_experiments: {
          enableStandaloneFuseboxShell: true,
        },
      });

      test('falls back to browser window when preparation fails', async () => {
        // Connect a device to use when opening the debugger
        const device = await setupDevice(server, autoCleanup.signal);

        const launchDebuggerAppWindowSpy = jest
          .spyOn(ToolLauncherWithFuseboxShell, 'launchDebuggerAppWindow')
          .mockResolvedValue();
        const showFuseboxShellSpy = jest
          .spyOn(ToolLauncherWithFuseboxShell, 'launchDebuggerShell')
          .mockResolvedValue();

        try {
          // Fetch the target information for the device
          const pageListResponse = await fetchJson<JsonPagesListResponse>(
            `${server.serverBaseUrl}/json`,
          );
          // Select the first target from the page list response
          expect(pageListResponse.length).toBeGreaterThanOrEqual(1);
          const firstPage = pageListResponse[0];

          // Build the URL for the debugger
          const openUrl = new URL('/open-debugger', server.serverBaseUrl);
          openUrl.searchParams.set('launchId', 'launch1');
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

          // Debugger was launched but will fail to prepare standalone shell
          expect(prepareDebuggerShellSpy).toHaveBeenCalled();

          // Debugger is not launched with standalone shell since preparation failed
          expect(showFuseboxShellSpy).not.toHaveBeenCalled();

          // Debugger fallback
          expect(launchDebuggerAppWindowSpy).toHaveBeenCalled();
        } finally {
          device.close();
        }
      });
    });
  });
});

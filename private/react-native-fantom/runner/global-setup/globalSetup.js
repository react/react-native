/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {DevToolLauncher} from '@react-native/dev-middleware';

import {
  debugJS,
  isOSS,
  validateEnvironmentVariables,
} from '../EnvironmentOptions';
import {getTestBuildOutputPath} from '../paths';
import build from './build';
import {
  createDevMiddleware,
  unstable_DefaultToolLauncher as DefaultToolLauncher,
} from '@react-native/dev-middleware';
import * as Metro from 'metro';
import {Server} from 'node:net';
import path from 'node:path';

export default async function globalSetup(
  globalConfig: {
    collectCoverage: boolean,
    ...
  },
  projectConfig: {...},
): Promise<void> {
  process.env.__FANTOM_RUN_ID__ ??= `run-${Date.now()}`;

  validateEnvironmentVariables();

  await startMetroServer();

  if (!isOSS) {
    await build(globalConfig.collectCoverage, {
      LLVM_PROFILE_FILE: globalConfig.collectCoverage
        ? getTestBuildOutputPath() + 'fantom.profraw'
        : undefined,
    });
  }
}

async function startMetroServer() {
  const metroConfig = await Metro.loadConfig({
    config: path.resolve(__dirname, '..', '..', 'config', 'metro.config.js'),
  });

  if (process.env.__FANTOM_METRO_PORT__ == null) {
    const availablePort = await findAvailablePort();
    process.env.__FANTOM_METRO_PORT__ = String(availablePort);
  }

  // We need to reuse the same port across runs because can only set environment
  // variables for workers in the first one.
  // $FlowExpectedError[cannot-write]
  metroConfig.server.port = Number(process.env.__FANTOM_METRO_PORT__);

  const serverBaseUrl = `http://localhost:${metroConfig.server.port}`;
  const devToolLauncher: DevToolLauncher = {
    launchDebuggerAppWindow: async (url: string) => {
      if (debugJS) {
        await DefaultToolLauncher.launchDebuggerAppWindow(url, {
          allowInTests: true,
        });
      }
    },
  };

  const {
    middleware: devMiddleware,
    websocketEndpoints: debuggerWebsocketEndpoints,
  } = createDevMiddleware({
    serverBaseUrl,
    unstable_toolLauncher: devToolLauncher,
    unstable_experiments: {
      enableStandaloneFuseboxShell: false,
    },
  });

  const server = await Metro.runServer(metroConfig, {
    unstable_extraMiddleware: [devMiddleware],
    waitForBundler: true,
    watch: true,
    websocketEndpoints: {
      ...debuggerWebsocketEndpoints,
    },
  });

  // $FlowExpectedError[prop-missing]
  globalThis.__FANTOM_METRO_SERVER__ = server;
}

async function findAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = new Server();
    server.listen(0, 'localhost', undefined, () => {
      const port = server.address().port;
      server.close(error => {
        if (error != null) {
          reject(error);
        } else {
          resolve(port);
        }
      });
    });
    server.on('error', reject);
  });
}

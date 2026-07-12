/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Server as HttpServer} from 'http';
import type {Server as HttpsServer} from 'https';

import * as Metro from 'metro';
import {mergeConfig} from 'metro-config';
import {Server as NetServer} from 'net';
import path from 'path';

let metroServer: ?(HttpServer | HttpsServer) = null;

export async function startMetroServer(): Promise<void> {
  process.env.__FANTOM_RUN_ID__ ??= `repl-${Date.now()}`;

  if (process.env.__FANTOM_METRO_PORT__ == null) {
    process.env.__FANTOM_METRO_PORT__ = String(await findAvailablePort());
  }

  const port = Number(process.env.__FANTOM_METRO_PORT__);

  const baseConfig = await Metro.loadConfig({
    config: path.resolve(__dirname, '..', 'config', 'metro.config.js'),
  });

  // Force the chosen port over the default one baked into the config.
  const metroConfig = mergeConfig(baseConfig, {server: {port}});

  const {httpServer} = await Metro.runServer(metroConfig, {
    waitForBundler: true,
    watch: true,
  });
  metroServer = httpServer;
}

export async function stopMetroServer(): Promise<void> {
  const server = metroServer;
  metroServer = null;
  if (server != null) {
    await new Promise<void>(resolve => {
      server.close(() => resolve());
    });
  }
}

async function findAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = new NetServer();
    server.listen(0, 'localhost', undefined, () => {
      const address = server.address();
      const port =
        address != null && typeof address === 'object' ? address.port : 0;
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

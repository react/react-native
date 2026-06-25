/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RunServerResult} from 'metro';

type MetroServer = NonNullable<RunServerResult?.['httpServer']>;

declare var __FANTOM_METRO_SERVER__: ?RunServerResult;

const SHUTDOWN_TIMEOUT_MS = 5_000;

function getMetroServer(): ?MetroServer {
  return typeof __FANTOM_METRO_SERVER__ !== 'undefined' &&
    __FANTOM_METRO_SERVER__ != null
    ? __FANTOM_METRO_SERVER__.httpServer
    : null;
}

export default async function globalTeardown(
  globalConfig: {...},
  projectConfig: {...},
): Promise<void> {
  const metroServer = getMetroServer();
  if (metroServer) {
    await stopMetroServer(metroServer);
  }
}

async function stopMetroServer(metroServer: MetroServer): Promise<void> {
  if (!metroServer.listening) {
    return;
  }

  const closed = new Promise<void>((resolve, reject) => {
    metroServer.close(error => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });

  // $FlowFixMe[method-unbinding] Node 18.2+ API
  if (typeof metroServer.closeIdleConnections === 'function') {
    metroServer.closeIdleConnections();
  }

  const timeout = new Promise<void>(resolve => {
    setTimeout(() => {
      // $FlowFixMe[method-unbinding] Node 18.2+ API
      if (typeof metroServer.closeAllConnections === 'function') {
        metroServer.closeAllConnections();
      }
      resolve();
    }, SHUTDOWN_TIMEOUT_MS);
  });

  await Promise.race([closed, timeout]);
}

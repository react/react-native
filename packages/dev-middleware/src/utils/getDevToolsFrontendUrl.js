/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Experiments} from '../types/Experiments';
import type {ReadonlyURL} from '../types/ReadonlyURL';

/**
 * Get the DevTools frontend URL to debug a given React Native CDP target.
 */
export default function getDevToolsFrontendUrl(
  experiments: Experiments,
  webSocketDebuggerUrl: string,
  devServerUrl: ReadonlyURL,
  options?: Readonly<{
    relative?: boolean,
    launchId?: string,
    telemetryInfo?: string,
    appId?: string,
    panel?: string,
  }>,
): string {
  const wsParam = getWsParam({
    webSocketDebuggerUrl,
    devServerUrl,
  });

  const appUrl =
    (options?.relative === true ? '' : devServerUrl.origin) +
    '/debugger-frontend/rn_fusebox.html';

  const searchParams = new URLSearchParams([
    [wsParam.key, wsParam.value],
    ['sources.hide_add_folder', 'true'],
  ]);
  if (experiments.enableNetworkInspector) {
    searchParams.append('unstable_enableNetworkPanel', 'true');
  }
  if (options?.launchId != null && options.launchId !== '') {
    searchParams.append('launchId', options.launchId);
  }
  if (options?.appId != null && options.appId !== '') {
    searchParams.append('appId', options.appId);
  }
  if (options?.telemetryInfo != null && options.telemetryInfo !== '') {
    searchParams.append('telemetryInfo', options.telemetryInfo);
  }
  if (options?.panel != null && options.panel !== '') {
    searchParams.append('panel', options.panel);
  }

  return appUrl + '?' + searchParams.toString();
}

function getWsParam({
  webSocketDebuggerUrl,
  devServerUrl,
}: Readonly<{
  webSocketDebuggerUrl: string,
  devServerUrl: ReadonlyURL,
}>): {
  key: string,
  value: string,
} {
  const wsUrl = new URL(webSocketDebuggerUrl);
  const serverHost = devServerUrl.host;
  let value;
  if (wsUrl.host === serverHost) {
    // Use a path-absolute (host-relative) URL if the WS server and frontend
    // server are colocated. This is more robust for cases where the frontend
    // may actually load through a tunnel or proxy, and the WS connection
    // should therefore do the same.
    //
    // Depends on https://github.com/facebook/react-native-devtools-frontend/pull/4
    value = wsUrl.pathname + wsUrl.search + wsUrl.hash;
  } else {
    // Standard URL format accepted by the DevTools frontend
    value = wsUrl.host + wsUrl.pathname + wsUrl.search + wsUrl.hash;
  }
  const key = wsUrl.protocol.slice(0, -1);
  return {key, value};
}

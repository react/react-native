/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Server} from 'connect';
import type {TerminalReportableEvent} from 'metro';

const debug = require('debug')('ReactNative:CommunityCliPlugin');

type DevServerMiddlewareFactory = (params: {
  host?: string,
  port: number,
  watchFolders: ReadonlyArray<string>,
}) => {
  middleware: Server,
  websocketEndpoints: {[path: string]: ws$WebSocketServer},
  messageSocketEndpoint: {
    server: ws$WebSocketServer,
    broadcast: (
      method: string,
      params?: Record<string, unknown> | null,
    ) => void,
  },
  eventsSocketEndpoint: {
    server: ws$WebSocketServer,
    reportEvent: (event: TerminalReportableEvent) => void,
  },
  ...
};

// $FlowFixMe[incompatible-type]
const unusedStubWSServer: ws$WebSocketServer = {};
// $FlowFixMe[incompatible-type]
const unusedMiddlewareStub: Server = {};

// FIXME: Several features will break without community middleware
// (@react-native-community/cli-server-api) and should be migrated into core.
// e.g. used by packages/react-native/Libraries/Core/Devtools/:
// - /open-stack-frame
// - /open-url
// - /symbolicate
// e.g. used by ./isDevServerRunning.js:
// - /status
const communityMiddlewareFallback: DevServerMiddlewareFactory = () => ({
  middleware: unusedMiddlewareStub,
  websocketEndpoints: {},
  messageSocketEndpoint: {
    server: unusedStubWSServer,
    broadcast: (
      method: string,
      _params?: Record<string, unknown> | null,
    ): void => {},
  },
  eventsSocketEndpoint: {
    server: unusedStubWSServer,
    reportEvent: (event: TerminalReportableEvent) => {},
  },
});

/**
 * Attempt to load the `createDevServerMiddleware` factory from
 * `@react-native-community/cli` (an optional peer dependency). If it cannot be
 * found, return a factory that produces stub middleware instead.
 */
export default function loadCommunityMiddleware(): DevServerMiddlewareFactory {
  try {
    // `@react-native-community/cli` is an optional peer dependency of this
    // package, and should be a dev dependency of the host project (via the
    // community template's package.json).
    const communityCliPath = require.resolve('@react-native-community/cli');

    // Until https://github.com/react-native-community/cli/pull/2605 lands,
    // we need to find `@react-native-community/cli-server-api` via
    // `@react-native-community/cli`. Once that lands, we can simply
    // require('@react-native-community/cli').
    const communityCliServerApiPath = require.resolve(
      '@react-native-community/cli-server-api',
      {paths: [communityCliPath]},
    );
    // $FlowFixMe[unsupported-syntax] dynamic import
    return require(communityCliServerApiPath).createDevServerMiddleware;
  } catch {
    debug(`⚠️ Unable to find @react-native-community/cli-server-api
Starting the server without the community middleware.`);
    return communityMiddlewareFallback;
  }
}

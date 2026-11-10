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

type DevServerMiddlewareFactory = (params: {
  host?: string,
  port: number,
  watchFolders: ReadonlyArray<string>,
}) => {
  middleware: Server,
  websocketEndpoints: {[path: string]: ws$WebSocketServer},
  ...
};

// $FlowFixMe[incompatible-type]
const unusedMiddlewareStub: Server = {};

const communityMiddlewareFallback: DevServerMiddlewareFactory = () => ({
  middleware: unusedMiddlewareStub,
  websocketEndpoints: {},
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
    // $FlowFixMe[prop-missing]
    // $FlowFixMe[untyped-import]
    return require('@react-native-community/cli').createDevServerMiddleware;
  } catch {
    console.warn(`⚠️ Unable to find @react-native-community/cli.
Starting dev server without community middleware endpoints - some functionality may be broken.`);
    return communityMiddlewareFallback;
  }
}

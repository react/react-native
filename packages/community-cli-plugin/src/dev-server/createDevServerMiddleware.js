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

import openStackFrameMiddleware from './openStackFrameMiddleware';
import openURLMiddleware from './openURLMiddleware';
import securityHeadersMiddleware from './securityHeadersMiddleware';
import compression from 'compression';
import connect from 'connect';
import nocache from 'nocache';

type Options = Readonly<{
  serverBaseUrl: URL,
  watchFolders: ReadonlyArray<string>,
}>;

/**
 * The dev server routes that React Native tooling and apps call outside
 * Metro and `@react-native/dev-middleware`.
 */
export default function createDevServerMiddleware({
  serverBaseUrl,
  watchFolders,
}: Options): Server {
  return connect()
    .use(securityHeadersMiddleware({serverBaseUrl}))
    .use(compression())
    .use(nocache())
    .use('/open-stack-frame', openStackFrameMiddleware({watchFolders}))
    .use('/open-url', openURLMiddleware());
}

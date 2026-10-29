/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {NextHandleFunction} from 'connect';

type Options = Readonly<{
  projectRoot: string,
}>;

/**
 * Report that this dev server is running for `projectRoot`, so that the app
 * and `isDevServerRunning` can tell it from another process on the port.
 */
export default function statusMiddleware({
  projectRoot,
}: Options): NextHandleFunction {
  const projectRootHeader = new URL(`file:///${projectRoot}`).pathname.slice(1);

  return (req, res) => {
    res.setHeader('X-React-Native-Project-Root', projectRootHeader);
    res.setHeader('Cache-Control', 'no-store');
    res.end('packager-status:running');
  };
}

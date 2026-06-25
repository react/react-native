/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import type {StackFrame} from '../NativeExceptionsManager';

const getDevServer = require('./getDevServer').default;

export type CodeFrame = Readonly<{
  content: string,
  location: ?{
    row: number,
    column: number,
    ...
  },
  fileName: string,
}>;

export type SymbolicatedStackTrace = Readonly<{
  stack: Array<StackFrame>,
  codeFrame: ?CodeFrame,
}>;

export default async function symbolicateStackTrace(
  stack: Array<StackFrame>,
  extraData?: unknown,
): Promise<SymbolicatedStackTrace> {
  const devServer = getDevServer();
  if (!devServer.bundleLoadedFromServer) {
    throw new Error('Bundle was not loaded from Metro.');
  }

  // Lazy-load `fetch` until the first symbolication call to avoid circular requires.
  const fetch = global.fetch ?? require('../../Network/fetch').fetch;
  const response = await fetch(devServer.url + 'symbolicate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({stack, extraData}),
  });
  return await response.json();
}

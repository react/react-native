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

import isAllowedOrigin from './isAllowedOrigin';
import readJSONBody from './readJSONBody';
import launchEditor from 'launch-editor';
import fs from 'node:fs';
import path from 'node:path';

const LAUNCH_THROTTLE_MS = 2000;

type Options = Readonly<{
  serverBaseUrl: URL,
  watchFolders: ReadonlyArray<string>,
}>;

type StackFrame = Readonly<{
  file: string,
  lineNumber?: number,
}>;

/**
 * Open a stack frame in the user's editor, through `launch-editor` and
 * `$REACT_EDITOR`. The file must resolve, through any symlinks, to a path
 * inside one of `watchFolders`; a relative path resolves against the first.
 */
export default function openStackFrameMiddleware({
  serverBaseUrl,
  watchFolders,
}: Options): NextHandleFunction {
  const rootsPromise = Promise.all(
    watchFolders.map(folder =>
      fs.promises.realpath(folder).catch(() => path.resolve(folder)),
    ),
  );

  let lastLaunchTime = -Infinity;

  return async (req, res, next) => {
    // `@react-native-community/cli-server-api` before v21, mounted ahead of
    // this middleware, serves this route and calls `next()` after responding.
    if (req.method !== 'POST' || res.writableEnded) {
      next();
      return;
    }

    const {origin} = req.headers;
    if (typeof origin === 'string' && !isAllowedOrigin(origin, serverBaseUrl)) {
      res.writeHead(403);
      res.end('Unauthorized origin');
      return;
    }

    let body;
    try {
      body = await readJSONBody(req);
    } catch {
      res.writeHead(400);
      res.end('Invalid request body');
      return;
    }

    const frame = parseStackFrame(body);
    if (frame == null) {
      res.writeHead(400);
      res.end('Expected a JSON body with a string `file`');
      return;
    }

    const roots = await rootsPromise;
    const filePath = await resolveInRoots(frame.file, roots);
    if (filePath == null) {
      res.writeHead(400);
      res.end('File is missing or outside the project watch folders');
      return;
    }

    const now = Date.now();
    if (now - lastLaunchTime < LAUNCH_THROTTLE_MS) {
      res.writeHead(429);
      res.end('Too many requests');
      return;
    }
    lastLaunchTime = now;

    launchEditor(
      frame.lineNumber != null ? `${filePath}:${frame.lineNumber}` : filePath,
      process.env.REACT_EDITOR,
    );

    res.writeHead(200);
    res.end('OK');
  };
}

function parseStackFrame(body: unknown): ?StackFrame {
  if (body == null || typeof body !== 'object' || Array.isArray(body)) {
    return null;
  }
  const {file, lineNumber} = body;
  if (typeof file !== 'string' || file === '') {
    return null;
  }
  return typeof lineNumber === 'number' &&
    Number.isSafeInteger(lineNumber) &&
    lineNumber > 0
    ? {file, lineNumber}
    : {file};
}

async function resolveInRoots(
  file: string,
  roots: ReadonlyArray<string>,
): Promise<?string> {
  if (roots.length === 0) {
    return null;
  }
  let realPath;
  try {
    realPath = await fs.promises.realpath(path.resolve(roots[0], file));
  } catch {
    return null;
  }
  const isInRoot = (root: string) => {
    const relativePath = path.relative(root, realPath);
    return (
      relativePath !== '' &&
      relativePath !== '..' &&
      !relativePath.startsWith('..' + path.sep) &&
      !path.isAbsolute(relativePath)
    );
  };
  return roots.some(isInRoot) ? realPath : null;
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {DevToolLauncher} from '../types/DevToolLauncher';
import type {Logger} from '../types/Logger';
import type {ReadonlyURL} from '../types/ReadonlyURL';
import type {NextHandleFunction} from 'connect';
import type {IncomingMessage, ServerResponse} from 'node:http';

import isAllowedOrigin from '../utils/isAllowedOrigin';
import fs from 'node:fs';
import path from 'node:path';

const MAX_BODY_BYTES = 100 * 1024;
const LAUNCH_THROTTLE_MS = 2000;

type Options = Readonly<{
  serverBaseUrl: ReadonlyURL,
  watchFolders: ReadonlyArray<string>,
  toolLauncher: DevToolLauncher,
  logger?: Logger,
}>;

type StackFrame = Readonly<{
  file: string,
  lineNumber?: number,
}>;

/**
 * Open a stack frame in the user's editor. The file must resolve, through any
 * symlinks, to a path inside one of `watchFolders`; a relative path resolves
 * against the first.
 */
export default function openStackFrameMiddleware({
  serverBaseUrl,
  watchFolders,
  toolLauncher,
  logger,
}: Options): NextHandleFunction {
  const rootsPromise = Promise.all(
    watchFolders.map(folder =>
      fs.promises.realpath(folder).catch(() => path.resolve(folder)),
    ),
  );

  let lastLaunchTime = -Infinity;

  return async (
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: Error) => void,
  ) => {
    // Older versions of `@react-native-community/cli-server-api`, mounted
    // ahead of this middleware, serve this route and call `next()` after
    // responding.
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
      body = JSON.parse(await readBody(req));
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

    if (toolLauncher.launchEditor == null) {
      res.writeHead(501);
      res.end('Opening files is not supported by the current tool launcher');
      return;
    }

    const now = Date.now();
    if (now - lastLaunchTime < LAUNCH_THROTTLE_MS) {
      res.writeHead(429);
      res.end('Too many requests');
      return;
    }
    lastLaunchTime = now;

    try {
      await toolLauncher.launchEditor(filePath, frame.lineNumber);
    } catch (e) {
      logger?.error('Error opening editor: %s', e.message);
      res.writeHead(500);
      res.end();
      return;
    }

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

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Array<Buffer> = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

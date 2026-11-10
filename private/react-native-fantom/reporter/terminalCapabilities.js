/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {Buffer} from 'node:buffer';

interface TerminalInput {
  readonly isRaw: boolean;
  readonly readableFlowing: ?boolean;
  listenerCount(string): number;
  on('data', (Buffer | string) => void): unknown;
  removeListener('data', (Buffer | string) => void): unknown;
  setRawMode(boolean): unknown;
  pause(): unknown;
  unshift(Buffer): unknown;
}

interface TerminalOutput {
  write(string): unknown;
}

export default function queryImageSupport(
  input: TerminalInput,
  output: TerminalOutput,
): Promise<boolean> {
  if (input.listenerCount('data') > 0 || input.listenerCount('readable') > 0) {
    return Promise.resolve(false);
  }
  return new Promise(resolve => {
    const wasRaw = input.isRaw;
    const wasFlowing = input.readableFlowing === true;
    let pending = Buffer.alloc(0);
    let settled = false;
    const finish = (supported: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      let supportsImages = supported;
      try {
        input.setRawMode(wasRaw);
      } catch {
        supportsImages = false;
        try {
          output.write(
            'Fantom could not restore terminal input mode. Run `stty sane` if keyboard input stops echoing.\n',
          );
        } catch {}
      }
      try {
        input.removeListener('data', onData);
      } catch {
        supportsImages = false;
      }
      try {
        if (!wasFlowing) {
          input.pause();
        }
      } catch {
        supportsImages = false;
      }
      try {
        if (pending.length > 0) {
          input.unshift(pending);
        }
      } catch {
        supportsImages = false;
      }
      resolve(supportsImages);
    };
    const onData = (data: Buffer | string) => {
      if (settled) {
        return;
      }
      pending = Buffer.concat([
        pending,
        typeof data === 'string' ? Buffer.from(data) : data,
      ]);
      const text = pending.toString('latin1');
      const response = [...text.matchAll(/\[\?([0-9;]+)c/g)].find(
        match => text[match.index - 1] === '\x1b',
      );
      if (response != null) {
        const offset = response.index - 1;
        pending = Buffer.concat([
          pending.subarray(0, offset),
          pending.subarray(response.index + response[0].length),
        ]);
        // VS Code's image addon reports Sixel support (device attribute 4).
        finish(response[1].split(';').includes('4'));
      } else if (pending.length > 4096) {
        finish(false);
      }
    };
    const timeout = setTimeout(() => finish(false), 500);
    try {
      input.setRawMode(true);
      input.on('data', onData);
      output.write('\x1b[c');
    } catch {
      finish(false);
    }
  });
}

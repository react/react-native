/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import queryImageSupport from '../terminalCapabilities';
import {Buffer} from 'node:buffer';
import {PassThrough} from 'node:stream';

class TerminalInput extends PassThrough {
  isRaw: boolean = false;

  setRawMode(raw: boolean): this {
    this.isRaw = raw;
    return this;
  }
}

let input: TerminalInput;
const write = jest.fn<[string], boolean>(() => true);

beforeEach(() => {
  jest.useFakeTimers();
  input = new TerminalInput();
  input.pause();
});

afterEach(() => {
  jest.restoreAllMocks();
  input.destroy();
  write.mockReset();
  jest.useRealTimers();
});

it('confirms the device attributes reported by the VS Code image addon', async () => {
  const result = queryImageSupport(input, {write});
  expect(write).toHaveBeenCalledWith('\x1b[c');
  expect(input.isRaw).toBe(true);
  input.emit('data', Buffer.from('\x1b[?62;4;9;22c'));
  expect(await result).toBe(true);
  expect(input.isRaw).toBe(false);
  expect(input.readableFlowing).toBe(false);
  expect(input.listenerCount('data')).toBe(0);
  expect(jest.getTimerCount()).toBe(0);
});

it('rejects device attributes without image support', async () => {
  const result = queryImageSupport(input, {write});
  input.emit('data', Buffer.from('\x1b[?1;2c'));
  expect(await result).toBe(false);
  expect(jest.getTimerCount()).toBe(0);
});

it('keeps the text fallback when the terminal does not respond', async () => {
  const result = queryImageSupport(input, {write});
  jest.advanceTimersByTime(500);
  expect(await result).toBe(false);
  expect(input.isRaw).toBe(false);
  expect(input.readableFlowing).toBe(false);
  expect(input.listenerCount('data')).toBe(0);
});

it('accepts fragmented replies and preserves unrelated input', async () => {
  const result = queryImageSupport(input, {write});
  input.emit('data', Buffer.from('a\x1b[?62;'));
  input.emit('data', Buffer.from('4;9;22cb'));
  expect(await result).toBe(true);
  expect(input.read()?.toString()).toBe('ab');
});

it('does not mistake ordinary input for a device attributes reply', async () => {
  const result = queryImageSupport(input, {write});
  input.emit('data', Buffer.from('[?62;4;9;22c'));
  jest.advanceTimersByTime(500);
  expect(await result).toBe(false);
  expect(input.read()?.toString()).toBe('[?62;4;9;22c');
});

it('preserves input when the capability check times out', async () => {
  const result = queryImageSupport(input, {write});
  input.emit('data', Buffer.from('q'));
  jest.advanceTimersByTime(500);
  expect(await result).toBe(false);
  expect(input.read()?.toString()).toBe('q');
});

it('preserves an already active raw mode', async () => {
  input.setRawMode(true);
  const result = queryImageSupport(input, {write});
  input.emit('data', Buffer.from('\x1b[?62;4;9;22c'));
  expect(await result).toBe(true);
  expect(input.isRaw).toBe(true);
});

it('does not take input from another terminal reader', async () => {
  for (const event of ['data', 'readable']) {
    const listener = jest.fn();
    input.on(event, listener);
    expect(await queryImageSupport(input, {write})).toBe(false);
    expect(input.listenerCount(event)).toBe(1);
    expect(write).not.toHaveBeenCalled();
    expect(input.isRaw).toBe(false);
    input.removeListener(event, listener);
  }
});

it('falls back and restores the input if the query cannot be written', async () => {
  write.mockImplementation(() => {
    throw new Error('terminal disconnected');
  });
  expect(await queryImageSupport(input, {write})).toBe(false);
  expect(input.isRaw).toBe(false);
  expect(input.listenerCount('data')).toBe(0);
  expect(jest.getTimerCount()).toBe(0);
});

it('restores raw mode and buffered input even when pausing fails', async () => {
  const result = queryImageSupport(input, {write});
  jest.spyOn(input, 'pause').mockImplementationOnce(() => {
    throw new Error('pause failed');
  });
  input.emit('data', Buffer.from('q\x1b[?62;4;9;22c'));
  expect(await result).toBe(false);
  expect(input.isRaw).toBe(false);
  expect(input.listenerCount('data')).toBe(0);
  expect(jest.getTimerCount()).toBe(0);
  expect(input.read()?.toString()).toBe('q');
});

it('restores raw mode and buffered input when removing the listener fails', async () => {
  const result = queryImageSupport(input, {write});
  jest.spyOn(input, 'removeListener').mockImplementationOnce(() => {
    throw new Error('listener removal failed');
  });
  input.emit('data', Buffer.from('q\x1b[?62;4;9;22c'));
  expect(await result).toBe(false);
  expect(input.isRaw).toBe(false);
  expect(input.readableFlowing).toBe(false);
  expect(jest.getTimerCount()).toBe(0);
  expect(input.read()?.toString()).toBe('q');
});

it('restores raw mode before trying to put unrelated input back', async () => {
  const result = queryImageSupport(input, {write});
  jest.spyOn(input, 'unshift').mockImplementationOnce(() => {
    throw new Error('input closed');
  });
  input.emit('data', Buffer.from('q\x1b[?62;4;9;22c'));
  expect(await result).toBe(false);
  expect(input.isRaw).toBe(false);
  expect(input.listenerCount('data')).toBe(0);
});

it('reports a failed raw-mode restore and keeps the text fallback', async () => {
  jest.spyOn(input, 'setRawMode').mockImplementation(raw => {
    if (!raw) {
      throw new Error('raw-mode restore failed');
    }
    input.isRaw = raw;
    return input;
  });
  const result = queryImageSupport(input, {write});
  input.emit('data', Buffer.from('\x1b[?62;4;9;22c'));
  expect(await result).toBe(false);
  expect(write).toHaveBeenLastCalledWith(expect.stringContaining('stty sane'));
  expect(input.listenerCount('data')).toBe(0);
  expect(input.readableFlowing).toBe(false);
  expect(jest.getTimerCount()).toBe(0);
});

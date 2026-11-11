/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TestServer} from './SocketTestUtils';

import createEventsSocket from '../createEventsSocket';
import {startTestServer, waitUntil} from './SocketTestUtils';

jest.useRealTimers();

const logger = {warn: jest.fn(), error: jest.fn()};
const broadcast = jest.fn<[string, ?{[string]: unknown}], void>();

let testServer: TestServer;
let eventsSocket: ReturnType<typeof createEventsSocket>;

beforeEach(async () => {
  logger.warn.mockReset();
  logger.error.mockReset();
  broadcast.mockReset();
  testServer = await startTestServer();
  eventsSocket = createEventsSocket({
    logger,
    serverBaseUrl: testServer.baseUrl,
    broadcast,
  });
  testServer.mount('/events', eventsSocket.server);
});

afterEach(() => testServer.close());

describe('/events', () => {
  test('sends a reported event to every client', async () => {
    const first = await testServer.connect('/events');
    const second = await testServer.connect('/events');

    eventsSocket.reportEvent({type: 'bundle_build_started', id: 'a'});

    const expected = {type: 'bundle_build_started', id: 'a'};
    expect(await first.next()).toEqual(expected);
    expect(await second.next()).toEqual(expected);
  });

  test('formats the error of an event', async () => {
    const client = await testServer.connect('/events');

    eventsSocket.reportEvent({
      type: 'bundling_error',
      error: new Error('boom'),
    });

    expect(await client.next()).toEqual({
      type: 'bundling_error',
      error: expect.stringContaining('boom'),
    });
  });

  test('logs an event that cannot be serialized', async () => {
    const client = await testServer.connect('/events');
    const circular: {[string]: unknown} = {};
    circular.self = circular;

    eventsSocket.reportEvent(circular);
    eventsSocket.reportEvent({type: 'after'});

    expect(await client.next()).toEqual({type: 'after'});
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to serialize'),
    );
  });

  test('forwards a command to the connected apps', async () => {
    const client = await testServer.connect('/events');

    client.send({
      version: 2,
      type: 'command',
      command: 'reload',
      params: {a: 1},
    });

    await waitUntil(() =>
      expect(broadcast).toHaveBeenCalledWith('reload', {a: 1}),
    );
  });

  test.each([
    ['a message that is not JSON', 'not json', 'Failed to parse the message'],
    [
      'a message with another protocol version',
      '{"version":1,"type":"command","command":"reload"}',
      'wrong protocol version: 1',
    ],
  ])('logs and ignores %s', async (_, raw, logged) => {
    const client = await testServer.connect('/events');

    client.sendRaw(raw);
    client.send({version: 2, type: 'command', command: 'devMenu'});
    await waitUntil(() => expect(broadcast).toHaveBeenCalledTimes(1));

    expect(broadcast).toHaveBeenCalledWith('devMenu', undefined);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining(logged));
  });

  test.each([
    ['no origin', undefined],
    ['the dev server origin', 'SERVER'],
    ['a file origin', 'file://'],
  ])('accepts a client with %s', async (_, origin) => {
    const client = await testServer.connect('/events', {
      origin: origin === 'SERVER' ? testServer.baseUrl.origin : origin,
    });

    eventsSocket.reportEvent({type: 'x'});

    expect(await client.next()).toEqual({type: 'x'});
  });

  test('refuses a client with a foreign origin', async () => {
    await expect(
      testServer.connect('/events', {origin: 'https://example.com'}),
    ).rejects.toThrow('HTTP 401');
  });
});

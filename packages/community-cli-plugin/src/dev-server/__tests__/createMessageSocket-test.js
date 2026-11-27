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

import createMessageSocket from '../createMessageSocket';
import {startTestServer} from './SocketTestUtils';

jest.useRealTimers();

const logger = {warn: jest.fn(), error: jest.fn()};

let testServer: TestServer;
let messageSocket: ReturnType<typeof createMessageSocket>;

beforeEach(async () => {
  logger.warn.mockReset();
  logger.error.mockReset();
  testServer = await startTestServer();
  messageSocket = createMessageSocket({
    logger,
    serverBaseUrl: testServer.baseUrl,
  });
  testServer.mount('/message', messageSocket.server);
});

afterEach(() => testServer.close());

describe('/message', () => {
  test('answers getpeers with the other clients and their query', async () => {
    const first = await testServer.connect('/message?name=first&platform=ios');
    const firstId = await first.getId();
    const second = await testServer.connect('/message');

    second.send({version: 2, method: 'getpeers', target: 'server', id: 2});

    expect(await second.next()).toEqual({
      version: 2,
      result: {[firstId]: {name: 'first', platform: 'ios'}},
      id: 2,
    });
  });

  test('forwards a request to its target and the response back', async () => {
    const requester = await testServer.connect('/message');
    const target = await testServer.connect('/message');
    const requesterId = await requester.getId();
    const targetId = await target.getId();

    requester.send({
      version: 2,
      method: 'ping',
      target: targetId,
      id: 7,
      params: {n: 1},
    });
    expect(await target.next()).toEqual({
      version: 2,
      method: 'ping',
      params: {n: 1},
      id: {requestId: 7, clientId: requesterId},
    });

    target.send({
      version: 2,
      id: {requestId: 7, clientId: requesterId},
      result: 'pong',
    });
    expect(await requester.next()).toEqual({
      version: 2,
      id: 7,
      result: 'pong',
    });
  });

  test('replies with an error to a request for an unknown target', async () => {
    const client = await testServer.connect('/message');

    client.send({version: 2, method: 'ping', target: 'client#99', id: 3});

    expect(await client.next()).toEqual({
      version: 2,
      error: expect.stringContaining('could not find id "client#99"'),
      id: 3,
    });
  });

  test('relays a reload broadcast from a trusted client to the others', async () => {
    const sender = await testServer.connect('/message');
    const other = await testServer.connect('/message');

    sender.send({version: 2, method: 'reload', params: {a: 1}});

    expect(await other.next()).toEqual({
      version: 2,
      method: 'reload',
      params: {a: 1},
    });
    expect(await sender.drain()).toEqual([]);
  });

  test('drops a broadcast of any other method', async () => {
    const sender = await testServer.connect('/message');
    const other = await testServer.connect('/message');

    sender.send({version: 2, method: 'openFile', params: {}});

    expect(await sender.drain()).toEqual([]);
    expect(await other.drain()).toEqual([]);
  });

  test('drops a broadcast from a client with a foreign origin', async () => {
    const sender = await testServer.connect('/message', {
      origin: 'https://example.com',
    });
    const other = await testServer.connect('/message');

    sender.send({version: 2, method: 'reload'});

    expect(await sender.drain()).toEqual([]);
    expect(await other.drain()).toEqual([]);
  });

  test('broadcasts a server command to every client', async () => {
    const first = await testServer.connect('/message');
    const second = await testServer.connect('/message');
    await first.drain();
    await second.drain();

    messageSocket.broadcast('devMenu', {a: 1});

    const expected = {version: 2, method: 'devMenu', params: {a: 1}};
    expect(await first.next()).toEqual(expected);
    expect(await second.next()).toEqual(expected);
  });

  test.each([
    ['a message that is not JSON', 'not json', 'Failed to parse the message'],
    [
      'a message with another protocol version',
      '{"version":1,"method":"reload"}',
      'wrong protocol version: 1',
    ],
  ])('logs and ignores %s', async (_, raw, logged) => {
    const client = await testServer.connect('/message');
    const other = await testServer.connect('/message');

    client.sendRaw(raw);

    expect(await client.drain()).toEqual([]);
    expect(await other.drain()).toEqual([]);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining(logged));
  });
});

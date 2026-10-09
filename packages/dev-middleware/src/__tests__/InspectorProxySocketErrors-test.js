/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {fetchJson} from './FetchUtils';
import {createDeviceMock} from './InspectorDeviceUtils';
import {withAbortSignalForEachTest} from './ResourceUtils';
import {withServerForEachTest} from './ServerUtils';
import until from 'wait-for-expect';
import WS from 'ws';

// WebSocket is unreliable when using fake timers.
jest.useRealTimers();

jest.setTimeout(10000);

/**
 * A socket-level failure on one connection must not be fatal to the proxy.
 *
 * Without an 'error' listener on the accepted socket, Node throws on the
 * unhandled 'error' event and the whole dev server exits — so a single
 * misbehaving peer can end everyone's session. Reported as #57793, where a
 * normally-connected iOS simulator tripped the `maxFragments` cap in the
 * vendored `ws` and took Metro down with it.
 */
describe('inspector proxy socket errors', () => {
  const serverRef = withServerForEachTest({
    logger: undefined,
    secure: false,
  });
  const autoCleanup = withAbortSignalForEachTest();

  afterEach(() => {
    jest.clearAllMocks();
  });

  test.each([
    ['device', '/inspector/device?device=badDevice&name=foo&app=bar'],
    ['debugger', '/inspector/debug?device=badDevice&page=1'],
  ])(
    'a protocol error on a %s connection does not take down the proxy',
    async (_role, path) => {
      // A well-behaved device, so there is a live session to lose.
      const device = await createDeviceMock(
        `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
        autoCleanup.signal,
      );
      try {
        device.getPages.mockImplementation(() => [
          {
            app: 'bar-app',
            id: 'page1',
            title: 'bar-title',
            vm: 'bar-vm',
          },
        ]);
        await until(async () =>
          expect((await fetchJson(`${serverRef.serverBaseUrl}/json`)).length)
            .toBeGreaterThan(0),
        );

        // Now break one connection at the protocol level: a single message in
        // more fragments than the vendored `ws` permits, which fails the
        // receiver with RangeError and close code 1008.
        const bad = new WS(`${serverRef.serverBaseWsUrl}${path}`);
        bad.on('error', () => {});
        await new Promise((resolve, reject) => {
          bad.on('open', resolve);
          bad.on('close', resolve);
          bad.on('error', reject);
        }).catch(() => {});

        if (bad.readyState === WS.OPEN) {
          const sender = bad._sender;
          sender.send(Buffer.from('x'), {fin: false, opcode: 1, mask: true}, () => {});
          for (let i = 0; i < 17000; i++) {
            sender.send(Buffer.from('x'), {fin: false, opcode: 0, mask: true}, () => {});
          }
          sender.send(Buffer.from('x'), {fin: true, opcode: 0, mask: true}, () => {});
        }

        // The proxy is still serving, and the healthy device is still listed.
        await until(async () => {
          const pages = await fetchJson(`${serverRef.serverBaseUrl}/json`);
          expect(pages.length).toBeGreaterThan(0);
        });
      } finally {
        device.close();
      }
    },
  );
});

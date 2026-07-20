/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// $FlowFixMe[cannot-resolve-module] libdef missing in RN OSS
import type {Timeout} from 'node:timers';

// Import these from node:timers to get the correct Flow types.
// $FlowFixMe[cannot-resolve-module] libdef missing in RN OSS
import {clearTimeout, setTimeout} from 'node:timers';
import WS from 'ws';

export type HeartbeatTrackerArgs = {
  socket: WS,
  timeBetweenPings: number,
  minHighPingToReport: number,
  timeoutMs: number,
  onTimeout: (roundtripDuration: number) => void,
  onHighPing: (roundtripDuration: number) => void,
};

export default class InspectorProxyHeartbeat {
  #socket: WS;
  #timeBetweenPings: number;
  #minHighPingToReport: number;
  #timeoutMs: number;
  #onTimeout: (roundtripDuration: number) => void;
  #onHighPing: (roundtripDuration: number) => void;

  constructor(args: HeartbeatTrackerArgs): void {
    this.#socket = args.socket;
    this.#timeBetweenPings = args.timeBetweenPings;
    this.#minHighPingToReport = args.minHighPingToReport;
    this.#timeoutMs = args.timeoutMs;
    this.#onTimeout = args.onTimeout;
    this.#onHighPing = args.onHighPing;
  }

  start() {
    let latestPingMs = Date.now();
    let terminateTimeout: ?Timeout;

    const pingTimeout: Timeout = setTimeout(() => {
      if (this.#socket.readyState !== WS.OPEN) {
        // May be connecting or closing, try again later.
        pingTimeout.refresh();
        return;
      }

      if (!terminateTimeout) {
        terminateTimeout = setTimeout(() => {
          if (this.#socket.readyState !== WS.OPEN) {
            // May be connecting or closing, try again later.
            terminateTimeout?.refresh();
            return;
          }
          this.#onTimeout(this.#timeoutMs);
        }, this.#timeoutMs).unref();
      }

      latestPingMs = Date.now();
      this.#socket.ping();
    }, this.#timeBetweenPings).unref();

    this.#socket.on('pong', () => {
      const roundtripDuration = Date.now() - latestPingMs;

      if (roundtripDuration >= this.#minHighPingToReport) {
        this.#onHighPing(roundtripDuration);
      }

      terminateTimeout?.refresh();
      pingTimeout.refresh();
    });

    this.#socket.on('message', () => {
      terminateTimeout?.refresh();
    });

    this.#socket.on('close', (code: number, reason: string) => {
      terminateTimeout && clearTimeout(terminateTimeout);
      clearTimeout(pingTimeout);
    });
  }
}

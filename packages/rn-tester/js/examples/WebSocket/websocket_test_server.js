#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

/* eslint-env node */

const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

console.log(`\
Test server for WebSocketExample

This will send each incoming message right back to the other side.
Restart with the '--binary' command line flag to have it respond with an
ArrayBuffer instead of a string.
`);

const respondWithBinary = process.argv.indexOf('--binary') !== -1;
const server = new WebSocket.Server({port: 5555});
server.on('connection', ws => {
  ws.on('message', message => {
    console.log('Received message:', message);
    if (respondWithBinary) {
      // $FlowFixMe[incompatible-type]
      message = Buffer.from(message);
    }
    if (message === 'getImage') {
      message = fs.readFileSync(
        path.resolve(__dirname, '../../assets/flux@3x.png'),
      );
    }
    console.log('Replying with:', message);
    ws.send(message);
  });

  console.log('Incoming connection!');
  ws.send('Why hello there!');
});

#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

/* eslint-env node */

console.log(`\
Test server for WebSocketExample

This will set a cookie named "wstest" on the response of any incoming request.
`);

const connect = require('connect');
const http = require('node:http');

const app = connect();

app.use(function (req, res) {
  console.log('received request');
  res.setHeader('Set-Cookie', ['wstest=OK; Path=/']);
  res.end('Cookie has been set!\n');
});

http.createServer(app).listen(5556);

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

const WebSocket = require('../WebSocket').default;

describe('WebSocket', function () {
  it('should have connection lifecycle constants defined on the class', () => {
    expect(WebSocket.CONNECTING).toEqual(0);
  });

  it('should have connection lifecycle constants defined on the instance', () => {
    expect(new WebSocket('wss://echo.websocket.org').CONNECTING).toEqual(0);
  });
});

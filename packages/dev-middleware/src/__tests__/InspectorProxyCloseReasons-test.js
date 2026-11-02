/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {WS_CLOSE_REASON} from '../inspector-proxy/Device';

// WebSocket close frames limit the reason to 123 bytes (RFC 6455, 5.5).
const MAX_CLOSE_REASON_BYTES = 123;

describe('inspector proxy WebSocket close reasons', () => {
  test.each(Object.entries(WS_CLOSE_REASON))(
    '%s fits in a close frame',
    (_, reason) => {
      expect(Buffer.byteLength(reason)).toBeLessThanOrEqual(
        MAX_CLOSE_REASON_BYTES,
      );
    },
  );
});

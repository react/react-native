/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

const base64 = require('base64-js');

function binaryToBase64(data: ArrayBuffer | $ArrayBufferView): string {
  if (data instanceof ArrayBuffer) {
    // $FlowFixMe[reassign-const]
    data = new Uint8Array(data);
  }
  if (data instanceof Uint8Array) {
    return base64.fromByteArray(data);
  }
  if (!ArrayBuffer.isView(data)) {
    throw new Error('data must be ArrayBuffer or typed array');
  }
  // Already checked that `data` is `DataView` in `ArrayBuffer.isView(data)`
  const {buffer, byteOffset, byteLength}: DataView = data as $FlowFixMe;
  return base64.fromByteArray(new Uint8Array(buffer, byteOffset, byteLength));
}

export default binaryToBase64;

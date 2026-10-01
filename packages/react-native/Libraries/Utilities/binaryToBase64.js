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
  let dataView = data;
  if (dataView instanceof ArrayBuffer) {
    dataView = new Uint8Array(dataView);
  }
  if (dataView instanceof Uint8Array) {
    return base64.fromByteArray(dataView);
  }
  if (!ArrayBuffer.isView(dataView)) {
    throw new Error('data must be ArrayBuffer or typed array');
  }
  // Already checked that `dataView` is `DataView` in `ArrayBuffer.isView(dataView)`
  const {buffer, byteOffset, byteLength}: DataView = dataView as $FlowFixMe;
  return base64.fromByteArray(new Uint8Array(buffer, byteOffset, byteLength));
}

export default binaryToBase64;

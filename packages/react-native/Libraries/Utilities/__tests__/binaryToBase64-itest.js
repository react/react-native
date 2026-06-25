/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';
import binaryToBase64 from '../binaryToBase64';
import base64 from 'base64-js';

describe('binaryToBase64', () => {
  it('should encode a Uint8Array', () => {
    const bytes = new TextEncoder().encode('Test string');

    expect(decodeBase64(binaryToBase64(bytes))).toEqual(Array.from(bytes));
  });

  it('should encode an ArrayBuffer', () => {
    const bytes = new TextEncoder().encode('Test string');

    expect(decodeBase64(binaryToBase64(bytes.buffer))).toEqual(
      Array.from(bytes),
    );
  });

  it('should encode a DataView', () => {
    const bytes = new TextEncoder().encode('Test string');

    expect(decodeBase64(binaryToBase64(new DataView(bytes.buffer)))).toEqual(
      Array.from(bytes),
    );
  });

  it('should not encode a non-ArrayBuffer or non-TypedArray', () => {
    const input = ['i', 'n', 'v', 'a', 'l', 'i', 'd'];

    // $FlowExpectedError[incompatible-type]
    expect(() => binaryToBase64(input)).toThrow();
  });
});

function decodeBase64(base64String: string): Array<number> {
  return Array.from(base64.toByteArray(base64String));
}

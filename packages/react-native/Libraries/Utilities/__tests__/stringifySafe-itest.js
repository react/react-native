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
import stringifySafe, {createStringifySafeWithLimits} from '../stringifySafe';

describe('stringifySafe', () => {
  it('stringifySafe stringifies undefined values', () => {
    expect(stringifySafe(undefined)).toEqual('undefined');
  });

  it('stringifySafe stringifies null values', () => {
    expect(stringifySafe(null)).toEqual('null');
  });

  it('stringifySafe stringifies string values', () => {
    expect(stringifySafe('abc')).toEqual('"abc"');
  });

  it('stringifySafe stringifies function values', () => {
    expect(stringifySafe(function () {})).toEqual('function () { [bytecode] }');
  });

  it('stringifySafe stringifies non-circular objects', () => {
    expect(stringifySafe({a: 1})).toEqual('{"a":1}');
  });

  it('stringifySafe stringifies circular objects with toString', () => {
    const arg: {arg?: {...}} = {};
    arg.arg = arg;
    const result = stringifySafe(arg);
    expect(result).toEqual('[object Object]');
  });

  it('stringifySafe stringifies circular objects without toString', () => {
    const arg = {x: {} as {...}, toString: undefined};
    arg.x = arg;
    const result = stringifySafe(arg);
    expect(result).toEqual('["object" failed to stringify]');
  });

  it('stringifySafe stringifies error messages', () => {
    const error = new Error('error');
    const result = stringifySafe(error);
    expect(result).toEqual('Error: error');
  });

  it('stringifySafe truncates long strings', () => {
    const stringify = createStringifySafeWithLimits({maxStringLimit: 3});
    expect(stringify('abcdefghijklmnopqrstuvwxyz')).toEqual(
      '"abc...(truncated)..."',
    );
    expect(stringify({a: 'abcdefghijklmnopqrstuvwxyz'})).toEqual(
      '{"a":"abc...(truncated)..."}',
    );
  });

  it('stringifySafe truncates large arrays', () => {
    const stringify = createStringifySafeWithLimits({maxArrayLimit: 3});
    expect(stringify([1, 2, 3, 4, 5])).toEqual(
      '[1,2,3,"... extra 2 values truncated ..."]',
    );
    expect(stringify({a: [1, 2, 3, 4, 5]})).toEqual(
      '{"a":[1,2,3,"... extra 2 values truncated ..."]}',
    );
  });

  it('stringifySafe truncates large objects', () => {
    const stringify = createStringifySafeWithLimits({maxObjectKeysLimit: 3});
    expect(stringify({a: 1, b: 2, c: 3, d: 4, e: 5})).toEqual(
      '{"a":1,"b":2,"c":3,"...(truncated keys)...":2}',
    );
  });

  it('stringifySafe truncates deep objects', () => {
    const stringify = createStringifySafeWithLimits({maxDepth: 3});
    expect(stringify({a: {a: {a: {x: 0, y: 1, z: 2}}}})).toEqual(
      '{"a":{"a":{"a":"{ ... object with 3 keys ... }"}}}',
    );
  });
});

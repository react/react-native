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
import processAspectRatio from '../processAspectRatio';

describe('processAspectRatio', () => {
  it('should accept numbers', () => {
    expect(processAspectRatio(1)).toBe(1);
    expect(processAspectRatio(0)).toBe(0);
    expect(processAspectRatio(1.5)).toBe(1.5);
  });

  it('should accept string numbers', () => {
    expect(processAspectRatio('1')).toBe(1);
    expect(processAspectRatio('0')).toBe(0);
    expect(processAspectRatio('1.5')).toBe(1.5);
    expect(processAspectRatio('+1.5')).toBe(1.5);
    expect(processAspectRatio('   1')).toBe(1);
    expect(processAspectRatio('   0    ')).toBe(0);
  });

  it('should accept `auto`', () => {
    expect(processAspectRatio('auto')).toBe(undefined);
    expect(processAspectRatio(' auto')).toBe(undefined);
    expect(processAspectRatio(' auto  ')).toBe(undefined);
  });

  it('should accept ratios', () => {
    expect(processAspectRatio('+1/1')).toBe(1);
    expect(processAspectRatio('0 / 10')).toBe(0);
    expect(processAspectRatio('117/ 13')).toBe(9);
    expect(processAspectRatio('1.5 /1.2')).toBe(1.25);
    expect(processAspectRatio('1/0')).toBe(Infinity);
  });

  it('should not accept invalid formats', () => {
    expect(() => processAspectRatio('0a')).toThrow(
      'aspectRatio must either be a number, a ratio string or `auto`. You passed: 0a',
    );
    expect(() => processAspectRatio('1 / 1 1')).toThrow(
      'aspectRatio must either be a number, a ratio string or `auto`. You passed: 1 / 1 1',
    );
    expect(() => processAspectRatio('auto 1/1')).toThrow(
      'aspectRatio must either be a number, a ratio string or `auto`. You passed: auto 1/1',
    );
  });

  it('should ignore non string falsy types', () => {
    const invalidThings = [undefined, null, false];
    for (const thing of invalidThings) {
      // $FlowExpectedError[incompatible-type]
      expect(processAspectRatio(thing)).toBe(undefined);
    }
  });

  it('should not accept non string truthy types', () => {
    const invalidThings = [() => {}, [1, 2, 3], {}];
    for (const thing of invalidThings) {
      expect(() =>
        // $FlowExpectedError[incompatible-type]
        processAspectRatio(thing),
      ).toThrow(
        `aspectRatio must either be a number, a ratio string or \`auto\`. You passed: ${String(thing)}`,
      );
    }
  });
});

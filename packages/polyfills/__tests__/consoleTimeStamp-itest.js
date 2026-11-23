/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @fantom_mode *
 * @fantom_flags fuseboxEnabledRelease:*
 */

describe('console.timeStamp()', () => {
  it('installed', () => {
    expect(typeof console.timeStamp).toBe('function');
  });

  it("doesn't throw when label is not specified", () => {
    expect(() => console.timeStamp()).not.toThrow();
  });

  it("doesn't throw when label is specified", () => {
    expect(() => console.timeStamp('label')).not.toThrow();
  });

  it("doesn't throw when additional arguments are specified", () => {
    expect(() =>
      console.timeStamp('label', 100, 500, 'Track', 'Group', 'error', {
        tooltipText: 'Image processing failed',
      }),
    ).not.toThrow();
  });

  it("doesn't throw when invalid arguments are specified", () => {
    // $FlowExpectedError[incompatible-type]
    expect(() => console.timeStamp({})).not.toThrow();
    expect(() =>
      // $FlowExpectedError[incompatible-type]
      console.timeStamp('label', true, null, {}, [], () => {}),
    ).not.toThrow();
  });
});

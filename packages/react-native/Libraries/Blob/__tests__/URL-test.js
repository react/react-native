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

const {URL, URLSearchParams} = require('../URL');

describe('URL', function () {
  it('should have the URL string tag', () => {
    const url = new URL('https://reactnative.dev/docs?foo=bar');

    expect(Object.prototype.toString.call(url)).toBe('[object URL]');
  });
});

describe('URLSearchParams', function () {
  it('should have the URLSearchParams string tag', () => {
    const params = new URLSearchParams('foo=bar');

    expect(Object.prototype.toString.call(params)).toBe(
      '[object URLSearchParams]',
    );
  });
});

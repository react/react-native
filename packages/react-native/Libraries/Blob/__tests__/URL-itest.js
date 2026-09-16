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

const URL = require('../URL').URL;
const URLSearchParams = require('../URL').URLSearchParams;

describe('URL', function () {
  it('should pass Mozilla Dev Network examples', () => {
    const a = new URL('/', 'https://developer.mozilla.org');
    expect(a.href).toBe('https://developer.mozilla.org/');
    const b = new URL('https://developer.mozilla.org');
    expect(b.href).toBe('https://developer.mozilla.org/');
    const c = new URL('en-US/docs', b);
    expect(c.href).toBe('https://developer.mozilla.org/en-US/docs');
    const d = new URL('/en-US/docs', b);
    expect(d.href).toBe('https://developer.mozilla.org/en-US/docs');
    const f = new URL('/en-US/docs', d);
    expect(f.href).toBe('https://developer.mozilla.org/en-US/docs');
    // from original test suite, but requires complex implementation
    // const g = new URL(
    //   '/en-US/docs',
    //   'https://developer.mozilla.org/fr-FR/toto',
    // );
    // expect(g.href).toBe('https://developer.mozilla.org/en-US/docs');
    const h = new URL('/en-US/docs', a);
    expect(h.href).toBe('https://developer.mozilla.org/en-US/docs');
    const i = new URL('http://github.com', 'http://google.com');
    expect(i.href).toBe('http://github.com/');
    // Support Bare Hosts
    const j = new URL('home', 'http://localhost');
    expect(j.href).toBe('http://localhost/home');
    // Insert / between Base and Path if missing
    const k = new URL('en-US/docs', 'https://developer.mozilla.org');
    expect(k.href).toBe('https://developer.mozilla.org/en-US/docs');
    //More cases
    const url = new URL(
      'https://username:password@reactnative.dev:8080/docs/path?query=testQuery&key=value#fragment',
    );
    expect(url.hash).toBe('#fragment');
    expect(url.host).toBe('reactnative.dev:8080');
    expect(url.hostname).toBe('reactnative.dev');
    expect(url.password).toBe('password');
    expect(url.username).toBe('username');
    expect(url.pathname).toBe('/docs/path');
    expect(url.port).toBe('8080');
    expect(url.search).toBe('?query=testQuery&key=value');
    expect(url.protocol).toBe('https:');
    expect(url.toString()).toBe(
      'https://username:password@reactnative.dev:8080/docs/path?query=testQuery&key=value#fragment',
    );

    // Test searchParams
    const searchParams = url.searchParams;
    expect(searchParams.size).toBe(2);
    expect(searchParams.get('query')).toBe('testQuery');
    expect(searchParams.get('key')).toBe('value');

    const paramsFromString = new URLSearchParams(
      [
        '?param1=value1',
        '&param2=value2%20with%20spaces',
        '&param3=value3+with+spaces+legacy',
      ].join(''),
    );
    expect(paramsFromString.size).toBe(3);
    expect(paramsFromString.get('param1')).toBe('value1');
    expect(paramsFromString.get('param2')).toBe('value2 with spaces');
    expect(paramsFromString.get('param3')).toBe('value3 with spaces legacy');
    expect(paramsFromString.toString()).toBe(
      'param1=value1&param2=value2+with+spaces&param3=value3+with+spaces+legacy',
    );

    const paramsFromObject = new URLSearchParams({
      user: 'john',
      age: '30',
      active: 'true',
    });

    expect(paramsFromObject.size).toBe(3);
    expect(paramsFromObject.get('user')).toBe('john');
    expect(paramsFromObject.get('age')).toBe('30');
    expect(paramsFromObject.get('active')).toBe('true');

    const valuesArray = Array.from(paramsFromObject.values());
    expect(valuesArray).toEqual(['john', '30', 'true']);
    const entriesArray = Array.from(paramsFromObject.entries());
    expect(entriesArray).toEqual([
      ['user', 'john'],
      ['age', '30'],
      ['active', 'true'],
    ]);

    // URLSearchParams: Empty
    const emptyParams = new URLSearchParams('');
    expect(emptyParams.size).toBe(0);
    expect([...emptyParams.entries()]).toEqual([]);

    // URLSearchParams: Array (for multiple values of the same key)
    const paramsFromArray = new URLSearchParams([
      ['key1', 'value1'],
      ['key1', 'value2'],
      ['key2', 'value3'],
    ]);
    expect(paramsFromArray.size).toBe(2);
    expect(paramsFromArray.getAll('key1')).toEqual(['value1', 'value2']);
    expect(paramsFromArray.get('key2')).toBe('value3');

    // Manipulating existing search params in the URL
    const urlParams = url.searchParams;
    expect(urlParams.get('query')).toBe('testQuery');
    expect(urlParams.get('key')).toBe('value');

    // Adding a new param
    urlParams.append('newKey', 'newValue');
    expect(urlParams.size).toBe(3);
    expect(urlParams.get('newKey')).toBe('newValue');

    // Deleting a param
    urlParams.delete('key');
    expect(urlParams.size).toBe(2);
    expect(urlParams.get('key')).toBeNull();

    // Checking if a param exists
    expect(urlParams.has('query')).toBe(true);
    expect(urlParams.has('key')).toBe(false);

    // Sorting URLSearchParams is not exercised here: URLSearchParams.sort()
    // relies on String.prototype.localeCompare, which requires ICU collation
    // support that is unavailable in Fantom's Hermes build.

    // searchParams.set() should replace values not duplicate them
    const urlWithSearchParams = new URL(
      'https://example.com/api/data?foo=bar&baz=qux',
    );
    urlWithSearchParams.searchParams.set('foo', 'newFoo');
    urlWithSearchParams.searchParams.set('test', '12345');
    expect(urlWithSearchParams.toString()).toBe(
      'https://example.com/api/data?foo=newFoo&baz=qux&test=12345',
    );

    //url.search setter should replace search params
    const urlSearchSetter = new URL(
      'https://example.com/api/data?foo=bar&baz=qux',
    );

    urlSearchSetter.search = 'foo=overwritten&hello=world';

    expect(urlSearchSetter.toString()).toBe(
      'https://example.com/api/data?foo=overwritten&hello=world',
    );

    //URL constructor should not add trailing slash to paths
    const urlWithoutTrailing = new URL('https://example.com/path/to/resource');

    expect(urlWithoutTrailing.toString()).toBe(
      'https://example.com/path/to/resource',
    );
  });
});

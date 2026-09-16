/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

// `XMLHttpRequest` is set up as a global by the default environment (via
// `setUpXHR`), so these tests use the public global rather than importing the
// internal module. Fantom's HTTP client stub does not deliver responses, so
// they cover the synchronous XMLHttpRequest lifecycle and validation logic
// rather than response/progress/load/error events.
describe('XMLHttpRequest', () => {
  it('transitions to OPENED after open()', () => {
    const xhr = new XMLHttpRequest();
    expect(xhr.readyState).toBe(XMLHttpRequest.UNSENT);

    xhr.open('GET', 'https://example.com/data');
    expect(xhr.readyState).toBe(XMLHttpRequest.OPENED);
  });

  it('throws for synchronous requests', () => {
    const xhr = new XMLHttpRequest();
    expect(() => {
      xhr.open('GET', 'https://example.com', false);
    }).toThrow('Synchronous http requests are not supported');
  });

  it('throws when opening an empty url', () => {
    const xhr = new XMLHttpRequest();
    expect(() => {
      xhr.open('GET', '');
    }).toThrow('Cannot load an empty url');
  });

  it('throws when setting a request header before open()', () => {
    const xhr = new XMLHttpRequest();
    expect(() => {
      xhr.setRequestHeader('Content-Type', 'application/json');
    }).toThrow('Request has not been opened');
  });

  it('accepts request headers after open()', () => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://example.com');
    expect(() => {
      xhr.setRequestHeader('Content-Type', 'application/json');
    }).not.toThrow();
  });

  it('throws when sending before open()', () => {
    const xhr = new XMLHttpRequest();
    expect(() => {
      xhr.send();
    }).toThrow('Request has not been opened');
  });

  it('exposes an empty responseText before loading', () => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://example.com');
    expect(xhr.responseText).toBe('');
    expect(xhr.status).toBe(0);
    expect(xhr.getAllResponseHeaders()).toBe(null);
  });

  it('supports setting a valid responseType before send', () => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://example.com');
    xhr.responseType = 'json';
    expect(xhr.responseType).toBe('json');
  });

  it('exposes the upload object and fires onreadystatechange when opened', () => {
    const xhr = new XMLHttpRequest();
    const onReadyStateChange = jest.fn();
    xhr.onreadystatechange = onReadyStateChange;

    xhr.open('GET', 'https://example.com');

    // Opening advances readyState to OPENED, firing readystatechange.
    expect(onReadyStateChange).toHaveBeenCalled();
    expect(xhr.upload).toBeDefined();
  });
});

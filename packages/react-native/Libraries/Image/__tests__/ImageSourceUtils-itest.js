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

const {getImageSourcesFromImageProps} = require('../ImageSourceUtils');

const originalConsoleWarn = console.warn;

describe('ImageSourceUtils', () => {
  afterEach(() => {
    // $FlowFixMe[cannot-write]
    console.warn = originalConsoleWarn;
  });

  it('source prop provided', () => {
    const imageProps = {source: require('./img/img1.png')};
    const sources = getImageSourcesFromImageProps(imageProps);

    expect(sources).toBeDefined();
  });

  it('should ignore source when src is provided', () => {
    let uri = 'imageURI';
    const imageProps = {source: require('./img/img1.png'), src: uri};
    const sources = getImageSourcesFromImageProps(imageProps);

    expect(sources).toBeDefined();
    expect(sources).toHaveLength(1);
    if (!Array.isArray(sources)) {
      throw new Error('Expected `sources` to be an array');
    }
    expect(sources[0].uri).toBe(uri);
  });

  it('should ignore source and src when srcSet is provided', () => {
    let uri = 'imageURI';

    let uri1 = 'uri1';
    let scale1 = '1x';

    let uri2 = 'uri2';
    let scale2 = '2x';

    const imageProps = {
      source: require('./img/img1.png'),
      src: uri,
      srcSet: `${uri1} ${scale1}, ${uri2} ${scale2}`,
    };
    const sources = getImageSourcesFromImageProps(imageProps);

    expect(sources).toBeDefined();
    expect(sources).toHaveLength(2);
    if (!Array.isArray(sources)) {
      throw new Error('Expected `sources` to be an array');
    }
    expect(sources[0]).toEqual({
      headers: {},
      scale: 1,
      uri: uri1,
      width: undefined,
      height: undefined,
    });
    expect(sources[1]).toEqual({
      headers: {},
      scale: 2,
      uri: uri2,
      width: undefined,
      height: undefined,
    });
  });

  it('should use src as default when 1x scale is not provided in srcSet', () => {
    let uri = 'imageURI';

    let uri1 = 'uri1';
    let scale1 = '3x';

    let uri2 = 'uri2';
    let scale2 = '2x';

    const imageProps = {
      src: uri,
      srcSet: `${uri1} ${scale1}, ${uri2} ${scale2}`,
    };
    const sources = getImageSourcesFromImageProps(imageProps);

    expect(sources).toBeDefined();
    expect(sources).toHaveLength(3);
    if (!Array.isArray(sources)) {
      throw new Error('Expected `sources` to be an array');
    }
    expect(sources[0]).toEqual({
      headers: {},
      scale: 3,
      uri: uri1,
      width: undefined,
      height: undefined,
    });
    expect(sources[1]).toEqual({
      headers: {},
      scale: 2,
      uri: uri2,
      width: undefined,
      height: undefined,
    });
    expect(sources[2]).toEqual({
      headers: {},
      scale: 1,
      uri: uri,
      width: undefined,
      height: undefined,
    });
  });

  it('should use 1x as default scale if only url is provided in srcSet', () => {
    let uri1 = 'uri1';
    let scale1 = '2x';

    let uri2 = 'uri2';

    const imageProps = {
      srcSet: `${uri1} ${scale1}, ${uri2}`,
    };
    const sources = getImageSourcesFromImageProps(imageProps);

    expect(sources).toBeDefined();
    expect(sources).toHaveLength(2);
    if (!Array.isArray(sources)) {
      throw new Error('Expected `sources` to be an array');
    }
    expect(sources[0]).toEqual({
      headers: {},
      scale: 2,
      uri: uri1,
      width: undefined,
      height: undefined,
    });
    expect(sources[1]).toEqual({
      headers: {},
      scale: 1,
      uri: uri2,
      width: undefined,
      height: undefined,
    });
  });

  it('should parse srcSet values without spaces after commas', () => {
    const imageProps = {
      srcSet: 'uri1 1x,uri2 2x,uri3 3x',
    };
    const sources = getImageSourcesFromImageProps(imageProps);

    expect(sources).toBeDefined();
    expect(sources).toHaveLength(3);
    if (!Array.isArray(sources)) {
      throw new Error('Expected `sources` to be an array');
    }
    expect(sources[0]).toEqual({
      headers: {},
      scale: 1,
      uri: 'uri1',
      width: undefined,
      height: undefined,
    });
    expect(sources[1]).toEqual({
      headers: {},
      scale: 2,
      uri: 'uri2',
      width: undefined,
      height: undefined,
    });
    expect(sources[2]).toEqual({
      headers: {},
      scale: 3,
      uri: 'uri3',
      width: undefined,
      height: undefined,
    });
  });

  it('should parse fractional srcSet scales', () => {
    const imageProps = {
      srcSet: 'uri1 1.5x, uri2 2x',
    };
    const sources = getImageSourcesFromImageProps(imageProps);

    expect(sources).toBeDefined();
    expect(sources).toHaveLength(2);
    if (!Array.isArray(sources)) {
      throw new Error('Expected `sources` to be an array');
    }
    expect(sources[0]).toEqual({
      headers: {},
      scale: 1.5,
      uri: 'uri1',
      width: undefined,
      height: undefined,
    });
    expect(sources[1]).toEqual({
      headers: {},
      scale: 2,
      uri: 'uri2',
      width: undefined,
      height: undefined,
    });
  });

  it('should ignore srcSet entries with a bare x descriptor', () => {
    const imageProps = {
      src: 'fallbackUri',
      srcSet: 'invalid x, uri2 2x',
    };
    const sources = getImageSourcesFromImageProps(imageProps);

    expect(sources).toBeDefined();
    expect(sources).toHaveLength(2);
    if (!Array.isArray(sources)) {
      throw new Error('Expected `sources` to be an array');
    }
    expect(sources[0]).toEqual({
      headers: {},
      scale: 2,
      uri: 'uri2',
      width: undefined,
      height: undefined,
    });
    expect(sources[1]).toEqual({
      headers: {},
      scale: 1,
      uri: 'fallbackUri',
      width: undefined,
      height: undefined,
    });
  });

  it('should warn when an unsupported scale is provided in srcSet', () => {
    const mockWarn = jest.fn();
    // $FlowFixMe[cannot-write]
    console.warn = mockWarn;
    let uri1 = 'uri1';
    let scale1 = '300w';

    let uri2 = 'uri2';

    const imageProps = {
      srcSet: `${uri1} ${scale1}, ${uri2}`,
    };
    const sources = getImageSourcesFromImageProps(imageProps);

    expect(sources).toBeDefined();
    expect(sources).toHaveLength(1);
    expect(mockWarn).toHaveBeenCalled();
  });

  it('should contain crossorigin headers when provided with src', () => {
    let uri = 'imageURI';

    const imageProps = {
      src: uri,
      crossOrigin: 'use-credentials' as const,
    };
    const sources = getImageSourcesFromImageProps(imageProps);

    expect(sources).toBeDefined();
    expect(sources).toHaveLength(1);
    if (!Array.isArray(sources)) {
      throw new Error('Expected `sources` to be an array');
    }
    expect(sources[0].headers).toEqual({
      ['Access-Control-Allow-Credentials']: 'true',
    });
  });

  it('should contain referrerPolicy headers when provided with src', () => {
    let uri = 'imageURI';

    let referrerPolicy = 'origin-when-cross-origin' as const;
    const imageProps = {
      src: uri,
      referrerPolicy,
    };
    const sources = getImageSourcesFromImageProps(imageProps);

    expect(sources).toBeDefined();
    expect(sources).toHaveLength(1);
    if (!Array.isArray(sources)) {
      throw new Error('Expected `sources` to be an array');
    }
    expect(sources[0].headers).toEqual({
      ['Referrer-Policy']: referrerPolicy,
    });
  });
});

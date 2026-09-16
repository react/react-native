/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import FormData from '../FormData';

describe('FormData', function () {
  let formData;

  beforeEach(() => {
    formData = new FormData();
  });

  it('should return non blob null', function () {
    // $FlowFixMe[incompatible-type]
    formData.append('null', null);

    const expectedPart = {
      string: 'null',
      headers: {
        'content-disposition': 'form-data; name="null"',
      },
      fieldName: 'null',
    };
    expect(formData.getParts()[0]).toEqual(expectedPart);
  });

  it('should return blob', function () {
    formData.append('photo', {
      uri: 'arbitrary/path',
      type: 'image/jpeg',
      name: 'photo.jpg',
    });

    const expectedPart = {
      uri: 'arbitrary/path',
      type: 'image/jpeg',
      name: 'photo.jpg',
      headers: {
        'content-disposition': 'form-data; name="photo"; filename="photo.jpg"',
        'content-type': 'image/jpeg',
      },
      fieldName: 'photo',
    };
    expect(formData.getParts()[0]).toEqual(expectedPart);
  });

  it('should return blob with the correct utf-8 handling', function () {
    formData.append('photo', {
      uri: 'arbitrary/path',
      type: 'image/jpeg',
      name: '测试photo.jpg',
    });

    const expectedPart = {
      uri: 'arbitrary/path',
      type: 'image/jpeg',
      name: '测试photo.jpg',
      headers: {
        'content-disposition':
          'form-data; name="photo"; filename="%E6%B5%8B%E8%AF%95photo.jpg"',
        'content-type': 'image/jpeg',
      },
      fieldName: 'photo',
    };
    expect(formData.getParts()[0]).toEqual(expectedPart);
  });

  it('should return non blob array', function () {
    // $FlowFixMe[incompatible-type]
    formData.append('array', [
      true,
      false,
      undefined,
      null,
      {},
      [],
      'string',
      0,
    ]);

    const expectedPart = {
      string: 'true,false,,,[object Object],,string,0',
      headers: {
        'content-disposition': 'form-data; name="array"',
      },
      fieldName: 'array',
    };
    expect(formData.getParts()[0]).toEqual(expectedPart);
  });

  it('should return values based on the given key', function () {
    formData.append('username', 'Chris');
    formData.append('username', 'Bob');

    expect(formData.getAll('username').length).toBe(2);

    expect(formData.getAll('username')).toEqual(['Chris', 'Bob']);

    formData.append('photo', {
      uri: 'arbitrary/path',
      type: 'image/jpeg',
      name: 'photo3.jpg',
    });

    formData.append('photo', {
      uri: 'arbitrary/path',
      type: 'image/jpeg',
      name: 'photo2.jpg',
    });

    const expectedPart = {
      uri: 'arbitrary/path',
      type: 'image/jpeg',
      name: 'photo2.jpg',
    };

    expect(formData.getAll('photo')[1]).toEqual(expectedPart);

    expect(formData.getAll('file').length).toBe(0);
  });
});

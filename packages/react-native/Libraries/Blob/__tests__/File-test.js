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

jest.mock('../../BatchedBridge/NativeModules', () => ({
  __esModule: true,
  default: {
    BlobModule: require('../__mocks__/BlobModule').default,
  },
}));

const Blob = require('../Blob').default;
const File = require('../File').default;

describe('babel 7 smoke test', function () {
  it('should be able to extend a class with native name', function () {
    let called = false;
    class Array {
      constructor() {
        called = true;
        // $FlowFixMe[incompatible-type]
        return {foo: 'PASS'};
      }
    }
    class A extends Array {
      constructor() {
        super();
      }
    }

    // there is/was a regression in Babel where this would break and super()
    // would not actually invoke the constructor of the parent class if the
    // parent class had a name matching a built-in class (like Blob)
    // $FlowFixMe[prop-missing]
    expect(new A().foo).toBe('PASS');
    expect(called).toBe(true);
  });
});

describe('Blob', function () {
  it('regression caused by circular dep && babel 7', function () {
    const blob = new Blob([], {lastModified: 0, type: 'image/jpeg'});
    expect(blob).toBeInstanceOf(Blob);
  });
});

describe('File', function () {
  it('should create empty file', () => {
    const file = new File([], 'test.jpg');
    expect(file).toBeInstanceOf(File);
    expect(file.data.offset).toBe(0);
    expect(file.data.size).toBe(0);
    expect(file.size).toBe(0);
    expect(file.type).toBe('');
    expect(file.name).toBe('test.jpg');
    expect(file.lastModified).toEqual(expect.any(Number));
  });

  it('should create empty file with type', () => {
    const file = new File([], 'test.jpg', {
      lastModified: 0,
      type: 'image/jpeg',
    });
    expect(file.type).toBe('image/jpeg');
  });

  it('should create empty file with lastModified', () => {
    const file = new File([], 'test.jpg', {
      lastModified: 1337,
      type: 'image/jpeg',
    });
    expect(file.lastModified).toBe(1337);
  });

  it('should throw on invalid arguments', () => {
    // $FlowExpectedError[incompatible-type]
    expect(() => new File()).toThrow();
    // $FlowExpectedError[incompatible-type]
    expect(() => new File([])).toThrow();
  });

  it('should create file from array buffer parts', () => {
    const file = new File([new Uint8Array([1, 2, 3]).buffer], 'a.bin');
    expect(file.size).toBe(3);
    expect(file.name).toBe('a.bin');
  });
});

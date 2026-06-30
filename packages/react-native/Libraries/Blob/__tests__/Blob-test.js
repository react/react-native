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

describe('Blob', function () {
  it('should create empty blob', () => {
    const blob = new Blob();
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.data.offset).toBe(0);
    expect(blob.data.size).toBe(0);
    expect(blob.size).toBe(0);
    expect(blob.type).toBe('');
  });

  it('should create blob from other blobs and strings', () => {
    const blobA = new Blob();
    const blobB = new Blob();
    const textA = 'i \u2665 dogs';
    const textB = '\uD800\uDC00';
    const textC =
      'Z\u0351\u036B\u0343\u036A\u0302\u036B\u033D\u034F\u0334\u0319\u0324' +
      '\u031E\u0349\u035A\u032F\u031E\u0320\u034DA\u036B\u0357\u0334\u0362' +
      '\u0335\u031C\u0330\u0354L\u0368\u0367\u0369\u0358\u0320G\u0311\u0357' +
      '\u030E\u0305\u035B\u0341\u0334\u033B\u0348\u034D\u0354\u0339O\u0342' +
      '\u030C\u030C\u0358\u0328\u0335\u0339\u033B\u031D\u0333!\u033F\u030B' +
      '\u0365\u0365\u0302\u0363\u0310\u0301\u0301\u035E\u035C\u0356\u032C' +
      '\u0330\u0319\u0317';

    blobA.data.size = 34540;
    blobB.data.size = 65452;

    const blob = new Blob([blobA, blobB, textA, textB, textC]);

    expect(blob.size).toBe(
      blobA.size +
        blobB.size +
        global.Buffer.byteLength(textA, 'UTF-8') +
        global.Buffer.byteLength(textB, 'UTF-8') +
        global.Buffer.byteLength(textC, 'UTF-8'),
    );
    expect(blob.type).toBe('');
  });

  it('should slice a blob', () => {
    const blob = new Blob();

    blob.data.size = 34546;

    const sliceA = blob.slice(0, 2354);

    expect(sliceA.data.offset).toBe(0);
    expect(sliceA.size).toBe(2354);
    expect(sliceA.type).toBe('');

    const sliceB = blob.slice(2384, 7621);

    expect(sliceB.data.offset).toBe(2384);
    expect(sliceB.size).toBe(7621 - 2384);
    expect(sliceB.type).toBe('');

    const sliceC = blob.slice(34543, 34569);

    expect(sliceC.data.offset).toBe(34543);
    expect(sliceC.size).toBe(Math.min(blob.data.size, 34569) - 34543);
  });

  it('should slice a blob with a negative start', () => {
    const blob = new Blob();
    blob.data.size = 34546;

    // A negative start is relative to the end of the blob.
    const slice = blob.slice(-100);

    expect(slice.data.offset).toBe(34446);
    expect(slice.size).toBe(100);
  });

  it('should slice a blob with a negative end', () => {
    const blob = new Blob();
    blob.data.size = 34546;

    // A negative end is relative to the end of the blob.
    const slice = blob.slice(0, -100);

    expect(slice.data.offset).toBe(0);
    expect(slice.size).toBe(34446);
  });

  it('should return an empty slice when end precedes start', () => {
    const blob = new Blob();
    blob.data.size = 34546;

    const slice = blob.slice(200, 100);

    expect(slice.data.offset).toBe(200);
    expect(slice.size).toBe(0);
  });

  it('should slice a blob and sets a contentType', () => {
    const blob = new Blob();

    blob.data.size = 34546;

    const slice = blob.slice(0, 2354, 'text/plain');

    expect(slice.data.offset).toBe(0);
    expect(slice.size).toBe(2354);
    expect(slice.type).toBe('text/plain');
  });

  it('should close a blob', () => {
    const blob = new Blob();

    blob.close();

    expect(() => blob.size).toThrow();
  });
});

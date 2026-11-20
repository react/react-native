/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import createImageDiff from '../imageDiff';
import {Buffer} from 'node:buffer';
import {PNG} from 'pngjs/lib/png';

const png = PNG.sync.write(new PNG({width: 2, height: 1}));

it('highlights changed pixels and fades unchanged content without modifying inputs', () => {
  const baseline = new PNG({width: 2, height: 1});
  baseline.data.set([0, 0, 0, 255, 0, 0, 255, 255]);
  const capture = new PNG({width: 2, height: 1});
  capture.data.set([0, 0, 0, 255, 0, 255, 0, 255]);
  const expected = PNG.sync.write(baseline);
  const received = PNG.sync.write(capture);
  const originalExpected = Buffer.from(expected);
  const originalReceived = Buffer.from(received);
  const encoded = createImageDiff(expected, received);
  expect(encoded).not.toBe(null);
  if (encoded == null) {
    return;
  }
  const diff = PNG.sync.read(encoded);
  expect(diff.width).toBe(2);
  expect(diff.height).toBe(1);
  expect(diff.data[0]).toBeGreaterThan(200);
  expect(diff.data[0]).toBe(diff.data[1]);
  expect(diff.data[1]).toBe(diff.data[2]);
  expect([...diff.data.subarray(4, 8)]).toEqual([255, 0, 0, 255]);
  expect(expected.equals(originalExpected)).toBe(true);
  expect(received.equals(originalReceived)).toBe(true);
});

it('marks alpha changes even when compositing onto white would hide them', () => {
  const baseline = new PNG({width: 1, height: 1});
  baseline.data.set([255, 255, 255, 255]);
  const capture = new PNG({width: 1, height: 1});
  capture.data.set([255, 255, 255, 128]);
  const encoded = createImageDiff(
    PNG.sync.write(baseline),
    PNG.sync.write(capture),
  );
  expect(encoded).not.toBe(null);
  if (encoded != null) {
    expect([...PNG.sync.read(encoded).data]).toEqual([255, 0, 0, 255]);
  }
});

it('marks added and removed dimensions, including transparent pixels', () => {
  const baseline = PNG.sync.write(new PNG({width: 2, height: 1}));
  const capture = PNG.sync.write(new PNG({width: 1, height: 2}));
  for (const [expected, received] of [
    [baseline, capture],
    [capture, baseline],
  ]) {
    const encoded = createImageDiff(expected, received);
    expect(encoded).not.toBe(null);
    if (encoded == null) {
      continue;
    }
    const diff = PNG.sync.read(encoded);
    expect(diff.width).toBe(2);
    expect(diff.height).toBe(2);
    expect([...diff.data.subarray(0, 4)]).toEqual([255, 255, 255, 255]);
    expect([...diff.data.subarray(4, 8)]).toEqual([255, 0, 0, 255]);
    expect([...diff.data.subarray(8, 12)]).toEqual([255, 0, 0, 255]);
    expect([...diff.data.subarray(12, 16)]).toEqual([255, 255, 255, 255]);
  }
});

it('isolates corrupt PNGs and oversized diff canvases', () => {
  expect(createImageDiff(Buffer.from('invalid'), png)).toBe(null);
  const corrupt = Buffer.from(png);
  corrupt[corrupt.length - 5] = (corrupt[corrupt.length - 5] + 1) % 256;
  expect(createImageDiff(png, corrupt)).toBe(null);
  const wide = Buffer.from(png);
  wide.writeUInt32BE(16000, 16);
  wide.writeUInt32BE(1, 20);
  const tall = Buffer.from(png);
  tall.writeUInt32BE(1, 16);
  tall.writeUInt32BE(16000, 20);
  expect(createImageDiff(wide, tall)).toBe(null);
});

it('rejects PNGs with conflicting dimension headers', () => {
  const small = PNG.sync.write(new PNG({width: 1, height: 1}));
  const wide = PNG.sync.write(new PNG({width: 10, height: 1}));
  const conflicting = Buffer.concat([small.subarray(0, 33), wide.subarray(8)]);
  expect(createImageDiff(conflicting, small)).toBe(null);
  expect(createImageDiff(small, conflicting)).toBe(null);
});

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import saveAssets from '../saveAssets';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let directory: string;

beforeEach(() => {
  jest.useRealTimers();
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-save-assets-'));
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  fs.rmSync(directory, {recursive: true, force: true});
});

function makeAsset(type: string) {
  const file = path.join(directory, `icon.${type}`);
  fs.writeFileSync(file, 'asset contents');
  return {
    __packager_asset: true,
    fileSystemLocation: directory,
    httpServerLocation: '/assets',
    width: 1,
    height: 1,
    scales: [1],
    files: [file],
    hash: 'hash',
    name: 'icon',
    type,
  };
}

test('rejects when the requested iOS asset catalog is missing', async () => {
  const assetsDest = path.join(directory, 'output');
  const catalogDest = path.join(directory, 'missing-catalog');

  await expect(
    saveAssets([makeAsset('gif')], 'ios', assetsDest, catalogDest),
  ).rejects.toThrow(
    `Could not find asset catalog 'RNAssets.xcassets' in ${catalogDest}`,
  );
  expect(fs.existsSync(assetsDest)).toBe(false);
});

test('saves catalog images and copies non-catalog assets', async () => {
  const assetsDest = path.join(directory, 'output');
  const catalogDest = path.join(directory, 'catalog');
  const imageset = path.join(catalogDest, 'RNAssets.xcassets', 'icon.imageset');
  fs.mkdirSync(path.dirname(imageset), {recursive: true});

  await saveAssets(
    [makeAsset('png'), makeAsset('gif')],
    'ios',
    assetsDest,
    catalogDest,
  );

  expect(fs.readFileSync(path.join(imageset, 'icon.png'), 'utf8')).toBe(
    'asset contents',
  );
  expect(
    JSON.parse(fs.readFileSync(path.join(imageset, 'Contents.json'), 'utf8'))
      .images,
  ).toEqual([{filename: 'icon.png', idiom: 'universal', scale: '1x'}]);
  expect(
    fs.readFileSync(path.join(assetsDest, 'assets', 'icon.gif'), 'utf8'),
  ).toBe('asset contents');
});

test('copies loose assets when no asset catalog is requested', async () => {
  const assetsDest = path.join(directory, 'output');

  await saveAssets([makeAsset('gif')], 'ios', assetsDest);

  expect(
    fs.readFileSync(path.join(assetsDest, 'assets', 'icon.gif'), 'utf8'),
  ).toBe('asset contents');
});

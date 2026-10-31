/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import PixelRatio from '../../../../packages/react-native/Libraries/Utilities/PixelRatio';
import {AssetRegistry} from '../../../../packages/react-native/src/private/assets/AssetRegistry';
import assetPlugin from '../../config/assetPlugin';
import {Image} from 'react-native';

const NativeFantom =
  require('../../../../packages/react-native/src/private/testing/fantom/specs/NativeFantom').default;
const setUpAssetSourceResolver = require('../setUpAssetSourceResolver').default;

const resolveAssetSource = Image.resolveAssetSource;

jest.mock(
  '../../../../packages/react-native/src/private/testing/fantom/specs/NativeFantom',
  () => ({__esModule: true, default: {registerAsset: jest.fn()}}),
);

const asset = {
  __packager_asset: true,
  fileSystemLocation: '/fixtures',
  httpServerLocation: '/assets/fixtures',
  width: 12,
  height: 7,
  scales: [1, 2, 3],
  files: [
    '/fixtures/logo.png',
    '/fixtures/logo@2x.android.png',
    '/fixtures/logo@3x.png',
  ],
  hash: 'test',
  name: 'logo',
  type: 'png',
  resolver: undefined,
};

beforeEach(() => {
  jest.clearAllMocks();
  resolveAssetSource.setCustomSourceTransformer(() => null);
  setUpAssetSourceResolver();
  jest.spyOn(PixelRatio, 'get').mockReturnValue(2);
});

afterEach(() => {
  jest.restoreAllMocks();
  resolveAssetSource.setCustomSourceTransformer(() => null);
});

it.each([
  [1, 1, '/fixtures/logo.png'],
  [1.5, 2, '/fixtures/logo@2x.android.png'],
  [4, 3, '/fixtures/logo@3x.png'],
])(
  'resolves the bundled file at device scale %s',
  (deviceScale, scale, file) => {
    jest.spyOn(PixelRatio, 'get').mockReturnValue(deviceScale);
    const id = AssetRegistry.registerAsset(assetPlugin(asset));
    const source = resolveAssetSource(id);
    expect(source?.scale).toBe(scale);
    expect(source).toEqual(
      resolveAssetSource(AssetRegistry.registerAsset(asset)),
    );
    expect(NativeFantom.registerAsset).toHaveBeenCalledWith(source?.uri, file);
  },
);

it('distinguishes assets with the same name in different directories', () => {
  const first = AssetRegistry.registerAsset(assetPlugin(asset));
  const second = AssetRegistry.registerAsset(
    assetPlugin({
      ...asset,
      httpServerLocation: '/assets/other',
      files: ['/other/logo.png'],
      scales: [1],
    }),
  );
  const firstUri = resolveAssetSource(first)?.uri;
  const secondUri = resolveAssetSource(second)?.uri;
  expect(firstUri).not.toBe(secondUri);
  expect(NativeFantom.registerAsset).toHaveBeenCalledWith(
    firstUri,
    '/fixtures/logo@2x.android.png',
  );
  expect(NativeFantom.registerAsset).toHaveBeenCalledWith(
    secondUri,
    '/other/logo.png',
  );
});

it('reports a missing file for the selected scale', () => {
  const id = AssetRegistry.registerAsset(
    assetPlugin({...asset, files: ['/fixtures/logo.png']}),
  );
  expect(() => resolveAssetSource(id)).toThrow(
    'Fantom could not find a bundled file for logo.png at scale 2.',
  );
  expect(NativeFantom.registerAsset).not.toHaveBeenCalled();
});

it('reports assets with no scales', () => {
  const id = AssetRegistry.registerAsset(assetPlugin({...asset, scales: []}));
  expect(() => resolveAssetSource(id)).toThrow(
    'Fantom could not find a bundled file for logo.png at scale 1.',
  );
  expect(NativeFantom.registerAsset).not.toHaveBeenCalled();
});

it('preserves explicit image sources', () => {
  const source = {uri: '/images/logo.png', width: 12, height: 7};
  expect(resolveAssetSource(source)).toBe(source);
  expect(NativeFantom.registerAsset).not.toHaveBeenCalled();
});

it('uses normal resolution for assets without Fantom metadata', () => {
  const id = AssetRegistry.registerAsset(asset);
  resolveAssetSource.setCustomSourceTransformer(() => null);
  const expected = resolveAssetSource(id);
  setUpAssetSourceResolver();
  expect(resolveAssetSource(id)).toEqual(expected);
  expect(NativeFantom.registerAsset).not.toHaveBeenCalled();
});

it('respects an existing custom source transformer', () => {
  resolveAssetSource.setCustomSourceTransformer(resolver =>
    resolver.fromSource('custom-source'),
  );
  setUpAssetSourceResolver();
  const id = AssetRegistry.registerAsset(assetPlugin(asset));
  expect(resolveAssetSource(id)?.uri).toBe('custom-source');
  expect(NativeFantom.registerAsset).not.toHaveBeenCalled();
});

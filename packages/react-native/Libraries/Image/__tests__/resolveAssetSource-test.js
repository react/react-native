/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {PackagerAsset} from '../../../../assets-registry/registry';
import type {ResolvedAssetSource} from '../AssetSourceResolver';

describe('resolveAssetSource', () => {
  let AssetRegistry;
  let resolveAssetSource;
  let NativeSourceCode;
  let Platform;

  beforeEach(() => {
    jest.resetModules();

    AssetRegistry = require('@react-native/assets-registry/registry');
    resolveAssetSource = require('../resolveAssetSource').default;
    NativeSourceCode =
      require('../../NativeModules/specs/NativeSourceCode').default;
    Platform = require('../../Utilities/Platform').default;
  });

  it('returns same source for simple static and network images', () => {
    const source1 = {uri: 'https://www.facebook.com/logo'};
    expect(resolveAssetSource(source1)).toBe(source1);

    const source2 = {uri: 'logo'};
    expect(resolveAssetSource(source2)).toBe(source2);
  });

  it('does not change deprecated assets', () => {
    expect(
      resolveAssetSource({
        deprecated: true,
        width: 100,
        height: 200,
        uri: 'logo',
      }),
    ).toEqual({
      deprecated: true,
      width: 100,
      height: 200,
      uri: 'logo',
    });
  });

  it('ignores any weird data', () => {
    expect(resolveAssetSource(null)).toBe(null);
    expect(resolveAssetSource(42)).toBe(null);
    // $FlowExpectedError[incompatible-type]
    expect(resolveAssetSource('nonsense')).toBe(null);
  });

  describe('bundle was loaded from network (DEV)', () => {
    beforeEach(() => {
      jest.spyOn(NativeSourceCode, 'getConstants').mockImplementation(() => ({
        scriptURL: 'http://10.0.0.1:8081/main.bundle',
      }));
      // $FlowFixMe[incompatible-type] - Platform.OS needs to be read-only.
      Platform.OS = 'ios';
    });

    it('uses network image', () => {
      expectResolvesAsset(
        {
          __packager_asset: true,
          fileSystemLocation: '/root/app/module/a',
          httpServerLocation: '/assets/module/a',
          width: 100,
          height: 200,
          scales: [1],
          hash: '5b6f00f',
          name: 'logo',
          type: 'png',
        },
        {
          __packager_asset: true,
          width: 100,
          height: 200,
          uri: 'http://10.0.0.1:8081/assets/module/a/logo.png?platform=ios&hash=5b6f00f',
          scale: 1,
        },
      );
    });

    it('picks matching scale', () => {
      expectResolvesAsset(
        {
          __packager_asset: true,
          fileSystemLocation: '/root/app/module/a',
          httpServerLocation: '/assets/module/a',
          width: 100,
          height: 200,
          scales: [1, 2, 3],
          hash: '5b6f00f',
          name: 'logo',
          type: 'png',
        },
        {
          __packager_asset: true,
          width: 100,
          height: 200,
          uri: 'http://10.0.0.1:8081/assets/module/a/logo@2x.png?platform=ios&hash=5b6f00f',
          scale: 2,
        },
      );
    });

    it('respects query parameters', () => {
      expectResolvesAsset(
        {
          __packager_asset: true,
          fileSystemLocation: '/root/app/assets/module/a',
          httpServerLocation: '/assets?unstable_path=./module/a',
          width: 100,
          height: 200,
          scales: [1, 2, 3],
          hash: '5b6f00f',
          name: 'logo',
          type: 'png',
        },
        {
          __packager_asset: true,
          width: 100,
          height: 200,
          uri: 'http://10.0.0.1:8081/assets?unstable_path=./module/a/logo@2x.png?platform=ios&hash=5b6f00f',
          scale: 2,
        },
      );
    });
  });

  describe('bundle was loaded from file on iOS', () => {
    beforeEach(() => {
      jest.spyOn(NativeSourceCode, 'getConstants').mockImplementation(() => ({
        scriptURL: 'file:///Path/To/Sample.app/main.bundle',
      }));
      // $FlowFixMe[incompatible-type] - Platform.OS needs to be read-only.
      Platform.OS = 'ios';
    });

    it('uses pre-packed image', () => {
      expectResolvesAsset(
        {
          __packager_asset: true,
          fileSystemLocation: '/root/app/module/a',
          httpServerLocation: '/assets/module/a',
          width: 100,
          height: 200,
          scales: [1],
          hash: '5b6f00f',
          name: 'logo',
          type: 'png',
        },
        {
          __packager_asset: true,
          width: 100,
          height: 200,
          uri: 'file:///Path/To/Sample.app/assets/module/a/logo.png',
          scale: 1,
        },
      );
    });

    it('resolves an image with a relative path outside of root', () => {
      expectResolvesAsset(
        {
          __packager_asset: true,
          fileSystemLocation: '/module/a',
          httpServerLocation: '/assets/../../module/a',
          width: 100,
          height: 200,
          scales: [1],
          hash: '5b6f00f',
          name: 'logo',
          type: 'png',
        },
        {
          __packager_asset: true,
          width: 100,
          height: 200,
          uri: 'file:///Path/To/Sample.app/assets/__module/a/logo.png',
          scale: 1,
        },
      );
    });
  });

  describe('bundle was loaded from assets on Android', () => {
    beforeEach(() => {
      jest.spyOn(NativeSourceCode, 'getConstants').mockImplementation(() => ({
        scriptURL: 'assets://Path/To/Simulator/main.bundle',
      }));
      // $FlowFixMe[incompatible-type] - Platform.OS needs to be read-only.
      Platform.OS = 'android';
    });

    it('uses pre-packed image', () => {
      expectResolvesAsset(
        {
          __packager_asset: true,
          fileSystemLocation: '/root/app/module/a',
          httpServerLocation: '/assets/AwesomeModule/Subdir',
          width: 100,
          height: 200,
          scales: [1],
          hash: '5b6f00f',
          name: '!@Logo#1_\u20ac', // Invalid chars shouldn't get passed to native
          type: 'png',
        },
        {
          __packager_asset: true,
          width: 100,
          height: 200,
          uri: 'awesomemodule_subdir_logo1_',
          scale: 1,
        },
      );
    });

    it('resolves an image with a relative path outside of root', () => {
      expectResolvesAsset(
        {
          __packager_asset: true,
          fileSystemLocation: '/module/a',
          httpServerLocation: '/assets/../../module/a',
          width: 100,
          height: 200,
          scales: [1],
          hash: '5b6f00f',
          name: 'logo',
          type: 'png',
        },
        {
          __packager_asset: true,
          width: 100,
          height: 200,
          uri: '__module_a_logo',
          scale: 1,
        },
      );
    });
  });

  describe('bundle was loaded from file on Android', () => {
    beforeEach(() => {
      jest.spyOn(NativeSourceCode, 'getConstants').mockImplementation(() => ({
        scriptURL: 'file:///sdcard/Path/To/Simulator/main.bundle',
      }));
      // $FlowFixMe[incompatible-type] - Platform.OS needs to be read-only.
      Platform.OS = 'android';
    });

    it('uses pre-packed image', () => {
      expectResolvesAsset(
        {
          __packager_asset: true,
          fileSystemLocation: '/root/app/module/a',
          httpServerLocation: '/assets/AwesomeModule/Subdir',
          width: 100,
          height: 200,
          scales: [1],
          hash: '5b6f00f',
          name: '!@Logo#1_\u20ac',
          type: 'png',
        },
        {
          __packager_asset: true,
          width: 100,
          height: 200,
          uri: 'file:///sdcard/Path/To/Simulator/drawable-mdpi/awesomemodule_subdir_logo1_.png',
          scale: 1,
        },
      );
    });
  });

  describe('bundle was loaded from raw file on Android', () => {
    beforeEach(() => {
      jest.spyOn(NativeSourceCode, 'getConstants').mockImplementation(() => ({
        scriptURL: '/sdcard/Path/To/Simulator/main.bundle',
      }));
      // $FlowFixMe[incompatible-type] - Platform.OS needs to be read-only.
      Platform.OS = 'android';
    });

    it('uses sideloaded image', () => {
      expectResolvesAsset(
        {
          __packager_asset: true,
          fileSystemLocation: '/root/app/module/a',
          httpServerLocation: '/assets/AwesomeModule/Subdir',
          width: 100,
          height: 200,
          scales: [1],
          hash: '5b6f00f',
          name: '!@Logo#1_\u20ac',
          type: 'png',
        },
        {
          __packager_asset: true,
          width: 100,
          height: 200,
          uri: 'file:///sdcard/Path/To/Simulator/drawable-mdpi/awesomemodule_subdir_logo1_.png',
          scale: 1,
        },
      );
    });
  });

  describe('source resolver can be customized', () => {
    beforeEach(() => {
      jest.spyOn(NativeSourceCode, 'getConstants').mockImplementation(() => ({
        scriptURL: 'file:///sdcard/Path/To/Simulator/main.bundle',
      }));
      // $FlowFixMe[incompatible-type] - Platform.OS needs to be read-only.
      Platform.OS = 'android';
    });

    it('uses bundled source, even when js is sideloaded', () => {
      resolveAssetSource.setCustomSourceTransformer(resolver =>
        resolver.resourceIdentifierWithoutScale(),
      );
      expectResolvesAsset(
        {
          __packager_asset: true,
          fileSystemLocation: '/root/app/module/a',
          httpServerLocation: '/assets/AwesomeModule/Subdir',
          width: 100,
          height: 200,
          scales: [1],
          hash: '5b6f00f',
          name: '!@Logo#1_\u20ac',
          type: 'png',
        },
        {
          __packager_asset: true,
          width: 100,
          height: 200,
          uri: 'awesomemodule_subdir_logo1_',
          scale: 1,
        },
      );
    });

    it('can chain multiple custom source transformers', () => {
      resolveAssetSource.addCustomSourceTransformer(resolver => {
        if (resolver.asset.type === 'gif') {
          return resolver.fromSource(`my_gif_file`);
        }
        return null;
      });

      resolveAssetSource.addCustomSourceTransformer(resolver => {
        if (resolver.asset.type === 'png') {
          return resolver.fromSource(`my_png_file`);
        }
        return null;
      });

      const pngAsset = {
        __packager_asset: true,
        fileSystemLocation: '/root/app/module/a',
        httpServerLocation: '/assets/AwesomeModule/Subdir',
        width: 100,
        height: 200,
        scales: [1],
        hash: '5b6f00f',
        name: '!@Logo#1_\u20ac',
        type: 'png',
      };

      expectResolvesAsset(pngAsset, {
        __packager_asset: true,
        width: 100,
        height: 200,
        uri: 'my_png_file',
        scale: 1,
      });

      expectResolvesAsset(
        {...pngAsset, type: 'gif'},
        {
          __packager_asset: true,
          width: 100,
          height: 200,
          uri: 'my_gif_file',
          scale: 1,
        },
      );

      expectResolvesAsset(
        {...pngAsset, type: 'jpg'},
        {
          __packager_asset: true,
          width: 100,
          height: 200,
          uri: 'file:///sdcard/Path/To/Simulator/drawable-mdpi/awesomemodule_subdir_logo1_.jpg',
          scale: 1,
        },
      );
    });

    it('allows any customization', () => {
      resolveAssetSource.setCustomSourceTransformer(resolver =>
        resolver.fromSource('TEST'),
      );
      expectResolvesAsset(
        {
          __packager_asset: true,
          fileSystemLocation: '/root/app/module/a',
          httpServerLocation: '/assets/AwesomeModule/Subdir',
          width: 100,
          height: 200,
          scales: [1],
          hash: '5b6f00f',
          name: '!@Logo#1_\u20ac',
          type: 'png',
        },
        {
          __packager_asset: true,
          width: 100,
          height: 200,
          uri: 'TEST',
          scale: 1,
        },
      );
    });
  });

  function expectResolvesAsset(
    input: PackagerAsset,
    expectedSource: ?ResolvedAssetSource,
  ) {
    const assetId = AssetRegistry.registerAsset(input);
    expect(resolveAssetSource(assetId)).toEqual(expectedSource);
  }
});

describe('resolveAssetSource.pickScale', () => {
  const resolveAssetSource = require('../resolveAssetSource').default;

  it('picks matching scale', () => {
    expect(resolveAssetSource.pickScale([1], 2)).toBe(1);
    expect(resolveAssetSource.pickScale([1, 2, 3], 2)).toBe(2);
    expect(resolveAssetSource.pickScale([1, 2], 3)).toBe(2);
    expect(resolveAssetSource.pickScale([1, 2, 3, 4], 3.5)).toBe(4);
    expect(resolveAssetSource.pickScale([3, 4], 2)).toBe(3);
    expect(resolveAssetSource.pickScale([], 2)).toBe(1);
  });
});

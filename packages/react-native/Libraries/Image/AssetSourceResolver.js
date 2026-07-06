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

import type {
  AssetDestPathResolver,
  PackagerAsset,
} from '../../src/private/assets/AssetRegistry';

const PixelRatio = require('../Utilities/PixelRatio').default;
const Platform = require('../Utilities/Platform').default;
const {pickScale} = require('./AssetUtils');
const {
  getAndroidResourceFolderName,
  getAndroidResourceIdentifier,
} = require('@react-native/asset-utils');
const invariant = require('invariant');

export type ResolvedAssetSource = {
  readonly __packager_asset: boolean,
  readonly width: ?number,
  readonly height: ?number,
  readonly uri: string,
  readonly scale: number,
};

/**
 * Returns a path like 'assets/AwesomeModule/icon@2x.png'
 */
function getScaledAssetPath(asset: PackagerAsset): string {
  const scale = pickScale(asset.scales, PixelRatio.get());
  const scaleSuffix = scale === 1 ? '' : '@' + scale + 'x';
  const assetDir = getBasePath(asset);
  return assetDir + '/' + asset.name + scaleSuffix + '.' + asset.type;
}

/**
 * Returns a path like 'drawable-mdpi/icon.png'
 */
function getAssetPathInDrawableFolder(asset: PackagerAsset): string {
  const scale = pickScale(asset.scales, PixelRatio.get());
  const drawableFolder = getAndroidResourceFolderName(asset, scale);
  const fileName = getAndroidResourceIdentifier(asset);
  return drawableFolder + '/' + fileName + '.' + asset.type;
}

function getBasePath(asset: PackagerAsset): string {
  const basePath = asset.httpServerLocation;
  return basePath.startsWith('/') ? basePath.slice(1) : basePath;
}

/**
 * Returns true if the asset can be loaded over the network.
 *
 * This prevents an issue loading XML assets on Android. XML asset types like
 * vector drawables can only be loaded from precompiled source. Android does
 * not support loading these over the network, and AAPT precompiles data by
 * breaking path data and resource information apart into multiple files,
 * stuffing it all into the resource table. As a result, we should only attempt
 * to load resources as we would in release builds: by the resource name.
 *
 * For more information, see:
 * https://issuetracker.google.com/issues/62435069
 * https://issuetracker.google.com/issues/68293189
 */
function assetSupportsNetworkLoads(asset: PackagerAsset): boolean {
  return !(asset.type === 'xml' && Platform.OS === 'android');
}

class AssetSourceResolver {
  serverUrl: ?string;
  // where the jsbundle is being run from
  jsbundleUrl: ?string;
  // the asset to resolve
  asset: PackagerAsset;

  constructor(serverUrl: ?string, jsbundleUrl: ?string, asset: PackagerAsset) {
    this.serverUrl = serverUrl;
    this.jsbundleUrl = jsbundleUrl;
    this.asset = asset;
  }

  isLoadedFromServer(): boolean {
    return (
      this.serverUrl != null &&
      this.serverUrl !== '' &&
      assetSupportsNetworkLoads(this.asset)
    );
  }

  isLoadedFromFileSystem(): boolean {
    return this.jsbundleUrl != null && this.jsbundleUrl?.startsWith('file://');
  }

  defaultAsset(): ResolvedAssetSource {
    if (this.isLoadedFromServer()) {
      return this.assetServerURL();
    }

    if (this.asset.resolver != null) {
      return this.getAssetUsingResolver(this.asset.resolver);
    }

    if (Platform.OS === 'android') {
      return this.isLoadedFromFileSystem()
        ? this.drawableFolderInBundle()
        : this.resourceIdentifierWithoutScale();
    } else {
      return this.scaledAssetURLNearBundle();
    }
  }

  getAssetUsingResolver(resolver: AssetDestPathResolver): ResolvedAssetSource {
    switch (resolver) {
      case 'android':
        return this.isLoadedFromFileSystem()
          ? this.drawableFolderInBundle()
          : this.resourceIdentifierWithoutScale();
      case 'generic':
        return this.scaledAssetURLNearBundle();
      default:
        throw new Error(
          "Don't know how to get asset via provided resolver: " +
            resolver +
            '\nAsset: ' +
            JSON.stringify(this.asset, null, '\t') +
            '\nPossible resolvers are:' +
            JSON.stringify(['android', 'generic'], null, '\t'),
        );
    }
  }

  /**
   * Returns an absolute URL which can be used to fetch the asset
   * from the devserver
   */
  assetServerURL(): ResolvedAssetSource {
    invariant(this.serverUrl != null, 'need server to load from');
    return this.fromSource(
      this.serverUrl +
        getScaledAssetPath(this.asset) +
        '?platform=' +
        Platform.OS +
        '&hash=' +
        this.asset.hash,
    );
  }

  /**
   * Resolves to just the scaled asset filename
   * E.g. 'assets/AwesomeModule/icon@2x.png'
   */
  scaledAssetPath(): ResolvedAssetSource {
    return this.fromSource(getScaledAssetPath(this.asset));
  }

  /**
   * Resolves to where the bundle is running from, with a scaled asset filename
   * E.g. 'file:///sdcard/bundle/assets/AwesomeModule/icon@2x.png'
   */
  scaledAssetURLNearBundle(): ResolvedAssetSource {
    const path = this.jsbundleUrl ?? 'file://';
    return this.fromSource(
      // Assets can have relative paths outside of the project root.
      // When bundling them we replace `../` with `_` to make sure they
      // don't end up outside of the expected assets directory.
      path + getScaledAssetPath(this.asset).replace(/\.\.\//g, '_'),
    );
  }

  /**
   * The default location of assets bundled with the app, located by
   * resource identifier
   * The Android resource system picks the correct scale.
   * E.g. 'assets_awesomemodule_icon'
   */
  resourceIdentifierWithoutScale(): ResolvedAssetSource {
    invariant(
      Platform.OS === 'android',
      'resource identifiers work on Android',
    );
    return this.fromSource(getAndroidResourceIdentifier(this.asset));
  }

  /**
   * If the jsbundle is running from a sideload location, this resolves assets
   * relative to its location
   * E.g. 'file:///sdcard/AwesomeModule/drawable-mdpi/icon.png'
   */
  drawableFolderInBundle(): ResolvedAssetSource {
    const path = this.jsbundleUrl ?? 'file://';
    return this.fromSource(path + getAssetPathInDrawableFolder(this.asset));
  }

  fromSource(source: string): ResolvedAssetSource {
    return {
      __packager_asset: true,
      width: this.asset.width,
      height: this.asset.height,
      uri: source,
      scale: pickScale(this.asset.scales, PixelRatio.get()),
    };
  }

  static pickScale: (scales: Array<number>, deviceScale?: number) => number =
    pickScale;
}

export default AssetSourceResolver;

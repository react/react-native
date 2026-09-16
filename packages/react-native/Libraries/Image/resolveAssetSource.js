/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// Utilities for resolving an asset into a `source` for e.g. `Image`

import type {ResolvedAssetSource} from './AssetSourceResolver';
import typeof AssetSourceResolverT from './AssetSourceResolver';
import type {ImageSource} from './ImageSource';

import SourceCode from '../NativeModules/specs/NativeSourceCode';

const {AssetRegistry} = require('../../src/private/assets/AssetRegistry');
const AssetSourceResolver: AssetSourceResolverT =
  require('./AssetSourceResolver').default;
const {pickScale} = require('./AssetUtils');

type CustomSourceTransformer = (
  resolver: AssetSourceResolver,
) => ?ResolvedAssetSource;

let _customSourceTransformers: Array<CustomSourceTransformer> = [];
let _serverURL: ?string;
let _scriptURL: ?string;
let _sourceCodeScriptURL: ?string;

function getSourceCodeScriptURL(): ?string {
  if (_sourceCodeScriptURL != null) {
    return _sourceCodeScriptURL;
  }

  _sourceCodeScriptURL = SourceCode.getConstants().scriptURL;
  return _sourceCodeScriptURL;
}

function getDevServerURL(): ?string {
  if (_serverURL === undefined) {
    const sourceCodeScriptURL = getSourceCodeScriptURL();
    const match = sourceCodeScriptURL?.match(/^https?:\/\/.*?\//);
    if (match) {
      // jsBundle was loaded from network
      _serverURL = match[0];
    } else {
      // jsBundle was loaded from file
      _serverURL = null;
    }
  }
  return _serverURL;
}

function _coerceLocalScriptURL(scriptURL: ?string): ?string {
  let normalizedScriptURL = scriptURL;

  if (normalizedScriptURL != null) {
    if (normalizedScriptURL.startsWith('assets://')) {
      // android: running from within assets, no offline path to use
      return null;
    }
    normalizedScriptURL = normalizedScriptURL.substring(
      0,
      normalizedScriptURL.lastIndexOf('/') + 1,
    );
    if (!normalizedScriptURL.includes('://')) {
      // Add file protocol in case we have an absolute file path and not a URL.
      // This shouldn't really be necessary. scriptURL should be a URL.
      normalizedScriptURL = 'file://' + normalizedScriptURL;
    }
  }

  return normalizedScriptURL;
}

function getScriptURL(): ?string {
  if (_scriptURL === undefined) {
    _scriptURL = _coerceLocalScriptURL(getSourceCodeScriptURL());
  }
  return _scriptURL;
}

/**
 * `transformer` can optionally be used to apply a custom transformation when
 * resolving an asset source. This methods overrides all other custom transformers
 * that may have been previously registered.
 */
function setCustomSourceTransformer(
  transformer: CustomSourceTransformer,
): void {
  _customSourceTransformers = [transformer];
}

/**
 * Adds a `transformer` into the chain of custom source transformers, which will
 * be applied in the order registered, until one returns a non-null value.
 */
function addCustomSourceTransformer(
  transformer: CustomSourceTransformer,
): void {
  _customSourceTransformers.push(transformer);
}

/**
 * `source` is either a number (opaque type returned by require('./foo.png'))
 * or an `ImageSource` like { uri: '<http location || file path>' }
 */
function resolveAssetSource(source: ?ImageSource): ?ResolvedAssetSource {
  if (source == null || typeof source === 'object') {
    // $FlowFixMe[incompatible-exact] `source` doesn't exactly match `ResolvedAssetSource`
    // $FlowFixMe[incompatible-type] `source` doesn't exactly match `ResolvedAssetSource`
    return source;
  }

  const asset = AssetRegistry.getAssetByID(source);
  if (!asset) {
    return null;
  }

  const resolver = new AssetSourceResolver(
    getDevServerURL(),
    getScriptURL(),
    asset,
  );

  // Apply (chained) custom source transformers, if any
  if (_customSourceTransformers) {
    for (const customSourceTransformer of _customSourceTransformers) {
      const transformedSource = customSourceTransformer(resolver);
      if (transformedSource != null) {
        return transformedSource;
      }
    }
  }

  return resolver.defaultAsset();
}

resolveAssetSource.pickScale = pickScale;
resolveAssetSource.setCustomSourceTransformer = setCustomSourceTransformer;
resolveAssetSource.addCustomSourceTransformer = addCustomSourceTransformer;
export default resolveAssetSource;

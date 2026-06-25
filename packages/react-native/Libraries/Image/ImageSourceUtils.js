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

import type {ResolvedAssetSource} from './AssetSourceResolver';
import type {ImageProps} from './ImageProps';

import resolveAssetSource from './resolveAssetSource';

export type ImageSourceHeaders = {
  [string]: string,
};

/**
 * A function which returns the appropriate value for image source
 * by resolving the `source`, `src` and `srcSet` props.
 */
export function getImageSourcesFromImageProps(imageProps: ImageProps):
  | ?ResolvedAssetSource
  | ReadonlyArray<{
      readonly uri: string,
      readonly headers: ImageSourceHeaders,
      readonly width: ?number,
      readonly height: ?number,
      ...
    }> {
  let source = resolveAssetSource(imageProps.source);

  let sources;

  const {crossOrigin, referrerPolicy, src, srcSet, width, height} = imageProps;

  const headers: ImageSourceHeaders = {};
  if (crossOrigin === 'use-credentials') {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  if (referrerPolicy != null) {
    headers['Referrer-Policy'] = referrerPolicy;
  }
  if (srcSet != null) {
    const sourceList = [];
    const srcSetList = srcSet
      .split(',')
      .map(imageSrc => imageSrc.trim())
      .filter(Boolean);
    // `src` prop should be used with default scale if `srcSet` does not have 1x scale.
    let shouldUseSrcForDefaultScale = true;
    srcSetList.forEach(imageSrc => {
      const [uri, xScale = '1x'] = imageSrc.split(/\s+/);
      if (!xScale.endsWith('x')) {
        console.warn(
          'The provided format for scale is not supported yet. Please use scales like 1x, 2x, etc.',
        );
      } else {
        const scale = parseFloat(xScale.slice(0, -1));
        if (!isNaN(scale)) {
          // 1x scale is provided in `srcSet` prop so ignore the `src` prop if provided.
          shouldUseSrcForDefaultScale =
            scale === 1 ? false : shouldUseSrcForDefaultScale;
          sourceList.push({headers, scale, uri, width, height});
        }
      }
    });

    if (shouldUseSrcForDefaultScale && src != null) {
      sourceList.push({
        headers,
        scale: 1,
        uri: src,
        width,
        height,
      });
    }
    if (sourceList.length === 0) {
      console.warn('The provided value for srcSet is not valid.');
    }

    sources = sourceList;
  } else if (src != null) {
    sources = [{uri: src, headers: headers, width, height}];
  } else if (source != null && source.uri && Object.keys(headers).length > 0) {
    sources = [{...source, headers}];
  } else {
    sources = source;
  }
  return sources;
}

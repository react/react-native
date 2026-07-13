/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

/**
 * This type is intentionally inexact in order to permit call sites that supply
 * extra properties.
 */
export interface ImageURISource {
  /**
   * `uri` is a string representing the resource identifier for the image, which
   * could be an http address, a local file path, or the name of a static image
   * resource (which should be wrapped in the `require('./path/to/image.png')`
   * function).
   */
  readonly uri?: ?string;

  /**
   * `bundle` is the iOS asset bundle which the image is included in. This
   * will default to [NSBundle mainBundle] if not set.
   * @platform ios
   */
  readonly bundle?: ?string;

  /**
   * `method` is the HTTP Method to use. Defaults to GET if not specified.
   */
  readonly method?: ?string;

  /**
   * `headers` is an object representing the HTTP headers to send along with the
   * request for a remote image.
   */
  readonly headers?: ?{[string]: string};

  /**
   * `body` is the HTTP body to send with the request. This must be a valid
   * UTF-8 string, and will be sent exactly as specified, with no
   * additional encoding (e.g. URL-escaping or base64) applied.
   */
  readonly body?: ?string;

  /**
   * `cache` determines how the requests handles potentially cached
   * responses.
   *
   * - `default`: Use the native platforms default strategy. `useProtocolCachePolicy` on iOS.
   *
   * - `reload`: The data for the URL will be loaded from the originating source.
   * No existing cache data should be used to satisfy a URL load request.
   *
   * - `force-cache`: The existing cached data will be used to satisfy the request,
   * regardless of its age or expiration date. If there is no existing data in the cache
   * corresponding the request, the data is loaded from the originating source.
   *
   * - `only-if-cached`: The existing cache data will be used to satisfy a request, regardless of
   * its age or expiration date. If there is no existing data in the cache corresponding
   * to a URL load request, no attempt is made to load the data from the originating source,
   * and the load is considered to have failed.
   */
  readonly cache?: ?('default' | 'reload' | 'force-cache' | 'only-if-cached');

  /**
   * `width` and `height` can be specified if known at build time, in which case
   * these will be used to set the default `<Image/>` component dimensions.
   */
  readonly width?: ?number;
  readonly height?: ?number;

  /**
   * `scale` is used to indicate the scale factor of the image. Defaults to 1.0 if
   * unspecified, meaning that one image pixel equates to one display point / DIP.
   */
  readonly scale?: ?number;
}

export type ImageRequireSource = number;

export type ImageSource =
  ImageRequireSource | ImageURISource | ReadonlyArray<ImageURISource>;

type ImageSourceProperties = {
  body?: ?string,
  bundle?: ?string,
  cache?: ?('default' | 'reload' | 'force-cache' | 'only-if-cached'),
  headers?: ?{[string]: string},
  height?: ?number,
  method?: ?string,
  scale?: ?number,
  uri?: ?string,
  width?: ?number,
  ...
};

export function getImageSourceProperties(
  imageSource: ImageURISource,
): Readonly<ImageSourceProperties> {
  const object: ImageSourceProperties = {};
  if (imageSource.body != null) {
    object.body = imageSource.body;
  }
  if (imageSource.bundle != null) {
    object.bundle = imageSource.bundle;
  }
  if (imageSource.cache != null) {
    object.cache = imageSource.cache;
  }
  if (imageSource.headers != null) {
    object.headers = imageSource.headers;
  }
  if (imageSource.height != null) {
    object.height = imageSource.height;
  }
  if (imageSource.method != null) {
    object.method = imageSource.method;
  }
  if (imageSource.scale != null) {
    object.scale = imageSource.scale;
  }
  if (imageSource.uri != null) {
    object.uri = imageSource.uri;
  }
  if (imageSource.width != null) {
    object.width = imageSource.width;
  }
  return object;
}

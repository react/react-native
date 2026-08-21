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

import type Blob from './Blob';

export opaque type BlobCollector = {...};

/**
 * A value accepted by the Blob and File constructors (W3C `BlobPart`).
 * https://w3c.github.io/FileAPI/#typedefdef-blobpart
 */
export type BlobPart = Blob | string | ArrayBuffer | $ArrayBufferView;

export type BlobData = {
  blobId: string,
  offset: number,
  size: number,
  name?: string,
  type?: string,
  lastModified?: number,
  __collector?: ?BlobCollector,
  ...
};

export type BlobOptions = {
  type: string,
  lastModified: number,
  ...
};

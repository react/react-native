/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// flowlint unsafe-getters-setters:off

'use strict';

import type {BlobOptions} from './BlobTypes';

import Blob from './Blob';

const invariant = require('invariant');

/**
 * The File interface provides information about files.
 */
class File extends Blob {
  /**
   * Constructor for JS consumers.
   */
  constructor(
    parts: Array<Blob | string>,
    name: string,
    options?: BlobOptions,
  ) {
    invariant(
      parts != null && name != null,
      'Failed to construct `File`: Must pass both `parts` and `name` arguments.',
    );

    super(parts, options);
    this.data.name = name;
  }

  /**
   * Name of the file.
   */
  get name(): string {
    invariant(this.data.name != null, 'Files must have a name set.');
    return this.data.name;
  }

  /*
   * Last modified time of the file.
   */
  get lastModified(): number {
    return this.data.lastModified || 0;
  }
}

export default File;

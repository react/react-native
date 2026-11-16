/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {ImageResizeMode} from './ImageResizeMode';

const objectFitMap: {[key: string]: ImageResizeMode} = {
  contain: 'contain',
  cover: 'cover',
  fill: 'stretch',
  'scale-down': 'contain',
  none: 'none',
};

export function convertObjectFitToResizeMode(
  objectFit: ?string,
): ?ImageResizeMode {
  return objectFit != null ? objectFitMap[objectFit] : undefined;
}

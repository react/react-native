/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {AssetData} from 'metro';

import assetPathUtils from './assetPathUtils';
import fs from 'fs';
import path from 'path';

async function createKeepFileAsync(
  assets: ReadonlyArray<AssetData>,
  outputDirectory: string,
): Promise<void> {
  if (!assets.length) {
    return;
  }
  const assetsList = [];
  for (const asset of assets) {
    const prefix = assetPathUtils.drawableFileTypes.has(asset.type)
      ? 'drawable'
      : 'raw';
    assetsList.push(
      `@${prefix}/${assetPathUtils.getResourceIdentifier(asset)}`,
    );
  }
  const keepPath = path.join(outputDirectory, 'raw/keep.xml');
  const content = `<resources xmlns:tools="http://schemas.android.com/tools" tools:keep="${assetsList.join(',')}" />\n`;
  await fs.promises.mkdir(path.dirname(keepPath), {recursive: true});
  await fs.promises.writeFile(keepPath, content);
}

export default createKeepFileAsync;

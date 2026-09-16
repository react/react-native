/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  BabelTransformer,
  BabelTransformerArgs,
} from 'metro-babel-transformer';

import MetroBabelTransformer from '@react-native/metro-babel-transformer';
import crypto from 'node:crypto';
import fs from 'node:fs';

const transform: BabelTransformer['transform'] = (
  args: BabelTransformerArgs,
) => {
  const processedArgs = {
    ...args,
    plugins: [
      ...(args.plugins ?? []),
      // $FlowExpectedError[untyped-import]
      require('./babel-plugins/inject-debugger-statements-in-tests'),
      ...(args.options.customTransformOptions?.collectCoverage === 'true'
        ? [
            [
              require.resolve('babel-plugin-istanbul'),
              {
                include: [
                  '**/packages/react-native/Libraries/**/*.js',
                  '**/packages/react-native/src/**/*.js',
                  '**/packages/virtualized-lists/**/*.js',
                ],
                exclude: [
                  '**/packages/react-native/Libraries/Renderer/**',
                  '**/__tests__/**',
                ],
              },
            ],
          ]
        : []),
    ],
  };
  return MetroBabelTransformer.transform(processedArgs);
};

module.exports = {
  ...MetroBabelTransformer,
  transform,
  getCacheKey(): string {
    const key = crypto.createHash('md5');
    const cacheKeyParts = [
      MetroBabelTransformer.getCacheKey?.() ?? '',
      fs.readFileSync(__filename),
      fs.readFileSync(
        require.resolve('./babel-plugins/inject-debugger-statements-in-tests'),
      ),
    ];
    cacheKeyParts.forEach(part => key.update(part));
    return key.digest('hex');
  },
};

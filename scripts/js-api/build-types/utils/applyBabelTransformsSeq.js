/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {PluginObj} from '@babel/core';

import * as babel from '@babel/core';

/**
 * Apply an array of Babel transforms to a TypeScript source in order.
 */
async function applyBabelTransformsSeq(
  source: string,
  transforms: ReadonlyArray<PluginObj<unknown>>,
): Promise<string> {
  const parsed = await babel.parseAsync(source, {
    plugins: ['@babel/plugin-syntax-typescript'],
  });

  const finalAST = await transforms.reduce((input, transform) => {
    return input.then(async ast => {
      const result = await babel.transformFromAstAsync(ast, source, {
        plugins: [transform],
        ast: true,
        code: false,
      });
      if (result == null) {
        throw new Error('Unexpected null result from Babel transform');
      }
      // $FlowFixMe[incompatible-type]
      return result.ast as BabelNodeFile;
    });
  }, Promise.resolve(parsed));

  const result = await babel.transformFromAstAsync(finalAST, source, {
    code: true,
    ast: false,
  });

  return result.code;
}

module.exports = applyBabelTransformsSeq;

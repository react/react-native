/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TransformVisitor} from 'flow-transform';
import type {ParseResult} from 'flow-transform/dist/transform/parse';
import type {TransformASTResult} from 'flow-transform/dist/transform/transformAST';

const {transformAST} = require('flow-transform/dist/transform/transformAST');

const visitors: TransformVisitor = context => ({
  GenericTypeAnnotation(node): void {
    if (node.id.type === 'Identifier' && node.id.name === 'LegacyFunction') {
      context.modifyNodeInPlace(node.id, {name: 'Function'});
    }
  },
});

/**
 * Replaces LegacyFunction with Function to preserve the TypeScript API.
 */
async function replaceLegacyFunctionWithFunction(
  source: ParseResult,
): Promise<TransformASTResult> {
  return transformAST(source, visitors);
}

module.exports = replaceLegacyFunctionWithFunction;

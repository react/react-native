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
    if (node.id.name === 'LegacyObject') {
      // $FlowExpectedError[incompatible-type] - replaceNode doesn't accept a GenericTypeAnnotation object literal
      context.replaceNode(node, {
        type: 'GenericTypeAnnotation',
        id: {
          type: 'Identifier',
          name: 'Object',
          optional: false,
        },
      });
    }
  },
});

/**
 * Replaces all LegacyObject type references with Object. LegacyObject is
 * `any` in Flow, but should keep the `Object` type in the TypeScript API.
 */
async function replaceLegacyObjectWithObject(
  source: ParseResult,
): Promise<TransformASTResult> {
  return transformAST(source, visitors);
}

module.exports = replaceLegacyObjectWithObject;

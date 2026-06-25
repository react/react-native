/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TransformVisitor} from 'hermes-transform';
import type {ParseResult} from 'hermes-transform/dist/transform/parse';
import type {TransformASTResult} from 'hermes-transform/dist/transform/transformAST';

const {transformAST} = require('hermes-transform/dist/transform/transformAST');

const visitors: TransformVisitor = context => ({
  ObjectTypeProperty(node): void {
    if (node.key.type === 'Identifier' && node.key.name.startsWith('_')) {
      context.removeNode(node);
    }
  },
  Property(node): void {
    if (node.key.type === 'Identifier' && node.key.name.startsWith('_')) {
      context.removeNode(node);
    }
  },
  PropertyDefinition(node): void {
    if (
      node.computed === true ||
      (node.key.type === 'Identifier' && node.key.name.startsWith('_'))
    ) {
      context.removeNode(node);
    }
  },
  MethodDefinition(node): void {
    if (
      node.computed === true ||
      (node.key.type === 'Identifier' && node.key.name.startsWith('_'))
    ) {
      context.removeNode(node);
    }
  },
});

async function stripPrivateProperties(
  source: ParseResult,
): Promise<TransformASTResult> {
  return transformAST(source, visitors);
}

// Exported for reuse in public-api-test
stripPrivateProperties.visitors = visitors;

module.exports = stripPrivateProperties;

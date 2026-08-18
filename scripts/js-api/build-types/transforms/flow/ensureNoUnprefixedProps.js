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
  TypeAlias(node): void {
    if (node.id.name === 'Props' || node.id.name === 'NativeProps') {
      throw new Error(
        `Type aliases 'Props' and 'NativeProps' are not allowed. Use more descriptive name.`,
      );
    }
  },
  InterfaceDeclaration(node): void {
    if (node.id.name === 'Props' || node.id.name === 'NativeProps') {
      throw new Error(
        `Type aliases 'Props' and 'NativeProps' are not allowed. Use more descriptive name.`,
      );
    }
  },
});

/**
 * Prevents the usage of 'Props' and 'NativeProps' type aliases across the
 * public API of React Native.
 */
async function ensureNoUnprefixedProps(
  source: ParseResult,
): Promise<TransformASTResult> {
  return transformAST(source, visitors);
}

module.exports = ensureNoUnprefixedProps;

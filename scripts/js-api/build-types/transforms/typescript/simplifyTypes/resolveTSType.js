/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {NodePath} from '@babel/traverse';
import type {TSType as BabelNodeTSType} from '@babel/types';

import traverse from '@babel/traverse';

const inlineTypes = require('./inlineTypesVisitor');
const t = require('@babel/types');

export type TSTypeResolver = (
  node: BabelNodeTSType,
  aliasToPathMap: Map<string, NodePath<t.TSTypeAliasDeclaration>>,
) => ?BabelNodeTSType;

export const resolveTSType: TSTypeResolver = (node, aliasToPathMap) => {
  if (t.isTSTypeLiteral(node)) {
    return node;
  }

  if (!t.isTSTypeLiteral(node)) {
    let body: ?BabelNodeTSType = null;
    const wrapperAst = t.file(
      t.program([
        t.exportNamedDeclaration(
          t.tsTypeAliasDeclaration(
            t.identifier('__WrapperAlias'),
            undefined,
            t.cloneDeep(node),
          ),
        ),
      ]),
    );

    traverse(wrapperAst, inlineTypes.visitor, undefined, {
      aliasToPathMap: aliasToPathMap,
    });

    traverse(wrapperAst, {
      TSTypeAliasDeclaration(innerPath) {
        if (innerPath.node.id.name !== '__WrapperAlias') {
          return;
        }

        body = innerPath.node.typeAnnotation;
        innerPath.stop();
      },
    });

    if (!body) {
      return;
    }
    const constBody = body;

    if (t.isTSTypeLiteral(constBody)) {
      // Only performing the resolution on objects with non-computed string keys.
      if (
        !constBody.members.every(
          member =>
            (t.isTSPropertySignature(member) ||
              t.isTSMethodSignature(member)) &&
            (t.isIdentifier(member.key) || t.isLiteral(member.key)),
        )
      ) {
        return;
      }
    }

    return constBody;
  }
};

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

import type {BaseVisitorState} from './visitorState';
import type {NodePath} from '@babel/traverse';

import {replaceWithCleanup} from './utils';

const t = require('@babel/types');
const debug = require('debug')('build-types:transforms:inlineTypes');

const typeOperatorResolvers: {
  readonly [K: string]: (
    path: NodePath<t.TSTypeOperator>,
    state: BaseVisitorState,
  ) => void,
} = {
  keyof: (path, state) => {
    const unionElements: Array<BabelNodeTSType> = [];

    const typeAnnotation = path.node.typeAnnotation;
    if (t.isTSTypeLiteral(typeAnnotation)) {
      for (const member of typeAnnotation.members) {
        if (t.isTSPropertySignature(member) || t.isTSMethodSignature(member)) {
          if (t.isIdentifier(member.key)) {
            unionElements.push(
              t.tsLiteralType(t.stringLiteral(member.key.name)),
            );
          } else if (t.isStringLiteral(member.key)) {
            unionElements.push(
              t.tsLiteralType(t.stringLiteral(member.key.value)),
            );
          } else {
            debug(
              `Unsupported object literal property key: ${member.key.type}`,
            );
            return;
          }
        } else {
          debug(`Unsupported object literal type key: ${member.type}`);
          return;
        }
      }
    } else {
      debug(`Unsupported type operand for keyof: ${typeAnnotation.type}`);
      return;
    }

    replaceWithCleanup(
      state,
      path,
      unionElements.length === 0
        ? t.tsNeverKeyword()
        : t.tsUnionType(unionElements),
    );

    path.skip(); // We don't want to traverse the new node
  },
};

export function canResolveTypeOperator(name: string): boolean {
  return typeOperatorResolvers.hasOwnProperty(name);
}

export function resolveTypeOperator(
  path: NodePath<t.TSTypeOperator>,
  state: BaseVisitorState,
): void {
  const name = path.node.operator;
  if (name != null && canResolveTypeOperator(name)) {
    typeOperatorResolvers[name](path, state);
  } else {
    debug(`Unsupported type operator: ${name ?? '(null)'}`);
  }
}

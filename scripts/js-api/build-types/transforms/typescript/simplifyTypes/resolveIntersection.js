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
import type {
  Comment as BabelNodeComment,
  TSPropertySignature as BabelNodeTSPropertySignature,
  TSType as BabelNodeTSType,
  TSTypeAnnotation as BabelNodeTSTypeAnnotation,
} from '@babel/types';

import {replaceWithCleanup} from './utils';

const t = require('@babel/types');
const debug = require('debug')('build-types:transforms:inlineTypes');

export function resolveIntersection(
  path: NodePath<t.TSIntersectionType>,
  state: BaseVisitorState,
): void {
  const newTypes: Array<BabelNodeTSType> = [];
  const requiredKeys = new Set<string>();
  const mutableKeys = new Set<string>();
  const combinedMembers: Record<
    string,
    {node: BabelNodeTSTypeAnnotation, leadingComments?: BabelNodeComment[]}[],
  > = {};

  for (const type of path.node.types) {
    if (!t.isTSTypeLiteral(type)) {
      newTypes.push(type); // Leave it as is, nothing to do here
      continue;
    }

    const members = type.members;
    if (members.length === 0) {
      // Empty object, lets omit it
      continue;
    }

    const membersObj = members.reduce(
      (acc, member) => {
        if (t.isTSPropertySignature(member)) {
          const key = member.key;
          if (t.isIdentifier(key) && member.typeAnnotation) {
            acc.map[key.name] = member;
          } else if (t.isStringLiteral(key) && member.typeAnnotation) {
            acc.map[key.value] = member;
          } else {
            acc.unsupported = true;
            debug(`Unsupported object literal property key: ${key.type}`);
          }
        } else {
          acc.unsupported = true;
          debug(`Unsupported object literal type key: ${member.type}`);
        }

        return acc;
      },
      {
        map: {} as Record<string, BabelNodeTSPropertySignature>,
        unsupported: false,
      },
    );

    if (membersObj.unsupported) {
      // We cannot combine this type with the others, so we leave it as is
      newTypes.push(type);
      continue;
    }

    for (const [key, prop] of Object.entries(membersObj.map)) {
      const annotation = prop.typeAnnotation;
      if (!annotation) {
        continue;
      }

      // $FlowExpectedError[sketchy-null-bool] Missing prop is the same as false
      if (!prop.optional) {
        requiredKeys.add(key);
      }

      // $FlowExpectedError[sketchy-null-bool] Missing prop is the same as false
      if (!prop.readonly) {
        mutableKeys.add(key);
      }

      if (!combinedMembers[key]) {
        combinedMembers[key] = [
          {node: annotation, leadingComments: prop.leadingComments},
        ];
      } else {
        combinedMembers[key].push({
          node: annotation,
          leadingComments: prop.leadingComments,
        });
      }
    }
  }

  // Creating a type literal from the combined keys
  const combinedLiteral = t.tsTypeLiteral(
    Object.entries(combinedMembers).map(([key, values]) => {
      const keyNode = t.isValidIdentifier(key)
        ? t.identifier(key)
        : t.stringLiteral(key);

      const prop = t.tsPropertySignature(
        keyNode,
        values.length === 1
          ? values[0].node
          : t.tsTypeAnnotation(
              t.tsIntersectionType(
                values.map(value => value.node.typeAnnotation),
              ),
            ),
      );

      prop.optional = !requiredKeys.has(key);
      prop.readonly = !mutableKeys.has(key);
      prop.leadingComments = values
        .map(value => value.leadingComments)
        .filter(Boolean)
        .flat();

      return prop;
    }),
  );

  if (combinedLiteral.members.length !== 0) {
    newTypes.push(combinedLiteral);
  }

  let newNode;

  if (newTypes.length === 0) {
    newNode = t.tsTypeReference(
      t.identifier('Record'),
      t.tsTypeParameterInstantiation([t.tsStringKeyword(), t.tsNeverKeyword()]),
    );
  } else if (newTypes.length === 1) {
    newNode = newTypes[0];
  } else {
    newNode = t.tsIntersectionType(newTypes);
  }

  const alias = state.nodeToAliasMap?.get(path.node);
  if (alias !== undefined) {
    // Inheriting alias from the node we're replacing
    state.nodeToAliasMap.set(newNode, alias);
    state.nodeToAliasMap.delete(path.node);
  }

  replaceWithCleanup(state, path, newNode);
  path.skip(); // We don't want to traverse the new node
}

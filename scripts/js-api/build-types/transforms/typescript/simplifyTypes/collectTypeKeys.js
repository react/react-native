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

const t = require('@babel/types');

/**
 * Collect all property keys reachable from a type by resolving through
 * interfaces, type aliases, intersections, and Readonly wrappers.
 *
 * Returns a Set of all keys when the type is fully resolvable, or null
 * when any part cannot be resolved (to avoid incorrect pruning).
 */
function collectTypeKeys(
  node: $FlowFixMe,
  aliasToPathMap: Map<string, NodePath<t.TSTypeAliasDeclaration>>,
  interfaceToPathMap: ?Map<string, NodePath<$FlowFixMe>>,
  visited?: Set<string>,
): Set<string> | null {
  const seen = visited ?? new Set<string>();

  if (t.isTSTypeLiteral(node)) {
    return collectMemberKeys(node.members);
  }

  if (t.isTSIntersectionType(node)) {
    const allKeys = new Set<string>();
    for (const member of node.types) {
      const memberKeys = collectTypeKeys(
        member,
        aliasToPathMap,
        interfaceToPathMap,
        seen,
      );
      if (memberKeys == null) {
        return null;
      }
      for (const key of memberKeys) {
        allKeys.add(key);
      }
    }
    return allKeys;
  }

  if (t.isTSTypeReference(node) && t.isIdentifier(node.typeName)) {
    const name = node.typeName.name;

    // $FlowFixMe[invalid-compare]
    if (name === 'Readonly' && node.typeParameters?.params.length === 1) {
      return collectTypeKeys(
        node.typeParameters.params[0],
        aliasToPathMap,
        interfaceToPathMap,
        seen,
      );
    }

    // Omit<T, K> — return keys of T (a safe superset, avoids under-counting)
    // $FlowFixMe[invalid-compare]
    if (name === 'Omit' && node.typeParameters?.params.length === 2) {
      return collectTypeKeys(
        node.typeParameters.params[0],
        aliasToPathMap,
        interfaceToPathMap,
        seen,
      );
    }

    if (seen.has(name)) {
      return null;
    }
    seen.add(name);

    const aliasPath = aliasToPathMap.get(name);
    if (aliasPath != null) {
      return collectTypeKeys(
        aliasPath.node.typeAnnotation,
        aliasToPathMap,
        interfaceToPathMap,
        seen,
      );
    }

    if (interfaceToPathMap != null) {
      const ifacePath = interfaceToPathMap.get(name);
      if (ifacePath != null) {
        return collectInterfaceKeys(
          ifacePath,
          aliasToPathMap,
          interfaceToPathMap,
          seen,
        );
      }
    }

    return null;
  }

  return null;
}

function collectInterfaceKeys(
  ifacePath: NodePath<$FlowFixMe>,
  aliasToPathMap: Map<string, NodePath<t.TSTypeAliasDeclaration>>,
  interfaceToPathMap: Map<string, NodePath<$FlowFixMe>>,
  visited: Set<string>,
): Set<string> | null {
  const keys = collectMemberKeys(ifacePath.node.body.body);
  if (keys == null) {
    return null;
  }

  if (ifacePath.node.extends != null) {
    for (const extendsClause of ifacePath.node.extends) {
      if (!t.isIdentifier(extendsClause.expression)) {
        return null;
      }
      const typeRef = t.tsTypeReference(
        t.cloneDeep(extendsClause.expression),
        extendsClause.typeParameters != null
          ? t.cloneDeep(extendsClause.typeParameters)
          : undefined,
      );
      const extendsKeys = collectTypeKeys(
        typeRef,
        aliasToPathMap,
        interfaceToPathMap,
        visited,
      );
      if (extendsKeys == null) {
        return null;
      }
      for (const key of extendsKeys) {
        keys.add(key);
      }
    }
  }

  return keys;
}

function collectMemberKeys(members: $FlowFixMe): Set<string> | null {
  const keys = new Set<string>();
  for (const member of members) {
    if (t.isTSPropertySignature(member) || t.isTSMethodSignature(member)) {
      if (t.isIdentifier(member.key)) {
        keys.add(member.key.name);
      } else if (t.isStringLiteral(member.key)) {
        keys.add(member.key.value);
      } else {
        return null;
      }
    } else if (t.isTSIndexSignature(member)) {
      return null;
    }
  }
  return keys;
}

module.exports = collectTypeKeys;

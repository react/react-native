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

const t = require('@babel/types');

export default function alignTypeParameters(
  node: BabelNodeTSType,
  declarationPath: NodePath<t.TSTypeAliasDeclaration>,
  path: NodePath<t.Node>,
): BabelNodeTSType {
  const declarationTypeParameters = declarationPath.node.typeParameters?.params;
  const nodeTypeParameters = path.node.typeParameters?.params;

  if (!declarationTypeParameters || !nodeTypeParameters) {
    throw new Error(
      `No type parameters found for ${declarationPath.node.id.name ?? ''}`,
    );
  }

  if (nodeTypeParameters.length > declarationTypeParameters.length) {
    throw new Error(
      `Encountered ${nodeTypeParameters.length} type parameters for type ${declarationPath.node.id.name ?? ''} while at maximum ${declarationTypeParameters.length} are allowed`,
    );
  }

  const genericMapping = new Map<string, BabelNodeTSType>();
  for (let i = 0; i < declarationTypeParameters.length; i++) {
    const declarationTypeParameter = declarationTypeParameters[i];
    let nodeTypeParameter: ?BabelNodeTSType = nodeTypeParameters[
      i
    ] as $FlowFixMe;

    if (nodeTypeParameter == null) {
      nodeTypeParameter = declarationTypeParameter.default;
    }

    if (nodeTypeParameter == null) {
      throw new Error(
        `No value provided for a required type parameter ${declarationPath.node.id.name ?? ''}`,
      );
    }

    genericMapping.set(declarationTypeParameter.name, nodeTypeParameter);
  }

  // handle edge case where the generic type is equal to one of the type
  // parameters, i.e. `type Foo<T> = T`
  if (t.isTSTypeReference(node) && t.isIdentifier(node.typeName)) {
    const mappedType = genericMapping.get(node.typeName.name);
    if (mappedType) {
      return mappedType;
    }
  }

  const wrapped = t.tsTypeAliasDeclaration(
    t.identifier('Wrapper'),
    undefined,
    node,
  );

  traverse(t.file(t.program([wrapped])), {
    TSTypeReference(innerPath) {
      const type = innerPath.node.typeName;
      if (!t.isIdentifier(type)) {
        return;
      }

      const mappedType = t.cloneDeep(genericMapping.get(type.name));
      if (!mappedType) {
        return;
      }

      innerPath.replaceWith(mappedType);
      innerPath.skip();
    },
  });

  return node;
}

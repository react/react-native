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

import type {PluginObj} from '@babel/core';

import * as t from '@babel/types';

const {
  hasAnnotation,
  stripAnnotationComments,
} = require('./utils/buildDirectives');

const ANNOTATION_PATTERN = /@build-types\s+emit-as-interface\b/;

/**
 * Convert `type` aliases annotated with `@build-types emit-as-interface` to
 * an `interface` declaration.
 *
 * Nativewind and Expo/react-native-web rely on TypeScript module augmentation
 * to extend props like `className` on React Native component types. This is
 * only possible on `interface` declarations (open), not `type` (closed).
 */
function convertToInterface(path: $FlowFixMe): void {
  stripAnnotationComments(path, ANNOTATION_PATTERN);

  const {typeAnnotation} = path.node;
  let innerType = typeAnnotation;
  let isReadonly = false;

  if (
    t.isTSTypeReference(typeAnnotation) &&
    t.isIdentifier(typeAnnotation.typeName, {name: 'Readonly'}) &&
    typeAnnotation.typeParameters?.params.length === 1
  ) {
    isReadonly = true;
    innerType = typeAnnotation.typeParameters.params[0];
  }

  let members: Array<t.TSType>;

  if (t.isTSIntersectionType(innerType)) {
    members = innerType.types.map(member => t.cloneDeep(member));
  } else if (t.isTSTypeLiteral(innerType) || t.isTSTypeReference(innerType)) {
    members = [t.cloneDeep(innerType)];
  } else {
    throw new Error(
      `Unsupported type structure for @build-types emit-as-interface on '${path.node.id.name}'. Only object literals, type references, and intersections of these are supported.`,
    );
  }

  const combined =
    members.length === 1 ? members[0] : t.tsIntersectionType(members);
  const hasObjectLiteral = members.some(member => t.isTSTypeLiteral(member));

  // Members declared in the body of an interface cannot be overridden by a
  // module augmentation: a second declaration is a merge conflict, and the
  // original wins. Keeping every member in the extends clause makes them all
  // inherited, and so all overridable.
  const extendsClauses = [
    isReadonly
      ? t.tsExpressionWithTypeArguments(
          t.identifier('Readonly'),
          t.tsTypeParameterInstantiation([combined]),
        )
      : hasObjectLiteral
        ? // An object literal cannot appear in an extends clause on its own,
          // and wrapping it in Readonly would add modifiers the source does
          // not have. Omit<_, never> preserves them.
          t.tsExpressionWithTypeArguments(
            t.identifier('Omit'),
            t.tsTypeParameterInstantiation([combined, t.tsNeverKeyword()]),
          )
        : typeToExtendsClause(combined, false),
  ];

  const interfaceNode = t.tsInterfaceDeclaration(
    t.cloneDeep(path.node.id),
    path.node.typeParameters
      ? t.cloneDeep(path.node.typeParameters)
      : undefined,
    extendsClauses,
    t.tsInterfaceBody([]),
  );
  interfaceNode.declare = path.node.declare ?? false;

  path.replaceWith(interfaceNode);
}

function typeToExtendsClause(
  tsType: t.TSType,
  wrapInReadonly: boolean,
): t.TSExpressionWithTypeArguments {
  if (wrapInReadonly) {
    return t.tsExpressionWithTypeArguments(
      t.identifier('Readonly'),
      t.tsTypeParameterInstantiation([t.cloneDeep(tsType)]),
    );
  }

  if (t.isTSTypeReference(tsType) && t.isIdentifier(tsType.typeName)) {
    return t.tsExpressionWithTypeArguments(
      t.cloneDeep(tsType.typeName),
      tsType.typeParameters ? t.cloneDeep(tsType.typeParameters) : undefined,
    );
  }

  return t.tsExpressionWithTypeArguments(
    t.identifier('Readonly'),
    t.tsTypeParameterInstantiation([t.cloneDeep(tsType)]),
  );
}

const visitor: PluginObj<unknown> = {
  visitor: {
    TSTypeAliasDeclaration(path) {
      if (!hasAnnotation(path, ANNOTATION_PATTERN)) {
        return;
      }
      convertToInterface(path);
    },
  },
};

module.exports = visitor;

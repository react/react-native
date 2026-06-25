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

  const extendsClauses: Array<t.TSExpressionWithTypeArguments> = [];
  const bodyMembers: Array<t.TSTypeElement> = [];

  if (t.isTSIntersectionType(innerType)) {
    const refMembers: Array<t.TSType> = [];
    for (const member of innerType.types) {
      if (t.isTSTypeLiteral(member)) {
        const clonedMembers = t.cloneDeep(member).members;
        if (isReadonly) {
          makePropertiesReadonly(clonedMembers);
        }
        bodyMembers.push(...clonedMembers);
      } else {
        refMembers.push(t.cloneDeep(member));
      }
    }
    if (refMembers.length > 0) {
      const refsType =
        refMembers.length === 1
          ? refMembers[0]
          : t.tsIntersectionType(refMembers);
      if (isReadonly) {
        extendsClauses.push(
          t.tsExpressionWithTypeArguments(
            t.identifier('Readonly'),
            t.tsTypeParameterInstantiation([refsType]),
          ),
        );
      } else {
        extendsClauses.push(typeToExtendsClause(refsType, false));
      }
    }
  } else if (t.isTSTypeLiteral(innerType)) {
    const clonedMembers = t.cloneDeep(innerType).members;
    if (isReadonly) {
      makePropertiesReadonly(clonedMembers);
    }
    bodyMembers.push(...clonedMembers);
  } else if (t.isTSTypeReference(innerType)) {
    extendsClauses.push(typeToExtendsClause(innerType, isReadonly));
  } else {
    throw new Error(
      `Unsupported type structure for @build-types emit-as-interface on '${path.node.id.name}'. Only object literals, type references, and intersections of these are supported.`,
    );
  }

  const interfaceNode = t.tsInterfaceDeclaration(
    t.cloneDeep(path.node.id),
    path.node.typeParameters
      ? t.cloneDeep(path.node.typeParameters)
      : undefined,
    extendsClauses.length > 0 ? extendsClauses : undefined,
    t.tsInterfaceBody(bodyMembers),
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

function makePropertiesReadonly(members: Array<t.TSTypeElement>): void {
  for (const member of members) {
    if (t.isTSPropertySignature(member)) {
      member.readonly = true;
    }
  }
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

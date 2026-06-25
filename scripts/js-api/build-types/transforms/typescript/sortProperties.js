/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {PluginObj} from '@babel/core';

import * as t from '@babel/types';

function sortMembers<T>(members: T[]): T[] {
  const indexSignature = [];
  const properties = [];
  const functionProperties = [];
  const methods = [];
  const enumMembers = [];

  for (const member of members) {
    if (t.isTSEnumMember(member)) {
      enumMembers.push(member);
    } else if (
      t.isTSPropertySignature(member) ||
      t.isClassProperty(member) ||
      t.isClassPrivateProperty(member)
    ) {
      if (
        t.isTSTypeAnnotation(member.typeAnnotation) &&
        t.isTSFunctionType(member.typeAnnotation.typeAnnotation)
      ) {
        functionProperties.push(member);
      } else {
        properties.push(member);
      }
    } else if (t.isTSIndexSignature(member)) {
      indexSignature.push(member);
    } else {
      methods.push(member);
    }
  }

  // $FlowFixMe[unclear-type]
  function comparator(a: any, b: any): number {
    const aName = t.isClassPrivateProperty(a)
      ? a.key.id.name
      : t.isTSEnumMember(a)
        ? a.id.name
        : t.isStringLiteral(a.key)
          ? a.key.value
          : a.key.name;
    const bName = t.isClassPrivateProperty(b)
      ? b.key.id.name
      : t.isTSEnumMember(b)
        ? b.id.name
        : t.isStringLiteral(b.key)
          ? b.key.value
          : b.key.name;

    if (aName === undefined || bName === undefined) {
      return 0;
    }

    return aName.localeCompare(bName);
  }

  properties.sort(comparator);
  functionProperties.sort(comparator);
  methods.sort(comparator);
  enumMembers.sort(comparator);

  return indexSignature
    .concat(properties)
    .concat(functionProperties)
    .concat(methods)
    .concat(enumMembers);
}

const visitor: PluginObj<unknown> = {
  visitor: {
    TSInterfaceBody(path) {
      path.node.body = sortMembers(path.node.body);
    },
    ClassBody(path) {
      path.node.body = sortMembers(path.node.body);
    },
    TSTypeLiteral(path) {
      path.node.members = sortMembers(path.node.members);
    },
    TSEnumDeclaration(path) {
      path.node.members = sortMembers(path.node.members);
    },
  },
};

module.exports = visitor;

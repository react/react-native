/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import type {NativeModuleEnumMemberType} from '../../CodegenSchema';
import type {ASTNode, TypeDeclarationMap} from '../utils';

function getValueFromTypes(value: ASTNode, types: TypeDeclarationMap): ASTNode {
  if (value.type === 'GenericTypeAnnotation' && types[value.id.name]) {
    return getValueFromTypes(types[value.id.name].right, types);
  }
  return value;
}

/**
 * Returns the member type of an enum body, or `null` if it is not a string or
 * number enum. Older Flow parser versions encode the member type in the body
 * node type. Newer versions emit an `EnumBody` whose `explicitType` is `null`
 * when the enum has no `of` clause, in which case the first member decides.
 */
function getEnumMembersType(enumBody: ASTNode): ?NativeModuleEnumMemberType {
  switch (enumBody.type) {
    case 'EnumStringBody':
      return 'StringTypeAnnotation';
    case 'EnumNumberBody':
      return 'NumberTypeAnnotation';
    case 'EnumBody':
      break;
    default:
      return null;
  }

  switch (enumBody.explicitType) {
    case 'number':
      return 'NumberTypeAnnotation';
    case 'string':
    case null:
      break;
    default:
      return null;
  }

  switch (enumBody.members[0]?.type) {
    case 'EnumNumberMember':
      return 'NumberTypeAnnotation';
    case 'EnumStringMember':
    case 'EnumDefaultedMember':
    case undefined:
      return 'StringTypeAnnotation';
    default:
      return null;
  }
}

module.exports = {
  getEnumMembersType,
  getValueFromTypes,
};

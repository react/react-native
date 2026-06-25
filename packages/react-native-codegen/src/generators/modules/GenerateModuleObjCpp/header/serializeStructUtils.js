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

import type {Nullable} from '../../../../CodegenSchema';
import type {StructContext, StructTypeAnnotation} from '../StructCollector';

const {unwrapNullable} = require('../../../../parsers/parsers-commons');
const {wrapOptional: wrapCxxOptional} = require('../../../TypeUtils/Cxx');
const {
  wrapOptional: wrapObjCOptional,
} = require('../../../TypeUtils/Objective-C');
const {capitalize} = require('../../../Utils');
const {getNamespacedStructName} = require('../Utils');

function toObjCType(
  hasteModuleName: string,
  nullableTypeAnnotation: Nullable<StructTypeAnnotation>,
  structContext: StructContext,
  isOptional: boolean = false,
): string {
  const [typeAnnotation, nullable] = unwrapNullable(nullableTypeAnnotation);
  const isRequired = !nullable && !isOptional;

  switch (typeAnnotation.type) {
    case 'ReservedTypeAnnotation':
      switch (typeAnnotation.name) {
        case 'RootTag':
          return wrapCxxOptional('double', isRequired);
        default:
          typeAnnotation.name as empty;
          throw new Error(`Unknown prop type, found: ${typeAnnotation.name}"`);
      }
    case 'StringTypeAnnotation':
      return 'NSString *';
    case 'StringLiteralTypeAnnotation':
      return 'NSString *';
    case 'UnionTypeAnnotation':
      // TODO(T247151345): Implement proper heterogeneous union support. This is unsafe.
      return 'NSObject *';
    case 'NumberTypeAnnotation':
      return wrapCxxOptional('double', isRequired);
    case 'NumberLiteralTypeAnnotation':
      return wrapCxxOptional('double', isRequired);
    case 'FloatTypeAnnotation':
      return wrapCxxOptional('double', isRequired);
    case 'Int32TypeAnnotation':
      return wrapCxxOptional('double', isRequired);
    case 'DoubleTypeAnnotation':
      return wrapCxxOptional('double', isRequired);
    case 'BooleanTypeAnnotation':
      return wrapCxxOptional('bool', isRequired);
    case 'BooleanLiteralTypeAnnotation':
      return wrapCxxOptional('bool', isRequired);
    case 'EnumDeclaration':
      switch (typeAnnotation.memberType) {
        case 'NumberTypeAnnotation':
          return wrapCxxOptional('double', isRequired);
        case 'StringTypeAnnotation':
          return 'NSString *';
        default:
          throw new Error(
            `Couldn't convert enum into ObjC type: ${typeAnnotation.type}"`,
          );
      }
    case 'GenericObjectTypeAnnotation':
      return wrapObjCOptional('id<NSObject>', isRequired);
    case 'ArrayTypeAnnotation':
      if (typeAnnotation.elementType.type === 'AnyTypeAnnotation') {
        return wrapObjCOptional('id<NSObject>', isRequired);
      }

      return wrapCxxOptional(
        structContext === 'CONSTANTS'
          ? `std::vector<${toObjCType(
              hasteModuleName,
              typeAnnotation.elementType,
              structContext,
            )}>`
          : `facebook::react::LazyVector<${toObjCType(
              hasteModuleName,
              typeAnnotation.elementType,
              structContext,
            )}>`,
        isRequired,
      );
    case 'TypeAliasTypeAnnotation':
      const structName = capitalize(typeAnnotation.name);
      const namespacedStructName = getNamespacedStructName(
        hasteModuleName,
        structName,
      );
      return wrapCxxOptional(
        structContext === 'CONSTANTS'
          ? `${namespacedStructName}::Builder`
          : namespacedStructName,
        isRequired,
      );
    default:
      typeAnnotation.type as empty;
      throw new Error(
        `Couldn't convert into ObjC type: ${typeAnnotation.type}"`,
      );
  }
}

module.exports = {
  toObjCType,
};

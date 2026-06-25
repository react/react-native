/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  ArrayTypeAnnotation,
  CompleteTypeAnnotation,
  ComponentArrayTypeAnnotation,
  ObjectTypeAnnotation,
  PropTypeAnnotation,
} from '@react-native/codegen/src/CodegenSchema';

export default function convertPropToBasicTypes(
  inputType: PropTypeAnnotation | ComponentArrayTypeAnnotation['elementType'],
): CompleteTypeAnnotation {
  let resultingType: CompleteTypeAnnotation;

  switch (inputType.type) {
    case 'BooleanTypeAnnotation':
      resultingType = {
        type: 'BooleanTypeAnnotation',
      };
      break;
    case 'StringTypeAnnotation':
      resultingType = {
        type: 'StringTypeAnnotation',
      };
      break;
    case 'DoubleTypeAnnotation':
      resultingType = {
        type: 'DoubleTypeAnnotation',
      };
      break;

    case 'FloatTypeAnnotation':
      resultingType = {
        type: 'FloatTypeAnnotation',
      };
      break;
    case 'Int32TypeAnnotation':
      resultingType = {
        type: 'Int32TypeAnnotation',
      };
      break;
    case 'StringEnumTypeAnnotation':
      resultingType = {
        type: 'UnionTypeAnnotation',
        types: inputType.options.map(option => {
          return {
            type: 'StringLiteralTypeAnnotation',
            value: option,
          };
        }),
      };
      break;
    case 'Int32EnumTypeAnnotation':
      // Compat check doesn't yet have support for
      // NumberLiteralUnionTypeAnnotation
      resultingType = {
        type: 'AnyTypeAnnotation',
      };
      break;
    case 'ReservedPropTypeAnnotation':
      resultingType = {
        type: 'ReservedTypeAnnotation',
        name: inputType.name,
      };
      break;
    case 'MixedTypeAnnotation':
      resultingType = inputType;
      break;
    case 'ObjectTypeAnnotation':
      resultingType = {
        type: 'ObjectTypeAnnotation',
        ...(inputType.baseTypes != null
          ? {baseTypes: inputType.baseTypes}
          : {}),
        properties: inputType.properties.map(property => ({
          name: property.name,
          optional: property.optional,
          typeAnnotation: convertPropToBasicTypes(property.typeAnnotation),
        })),
      } as ObjectTypeAnnotation<CompleteTypeAnnotation>;
      break;
    case 'ArrayTypeAnnotation':
      resultingType = {
        type: 'ArrayTypeAnnotation',
        elementType: convertPropToBasicTypes(inputType.elementType),
      } as ArrayTypeAnnotation<CompleteTypeAnnotation>;
      break;
    default:
      inputType.type as empty;
      throw new Error('Unexpected type ' + inputType.type);
  }

  return resultingType;
}

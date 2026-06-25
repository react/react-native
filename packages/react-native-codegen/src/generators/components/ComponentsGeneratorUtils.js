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

import type {NamedShape, PropTypeAnnotation} from '../../CodegenSchema';
import type {
  BooleanTypeAnnotation,
  DoubleTypeAnnotation,
  FloatTypeAnnotation,
  Int32TypeAnnotation,
  ObjectTypeAnnotation,
  ReservedPropTypeAnnotation,
  StringTypeAnnotation,
} from '../../CodegenSchema';

const {
  getCppLocalIncludesForReservedPrimitive,
  getCppTypeForReservedPrimitive,
} = require('../ReservedPrimitiveTypes');
const {getEnumName} = require('../Utils');
const {
  generateStructName,
  getCppTypeForAnnotation,
  getEnumMaskName,
  getImports,
} = require('./CppHelpers.js');

function getNativeTypeFromAnnotation(
  componentName: string,
  prop:
    | NamedShape<PropTypeAnnotation>
    | {
        name: string,
        typeAnnotation:
          | $FlowFixMe
          | DoubleTypeAnnotation
          | FloatTypeAnnotation
          | BooleanTypeAnnotation
          | Int32TypeAnnotation
          | StringTypeAnnotation
          | ObjectTypeAnnotation<PropTypeAnnotation>
          | ReservedPropTypeAnnotation
          | {
              readonly default: string,
              readonly options: ReadonlyArray<string>,
              readonly type: 'StringEnumTypeAnnotation',
            }
          | {
              readonly elementType: ObjectTypeAnnotation<PropTypeAnnotation>,
              readonly type: 'ArrayTypeAnnotation',
            },
      },
  nameParts: ReadonlyArray<string>,
): string {
  const typeAnnotation = prop.typeAnnotation;

  switch (typeAnnotation.type) {
    case 'BooleanTypeAnnotation':
    case 'StringTypeAnnotation':
    case 'Int32TypeAnnotation':
    case 'DoubleTypeAnnotation':
    case 'FloatTypeAnnotation':
      return getCppTypeForAnnotation(typeAnnotation.type);
    case 'ReservedPropTypeAnnotation':
      return getCppTypeForReservedPrimitive(typeAnnotation.name);
    case 'ArrayTypeAnnotation': {
      const arrayType = typeAnnotation.elementType.type;
      if (arrayType === 'ArrayTypeAnnotation') {
        return `std::vector<${getNativeTypeFromAnnotation(
          componentName,
          {typeAnnotation: typeAnnotation.elementType, name: ''},
          nameParts.concat([prop.name]),
        )}>`;
      }
      if (arrayType === 'ObjectTypeAnnotation') {
        const structName = generateStructName(
          componentName,
          nameParts.concat([prop.name]),
        );
        return `std::vector<${structName}>`;
      }
      if (arrayType === 'StringEnumTypeAnnotation') {
        const enumName = getEnumName(componentName, prop.name);
        return getEnumMaskName(enumName);
      }
      const itemAnnotation = getNativeTypeFromAnnotation(
        componentName,
        {
          typeAnnotation: typeAnnotation.elementType,
          name: componentName,
        },
        nameParts.concat([prop.name]),
      );
      return `std::vector<${itemAnnotation}>`;
    }
    case 'ObjectTypeAnnotation': {
      return generateStructName(componentName, nameParts.concat([prop.name]));
    }
    case 'StringEnumTypeAnnotation':
      return getEnumName(componentName, prop.name);
    case 'Int32EnumTypeAnnotation':
      return getEnumName(componentName, prop.name);
    case 'MixedTypeAnnotation':
      return 'folly::dynamic';
    default:
      typeAnnotation as empty;
      throw new Error(
        `Received invalid typeAnnotation for ${componentName} prop ${prop.name}, received ${typeAnnotation.type}`,
      );
  }
}

/// This function process some types if we need to customize them
/// For example, the ImageSource and the reserved types could be trasformed into
/// const address instead of using them as plain types.
function convertTypesToConstAddressIfNeeded(
  type: string,
  convertibleTypes: Set<string>,
): string {
  if (convertibleTypes.has(type)) {
    return `${type} const &`;
  }
  return type;
}

function convertValueToSharedPointerWithMove(
  type: string,
  value: string,
  convertibleTypes: Set<string>,
): string {
  if (convertibleTypes.has(type)) {
    return `std::make_shared<${type}>(std::move(${value}))`;
  }
  return value;
}

function convertVariableToSharedPointer(
  type: string,
  convertibleTypes: Set<string>,
): string {
  if (convertibleTypes.has(type)) {
    return `std::shared_ptr<${type}>`;
  }
  return type;
}

function convertVariableToPointer(
  type: string,
  value: string,
  convertibleTypes: Set<string>,
): string {
  if (convertibleTypes.has(type)) {
    return `*${value}`;
  }
  return value;
}

// Configuration for C++ type conversions of reserved types.
// Centralizes the knowledge of which types need special pointer/address handling.
const CTOR_PARAM_ADDRESS_TYPES: Set<string> = new Set(['ImageSource']);
const SHARED_POINTER_TYPES: Set<string> = new Set(['ImageRequest']);

const convertCtorParamToAddressType = (type: string): string =>
  convertTypesToConstAddressIfNeeded(type, CTOR_PARAM_ADDRESS_TYPES);

const convertCtorInitToSharedPointers = (type: string, value: string): string =>
  convertValueToSharedPointerWithMove(type, value, SHARED_POINTER_TYPES);

const convertGettersReturnTypeToAddressType = (type: string): string =>
  convertTypesToConstAddressIfNeeded(type, SHARED_POINTER_TYPES);

const convertVarTypeToSharedPointer = (type: string): string =>
  convertVariableToSharedPointer(type, SHARED_POINTER_TYPES);

const convertVarValueToPointer = (type: string, value: string): string =>
  convertVariableToPointer(type, value, SHARED_POINTER_TYPES);

function getLocalImports(
  properties: ReadonlyArray<NamedShape<PropTypeAnnotation>>,
): Set<string> {
  const imports: Set<string> = new Set();

  function addImportsForNativeName(
    name:
      | 'ColorPrimitive'
      | 'EdgeInsetsPrimitive'
      | 'ImageSourcePrimitive'
      | 'PointPrimitive'
      | 'ImageRequestPrimitive'
      | 'DimensionPrimitive',
  ) {
    for (const include of getCppLocalIncludesForReservedPrimitive(name)) {
      imports.add(include);
    }
  }

  properties.forEach(prop => {
    const typeAnnotation = prop.typeAnnotation;

    if (typeAnnotation.type === 'ReservedPropTypeAnnotation') {
      addImportsForNativeName(typeAnnotation.name);
    }

    if (typeAnnotation.type === 'ArrayTypeAnnotation') {
      imports.add('#include <vector>');
      if (typeAnnotation.elementType.type === 'StringEnumTypeAnnotation') {
        imports.add('#include <cinttypes>');
      }
    }

    if (
      typeAnnotation.type === 'ArrayTypeAnnotation' &&
      typeAnnotation.elementType.type === 'ReservedPropTypeAnnotation'
    ) {
      addImportsForNativeName(typeAnnotation.elementType.name);
    }

    if (
      typeAnnotation.type === 'ArrayTypeAnnotation' &&
      typeAnnotation.elementType.type === 'ObjectTypeAnnotation'
    ) {
      imports.add('#include <react/renderer/core/propsConversions.h>');
      const objectProps = typeAnnotation.elementType.properties;
      // $FlowFixMe[incompatible-type] the type is guaranteed to be ObjectTypeAnnotation<PropTypeAnnotation>
      const objectImports = getImports(objectProps);
      // $FlowFixMe[incompatible-type] the type is guaranteed to be ObjectTypeAnnotation<PropTypeAnnotation>
      const localImports = getLocalImports(objectProps);
      // $FlowFixMe[method-unbinding] added when improving typing for this parameters
      objectImports.forEach(imports.add, imports);
      // $FlowFixMe[method-unbinding] added when improving typing for this parameters
      localImports.forEach(imports.add, imports);
    }

    if (typeAnnotation.type === 'ObjectTypeAnnotation') {
      imports.add('#include <react/renderer/core/propsConversions.h>');
      const objectImports = getImports(typeAnnotation.properties);
      const localImports = getLocalImports(typeAnnotation.properties);
      // $FlowFixMe[method-unbinding] added when improving typing for this parameters
      objectImports.forEach(imports.add, imports);
      // $FlowFixMe[method-unbinding] added when improving typing for this parameters
      localImports.forEach(imports.add, imports);
    }
  });

  return imports;
}

module.exports = {
  getNativeTypeFromAnnotation,
  convertCtorParamToAddressType,
  convertGettersReturnTypeToAddressType,
  convertCtorInitToSharedPointers,
  convertVarTypeToSharedPointer,
  convertVarValueToPointer,
  getLocalImports,
};

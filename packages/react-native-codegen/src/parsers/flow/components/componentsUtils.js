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

import type {BuildSchemaFN, Parser} from '../../parser';
import type {ASTNode, PropAST, TypeDeclarationMap} from '../../utils';

const {verifyPropNotAlreadyDefined} = require('../../parsers-commons');
const {getValueFromTypes} = require('../utils.js');

// $FlowFixMe[unsupported-variance-annotation]
function getTypeAnnotationForArray<out T>(
  name: string,
  typeAnnotation: $FlowFixMe,
  defaultValue: $FlowFixMe | null,
  types: TypeDeclarationMap,
  parser: Parser,
  buildSchema: BuildSchemaFN<T>,
): $FlowFixMe {
  const extractedTypeAnnotation = getValueFromTypes(typeAnnotation, types);
  if (extractedTypeAnnotation.type === 'NullableTypeAnnotation') {
    throw new Error(
      'Nested optionals such as "$ReadOnlyArray<?boolean>" are not supported, please declare optionals at the top level of value definitions as in "?$ReadOnlyArray<boolean>"',
    );
  }

  if (
    extractedTypeAnnotation.type === 'GenericTypeAnnotation' &&
    parser.getTypeAnnotationName(extractedTypeAnnotation) === 'WithDefault'
  ) {
    throw new Error(
      'Nested defaults such as "$ReadOnlyArray<WithDefault<boolean, false>>" are not supported, please declare defaults at the top level of value definitions as in "WithDefault<$ReadOnlyArray<boolean>, false>"',
    );
  }

  if (extractedTypeAnnotation.type === 'GenericTypeAnnotation') {
    // Resolve the type alias if it's not defined inline
    const objectType = getValueFromTypes(extractedTypeAnnotation, types);

    if (
      objectType.id.name === '$ReadOnly' ||
      objectType.id.name === 'Readonly'
    ) {
      return {
        type: 'ObjectTypeAnnotation',
        properties: flattenProperties(
          objectType.typeParameters.params[0].properties,
          types,
          parser,
        )
          .map(prop => buildSchema(prop, types, parser))
          .filter(Boolean),
      };
    }

    if (
      objectType.id.name === '$ReadOnlyArray' ||
      objectType.id.name === 'ReadonlyArray'
    ) {
      // We need to go yet another level deeper to resolve
      // types that may be defined in a type alias
      const nestedObjectType = getValueFromTypes(
        objectType.typeParameters.params[0],
        types,
      );

      return {
        type: 'ArrayTypeAnnotation',
        elementType: {
          type: 'ObjectTypeAnnotation',
          properties: flattenProperties(
            nestedObjectType.typeParameters.params[0].properties,
            types,
            parser,
          )
            .map(prop => buildSchema(prop, types, parser))
            .filter(Boolean),
        },
      };
    }
  }

  const type =
    extractedTypeAnnotation.type === 'GenericTypeAnnotation'
      ? parser.getTypeAnnotationName(extractedTypeAnnotation)
      : extractedTypeAnnotation.type;

  switch (type) {
    case 'ImageSource':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'ImageSourcePrimitive',
      };
    case 'ImageRequest':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'ImageRequestPrimitive',
      };
    case 'ColorValue':
    case 'ProcessedColorValue':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'ColorPrimitive',
      };
    case 'PointValue':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'PointPrimitive',
      };
    case 'EdgeInsetsValue':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'EdgeInsetsPrimitive',
      };
    case 'DimensionValue':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'DimensionPrimitive',
      };
    case 'Stringish':
      return {
        type: 'StringTypeAnnotation',
      };
    case 'Int32':
      return {
        type: 'Int32TypeAnnotation',
      };
    case 'Double':
      return {
        type: 'DoubleTypeAnnotation',
      };
    case 'Float':
      return {
        type: 'FloatTypeAnnotation',
      };
    case 'BooleanTypeAnnotation':
      return {
        type: 'BooleanTypeAnnotation',
      };
    case 'StringTypeAnnotation':
      return {
        type: 'StringTypeAnnotation',
      };
    case 'UnsafeMixed':
      return {
        type: 'MixedTypeAnnotation',
      };
    case 'UnionTypeAnnotation':
      typeAnnotation.types.reduce((lastType, currType) => {
        if (lastType && currType.type !== lastType.type) {
          throw new Error(`Mixed types are not supported (see "${name}")`);
        }
        return currType;
      });

      if (defaultValue === null) {
        throw new Error(`A default enum value is required for "${name}"`);
      }

      const unionType = typeAnnotation.types[0].type;
      if (unionType === 'StringLiteralTypeAnnotation') {
        return {
          type: 'StringEnumTypeAnnotation',
          default: defaultValue as string,
          options: typeAnnotation.types.map(option => option.value),
        };
      } else if (unionType === 'NumberLiteralTypeAnnotation') {
        throw new Error(
          `Arrays of int enums are not supported (see: "${name}")`,
        );
      } else {
        throw new Error(
          `Unsupported union type for "${name}", received "${unionType}"`,
        );
      }
    default:
      throw new Error(`Unknown property type for "${name}": ${type}`);
  }
}

function flattenProperties(
  typeDefinition: ReadonlyArray<PropAST>,
  types: TypeDeclarationMap,
  parser: Parser,
): ReadonlyArray<PropAST> {
  return typeDefinition
    .map(property => {
      if (property.type === 'ObjectTypeProperty') {
        return property;
      } else if (property.type === 'ObjectTypeSpreadProperty') {
        return flattenProperties(
          parser.getProperties(property.argument.id.name, types),
          types,
          parser,
        );
      }
    })
    .reduce((acc: Array<PropAST>, item) => {
      if (Array.isArray(item)) {
        item.forEach(prop => {
          verifyPropNotAlreadyDefined(acc, prop);
        });
        return acc.concat(item);
      } else {
        verifyPropNotAlreadyDefined(acc, item);
        acc.push(item);
        return acc;
      }
    }, [])
    .filter(Boolean);
}

// $FlowFixMe[unsupported-variance-annotation]
function getTypeAnnotation<out T>(
  name: string,
  annotation: $FlowFixMe | ASTNode,
  defaultValue: $FlowFixMe | null,
  withNullDefault: boolean,
  types: TypeDeclarationMap,
  parser: Parser,
  buildSchema: BuildSchemaFN<T>,
): $FlowFixMe {
  const typeAnnotation = getValueFromTypes(annotation, types);

  if (
    typeAnnotation.type === 'GenericTypeAnnotation' &&
    (parser.getTypeAnnotationName(typeAnnotation) === '$ReadOnlyArray' ||
      parser.getTypeAnnotationName(typeAnnotation) === 'ReadonlyArray')
  ) {
    return {
      type: 'ArrayTypeAnnotation',
      elementType: getTypeAnnotationForArray(
        name,
        typeAnnotation.typeParameters.params[0],
        defaultValue,
        types,
        parser,
        buildSchema,
      ),
    };
  }

  if (
    typeAnnotation.type === 'GenericTypeAnnotation' &&
    (parser.getTypeAnnotationName(typeAnnotation) === '$ReadOnly' ||
      parser.getTypeAnnotationName(typeAnnotation) === 'Readonly')
  ) {
    return {
      type: 'ObjectTypeAnnotation',
      properties: flattenProperties(
        typeAnnotation.typeParameters.params[0].properties,
        types,
        parser,
      )
        .map(prop => buildSchema(prop, types, parser))
        .filter(Boolean),
    };
  }

  const type =
    typeAnnotation.type === 'GenericTypeAnnotation'
      ? parser.getTypeAnnotationName(typeAnnotation)
      : typeAnnotation.type;

  switch (type) {
    case 'ImageSource':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'ImageSourcePrimitive',
      };
    case 'ImageRequest':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'ImageRequestPrimitive',
      };
    case 'ColorValue':
    case 'ProcessedColorValue':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'ColorPrimitive',
      };
    case 'ColorArrayValue':
      return {
        type: 'ArrayTypeAnnotation',
        elementType: {
          type: 'ReservedPropTypeAnnotation',
          name: 'ColorPrimitive',
        },
      };
    case 'PointValue':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'PointPrimitive',
      };
    case 'EdgeInsetsValue':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'EdgeInsetsPrimitive',
      };
    case 'DimensionValue':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'DimensionPrimitive',
      };
    case 'Int32':
      return {
        type: 'Int32TypeAnnotation',
        default: (defaultValue ? defaultValue : 0) as number,
      };
    case 'Double':
      return {
        type: 'DoubleTypeAnnotation',
        default: (defaultValue ? defaultValue : 0) as number,
      };
    case 'Float':
      return {
        type: 'FloatTypeAnnotation',
        default: withNullDefault
          ? (defaultValue as number | null)
          : ((defaultValue ? defaultValue : 0) as number),
      };
    case 'BooleanTypeAnnotation':
      return {
        type: 'BooleanTypeAnnotation',
        default: withNullDefault
          ? (defaultValue as boolean | null)
          : ((defaultValue == null ? false : defaultValue) as boolean),
      };
    case 'StringTypeAnnotation':
      if (typeof defaultValue !== 'undefined') {
        return {
          type: 'StringTypeAnnotation',
          default: defaultValue as string | null,
        };
      }
      throw new Error(`A default string (or null) is required for "${name}"`);
    case 'Stringish':
      if (typeof defaultValue !== 'undefined') {
        return {
          type: 'StringTypeAnnotation',
          default: defaultValue as string | null,
        };
      }
      throw new Error(`A default string (or null) is required for "${name}"`);
    case 'UnionTypeAnnotation':
      typeAnnotation.types.reduce((lastType, currType) => {
        if (lastType && currType.type !== lastType.type) {
          throw new Error(`Mixed types are not supported (see "${name}").`);
        }
        return currType;
      });

      if (defaultValue === null) {
        throw new Error(`A default enum value is required for "${name}"`);
      }

      const unionType = typeAnnotation.types[0].type;
      if (unionType === 'StringLiteralTypeAnnotation') {
        return {
          type: 'StringEnumTypeAnnotation',
          default: defaultValue as string,
          options: typeAnnotation.types.map(option => option.value),
        };
      } else if (unionType === 'NumberLiteralTypeAnnotation') {
        return {
          type: 'Int32EnumTypeAnnotation',
          default: defaultValue as number,
          options: typeAnnotation.types.map(option => option.value),
        };
      } else {
        throw new Error(
          `Unsupported union type for "${name}", received "${unionType}"`,
        );
      }
    case 'ObjectTypeAnnotation':
      throw new Error(
        `Cannot use "${type}" type annotation for "${name}": object types must be declared using $ReadOnly<>`,
      );
    case 'NumberTypeAnnotation':
      throw new Error(
        `Cannot use "${type}" type annotation for "${name}": must use a specific numeric type like Int32, Double, or Float`,
      );
    case 'UnsafeMixed':
      return {
        type: 'MixedTypeAnnotation',
      };
    default:
      throw new Error(
        `Unknown property type for "${name}": "${type}" in the State`,
      );
  }
}

type SchemaInfo = {
  name: string,
  optional: boolean,
  typeAnnotation: $FlowFixMe,
  defaultValue: $FlowFixMe,
  withNullDefault: boolean,
};

function getSchemaInfo(
  property: PropAST,
  types: TypeDeclarationMap,
  parser: Parser,
): ?SchemaInfo {
  const name = property.key.name;

  const value = getValueFromTypes(property.value, types);
  let typeAnnotation =
    value.type === 'NullableTypeAnnotation' ? value.typeAnnotation : value;
  let typeAnnotationName = parser.getTypeAnnotationName(typeAnnotation);

  const optional =
    value.type === 'NullableTypeAnnotation' ||
    property.optional ||
    (value.type === 'GenericTypeAnnotation' &&
      typeAnnotationName === 'WithDefault');

  if (
    !property.optional &&
    value.type === 'GenericTypeAnnotation' &&
    typeAnnotationName === 'WithDefault'
  ) {
    throw new Error(
      `key ${name} must be optional if used with WithDefault<> annotation`,
    );
  }
  if (
    value.type === 'NullableTypeAnnotation' &&
    typeAnnotation.type === 'GenericTypeAnnotation' &&
    typeAnnotationName === 'WithDefault'
  ) {
    throw new Error(
      'WithDefault<> is optional and does not need to be marked as optional. Please remove the ? annotation in front of it.',
    );
  }

  let type = typeAnnotation.type;
  if (
    type === 'GenericTypeAnnotation' &&
    (typeAnnotationName === 'DirectEventHandler' ||
      typeAnnotationName === 'BubblingEventHandler')
  ) {
    return null;
  }

  if (
    name === 'style' &&
    type === 'GenericTypeAnnotation' &&
    typeAnnotationName === 'ViewStyleProp'
  ) {
    return null;
  }

  let defaultValue = null;
  let withNullDefault = false;
  if (
    type === 'GenericTypeAnnotation' &&
    typeAnnotationName === 'WithDefault'
  ) {
    if (typeAnnotation.typeParameters.params.length === 1) {
      throw new Error(
        `WithDefault requires two parameters, did you forget to provide a default value for "${name}"?`,
      );
    }

    defaultValue = typeAnnotation.typeParameters.params[1].value;
    const defaultValueType = typeAnnotation.typeParameters.params[1].type;

    typeAnnotation = typeAnnotation.typeParameters.params[0];
    type =
      typeAnnotation.type === 'GenericTypeAnnotation'
        ? typeAnnotationName
        : typeAnnotation.type;

    if (defaultValueType === 'NullLiteralTypeAnnotation') {
      defaultValue = null;
      withNullDefault = true;
    }
  }

  return {
    name,
    optional,
    typeAnnotation,
    defaultValue,
    withNullDefault,
  };
}

module.exports = {
  getSchemaInfo,
  getTypeAnnotation,
  flattenProperties,
};

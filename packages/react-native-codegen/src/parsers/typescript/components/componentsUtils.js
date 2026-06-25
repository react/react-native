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
const {
  flattenIntersectionType,
  parseTopLevelType,
} = require('../parseTopLevelType');

function getUnionOfLiterals(
  name: string,
  forArray: boolean,
  elementTypes: $FlowFixMe[],
  defaultValue: $FlowFixMe | void,
  types: TypeDeclarationMap,
) {
  elementTypes.reduce((lastType, currType) => {
    const lastFlattenedType =
      lastType && lastType.type === 'TSLiteralType'
        ? lastType.literal.type
        : lastType.type;
    const currFlattenedType =
      currType.type === 'TSLiteralType' ? currType.literal.type : currType.type;

    if (lastFlattenedType && currFlattenedType !== lastFlattenedType) {
      throw new Error(`Mixed types are not supported (see "${name}")`);
    }
    return currType;
  });

  if (defaultValue === undefined) {
    throw new Error(`A default enum value is required for "${name}"`);
  }

  const unionType = elementTypes[0].type;
  if (
    unionType === 'TSLiteralType' &&
    elementTypes[0].literal?.type === 'StringLiteral'
  ) {
    return {
      type: 'StringEnumTypeAnnotation',
      default: defaultValue as string,
      options: elementTypes.map(option => option.literal.value),
    };
  } else if (
    unionType === 'TSLiteralType' &&
    elementTypes[0].literal?.type === 'NumericLiteral'
  ) {
    if (forArray) {
      throw new Error(`Arrays of int enums are not supported (see: "${name}")`);
    } else {
      return {
        type: 'Int32EnumTypeAnnotation',
        default: defaultValue as number,
        options: elementTypes.map(option => option.literal.value),
      };
    }
  } else {
    throw new Error(
      `Unsupported union type for "${name}", received "${
        unionType === 'TSLiteralType'
          ? elementTypes[0].literal?.type
          : unionType
      }"`,
    );
  }
}

function detectArrayType<T>(
  name: string,
  typeAnnotation: $FlowFixMe | ASTNode,
  defaultValue: $FlowFixMe | void,
  types: TypeDeclarationMap,
  parser: Parser,
  buildSchema: BuildSchemaFN<T>,
): $FlowFixMe {
  // Covers: readonly T[]
  if (
    typeAnnotation.type === 'TSTypeOperator' &&
    typeAnnotation.operator === 'readonly' &&
    typeAnnotation.typeAnnotation.type === 'TSArrayType'
  ) {
    return {
      type: 'ArrayTypeAnnotation',
      elementType: getTypeAnnotationForArray(
        name,
        typeAnnotation.typeAnnotation.elementType,
        defaultValue,
        types,
        parser,
        buildSchema,
      ),
    };
  }

  // Covers: T[]
  if (typeAnnotation.type === 'TSArrayType') {
    return {
      type: 'ArrayTypeAnnotation',
      elementType: getTypeAnnotationForArray(
        name,
        typeAnnotation.elementType,
        defaultValue,
        types,
        parser,
        buildSchema,
      ),
    };
  }

  // Covers: Array<T> and ReadonlyArray<T>
  if (
    typeAnnotation.type === 'TSTypeReference' &&
    (parser.getTypeAnnotationName(typeAnnotation) === 'ReadonlyArray' ||
      parser.getTypeAnnotationName(typeAnnotation) === 'Array')
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

  return null;
}

function buildObjectType<T>(
  rawProperties: Array<$FlowFixMe>,
  types: TypeDeclarationMap,
  parser: Parser,
  buildSchema: BuildSchemaFN<T>,
): $FlowFixMe {
  const flattenedProperties = flattenProperties(rawProperties, types, parser);
  const properties = flattenedProperties
    .map(prop => buildSchema(prop, types, parser))
    .filter(Boolean);

  return {
    type: 'ObjectTypeAnnotation',
    properties,
  };
}

function getPrimitiveTypeAnnotation(type: string): $FlowFixMe {
  switch (type) {
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
    case 'TSBooleanKeyword':
      return {
        type: 'BooleanTypeAnnotation',
      };
    case 'Stringish':
    case 'TSStringKeyword':
      return {
        type: 'StringTypeAnnotation',
      };
    default:
      throw new Error(`Unknown primitive type "${type}"`);
  }
}

function getCommonTypeAnnotation<T>(
  name: string,
  forArray: boolean,
  type: string,
  typeAnnotation: $FlowFixMe,
  defaultValue: $FlowFixMe | void,
  types: TypeDeclarationMap,
  parser: Parser,
  buildSchema: BuildSchemaFN<T>,
): $FlowFixMe {
  switch (type) {
    case 'TSTypeLiteral':
      return buildObjectType(
        typeAnnotation.members,
        types,
        parser,
        buildSchema,
      );
    case 'TSInterfaceDeclaration':
      return buildObjectType([typeAnnotation], types, parser, buildSchema);
    case 'TSIntersectionType':
      return buildObjectType(
        flattenIntersectionType(typeAnnotation, parser, types),
        types,
        parser,
        buildSchema,
      );
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
    case 'TSUnionType':
      return getUnionOfLiterals(
        name,
        forArray,
        typeAnnotation.types,
        defaultValue,
        types,
      );
    case 'Int32':
    case 'Double':
    case 'Float':
    case 'TSBooleanKeyword':
    case 'Stringish':
    case 'TSStringKeyword':
      return getPrimitiveTypeAnnotation(type);
    case 'UnsafeMixed':
      return {
        type: 'MixedTypeAnnotation',
      };
    default:
      return undefined;
  }
}

function getTypeAnnotationForArray<T>(
  name: string,
  typeAnnotation: $FlowFixMe,
  defaultValue: $FlowFixMe | void,
  types: TypeDeclarationMap,
  parser: Parser,
  buildSchema: BuildSchemaFN<T>,
): $FlowFixMe {
  // unpack WithDefault, (T) or T|U
  const topLevelType = parseTopLevelType(typeAnnotation, parser, types);
  if (topLevelType.defaultValue !== undefined) {
    throw new Error(
      'Nested optionals such as "ReadonlyArray<boolean | null | undefined>" are not supported, please declare optionals at the top level of value definitions as in "ReadonlyArray<boolean> | null | undefined"',
    );
  }
  if (topLevelType.optional) {
    throw new Error(
      'Nested optionals such as "ReadonlyArray<boolean | null | undefined>" are not supported, please declare optionals at the top level of value definitions as in "ReadonlyArray<boolean> | null | undefined"',
    );
  }

  const extractedTypeAnnotation = topLevelType.type;
  const arrayType = detectArrayType(
    name,
    extractedTypeAnnotation,
    defaultValue,
    types,
    parser,
    buildSchema,
  );
  if (arrayType) {
    if (arrayType.elementType.type !== 'ObjectTypeAnnotation') {
      throw new Error(
        `Only array of array of object is supported for "${name}".`,
      );
    }
    return arrayType;
  }

  const type =
    extractedTypeAnnotation.elementType === 'TSTypeReference'
      ? parser.getTypeAnnotationName(extractedTypeAnnotation.elementType)
      : extractedTypeAnnotation.elementType?.type ||
        parser.getTypeAnnotationName(extractedTypeAnnotation) ||
        extractedTypeAnnotation.type;

  const common = getCommonTypeAnnotation(
    name,
    true,
    type,
    extractedTypeAnnotation,
    defaultValue,
    types,
    parser,
    buildSchema,
  );
  if (common) {
    return common;
  }

  switch (type) {
    case 'TSNumberKeyword':
      return {
        type: 'FloatTypeAnnotation',
      };
    default:
      (type) as unknown;
      throw new Error(`Unknown prop type for "${name}": ${type}`);
  }
}

function setDefaultValue(
  common: $FlowFixMe,
  defaultValue: $FlowFixMe | void,
): void {
  switch (common.type) {
    case 'Int32TypeAnnotation':
    case 'DoubleTypeAnnotation':
      common.default = (defaultValue ? defaultValue : 0) as number;
      break;
    case 'FloatTypeAnnotation':
      common.default =
        /* $FlowFixMe[invalid-compare] Error discovered during Constant Condition
         * roll out. See https://fburl.com/workplace/5whu3i34. */
        (defaultValue === null ? null : defaultValue ? defaultValue : 0) as
          | number
          | null;
      break;
    case 'BooleanTypeAnnotation':
      /* $FlowFixMe[invalid-compare] Error discovered during Constant Condition
       * roll out. See https://fburl.com/workplace/5whu3i34. */
      common.default = defaultValue === null ? null : !!defaultValue;
      break;
    case 'StringTypeAnnotation':
      common.default = (defaultValue === undefined ? null : defaultValue) as
        | string
        | null;
      break;
  }
}

function getTypeAnnotation<T>(
  name: string,
  annotation: $FlowFixMe | ASTNode,
  defaultValue: $FlowFixMe | void,
  withNullDefault: boolean, // Just to make `getTypeAnnotation` signature match with the one from Flow
  types: TypeDeclarationMap,
  parser: Parser,
  buildSchema: BuildSchemaFN<T>,
): $FlowFixMe {
  // unpack WithDefault, (T) or T|U
  const topLevelType = parseTopLevelType(annotation, parser, types);
  const typeAnnotation = topLevelType.type;
  const arrayType = detectArrayType(
    name,
    typeAnnotation,
    defaultValue,
    types,
    parser,
    buildSchema,
  );
  if (arrayType) {
    return arrayType;
  }

  const type =
    typeAnnotation.type === 'TSTypeReference' ||
    typeAnnotation.type === 'TSTypeAliasDeclaration'
      ? parser.getTypeAnnotationName(typeAnnotation)
      : typeAnnotation.type;

  const common = getCommonTypeAnnotation(
    name,
    false,
    type,
    typeAnnotation,
    defaultValue,
    types,
    parser,
    buildSchema,
  );
  if (common) {
    setDefaultValue(common, defaultValue);
    return common;
  }

  switch (type) {
    case 'ColorArrayValue':
      return {
        type: 'ArrayTypeAnnotation',
        elementType: {
          type: 'ReservedPropTypeAnnotation',
          name: 'ColorPrimitive',
        },
      };
    case 'TSNumberKeyword':
      throw new Error(
        `Cannot use "${type}" type annotation for "${name}": must use a specific numeric type like Int32, Double, or Float`,
      );
    case 'TSFunctionType':
      throw new Error(
        `Cannot use "${type}" type annotation for "${name}": must use a specific function type like BubblingEventHandler, or DirectEventHandler`,
      );
    default:
      throw new Error(`Unknown prop type for "${name}": "${type}"`);
  }
}

type SchemaInfo = {
  name: string,
  optional: boolean,
  typeAnnotation: $FlowFixMe,
  defaultValue: $FlowFixMe,
  withNullDefault: boolean, // Just to make `getTypeAnnotation` signature match with the one from Flow
};

function getSchemaInfo(
  property: PropAST,
  types: TypeDeclarationMap,
  parser: Parser,
): SchemaInfo {
  // unpack WithDefault, (T) or T|U
  const topLevelType = parseTopLevelType(
    property.typeAnnotation.typeAnnotation,
    parser,
    types,
  );

  const name = property.key.name;

  if (!property.optional && topLevelType.defaultValue !== undefined) {
    throw new Error(
      `key ${name} must be optional if used with WithDefault<> annotation`,
    );
  }

  return {
    name,
    optional: property.optional || topLevelType.optional,
    typeAnnotation: topLevelType.type,
    defaultValue: topLevelType.defaultValue,
    withNullDefault: false, // Just to make `getTypeAnnotation` signature match with the one from Flow
  };
}

function flattenProperties(
  typeDefinition: ReadonlyArray<PropAST>,
  types: TypeDeclarationMap,
  parser: Parser,
): ReadonlyArray<PropAST> {
  return typeDefinition
    .map(property => {
      if (property.type === 'TSPropertySignature') {
        return property;
      } else if (property.type === 'TSTypeReference') {
        return flattenProperties(
          parser.getProperties(property.typeName.name, types),
          types,
          parser,
        );
      } else if (
        property.type === 'TSExpressionWithTypeArguments' ||
        property.type === 'TSInterfaceHeritage'
      ) {
        return flattenProperties(
          parser.getProperties(property.expression.name, types),
          types,
          parser,
        );
      } else if (property.type === 'TSTypeLiteral') {
        return flattenProperties(property.members, types, parser);
      } else if (property.type === 'TSInterfaceDeclaration') {
        return flattenProperties(
          parser.getProperties(property.id.name, types),
          types,
          parser,
        );
      } else if (property.type === 'TSIntersectionType') {
        return flattenProperties(property.types, types, parser);
      } else {
        throw new Error(
          `${property.type} is not a supported object literal type.`,
        );
      }
    })
    .filter(Boolean)
    .reduce((acc: Array<PropAST>, item) => {
      if (Array.isArray(item)) {
        item.forEach((prop: PropAST) => {
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

module.exports = {
  getSchemaInfo,
  getTypeAnnotation,
  getPrimitiveTypeAnnotation,
  flattenProperties,
};

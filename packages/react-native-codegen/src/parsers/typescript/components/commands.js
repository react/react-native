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

import type {
  CommandParamTypeAnnotation,
  CommandTypeAnnotation,
  ComponentCommandArrayTypeAnnotation,
  NamedShape,
} from '../../../CodegenSchema.js';
import type {Parser} from '../../parser';
import type {TypeDeclarationMap} from '../../utils';

const {parseTopLevelType} = require('../parseTopLevelType');
const {getPrimitiveTypeAnnotation} = require('./componentsUtils');

// $FlowFixMe[unclear-type] there's no flowtype for ASTs
type EventTypeAST = Object;

function buildCommandSchemaInternal(
  name: string,
  optional: boolean,
  parameters: Array<$FlowFixMe>,
  types: TypeDeclarationMap,
  parser: Parser,
): NamedShape<CommandTypeAnnotation> {
  const firstParam = parameters[0].typeAnnotation;
  if (
    !(
      firstParam.typeAnnotation != null &&
      firstParam.typeAnnotation.type === 'TSTypeReference' &&
      firstParam.typeAnnotation.typeName.left?.name === 'React' &&
      (firstParam.typeAnnotation.typeName.right?.name === 'ElementRef' ||
        firstParam.typeAnnotation.typeName.right?.name === 'ComponentRef')
    )
  ) {
    throw new Error(
      `The first argument of method ${name} must be of type React.ElementRef<> or React.ComponentRef<>`,
    );
  }

  const params = parameters.slice(1).map(param => {
    const paramName = param.name;
    const paramValue = parseTopLevelType(
      param.typeAnnotation.typeAnnotation,
      parser,
      types,
    ).type;

    const type =
      paramValue.type === 'TSTypeReference'
        ? parser.getTypeAnnotationName(paramValue)
        : paramValue.type;
    let returnType: CommandParamTypeAnnotation;

    switch (type) {
      case 'RootTag':
        returnType = {
          type: 'ReservedTypeAnnotation',
          name: 'RootTag',
        };
        break;
      case 'TSBooleanKeyword':
      case 'Int32':
      case 'Double':
      case 'Float':
      case 'TSStringKeyword':
        returnType = getPrimitiveTypeAnnotation(type);
        break;
      case 'Array':
      case 'ReadOnlyArray':
        /* $FlowFixMe[invalid-compare] Error discovered during Constant
         * Condition roll out. See https://fburl.com/workplace/4oq3zi07. */
        if (!paramValue.type === 'TSTypeReference') {
          throw new Error(
            'Array and ReadOnlyArray are TSTypeReference for array',
          );
        }
        returnType = {
          type: 'ArrayTypeAnnotation',
          elementType: getCommandArrayElementTypeType(
            paramValue.typeParameters.params[0],
            parser,
          ),
        };
        break;
      case 'TSArrayType':
        returnType = {
          type: 'ArrayTypeAnnotation',
          elementType: getCommandArrayElementTypeType(
            paramValue.elementType,
            parser,
          ),
        };
        break;
      default:
        (type) as unknown;
        throw new Error(
          `Unsupported param type for method "${name}", param "${paramName}". Found ${type}`,
        );
    }

    return {
      name: paramName,
      optional: false,
      typeAnnotation: returnType,
    };
  });

  return {
    name,
    optional,
    typeAnnotation: {
      type: 'FunctionTypeAnnotation',
      params,
      returnTypeAnnotation: {
        type: 'VoidTypeAnnotation',
      },
    },
  };
}

function getCommandArrayElementTypeType(
  inputType: unknown,
  parser: Parser,
): ComponentCommandArrayTypeAnnotation['elementType'] {
  // TODO: T172453752 support more complex type annotation for array element

  if (inputType == null || typeof inputType !== 'object') {
    throw new Error(`Expected an object, received ${typeof inputType}`);
  }

  const type = inputType.type;
  if (typeof type !== 'string') {
    throw new Error('Command array element type must be a string');
  }

  // This is not a great solution. This generally means its a type alias to another type
  // like an object or union. Ideally we'd encode that in the schema so the compat-check can
  // validate those deeper objects for breaking changes and the generators can do something smarter.
  // As of now, the generators just create ReadableMap or (const NSArray *) which are untyped
  if (type === 'TSTypeReference') {
    const name =
      typeof inputType.typeName === 'object'
        ? parser.getTypeAnnotationName(inputType)
        : null;

    if (typeof name !== 'string') {
      throw new Error('Expected TSTypeReference AST name to be a string');
    }

    try {
      return getPrimitiveTypeAnnotation(name);
    } catch (e) {
      return {
        type: 'MixedTypeAnnotation',
      };
    }
  }

  return getPrimitiveTypeAnnotation(type);
}

function buildCommandSchema(
  property: EventTypeAST,
  types: TypeDeclarationMap,
  parser: Parser,
): NamedShape<CommandTypeAnnotation> {
  if (property.type === 'TSPropertySignature') {
    const topLevelType = parseTopLevelType(
      property.typeAnnotation.typeAnnotation,
      parser,
      types,
    );
    const name = property.key.name;
    const optional = property.optional || topLevelType.optional;
    const parameters = topLevelType.type.parameters || topLevelType.type.params;
    return buildCommandSchemaInternal(
      name,
      optional,
      parameters,
      types,
      parser,
    );
  } else {
    const name = property.key.name;
    const optional = property.optional || false;
    const parameters = property.parameters || property.params;
    return buildCommandSchemaInternal(
      name,
      optional,
      parameters,
      types,
      parser,
    );
  }
}

function getCommands(
  commandTypeAST: ReadonlyArray<EventTypeAST>,
  types: TypeDeclarationMap,
  parser: Parser,
): ReadonlyArray<NamedShape<CommandTypeAnnotation>> {
  return commandTypeAST
    .filter(
      property =>
        property.type === 'TSPropertySignature' ||
        property.type === 'TSMethodSignature',
    )
    .map(property => buildCommandSchema(property, types, parser))
    .filter(Boolean);
}

module.exports = {
  getCommands,
};

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

const {getValueFromTypes} = require('../utils.js');

// $FlowFixMe[unclear-type] there's no flowtype for ASTs
type EventTypeAST = Object;

function buildCommandSchema(
  property: EventTypeAST,
  types: TypeDeclarationMap,
  parser: Parser,
): Readonly<{
  name: string,
  optional: boolean,
  typeAnnotation: {
    type: 'FunctionTypeAnnotation',
    params: ReadonlyArray<{
      name: string,
      optional: boolean,
      typeAnnotation: CommandParamTypeAnnotation,
    }>,
    returnTypeAnnotation: {
      type: 'VoidTypeAnnotation',
    },
  },
}> {
  const name = property.key.name;
  const optional = property.optional;
  const value = getValueFromTypes(property.value, types);

  const firstParam = value.params[0].typeAnnotation;

  if (
    !(
      firstParam.id != null &&
      firstParam.id.type === 'QualifiedTypeIdentifier' &&
      firstParam.id.qualification.name === 'React' &&
      firstParam.id.id.name === 'ElementRef'
    )
  ) {
    throw new Error(
      `The first argument of method ${name} must be of type React.ElementRef<>`,
    );
  }

  const params = value.params.slice(1).map(param => {
    const paramName = param.name.name;
    const paramValue = getValueFromTypes(param.typeAnnotation, types);
    const type =
      paramValue.type === 'GenericTypeAnnotation'
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
      case 'BooleanTypeAnnotation':
        returnType = {
          type: 'BooleanTypeAnnotation',
        };
        break;
      case 'Int32':
        returnType = {
          type: 'Int32TypeAnnotation',
        };
        break;
      case 'Double':
        returnType = {
          type: 'DoubleTypeAnnotation',
        };
        break;
      case 'Float':
        returnType = {
          type: 'FloatTypeAnnotation',
        };
        break;
      case 'StringTypeAnnotation':
        returnType = {
          type: 'StringTypeAnnotation',
        };
        break;
      case 'Array':
      case '$ReadOnlyArray':
      case 'ReadonlyArray':
        /* $FlowFixMe[invalid-compare] Error discovered during Constant
         * Condition roll out. See https://fburl.com/workplace/4oq3zi07. */
        if (!paramValue.type === 'GenericTypeAnnotation') {
          throw new Error(
            'Array, $ReadOnlyArray and ReadonlyArray are GenericTypeAnnotation for array',
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
      case 'ArrayTypeAnnotation':
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

type Allowed = ComponentCommandArrayTypeAnnotation['elementType'];

function getCommandArrayElementTypeType(
  inputType: unknown,
  parser: Parser,
): Allowed {
  // TODO: T172453752 support more complex type annotation for array element
  if (typeof inputType !== 'object') {
    throw new Error('Expected an object');
  }

  const type = inputType?.type;

  if (inputType == null || typeof type !== 'string') {
    throw new Error('Command array element type must be a string');
  }

  switch (type) {
    case 'BooleanTypeAnnotation':
      return {
        type: 'BooleanTypeAnnotation',
      };
    case 'StringTypeAnnotation':
      return {
        type: 'StringTypeAnnotation',
      };
    case 'GenericTypeAnnotation':
      const name =
        typeof inputType.id === 'object'
          ? parser.getTypeAnnotationName(inputType)
          : null;

      if (typeof name !== 'string') {
        throw new Error(
          'Expected GenericTypeAnnotation AST name to be a string',
        );
      }

      switch (name) {
        case 'Int32':
          return {
            type: 'Int32TypeAnnotation',
          };
        case 'Float':
          return {
            type: 'FloatTypeAnnotation',
          };
        case 'Double':
          return {
            type: 'DoubleTypeAnnotation',
          };
        default:
          // This is not a great solution. This generally means its a type alias to another type
          // like an object or union. Ideally we'd encode that in the schema so the compat-check can
          // validate those deeper objects for breaking changes and the generators can do something smarter.
          // As of now, the generators just create ReadableMap or (const NSArray *) which are untyped
          return {
            type: 'MixedTypeAnnotation',
          };
      }

    default:
      throw new Error(`Unsupported array element type ${type}`);
  }
}

function getCommands(
  commandTypeAST: ReadonlyArray<EventTypeAST>,
  types: TypeDeclarationMap,
  parser: Parser,
): ReadonlyArray<NamedShape<CommandTypeAnnotation>> {
  return commandTypeAST
    .filter(property => property.type === 'ObjectTypeProperty')
    .map(property => buildCommandSchema(property, types, parser))
    .filter(Boolean);
}

module.exports = {
  getCommands,
};

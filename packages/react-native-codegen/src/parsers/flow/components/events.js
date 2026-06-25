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
  EventTypeAnnotation,
  EventTypeShape,
  NamedShape,
} from '../../../CodegenSchema.js';
import type {Parser} from '../../parser';
import type {EventArgumentReturnType} from '../../parsers-commons';

const {
  throwIfArgumentPropsAreNull,
  throwIfBubblingTypeIsNull,
  throwIfEventHasNoName,
} = require('../../error-utils');
const {
  buildPropertiesForEvent,
  emitBuildEventSchema,
  getEventArgument,
  handleEventHandler,
} = require('../../parsers-commons');
const {
  emitBoolProp,
  emitDoubleProp,
  emitFloatProp,
  emitInt32Prop,
  emitMixedProp,
  emitObjectProp,
  emitStringProp,
  emitUnionProp,
} = require('../../parsers-primitives');

function getPropertyType(
  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  name: string,
  optional: boolean,
  typeAnnotation: $FlowFixMe,
  parser: Parser,
): NamedShape<EventTypeAnnotation> {
  const type = extractTypeFromTypeAnnotation(typeAnnotation, parser);

  switch (type) {
    case 'BooleanTypeAnnotation':
      return emitBoolProp(name, optional);
    case 'StringTypeAnnotation':
      return emitStringProp(name, optional);
    case 'Int32':
      return emitInt32Prop(name, optional);
    case 'Double':
      return emitDoubleProp(name, optional);
    case 'Float':
      return emitFloatProp(name, optional);
    case '$ReadOnly':
    case 'Readonly':
      return getPropertyType(
        name,
        optional,
        typeAnnotation.typeParameters.params[0],
        parser,
      );
    case 'ObjectTypeAnnotation':
      return emitObjectProp(
        name,
        optional,
        parser,
        typeAnnotation,
        extractArrayElementType,
      );
    case 'UnionTypeAnnotation':
      return emitUnionProp(name, optional, parser, typeAnnotation);
    case 'UnsafeMixed':
      return emitMixedProp(name, optional);
    case 'ArrayTypeAnnotation':
    case '$ReadOnlyArray':
    case 'ReadonlyArray':
      return {
        name,
        optional,
        typeAnnotation: extractArrayElementType(typeAnnotation, name, parser),
      };
    default:
      throw new Error(`Unable to determine event type for "${name}": ${type}`);
  }
}

function extractArrayElementType(
  typeAnnotation: $FlowFixMe,
  name: string,
  parser: Parser,
): EventTypeAnnotation {
  const type = extractTypeFromTypeAnnotation(typeAnnotation, parser);

  switch (type) {
    case 'BooleanTypeAnnotation':
      return {type: 'BooleanTypeAnnotation'};
    case 'StringTypeAnnotation':
      return {type: 'StringTypeAnnotation'};
    case 'Int32':
      return {type: 'Int32TypeAnnotation'};
    case 'Float':
      return {type: 'FloatTypeAnnotation'};
    case 'NumberTypeAnnotation':
    case 'Double':
      return {
        type: 'DoubleTypeAnnotation',
      };
    case 'UnionTypeAnnotation':
      return {
        type: 'UnionTypeAnnotation',
        types: typeAnnotation.types.map(option => ({
          type: 'StringLiteralTypeAnnotation',
          value: parser.getLiteralValue(option),
        })),
      };
    case 'UnsafeMixed':
      return {type: 'MixedTypeAnnotation'};
    case 'ObjectTypeAnnotation':
      return {
        type: 'ObjectTypeAnnotation',
        properties: parser
          .getObjectProperties(typeAnnotation)
          .map(member =>
            buildPropertiesForEvent(member, parser, getPropertyType),
          ),
      };
    case 'ArrayTypeAnnotation':
      return {
        type: 'ArrayTypeAnnotation',
        elementType: extractArrayElementType(
          typeAnnotation.elementType,
          name,
          parser,
        ),
      };
    case '$ReadOnlyArray':
    case 'ReadonlyArray':
      const genericParams = typeAnnotation.typeParameters.params;
      if (genericParams.length !== 1) {
        throw new Error(
          `Events only supports arrays with 1 Generic type. Found ${
            genericParams.length
          } types:\n${prettify(genericParams)}`,
        );
      }
      return {
        type: 'ArrayTypeAnnotation',
        elementType: extractArrayElementType(genericParams[0], name, parser),
      };
    default:
      throw new Error(
        `Unrecognized ${type} for Array ${name} in events.\n${prettify(
          typeAnnotation,
        )}`,
      );
  }
}

function prettify(jsonObject: $FlowFixMe): string {
  return JSON.stringify(jsonObject, null, 2);
}

function extractTypeFromTypeAnnotation(
  typeAnnotation: $FlowFixMe,
  parser: Parser,
): string {
  return typeAnnotation.type === 'GenericTypeAnnotation'
    ? parser.getTypeAnnotationName(typeAnnotation)
    : typeAnnotation.type;
}

function findEventArgumentsAndType(
  parser: Parser,
  typeAnnotation: $FlowFixMe,
  types: TypeMap,
  bubblingType: void | 'direct' | 'bubble',
  paperName: ?$FlowFixMe,
): EventArgumentReturnType {
  throwIfEventHasNoName(typeAnnotation, parser);
  const name = parser.getTypeAnnotationName(typeAnnotation);
  if (name === '$ReadOnly' || name === 'Readonly') {
    return {
      argumentProps: typeAnnotation.typeParameters.params[0].properties,
      paperTopLevelNameDeprecated: paperName,
      bubblingType,
    };
  } else if (name === 'BubblingEventHandler' || name === 'DirectEventHandler') {
    return handleEventHandler(
      name,
      typeAnnotation,
      parser,
      types,
      findEventArgumentsAndType,
    );
  } else if (types[name]) {
    return findEventArgumentsAndType(
      parser,
      types[name].right,
      types,
      bubblingType,
      paperName,
    );
  } else {
    return {
      argumentProps: null,
      bubblingType: null,
      paperTopLevelNameDeprecated: null,
    };
  }
}

function buildEventSchema(
  types: TypeMap,
  property: EventTypeAST,
  parser: Parser,
): ?EventTypeShape {
  const name = property.key.name;
  const optional =
    property.optional || property.value.type === 'NullableTypeAnnotation';

  let typeAnnotation =
    property.value.type === 'NullableTypeAnnotation'
      ? property.value.typeAnnotation
      : property.value;

  if (
    typeAnnotation.type !== 'GenericTypeAnnotation' ||
    (parser.getTypeAnnotationName(typeAnnotation) !== 'BubblingEventHandler' &&
      parser.getTypeAnnotationName(typeAnnotation) !== 'DirectEventHandler')
  ) {
    return null;
  }

  const {argumentProps, bubblingType, paperTopLevelNameDeprecated} =
    findEventArgumentsAndType(parser, typeAnnotation, types);

  const nonNullableArgumentProps = throwIfArgumentPropsAreNull(
    argumentProps,
    name,
  );
  const nonNullableBubblingType = throwIfBubblingTypeIsNull(bubblingType, name);

  const argument = getEventArgument(
    nonNullableArgumentProps,
    parser,
    getPropertyType,
  );

  return emitBuildEventSchema(
    paperTopLevelNameDeprecated,
    name,
    optional,
    nonNullableBubblingType,
    argument,
  );
}

// $FlowFixMe[unclear-type] there's no flowtype for ASTs
type EventTypeAST = Object;

type TypeMap = {
  // $FlowFixMe[unclear-type] there's no flowtype for ASTs
  [string]: Object,
  ...
};

function getEvents(
  eventTypeAST: ReadonlyArray<EventTypeAST>,
  types: TypeMap,
  parser: Parser,
): ReadonlyArray<EventTypeShape> {
  return eventTypeAST
    .filter(property => property.type === 'ObjectTypeProperty')
    .map(property => buildEventSchema(types, property, parser))
    .filter(Boolean);
}

module.exports = {
  getEvents,
  extractArrayElementType,
};

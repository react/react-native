/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {NativeModuleEventEmitterShape} from '../../../CodegenSchema';

const {parseValidUnionType, toPascalCase} = require('../../Utils');

function getEventEmitterTypeObjCType(
  eventEmitter: NativeModuleEventEmitterShape,
): string {
  const typeAnnotation = eventEmitter.typeAnnotation.typeAnnotation;

  switch (typeAnnotation.type) {
    case 'StringTypeAnnotation':
      return 'NSString *_Nonnull';
    case 'StringLiteralTypeAnnotation':
      return 'NSString *_Nonnull';
    case 'UnionTypeAnnotation':
      const validUnionType = parseValidUnionType(typeAnnotation);
      switch (validUnionType) {
        case 'boolean':
          return 'BOOL';
        case 'number':
          return 'NSNumber *_Nonnull';
        case 'object':
          return 'NSDictionary *';
        case 'string':
          return 'NSString *_Nonnull';
        default:
          validUnionType as empty;
          throw new Error(`Unsupported union member type`);
      }
    case 'NumberTypeAnnotation':
    case 'NumberLiteralTypeAnnotation':
      return 'NSNumber *_Nonnull';
    case 'BooleanTypeAnnotation':
    case 'BooleanLiteralTypeAnnotation':
      return 'BOOL';
    case 'GenericObjectTypeAnnotation':
    case 'ObjectTypeAnnotation':
    case 'TypeAliasTypeAnnotation':
      return 'NSDictionary *';
    case 'ArrayTypeAnnotation':
      return 'NSArray<id<NSObject>> *';
    case 'DoubleTypeAnnotation':
    case 'FloatTypeAnnotation':
    case 'Int32TypeAnnotation':
    case 'VoidTypeAnnotation':
      // TODO: Add support for these types
      throw new Error(
        `Unsupported eventType for ${eventEmitter.name}. Found: ${eventEmitter.typeAnnotation.typeAnnotation.type}`,
      );
    default:
      typeAnnotation.type as empty;
      throw new Error(
        `Unsupported eventType for ${eventEmitter.name}. Found: ${eventEmitter.typeAnnotation.typeAnnotation.type}`,
      );
  }
}

function EventEmitterHeaderTemplate(
  eventEmitter: NativeModuleEventEmitterShape,
): string {
  return `- (void)emit${toPascalCase(eventEmitter.name)}${
    eventEmitter.typeAnnotation.typeAnnotation.type !== 'VoidTypeAnnotation'
      ? `:(${getEventEmitterTypeObjCType(eventEmitter)})value`
      : ''
  };`;
}

function EventEmitterImplementationTemplate(
  eventEmitter: NativeModuleEventEmitterShape,
): string {
  return `- (void)emit${toPascalCase(eventEmitter.name)}${
    eventEmitter.typeAnnotation.typeAnnotation.type !== 'VoidTypeAnnotation'
      ? `:(${getEventEmitterTypeObjCType(eventEmitter)})value`
      : ''
  }
{
  _eventEmitterCallback("${eventEmitter.name}", ${
    eventEmitter.typeAnnotation.typeAnnotation.type !== 'VoidTypeAnnotation'
      ? eventEmitter.typeAnnotation.typeAnnotation.type !==
        'BooleanTypeAnnotation'
        ? 'value'
        : '[NSNumber numberWithBool:value]'
      : 'nil'
  });
}`;
}

module.exports = {
  EventEmitterHeaderTemplate,
  EventEmitterImplementationTemplate,
};

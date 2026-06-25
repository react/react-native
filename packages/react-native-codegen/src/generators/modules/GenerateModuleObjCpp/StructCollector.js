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
  BooleanLiteralTypeAnnotation,
  BooleanTypeAnnotation,
  DoubleTypeAnnotation,
  FloatTypeAnnotation,
  Int32TypeAnnotation,
  NativeModuleArrayTypeAnnotation,
  NativeModuleBaseTypeAnnotation,
  NativeModuleEnumDeclaration,
  NativeModuleGenericObjectTypeAnnotation,
  NativeModuleNumberTypeAnnotation,
  NativeModuleObjectTypeAnnotation,
  NativeModuleTypeAliasTypeAnnotation,
  NativeModuleUnionTypeAnnotation,
  Nullable,
  NumberLiteralTypeAnnotation,
  ReservedTypeAnnotation,
  StringLiteralTypeAnnotation,
  StringTypeAnnotation,
} from '../../../CodegenSchema';
import type {AliasResolver} from '../Utils';

const {
  unwrapNullable,
  wrapNullable,
} = require('../../../parsers/parsers-commons');
const {
  HeterogeneousUnionError,
  capitalize,
  parseValidUnionType,
} = require('../../Utils');

export type StructContext = 'CONSTANTS' | 'REGULAR';

export type RegularStruct = Readonly<{
  context: 'REGULAR',
  name: string,
  properties: ReadonlyArray<StructProperty>,
}>;

export type ConstantsStruct = Readonly<{
  context: 'CONSTANTS',
  name: string,
  properties: ReadonlyArray<StructProperty>,
}>;

export type Struct = RegularStruct | ConstantsStruct;

export type StructProperty = Readonly<{
  name: string,
  optional: boolean,
  typeAnnotation: Nullable<StructTypeAnnotation>,
}>;

export type StructTypeAnnotation =
  | StringTypeAnnotation
  | StringLiteralTypeAnnotation
  | NativeModuleUnionTypeAnnotation
  | NativeModuleNumberTypeAnnotation
  | NumberLiteralTypeAnnotation
  | BooleanLiteralTypeAnnotation
  | Int32TypeAnnotation
  | DoubleTypeAnnotation
  | FloatTypeAnnotation
  | BooleanTypeAnnotation
  | NativeModuleEnumDeclaration
  | NativeModuleGenericObjectTypeAnnotation
  | ReservedTypeAnnotation
  | NativeModuleTypeAliasTypeAnnotation
  | NativeModuleArrayTypeAnnotation<Nullable<StructTypeAnnotation>>;

class StructCollector {
  _structs: Map<string, Struct> = new Map();

  process(
    structName: string,
    structContext: StructContext,
    resolveAlias: AliasResolver,
    nullableTypeAnnotation: Nullable<NativeModuleBaseTypeAnnotation>,
  ): Nullable<StructTypeAnnotation> {
    const [typeAnnotation, nullable] = unwrapNullable(nullableTypeAnnotation);
    switch (typeAnnotation.type) {
      case 'ObjectTypeAnnotation': {
        this._insertStruct(
          structName,
          structContext,
          resolveAlias,
          typeAnnotation,
        );
        return wrapNullable(nullable, {
          type: 'TypeAliasTypeAnnotation',
          name: structName,
        });
      }
      case 'ArrayTypeAnnotation': {
        if (typeAnnotation.elementType.type === 'AnyTypeAnnotation') {
          return wrapNullable(nullable, {
            type: 'ArrayTypeAnnotation',
            elementType: {
              type: 'AnyTypeAnnotation',
            },
          });
        }

        return wrapNullable(nullable, {
          type: 'ArrayTypeAnnotation',
          elementType: this.process(
            structName + 'Element',
            structContext,
            resolveAlias,
            typeAnnotation.elementType,
          ),
        });
      }
      case 'TypeAliasTypeAnnotation': {
        this._insertAlias(typeAnnotation.name, structContext, resolveAlias);
        return wrapNullable(nullable, typeAnnotation);
      }
      case 'EnumDeclaration':
        return wrapNullable(nullable, typeAnnotation);
      case 'MixedTypeAnnotation':
        throw new Error('Mixed types are unsupported in structs');
      case 'ArrayBufferTypeAnnotation':
        throw new Error(
          'ArrayBuffer is unsupported in TurboModule struct types.',
        );
      case 'UnionTypeAnnotation':
        try {
          const validUnionType = parseValidUnionType(typeAnnotation);
          switch (validUnionType) {
            case 'boolean':
              return wrapNullable(nullable, {
                type: 'BooleanTypeAnnotation',
              });
            case 'number':
              return wrapNullable(nullable, {
                type: 'NumberTypeAnnotation',
              });
            case 'object':
              // This isn't smart enough to actually know how to generate the
              // options on the native side. So we just treat it as an unknown object type
              return wrapNullable(nullable, {
                type: 'GenericObjectTypeAnnotation',
              });
            case 'string':
              return wrapNullable(nullable, {
                type: 'StringTypeAnnotation',
              });
            default:
              validUnionType as empty;
              throw new Error(`Unsupported union member types`);
          }
        } catch (ex) {
          // TODO(T247151345): Implement proper heterogeneous union support.
          if (ex instanceof HeterogeneousUnionError) {
            return wrapNullable(nullable, typeAnnotation);
          }

          throw ex;
        }
      default: {
        return wrapNullable(nullable, typeAnnotation);
      }
    }
  }

  _insertAlias(
    aliasName: string,
    structContext: StructContext,
    resolveAlias: AliasResolver,
  ): void {
    const usedStruct = this._structs.get(aliasName);
    if (usedStruct == null) {
      this._insertStruct(
        aliasName,
        structContext,
        resolveAlias,
        resolveAlias(aliasName),
      );
    } else if (usedStruct.context !== structContext) {
      throw new Error(
        `Tried to use alias '${aliasName}' in a getConstants() return type and inside a regular struct.`,
      );
    }
  }

  _insertStruct(
    structName: string,
    structContext: StructContext,
    resolveAlias: AliasResolver,
    objectTypeAnnotation: NativeModuleObjectTypeAnnotation,
  ): void {
    // $FlowFixMe[missing-type-arg]
    const properties = objectTypeAnnotation.properties.map<
      Readonly<{
        name: string,
        optional: boolean,
        typeAnnotation: Nullable<StructTypeAnnotation>,
      }>,
    >(property => {
      const propertyStructName = structName + capitalize(property.name);

      return {
        ...property,
        typeAnnotation: this.process(
          propertyStructName,
          structContext,
          resolveAlias,
          property.typeAnnotation,
        ),
      };
    });

    switch (structContext) {
      case 'REGULAR':
        this._structs.set(structName, {
          name: structName,
          context: 'REGULAR',
          properties: properties,
        });
        break;
      case 'CONSTANTS':
        this._structs.set(structName, {
          name: structName,
          context: 'CONSTANTS',
          properties: properties,
        });
        break;
      default:
        structContext as empty;
        throw new Error(`Detected an invalid struct context: ${structContext}`);
    }
  }

  getAllStructs(): ReadonlyArray<Struct> {
    return [...this._structs.values()];
  }

  getStruct(name: string): ?Struct {
    return this._structs.get(name);
  }
}

module.exports = {
  StructCollector,
};

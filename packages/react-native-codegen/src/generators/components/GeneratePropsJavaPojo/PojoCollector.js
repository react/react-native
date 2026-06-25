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
  BooleanTypeAnnotation,
  ComponentArrayTypeAnnotation,
  DoubleTypeAnnotation,
  FloatTypeAnnotation,
  Int32TypeAnnotation,
  MixedTypeAnnotation,
  NamedShape,
  ObjectTypeAnnotation,
  PropTypeAnnotation,
  ReservedPropTypeAnnotation,
  StringTypeAnnotation,
} from '../../../CodegenSchema';

const {capitalize} = require('../../Utils');

export type Pojo = {
  name: string,
  namespace: string,
  properties: ReadonlyArray<PojoProperty>,
};

export type PojoProperty = NamedShape<PojoTypeAnnotation>;

export type PojoTypeAliasAnnotation = {
  type: 'PojoTypeAliasTypeAnnotation',
  name: string,
};

export type PojoTypeAnnotation =
  | Readonly<{
      type: 'BooleanTypeAnnotation',
      default: boolean | null,
    }>
  | Readonly<{
      type: 'StringTypeAnnotation',
      default: string | null,
    }>
  | Readonly<{
      type: 'DoubleTypeAnnotation',
      default: number,
    }>
  | Readonly<{
      type: 'FloatTypeAnnotation',
      default: number | null,
    }>
  | Readonly<{
      type: 'Int32TypeAnnotation',
      default: number,
    }>
  | Readonly<{
      type: 'StringEnumTypeAnnotation',
      default: string,
      options: ReadonlyArray<string>,
    }>
  | Readonly<{
      type: 'Int32EnumTypeAnnotation',
      default: number,
      options: ReadonlyArray<number>,
    }>
  | ReservedPropTypeAnnotation
  | PojoTypeAliasAnnotation
  | Readonly<{
      type: 'ArrayTypeAnnotation',
      elementType:
        | BooleanTypeAnnotation
        | StringTypeAnnotation
        | DoubleTypeAnnotation
        | FloatTypeAnnotation
        | Int32TypeAnnotation
        | MixedTypeAnnotation
        | Readonly<{
            type: 'StringEnumTypeAnnotation',
            default: string,
            options: ReadonlyArray<string>,
          }>
        | PojoTypeAliasAnnotation
        | ReservedPropTypeAnnotation
        | Readonly<{
            type: 'ArrayTypeAnnotation',
            elementType: PojoTypeAliasAnnotation,
          }>,
    }>
  | MixedTypeAnnotation;

class PojoCollector {
  _pojos: Map<string, Pojo> = new Map();
  process(
    namespace: string,
    pojoName: string,
    typeAnnotation: PropTypeAnnotation,
  ): PojoTypeAnnotation {
    switch (typeAnnotation.type) {
      case 'ObjectTypeAnnotation': {
        this._insertPojo(namespace, pojoName, typeAnnotation);
        return {
          type: 'PojoTypeAliasTypeAnnotation',
          name: pojoName,
        };
      }
      case 'ArrayTypeAnnotation': {
        const arrayTypeAnnotation = typeAnnotation;
        const elementType: ComponentArrayTypeAnnotation['elementType'] =
          arrayTypeAnnotation.elementType;

        const pojoElementType = (() => {
          switch (elementType.type) {
            case 'ObjectTypeAnnotation': {
              this._insertPojo(namespace, `${pojoName}Element`, elementType);
              return {
                type: 'PojoTypeAliasTypeAnnotation',
                name: `${pojoName}Element`,
              };
            }
            case 'ArrayTypeAnnotation': {
              const {elementType: objectTypeAnnotation} = elementType;
              this._insertPojo(
                namespace,
                `${pojoName}ElementElement`,
                objectTypeAnnotation,
              );
              return {
                type: 'ArrayTypeAnnotation',
                elementType: {
                  type: 'PojoTypeAliasTypeAnnotation',
                  name: `${pojoName}ElementElement`,
                },
              };
            }
            default: {
              return elementType;
            }
          }
        })();

        /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
         * https://fburl.com/workplace/6291gfvu */
        return {
          type: 'ArrayTypeAnnotation',
          elementType: pojoElementType,
        };
      }
      default:
        return typeAnnotation;
    }
  }

  _insertPojo(
    namespace: string,
    pojoName: string,
    objectTypeAnnotation: ObjectTypeAnnotation<PropTypeAnnotation>,
  ) {
    const properties = objectTypeAnnotation.properties.map(property => {
      const propertyPojoName = pojoName + capitalize(property.name);

      return {
        ...property,
        typeAnnotation: this.process(
          namespace,
          propertyPojoName,
          property.typeAnnotation,
        ),
      };
    });

    this._pojos.set(pojoName, {
      name: pojoName,
      namespace,
      properties,
    });
  }

  getAllPojos(): ReadonlyArray<Pojo> {
    return [...this._pojos.values()];
  }
}

module.exports = PojoCollector;

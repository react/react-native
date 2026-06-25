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
  NativeModuleAliasMap,
  NativeModuleObjectTypeAnnotation,
  NativeModuleSchema,
  NativeModuleTypeAnnotation,
  Nullable,
  SchemaType,
} from '../../CodegenSchema';

const {unwrapNullable} = require('../../parsers/parsers-commons');
const invariant = require('invariant');

export type AliasResolver = (
  aliasName: string,
) => NativeModuleObjectTypeAnnotation;

function createAliasResolver(aliasMap: NativeModuleAliasMap): AliasResolver {
  return (aliasName: string) => {
    const alias = aliasMap[aliasName];
    invariant(alias != null, `Unable to resolve type alias '${aliasName}'.`);
    return alias;
  };
}

function getModules(
  schema: SchemaType,
): Readonly<{[hasteModuleName: string]: NativeModuleSchema}> {
  return Object.keys(schema.modules).reduce<{[string]: NativeModuleSchema}>(
    (modules, hasteModuleName: string) => {
      const module = schema.modules[hasteModuleName];
      if (module == null || module.type === 'Component') {
        return modules;
      }
      modules[hasteModuleName] = module;
      return modules;
    },
    {},
  );
}

function isDirectRecursiveMember(
  parentObjectAliasName: ?string,
  nullableTypeAnnotation: Nullable<NativeModuleTypeAnnotation>,
): boolean {
  const [typeAnnotation] = unwrapNullable<NativeModuleTypeAnnotation>(
    nullableTypeAnnotation,
  );
  return (
    parentObjectAliasName !== undefined &&
    typeAnnotation.name === parentObjectAliasName
  );
}

function isArrayRecursiveMember(
  parentObjectAliasName: ?string,
  nullableTypeAnnotation: Nullable<NativeModuleTypeAnnotation>,
): boolean {
  const [typeAnnotation] = unwrapNullable<NativeModuleTypeAnnotation>(
    nullableTypeAnnotation,
  );
  return (
    parentObjectAliasName !== undefined &&
    typeAnnotation.type === 'ArrayTypeAnnotation' &&
    typeAnnotation.elementType?.name === parentObjectAliasName
  );
}

module.exports = {
  createAliasResolver,
  getModules,
  isDirectRecursiveMember,
  isArrayRecursiveMember,
};

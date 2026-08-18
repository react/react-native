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
  NativeModuleReturnTypeAnnotation,
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

// Platform-native (Java/Kotlin and ObjC) TurboModules copy ArrayBuffer
// arguments and return ArrayBuffers zero-copy from synchronous methods, but
// `Promise<ArrayBuffer>` is not part of their contract.
//
// On Android it cannot work: the resolve path serializes through
// folly::dynamic, which cannot carry raw bytes. On iOS the resolve path is a
// direct ObjC->jsi conversion that would in fact produce an ArrayBuffer for an
// NSMutableData, so the limitation there is not technical — the guard is
// applied to ObjC as well to keep one cross-platform contract, so a spec that
// compiles for iOS cannot fail to build for Android.
//
// Reject `Promise<ArrayBuffer>` at codegen time for both native platforms so
// the unsupported case surfaces as a build error rather than a runtime failure
// or a silent iOS/Android divergence.
function throwIfUnsupportedPromiseArrayBuffer(
  methodName: string,
  nullableReturnTypeAnnotation: Nullable<NativeModuleReturnTypeAnnotation>,
): void {
  const [returnTypeAnnotation] =
    unwrapNullable<NativeModuleReturnTypeAnnotation>(
      nullableReturnTypeAnnotation,
    );
  if (returnTypeAnnotation.type !== 'PromiseTypeAnnotation') {
    return;
  }
  let elementType = returnTypeAnnotation.elementType;
  if (elementType.type === 'NullableTypeAnnotation') {
    elementType = elementType.typeAnnotation;
  }
  if (elementType.type === 'ArrayBufferTypeAnnotation') {
    throw new Error(
      `Unsupported return type for method "${methodName}": Promise<ArrayBuffer> is not ` +
        'supported for Android (Java/Kotlin) or iOS (ObjC) TurboModules. Use a C++ ' +
        '(Cxx) TurboModule, return the ArrayBuffer from a synchronous method, or resolve ' +
        'the Promise with a different type. ArrayBuffer is still supported as a method ' +
        'argument and as a synchronous return value on all platforms.',
    );
  }
}

module.exports = {
  createAliasResolver,
  getModules,
  isDirectRecursiveMember,
  isArrayRecursiveMember,
  throwIfUnsupportedPromiseArrayBuffer,
};

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
  NamedShape,
  NativeModuleParamTypeAnnotation,
  NativeModulePropertyShape,
  NativeModuleReturnTypeAnnotation,
  Nullable,
} from '../../../CodegenSchema';
import type {AliasResolver} from '../Utils';
import type {StructCollector} from './StructCollector';

const {
  unwrapNullable,
  wrapNullable,
} = require('../../../parsers/parsers-commons');
const {wrapOptional} = require('../../TypeUtils/Objective-C');
const {capitalize, parseValidUnionType} = require('../../Utils');
const {getNamespacedStructName} = require('./Utils');
const invariant = require('invariant');

const ProtocolMethodTemplate = ({
  returnObjCType,
  methodName,
  params,
}: Readonly<{
  returnObjCType: string,
  methodName: string,
  params: string,
}>) => `- (${returnObjCType})${methodName}${params};`;

export type StructParameterRecord = Readonly<{
  paramIndex: number,
  structName: string,
}>;

type ReturnJSType =
  | 'VoidKind'
  | 'BooleanKind'
  | 'PromiseKind'
  | 'ObjectKind'
  | 'ArrayKind'
  | 'NumberKind'
  | 'StringKind'
  | 'ArrayBufferKind';

export type MethodSerializationOutput = Readonly<{
  methodName: string,
  protocolMethod: string,
  selector: string,
  structParamRecords: ReadonlyArray<StructParameterRecord>,
  returnJSType: ReturnJSType,
  argCount: number,
}>;

function serializeMethod(
  hasteModuleName: string,
  property: NativeModulePropertyShape,
  structCollector: StructCollector,
  resolveAlias: AliasResolver,
): ReadonlyArray<MethodSerializationOutput> {
  const {name: methodName, typeAnnotation: nullableTypeAnnotation} = property;
  const [propertyTypeAnnotation] = unwrapNullable(nullableTypeAnnotation);
  const {params} = propertyTypeAnnotation;

  if (methodName === 'getConstants') {
    return serializeConstantsProtocolMethods(
      hasteModuleName,
      property,
      structCollector,
      resolveAlias,
    );
  }

  const methodParams: Array<{paramName: string, objCType: string}> = [];
  const structParamRecords: Array<StructParameterRecord> = [];

  params.forEach((param, index) => {
    const structName = getParamStructName(methodName, param);
    const {objCType, isStruct} = getParamObjCType(
      hasteModuleName,
      methodName,
      param,
      structName,
      structCollector,
      resolveAlias,
    );

    methodParams.push({paramName: param.name, objCType});

    if (isStruct) {
      structParamRecords.push({paramIndex: index, structName});
    }
  });

  // Unwrap returnTypeAnnotation, so we check if the return type is Promise
  // TODO(T76719514): Disallow nullable PromiseTypeAnnotations
  const [returnTypeAnnotation] = unwrapNullable(
    propertyTypeAnnotation.returnTypeAnnotation,
  );

  if (returnTypeAnnotation.type === 'PromiseTypeAnnotation') {
    methodParams.push(
      {paramName: 'resolve', objCType: 'RCTPromiseResolveBlock'},
      {paramName: 'reject', objCType: 'RCTPromiseRejectBlock'},
    );
  }

  /**
   * Build Protocol Method
   **/
  const returnObjCType = getReturnObjCType(
    methodName,
    propertyTypeAnnotation.returnTypeAnnotation,
  );
  const paddingMax = `- (${returnObjCType})${methodName}`.length;

  const objCParams = methodParams.reduce(
    ($objCParams, {objCType, paramName}, i) => {
      const rhs = `(${objCType})${paramName}`;
      const padding = ' '.repeat(Math.max(0, paddingMax - paramName.length));
      return i === 0
        ? `:${rhs}`
        : `${$objCParams}\n${padding}${paramName}:${rhs}`;
    },
    '',
  );

  const protocolMethod = ProtocolMethodTemplate({
    methodName,
    returnObjCType,
    params: objCParams,
  });

  /**
   * Build ObjC Selector
   */
  // $FlowFixMe[missing-type-arg]
  const selector = methodParams
    .map<string>(({paramName}) => paramName)
    .reduce(($selector, paramName, i) => {
      return i === 0 ? `${$selector}:` : `${$selector}${paramName}:`;
    }, methodName);

  /**
   * Build JS Return type
   */
  const returnJSType = getReturnJSType(methodName, returnTypeAnnotation);

  return [
    {
      methodName,
      protocolMethod,
      selector: `@selector(${selector})`,
      structParamRecords,
      returnJSType,
      argCount: params.length,
    },
  ];
}

type Param = NamedShape<Nullable<NativeModuleParamTypeAnnotation>>;

function getParamStructName(methodName: string, param: Param): string {
  const [typeAnnotation] = unwrapNullable(param.typeAnnotation);
  if (typeAnnotation.type === 'TypeAliasTypeAnnotation') {
    return typeAnnotation.name;
  }

  return `Spec${capitalize(methodName)}${capitalize(param.name)}`;
}

function getParamObjCType(
  hasteModuleName: string,
  methodName: string,
  param: Param,
  structName: string,
  structCollector: StructCollector,
  resolveAlias: AliasResolver,
): Readonly<{objCType: string, isStruct: boolean}> {
  const {name: paramName, typeAnnotation: nullableTypeAnnotation} = param;
  const [typeAnnotation, nullable] = unwrapNullable(nullableTypeAnnotation);
  const isRequired = !param.optional && !nullable;

  const isStruct = (objCType: string) => ({
    isStruct: true,
    objCType,
  });

  const notStruct = (objCType: string) => ({
    isStruct: false,
    objCType,
  });

  // Handle types that can only be in parameters
  switch (typeAnnotation.type) {
    case 'FunctionTypeAnnotation': {
      return notStruct('RCTResponseSenderBlock');
    }
    case 'ArrayTypeAnnotation': {
      /**
       * Array in params always codegen NSArray *
       *
       * TODO(T73933406): Support codegen for Arrays of structs and primitives
       *
       * For example:
       *   Array<number> => NSArray<NSNumber *>
       *   type Animal = {};
       *   Array<Animal> => NSArray<JS::NativeSampleTurboModule::Animal *>, etc.
       */
      return notStruct(wrapOptional('NSArray *', !nullable));
    }
    case 'ArrayBufferTypeAnnotation': {
      return notStruct(wrapOptional('NSMutableData *', !nullable));
    }
  }

  const [structTypeAnnotation] = unwrapNullable(
    structCollector.process(
      structName,
      'REGULAR',
      resolveAlias,
      wrapNullable(nullable, typeAnnotation),
    ),
  );

  invariant(
    structTypeAnnotation.type !== 'ArrayTypeAnnotation',
    'ArrayTypeAnnotations should have been processed earlier',
  );

  switch (structTypeAnnotation.type) {
    case 'TypeAliasTypeAnnotation': {
      /**
       * TODO(T73943261): Support nullable object literals and aliases?
       */
      return isStruct(
        getNamespacedStructName(hasteModuleName, structTypeAnnotation.name) +
          ' &',
      );
    }
    case 'ReservedTypeAnnotation':
      switch (structTypeAnnotation.name) {
        case 'RootTag':
          return notStruct(isRequired ? 'double' : 'NSNumber *');
        default:
          structTypeAnnotation.name as empty;
          throw new Error(
            `Unsupported type for param "${paramName}" in ${methodName}. Found: ${structTypeAnnotation.type}`,
          );
      }
    case 'StringTypeAnnotation':
      return notStruct(wrapOptional('NSString *', !nullable));
    case 'StringLiteralTypeAnnotation':
      return notStruct(wrapOptional('NSString *', !nullable));
    case 'UnionTypeAnnotation':
      // TODO(T247151345): Implement proper heterogeneous union support. This is unsafe.
      return notStruct(wrapOptional('NSObject *', !nullable));
    case 'NumberTypeAnnotation':
      return notStruct(isRequired ? 'double' : 'NSNumber *');
    case 'NumberLiteralTypeAnnotation':
      return notStruct(isRequired ? 'double' : 'NSNumber *');
    case 'FloatTypeAnnotation':
      return notStruct(isRequired ? 'float' : 'NSNumber *');
    case 'DoubleTypeAnnotation':
      return notStruct(isRequired ? 'double' : 'NSNumber *');
    case 'Int32TypeAnnotation':
      return notStruct(isRequired ? 'NSInteger' : 'NSNumber *');
    case 'BooleanTypeAnnotation':
      return notStruct(isRequired ? 'BOOL' : 'NSNumber *');
    case 'BooleanLiteralTypeAnnotation':
      return notStruct(isRequired ? 'BOOL' : 'NSNumber *');
    case 'EnumDeclaration':
      switch (typeAnnotation.memberType) {
        case 'NumberTypeAnnotation':
          return notStruct(isRequired ? 'double' : 'NSNumber *');
        case 'StringTypeAnnotation':
          return notStruct(wrapOptional('NSString *', !nullable));
        default:
          throw new Error(
            `Unsupported enum type for param "${paramName}" in ${methodName}. Found: ${typeAnnotation.type}`,
          );
      }
    case 'GenericObjectTypeAnnotation':
      return notStruct(wrapOptional('NSDictionary *', !nullable));
    default:
      structTypeAnnotation.type as empty;
      throw new Error(
        `Unsupported type for param "${paramName}" in ${methodName}. Found: ${typeAnnotation.type}`,
      );
  }
}

function getReturnObjCType(
  methodName: string,
  nullableTypeAnnotation: Nullable<NativeModuleReturnTypeAnnotation>,
): string {
  const [typeAnnotation, nullable] = unwrapNullable(nullableTypeAnnotation);
  const isRequired = !nullable;

  switch (typeAnnotation.type) {
    case 'VoidTypeAnnotation':
      return 'void';
    case 'PromiseTypeAnnotation':
      return 'void';
    case 'ObjectTypeAnnotation':
      return wrapOptional('NSDictionary *', isRequired);
    case 'TypeAliasTypeAnnotation':
      return wrapOptional('NSDictionary *', isRequired);
    case 'ArrayTypeAnnotation':
      if (typeAnnotation.elementType.type === 'AnyTypeAnnotation') {
        return wrapOptional('NSArray<id<NSObject>> *', isRequired);
      }

      return wrapOptional(
        `NSArray<${getReturnObjCType(
          methodName,
          typeAnnotation.elementType,
        )}> *`,
        isRequired,
      );
    case 'ReservedTypeAnnotation':
      switch (typeAnnotation.name) {
        case 'RootTag':
          return wrapOptional('NSNumber *', isRequired);
        default:
          typeAnnotation.name as empty;
          throw new Error(
            `Unsupported return type for ${methodName}. Found: ${typeAnnotation.name}`,
          );
      }
    case 'StringTypeAnnotation':
      // TODO: Can NSString * returns not be _Nullable?
      // In the legacy codegen, we don't surround NSSTring * with _Nullable
      return wrapOptional('NSString *', isRequired);
    case 'StringLiteralTypeAnnotation':
      // TODO: Can NSString * returns not be _Nullable?
      // In the legacy codegen, we don't surround NSSTring * with _Nullable
      return wrapOptional('NSString *', isRequired);
    case 'NumberTypeAnnotation':
      return wrapOptional('NSNumber *', isRequired);
    case 'NumberLiteralTypeAnnotation':
      return wrapOptional('NSNumber *', isRequired);
    case 'FloatTypeAnnotation':
      return wrapOptional('NSNumber *', isRequired);
    case 'DoubleTypeAnnotation':
      return wrapOptional('NSNumber *', isRequired);
    case 'Int32TypeAnnotation':
      return wrapOptional('NSNumber *', isRequired);
    case 'BooleanTypeAnnotation':
      return wrapOptional('NSNumber *', isRequired);
    case 'BooleanLiteralTypeAnnotation':
      return wrapOptional('NSNumber *', isRequired);
    case 'EnumDeclaration':
      switch (typeAnnotation.memberType) {
        case 'NumberTypeAnnotation':
          return wrapOptional('NSNumber *', isRequired);
        case 'StringTypeAnnotation':
          return wrapOptional('NSString *', isRequired);
        default:
          throw new Error(
            `Unsupported enum return type for ${methodName}. Found: ${typeAnnotation.type}`,
          );
      }
    case 'UnionTypeAnnotation':
      const validUnionType = parseValidUnionType(typeAnnotation);
      switch (validUnionType) {
        case 'boolean':
          return wrapOptional('NSNumber *', isRequired);
        case 'number':
          return wrapOptional('NSNumber *', isRequired);
        case 'object':
          return wrapOptional('NSDictionary *', isRequired);
        case 'string':
          // TODO: Can NSString * returns not be _Nullable?
          // In the legacy codegen, we don't surround NSSTring * with _Nullable
          return wrapOptional('NSString *', isRequired);
        default:
          validUnionType as empty;
          throw new Error(`Unsupported union member type`);
      }
    case 'GenericObjectTypeAnnotation':
      return wrapOptional('NSDictionary *', isRequired);
    case 'ArrayBufferTypeAnnotation':
      return wrapOptional('NSMutableData *', isRequired);
    default:
      typeAnnotation.type as 'MixedTypeAnnotation';
      throw new Error(
        `Unsupported return type for ${methodName}. Found: ${typeAnnotation.type}`,
      );
  }
}

function getReturnJSType(
  methodName: string,
  nullableTypeAnnotation: Nullable<NativeModuleReturnTypeAnnotation>,
): ReturnJSType {
  const [typeAnnotation] = unwrapNullable(nullableTypeAnnotation);
  switch (typeAnnotation.type) {
    case 'VoidTypeAnnotation':
      return 'VoidKind';
    case 'PromiseTypeAnnotation':
      return 'PromiseKind';
    case 'ObjectTypeAnnotation':
      return 'ObjectKind';
    case 'TypeAliasTypeAnnotation':
      return 'ObjectKind';
    case 'ArrayTypeAnnotation':
      return 'ArrayKind';
    case 'ReservedTypeAnnotation':
      return 'NumberKind';
    case 'StringTypeAnnotation':
      return 'StringKind';
    case 'StringLiteralTypeAnnotation':
      return 'StringKind';
    case 'NumberTypeAnnotation':
      return 'NumberKind';
    case 'NumberLiteralTypeAnnotation':
      return 'NumberKind';
    case 'FloatTypeAnnotation':
      return 'NumberKind';
    case 'DoubleTypeAnnotation':
      return 'NumberKind';
    case 'Int32TypeAnnotation':
      return 'NumberKind';
    case 'BooleanTypeAnnotation':
      return 'BooleanKind';
    case 'BooleanLiteralTypeAnnotation':
      return 'BooleanKind';
    case 'GenericObjectTypeAnnotation':
      return 'ObjectKind';
    case 'EnumDeclaration':
      switch (typeAnnotation.memberType) {
        case 'NumberTypeAnnotation':
          return 'NumberKind';
        case 'StringTypeAnnotation':
          return 'StringKind';
        default:
          throw new Error(
            `Unsupported return type for ${methodName}. Found: ${typeAnnotation.type}`,
          );
      }
    case 'UnionTypeAnnotation':
      const validUnionType = parseValidUnionType(typeAnnotation);
      switch (validUnionType) {
        case 'boolean':
          return 'BooleanKind';
        case 'number':
          return 'NumberKind';
        case 'object':
          return 'ObjectKind';
        case 'string':
          return 'StringKind';
        default:
          validUnionType as empty;
          throw new Error(`Unsupported union member types`);
      }
    case 'ArrayBufferTypeAnnotation':
      return 'ArrayBufferKind';
    default:
      typeAnnotation.type as 'MixedTypeAnnotation';
      throw new Error(
        `Unsupported return type for ${methodName}. Found: ${typeAnnotation.type}`,
      );
  }
}

function serializeConstantsProtocolMethods(
  hasteModuleName: string,
  property: NativeModulePropertyShape,
  structCollector: StructCollector,
  resolveAlias: AliasResolver,
): ReadonlyArray<MethodSerializationOutput> {
  const [propertyTypeAnnotation] = unwrapNullable(property.typeAnnotation);
  if (propertyTypeAnnotation.params.length !== 0) {
    throw new Error(
      `${hasteModuleName}.getConstants() may only accept 0 arguments.`,
    );
  }

  let {returnTypeAnnotation} = propertyTypeAnnotation;

  if (returnTypeAnnotation.type === 'TypeAliasTypeAnnotation') {
    // The return type is an alias, resolve it to get the expected undelying object literal type
    returnTypeAnnotation = resolveAlias(returnTypeAnnotation.name);
  }

  if (returnTypeAnnotation.type !== 'ObjectTypeAnnotation') {
    throw new Error(
      `${hasteModuleName}.getConstants() may only return an object literal: {...}` +
        ` or a type alias of such. Got '${propertyTypeAnnotation.returnTypeAnnotation.type}'.`,
    );
  }

  if (
    returnTypeAnnotation.type === 'ObjectTypeAnnotation' &&
    returnTypeAnnotation.properties.length === 0
  ) {
    return [];
  }

  const realTypeAnnotation = structCollector.process(
    'Constants',
    'CONSTANTS',
    resolveAlias,
    returnTypeAnnotation,
  );

  invariant(
    realTypeAnnotation.type === 'TypeAliasTypeAnnotation',
    "Unable to generate C++ struct from module's getConstants() method return type.",
  );

  const returnObjCType = `facebook::react::ModuleConstants<JS::${hasteModuleName}::Constants>`;

  // $FlowFixMe[missing-type-arg]
  return ['constantsToExport', 'getConstants'].map<MethodSerializationOutput>(
    methodName => {
      const protocolMethod = ProtocolMethodTemplate({
        methodName,
        returnObjCType,
        params: '',
      });

      return {
        methodName,
        protocolMethod,
        returnJSType: 'ObjectKind',
        selector: `@selector(${methodName})`,
        structParamRecords: [],
        argCount: 0,
      };
    },
  );
}

module.exports = {
  serializeMethod,
};

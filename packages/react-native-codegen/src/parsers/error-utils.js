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

import type {NativeModuleTypeAnnotation} from '../CodegenSchema';
import type {TypeDeclarationMap} from '../parsers/utils';
import type {ParserType} from './errors';
import type {Parser} from './parser';

const {
  IncorrectModuleRegistryCallArgumentTypeParserError,
  IncorrectModuleRegistryCallArgumentValueParserError,
  IncorrectModuleRegistryCallArityParserError,
  IncorrectModuleRegistryCallTypeParameterParserError,
  MisnamedModuleInterfaceParserError,
  ModuleInterfaceNotFoundParserError,
  MoreThanOneModuleInterfaceParserError,
  MoreThanOneModuleRegistryCallsParserError,
  UnsupportedArrayElementTypeAnnotationParserError,
  UnsupportedFunctionParamTypeAnnotationParserError,
  UnsupportedFunctionReturnTypeAnnotationParserError,
  UnsupportedModuleEventEmitterPropertyParserError,
  UnsupportedModuleEventEmitterTypePropertyParserError,
  UnsupportedModulePropertyParserError,
  UnsupportedObjectPropertyValueTypeAnnotationParserError,
  UntypedModuleRegistryCallParserError,
  UnusedModuleInterfaceParserError,
} = require('./errors');

function throwIfModuleInterfaceIsMisnamed(
  nativeModuleName: string,
  moduleSpecId: $FlowFixMe,
  parserType: ParserType,
) {
  if (moduleSpecId.name !== 'Spec') {
    throw new MisnamedModuleInterfaceParserError(
      nativeModuleName,
      moduleSpecId,
      parserType,
    );
  }
}

function throwIfModuleInterfaceNotFound(
  numberOfModuleSpecs: number,
  nativeModuleName: string,
  ast: $FlowFixMe,
  parserType: ParserType,
) {
  if (numberOfModuleSpecs === 0) {
    throw new ModuleInterfaceNotFoundParserError(
      nativeModuleName,
      ast,
      parserType,
    );
  }
}

function throwIfMoreThanOneModuleRegistryCalls(
  hasteModuleName: string,
  callExpressions: $FlowFixMe,
  callExpressionsLength: number,
) {
  if (callExpressions.length > 1) {
    throw new MoreThanOneModuleRegistryCallsParserError(
      hasteModuleName,
      callExpressions,
      callExpressionsLength,
    );
  }
}

function throwIfUnusedModuleInterfaceParserError(
  nativeModuleName: string,
  moduleSpec: $FlowFixMe,
  callExpressions: $FlowFixMe,
) {
  if (callExpressions.length === 0) {
    throw new UnusedModuleInterfaceParserError(nativeModuleName, moduleSpec);
  }
}

function throwIfWrongNumberOfCallExpressionArgs(
  nativeModuleName: string,
  flowCallExpression: $FlowFixMe,
  methodName: string,
  numberOfCallExpressionArgs: number,
) {
  if (numberOfCallExpressionArgs !== 1) {
    throw new IncorrectModuleRegistryCallArityParserError(
      nativeModuleName,
      flowCallExpression,
      methodName,
      numberOfCallExpressionArgs,
    );
  }
}

function throwIfIncorrectModuleRegistryCallTypeParameterParserError(
  nativeModuleName: string,
  typeArguments: $FlowFixMe,
  methodName: string,
  moduleName: string,
  parser: Parser,
) {
  function throwError() {
    throw new IncorrectModuleRegistryCallTypeParameterParserError(
      nativeModuleName,
      typeArguments,
      methodName,
      moduleName,
    );
  }

  if (parser.checkIfInvalidModule(typeArguments)) {
    throwError();
  }
}

function throwIfUnsupportedFunctionReturnTypeAnnotationParserError(
  nativeModuleName: string,
  returnTypeAnnotation: $FlowFixMe,
  invalidReturnType: string,
  cxxOnly: boolean,
  returnType: string,
) {
  if (!cxxOnly && returnType === 'FunctionTypeAnnotation') {
    throw new UnsupportedFunctionReturnTypeAnnotationParserError(
      nativeModuleName,
      returnTypeAnnotation.returnType,
      'FunctionTypeAnnotation',
    );
  }
}

function throwIfUntypedModule(
  typeArguments: $FlowFixMe,
  hasteModuleName: string,
  callExpression: $FlowFixMe,
  methodName: string,
  moduleName: string,
) {
  if (typeArguments == null) {
    throw new UntypedModuleRegistryCallParserError(
      hasteModuleName,
      callExpression,
      methodName,
      moduleName,
    );
  }
}

function throwIfEventEmitterTypeIsUnsupported(
  nativeModuleName: string,
  propertyName: string,
  propertyValueType: string,
  parser: Parser,
  nullable: boolean,
  untyped: boolean,
) {
  if (nullable || untyped) {
    throw new UnsupportedModuleEventEmitterPropertyParserError(
      nativeModuleName,
      propertyName,
      propertyValueType,
      parser.language(),
      nullable,
      untyped,
    );
  }
}

function throwIfEventEmitterEventTypeIsUnsupported(
  nativeModuleName: string,
  propertyName: string,
  propertyValueType: string,
  parser: Parser,
  nullable: boolean,
) {
  if (nullable) {
    throw new UnsupportedModuleEventEmitterTypePropertyParserError(
      nativeModuleName,
      propertyName,
      propertyValueType,
      parser.language(),
      nullable,
    );
  }
}

function throwIfModuleTypeIsUnsupported(
  nativeModuleName: string,
  propertyValue: $FlowFixMe,
  propertyName: string,
  propertyValueType: string,
  parser: Parser,
) {
  if (!parser.functionTypeAnnotation(propertyValueType)) {
    throw new UnsupportedModulePropertyParserError(
      nativeModuleName,
      propertyValue,
      propertyName,
      propertyValueType,
      parser.language(),
    );
  }
}

const UnsupportedObjectPropertyTypeToInvalidPropertyValueTypeMap = {
  FunctionTypeAnnotation: 'FunctionTypeAnnotation',
  VoidTypeAnnotation: 'void',
  PromiseTypeAnnotation: 'Promise',
  ArrayBufferTypeAnnotation: 'ArrayBuffer',
};

function throwIfPropertyValueTypeIsUnsupported(
  moduleName: string,
  propertyValue: $FlowFixMe,
  propertyKey: string,
  type: string,
) {
  const invalidPropertyValueType =
    // $FlowFixMe[invalid-computed-prop]
    UnsupportedObjectPropertyTypeToInvalidPropertyValueTypeMap[type];

  throw new UnsupportedObjectPropertyValueTypeAnnotationParserError(
    moduleName,
    propertyValue,
    propertyKey,
    invalidPropertyValueType,
  );
}

function throwIfMoreThanOneModuleInterfaceParserError(
  nativeModuleName: string,
  moduleSpecs: ReadonlyArray<$FlowFixMe>,
  parserType: ParserType,
) {
  if (moduleSpecs.length > 1) {
    throw new MoreThanOneModuleInterfaceParserError(
      nativeModuleName,
      moduleSpecs,
      moduleSpecs.map(node => node.id.name),
      parserType,
    );
  }
}

function throwIfUnsupportedFunctionParamTypeAnnotationParserError(
  nativeModuleName: string,
  languageParamTypeAnnotation: $FlowFixMe,
  paramName: string,
  paramTypeAnnotationType: NativeModuleTypeAnnotation['type'],
) {
  throw new UnsupportedFunctionParamTypeAnnotationParserError(
    nativeModuleName,
    languageParamTypeAnnotation,
    paramName,
    paramTypeAnnotationType,
  );
}

function throwIfArrayElementTypeAnnotationIsUnsupported(
  hasteModuleName: string,
  flowElementType: $FlowFixMe,
  flowArrayType: 'Array' | '$ReadOnlyArray' | 'ReadonlyArray',
  type: string,
) {
  const TypeMap = {
    FunctionTypeAnnotation: 'FunctionTypeAnnotation',
    VoidTypeAnnotation: 'void',
    PromiseTypeAnnotation: 'Promise',
    ArrayBufferTypeAnnotation: 'ArrayBuffer',
    // TODO: Added as a work-around for now until TupleTypeAnnotation are fully supported in both flow and TS
    // Right now they are partially treated as UnionTypeAnnotation
    // UnionTypeAnnotation: 'UnionTypeAnnotation',
  };

  if (type in TypeMap) {
    throw new UnsupportedArrayElementTypeAnnotationParserError(
      hasteModuleName,
      flowElementType,
      flowArrayType,
      // $FlowFixMe[invalid-computed-prop]
      TypeMap[type],
    );
  }
}

function throwIfIncorrectModuleRegistryCallArgument(
  nativeModuleName: string,
  callExpressionArg: $FlowFixMe,
  methodName: string,
) {
  if (
    callExpressionArg.type !== 'StringLiteral' &&
    callExpressionArg.type !== 'Literal'
  ) {
    const {type} = callExpressionArg;
    throw new IncorrectModuleRegistryCallArgumentTypeParserError(
      nativeModuleName,
      callExpressionArg,
      methodName,
      type,
    );
  }

  const value = callExpressionArg.value;
  if (typeof value !== 'string' || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
    throw new IncorrectModuleRegistryCallArgumentValueParserError(
      nativeModuleName,
      callExpressionArg,
      methodName,
      String(value),
    );
  }
}

function throwIfPartialNotAnnotatingTypeParameter(
  typeAnnotation: $FlowFixMe,
  types: TypeDeclarationMap,
  parser: Parser,
) {
  const annotatedElement = parser.extractAnnotatedElement(
    typeAnnotation,
    types,
  );

  if (!annotatedElement) {
    throw new Error('Partials only support annotating a type parameter.');
  }
}

function throwIfPartialWithMoreParameter(typeAnnotation: $FlowFixMe) {
  if (typeAnnotation.typeParameters.params.length !== 1) {
    throw new Error('Partials only support annotating exactly one parameter.');
  }
}

function throwIfMoreThanOneCodegenNativecommands(
  commandsTypeNames: ReadonlyArray<$FlowFixMe>,
) {
  if (commandsTypeNames.length > 1) {
    throw new Error('codegenNativeCommands may only be called once in a file');
  }
}

function throwIfConfigNotfound(foundConfigs: Array<{[string]: string}>) {
  if (foundConfigs.length === 0) {
    throw new Error('Could not find component config for native component');
  }
}

function throwIfMoreThanOneConfig(foundConfigs: Array<{[string]: string}>) {
  if (foundConfigs.length > 1) {
    throw new Error('Only one component is supported per file');
  }
}

function throwIfEventHasNoName(typeAnnotation: $FlowFixMe, parser: Parser) {
  const name =
    parser.language() === 'Flow' ? typeAnnotation.id : typeAnnotation.typeName;

  if (!name) {
    throw new Error("typeAnnotation of event doesn't have a name");
  }
}

function throwIfBubblingTypeIsNull(
  bubblingType: ?('direct' | 'bubble'),
  eventName: string,
): 'direct' | 'bubble' {
  if (!bubblingType) {
    throw new Error(
      `Unable to determine event bubbling type for "${eventName}"`,
    );
  }

  return bubblingType;
}

function throwIfArgumentPropsAreNull(
  argumentProps: ?ReadonlyArray<$FlowFixMe>,
  eventName: string,
): ReadonlyArray<$FlowFixMe> {
  if (!argumentProps) {
    throw new Error(`Unable to determine event arguments for "${eventName}"`);
  }

  return argumentProps;
}

function throwIfTypeAliasIsNotInterface(typeAlias: $FlowFixMe, parser: Parser) {
  if (typeAlias.type !== parser.interfaceDeclaration) {
    throw new Error(
      `The type argument for codegenNativeCommands must be an interface, received ${typeAlias.type}`,
    );
  }
}

module.exports = {
  throwIfModuleInterfaceIsMisnamed,
  throwIfUnsupportedFunctionReturnTypeAnnotationParserError,
  throwIfModuleInterfaceNotFound,
  throwIfMoreThanOneModuleRegistryCalls,
  throwIfPropertyValueTypeIsUnsupported,
  throwIfUnusedModuleInterfaceParserError,
  throwIfWrongNumberOfCallExpressionArgs,
  throwIfIncorrectModuleRegistryCallTypeParameterParserError,
  throwIfUntypedModule,
  throwIfEventEmitterTypeIsUnsupported,
  throwIfEventEmitterEventTypeIsUnsupported,
  throwIfModuleTypeIsUnsupported,
  throwIfMoreThanOneModuleInterfaceParserError,
  throwIfUnsupportedFunctionParamTypeAnnotationParserError,
  throwIfArrayElementTypeAnnotationIsUnsupported,
  throwIfIncorrectModuleRegistryCallArgument,
  throwIfPartialNotAnnotatingTypeParameter,
  throwIfPartialWithMoreParameter,
  throwIfMoreThanOneCodegenNativecommands,
  throwIfConfigNotfound,
  throwIfMoreThanOneConfig,
  throwIfEventHasNoName,
  throwIfBubblingTypeIsNull,
  throwIfArgumentPropsAreNull,
  throwIfTypeAliasIsNotInterface,
};

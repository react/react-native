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

import type {Parser} from './parser';

export type ParserType = 'Flow' | 'TypeScript';

class ParserError extends Error {
  nodes: ReadonlyArray<$FlowFixMe>;
  constructor(
    nativeModuleName: string,
    astNodeOrNodes: $FlowFixMe,
    message: string,
  ) {
    super(`Module ${nativeModuleName}: ${message}`);

    this.nodes = Array.isArray(astNodeOrNodes)
      ? astNodeOrNodes
      : [astNodeOrNodes];

    // assign the error class name in your custom error (as a shortcut)
    this.name = this.constructor.name;

    // capturing the stack trace keeps the reference to your error class
    Error.captureStackTrace(this, this.constructor);
  }
}
class MisnamedModuleInterfaceParserError extends ParserError {
  constructor(nativeModuleName: string, id: $FlowFixMe, language: ParserType) {
    super(
      nativeModuleName,
      id,
      `All ${language} interfaces extending TurboModule must be called 'Spec'. Please rename ${language} interface '${id.name}' to 'Spec'.`,
    );
  }
}

class ModuleInterfaceNotFoundParserError extends ParserError {
  constructor(nativeModuleName: string, ast: $FlowFixMe, language: ParserType) {
    super(
      nativeModuleName,
      ast,
      `No ${language} interfaces extending TurboModule were detected in this NativeModule spec.`,
    );
  }
}

class MoreThanOneModuleInterfaceParserError extends ParserError {
  constructor(
    nativeModuleName: string,
    flowModuleInterfaces: ReadonlyArray<$FlowFixMe>,
    names: ReadonlyArray<string>,
    language: ParserType,
  ) {
    const finalName = names[names.length - 1];
    const allButLastName = names.slice(0, -1);
    const quote = (x: string) => `'${x}'`;

    const nameStr =
      allButLastName.map(quote).join(', ') + ', and ' + quote(finalName);

    super(
      nativeModuleName,
      flowModuleInterfaces,
      `Every NativeModule spec file must declare exactly one NativeModule ${language} interface. This file declares ${names.length}: ${nameStr}. Please remove the extraneous ${language} interface declarations.`,
    );
  }
}

class UnsupportedModuleEventEmitterTypePropertyParserError extends ParserError {
  constructor(
    nativeModuleName: string,
    propertyValue: $FlowFixMe,
    propertyName: string,
    language: ParserType,
    nullable: boolean,
  ) {
    super(
      nativeModuleName,
      propertyValue,
      `Property '${propertyName}' is an EventEmitter and must have a non nullable eventType`,
    );
  }
}

class UnsupportedModuleEventEmitterPropertyParserError extends ParserError {
  constructor(
    nativeModuleName: string,
    propertyValue: $FlowFixMe,
    propertyName: string,
    language: ParserType,
    nullable: boolean,
    untyped: boolean,
  ) {
    let message = `${language} interfaces extending TurboModule must only contain 'FunctionTypeAnnotation's or non nullable 'EventEmitter's. Further the EventEmitter property `;
    if (nullable) {
      message += `'${propertyValue}' must non nullable.`;
    } else if (untyped) {
      message += `'${propertyValue}' must have a concrete or void eventType.`;
    }
    super(nativeModuleName, propertyValue, message);
  }
}

class UnsupportedModulePropertyParserError extends ParserError {
  constructor(
    nativeModuleName: string,
    propertyValue: $FlowFixMe,
    propertyName: string,
    invalidPropertyValueType: string,
    language: ParserType,
  ) {
    super(
      nativeModuleName,
      propertyValue,
      `${language} interfaces extending TurboModule must only contain 'FunctionTypeAnnotation's or non nullable 'EventEmitter's. Property '${propertyName}' refers to a '${invalidPropertyValueType}'.`,
    );
  }
}

class UnsupportedTypeAnnotationParserError extends ParserError {
  readonly typeAnnotationType: string;
  constructor(
    nativeModuleName: string,
    typeAnnotation: $FlowFixMe,
    language: ParserType,
  ) {
    super(
      nativeModuleName,
      typeAnnotation,
      `${language} type annotation '${typeAnnotation.type}' is unsupported in NativeModule specs.`,
    );

    this.typeAnnotationType = typeAnnotation.type;
  }
}

class UnsupportedGenericParserError extends ParserError {
  // +genericName: string;
  constructor(
    nativeModuleName: string,
    genericTypeAnnotation: $FlowFixMe,
    parser: Parser,
  ) {
    const genericName = parser.getTypeAnnotationName(genericTypeAnnotation);
    super(
      nativeModuleName,
      genericTypeAnnotation,
      `Unrecognized generic type '${genericName}' in NativeModule spec.`,
    );

    // this.genericName = genericName;
  }
}

class MissingTypeParameterGenericParserError extends ParserError {
  constructor(
    nativeModuleName: string,
    genericTypeAnnotation: $FlowFixMe,
    parser: Parser,
  ) {
    const genericName = parser.getTypeAnnotationName(genericTypeAnnotation);

    super(
      nativeModuleName,
      genericTypeAnnotation,
      `Generic '${genericName}' must have type parameters.`,
    );
  }
}

class MoreThanOneTypeParameterGenericParserError extends ParserError {
  constructor(
    nativeModuleName: string,
    genericTypeAnnotation: $FlowFixMe,
    parser: Parser,
  ) {
    const genericName = parser.getTypeAnnotationName(genericTypeAnnotation);

    super(
      nativeModuleName,
      genericTypeAnnotation,
      `Generic '${genericName}' must have exactly one type parameter.`,
    );
  }
}

/**
 * Array parsing errors
 */

class UnsupportedArrayElementTypeAnnotationParserError extends ParserError {
  constructor(
    nativeModuleName: string,
    arrayElementTypeAST: $FlowFixMe,
    arrayType: 'Array' | '$ReadOnlyArray' | 'ReadonlyArray',
    invalidArrayElementType: string,
  ) {
    super(
      nativeModuleName,
      arrayElementTypeAST,
      `${arrayType} element types cannot be '${invalidArrayElementType}'.`,
    );
  }
}

/**
 * Object parsing errors
 */

class UnsupportedObjectPropertyTypeAnnotationParserError extends ParserError {
  constructor(
    nativeModuleName: string,
    propertyAST: $FlowFixMe,
    invalidPropertyType: string,
    language: ParserType,
  ) {
    let message = `'ObjectTypeAnnotation' cannot contain '${invalidPropertyType}'.`;

    if (
      invalidPropertyType === 'ObjectTypeSpreadProperty' &&
      language !== 'TypeScript'
    ) {
      message = "Object spread isn't supported in 'ObjectTypeAnnotation's.";
    }

    super(nativeModuleName, propertyAST, message);
  }
}

class UnsupportedObjectPropertyWithIndexerTypeAnnotationParserError extends ParserError {
  constructor(nativeModuleName: string, propertyAST: $FlowFixMe) {
    let message =
      "'ObjectTypeAnnotation' cannot contain both an indexer and properties.";

    super(nativeModuleName, propertyAST, message);
  }
}

class UnsupportedObjectPropertyValueTypeAnnotationParserError extends ParserError {
  constructor(
    nativeModuleName: string,
    propertyValueAST: $FlowFixMe,
    propertyName: string,
    invalidPropertyValueType: string,
  ) {
    super(
      nativeModuleName,
      propertyValueAST,
      `Object property '${propertyName}' cannot have type '${invalidPropertyValueType}'.`,
    );
  }
}

class UnsupportedObjectDirectRecursivePropertyParserError extends ParserError {
  constructor(
    propertyName: string,
    propertyValueAST: $FlowFixMe,
    nativeModuleName: string,
  ) {
    super(
      nativeModuleName,
      propertyValueAST,
      `Object property '${propertyName}' is direct recursive and must be nullable.`,
    );
  }
}

/**
 * Function parsing errors
 */

class UnnamedFunctionParamParserError extends ParserError {
  constructor(functionParam: $FlowFixMe, nativeModuleName: string) {
    super(
      nativeModuleName,
      functionParam,
      'All function parameters must be named.',
    );
  }
}

class UnsupportedFunctionParamTypeAnnotationParserError extends ParserError {
  constructor(
    nativeModuleName: string,
    flowParamTypeAnnotation: $FlowFixMe,
    paramName: string,
    invalidParamType: string,
  ) {
    super(
      nativeModuleName,
      flowParamTypeAnnotation,
      `Function parameter '${paramName}' cannot have type '${invalidParamType}'.`,
    );
  }
}

class UnsupportedFunctionReturnTypeAnnotationParserError extends ParserError {
  constructor(
    nativeModuleName: string,
    flowReturnTypeAnnotation: $FlowFixMe,
    invalidReturnType: string,
  ) {
    super(
      nativeModuleName,
      flowReturnTypeAnnotation,
      `Function return cannot have type '${invalidReturnType}'.`,
    );
  }
}

/**
 * Enum parsing errors
 */

class UnsupportedEnumDeclarationParserError extends ParserError {
  constructor(
    nativeModuleName: string,
    arrayElementTypeAST: $FlowFixMe,
    memberType: string,
  ) {
    super(
      nativeModuleName,
      arrayElementTypeAST,
      `Unexpected enum member type ${memberType}. Only string and number enum members are supported`,
    );
  }
}

/**
 * Module parsing errors
 */

class UnusedModuleInterfaceParserError extends ParserError {
  constructor(nativeModuleName: string, flowInterface: $FlowFixMe) {
    super(
      nativeModuleName,
      flowInterface,
      "Unused NativeModule spec. Please load the NativeModule by calling TurboModuleRegistry.get<Spec>('<moduleName>').",
    );
  }
}

class MoreThanOneModuleRegistryCallsParserError extends ParserError {
  constructor(
    nativeModuleName: string,
    flowCallExpressions: $FlowFixMe,
    numCalls: number,
  ) {
    super(
      nativeModuleName,
      flowCallExpressions,
      `Every NativeModule spec file must contain exactly one NativeModule load. This file contains ${numCalls}. Please simplify this spec file, splitting it as necessary, to remove the extraneous loads.`,
    );
  }
}

class UntypedModuleRegistryCallParserError extends ParserError {
  constructor(
    nativeModuleName: string,
    flowCallExpression: $FlowFixMe,
    methodName: string,
    moduleName: string,
  ) {
    super(
      nativeModuleName,
      flowCallExpression,
      `Please type this NativeModule load: TurboModuleRegistry.${methodName}<Spec>('${moduleName}').`,
    );
  }
}

class IncorrectModuleRegistryCallTypeParameterParserError extends ParserError {
  constructor(
    nativeModuleName: string,
    flowTypeArguments: $FlowFixMe,
    methodName: string,
    moduleName: string,
  ) {
    super(
      nativeModuleName,
      flowTypeArguments,
      `Please change these type arguments to reflect TurboModuleRegistry.${methodName}<Spec>('${moduleName}').`,
    );
  }
}

class IncorrectModuleRegistryCallArityParserError extends ParserError {
  constructor(
    nativeModuleName: string,
    flowCallExpression: $FlowFixMe,
    methodName: string,
    incorrectArity: number,
  ) {
    super(
      nativeModuleName,
      flowCallExpression,
      `Please call TurboModuleRegistry.${methodName}<Spec>() with exactly one argument. Detected ${incorrectArity}.`,
    );
  }
}

class IncorrectModuleRegistryCallArgumentTypeParserError extends ParserError {
  constructor(
    nativeModuleName: string,
    flowArgument: $FlowFixMe,
    methodName: string,
    type: string,
  ) {
    const a = /[aeiouy]/.test(type.toLowerCase()) ? 'an' : 'a';
    super(
      nativeModuleName,
      flowArgument,
      `Please call TurboModuleRegistry.${methodName}<Spec>() with a string literal. Detected ${a} '${type}'`,
    );
  }
}

class IncorrectModuleRegistryCallArgumentValueParserError extends ParserError {
  constructor(
    nativeModuleName: string,
    flowArgument: $FlowFixMe,
    methodName: string,
    value: string,
  ) {
    super(
      nativeModuleName,
      flowArgument,
      `Please call TurboModuleRegistry.${methodName}<Spec>() with a safe module name. Module names must only contain alphanumeric characters and underscores (matching /^[a-zA-Z_][a-zA-Z0-9_]*$/). Got '${value.replace(/[^\x20-\x7e]/g, '?')}'`,
    );
  }
}

module.exports = {
  ParserError,
  MissingTypeParameterGenericParserError,
  MoreThanOneTypeParameterGenericParserError,
  MisnamedModuleInterfaceParserError,
  ModuleInterfaceNotFoundParserError,
  MoreThanOneModuleInterfaceParserError,
  UnnamedFunctionParamParserError,
  UnsupportedArrayElementTypeAnnotationParserError,
  UnsupportedGenericParserError,
  UnsupportedTypeAnnotationParserError,
  UnsupportedFunctionParamTypeAnnotationParserError,
  UnsupportedFunctionReturnTypeAnnotationParserError,
  UnsupportedEnumDeclarationParserError,
  UnsupportedModuleEventEmitterTypePropertyParserError,
  UnsupportedModuleEventEmitterPropertyParserError,
  UnsupportedModulePropertyParserError,
  UnsupportedObjectPropertyTypeAnnotationParserError,
  UnsupportedObjectPropertyWithIndexerTypeAnnotationParserError,
  UnsupportedObjectPropertyValueTypeAnnotationParserError,
  UnsupportedObjectDirectRecursivePropertyParserError,
  UnusedModuleInterfaceParserError,
  MoreThanOneModuleRegistryCallsParserError,
  UntypedModuleRegistryCallParserError,
  IncorrectModuleRegistryCallTypeParameterParserError,
  IncorrectModuleRegistryCallArityParserError,
  IncorrectModuleRegistryCallArgumentTypeParserError,
  IncorrectModuleRegistryCallArgumentValueParserError,
};

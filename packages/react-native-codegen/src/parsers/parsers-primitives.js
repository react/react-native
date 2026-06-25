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
  ArrayBufferTypeAnnotation,
  BooleanLiteralTypeAnnotation,
  BooleanTypeAnnotation,
  DoubleTypeAnnotation,
  EventTypeAnnotation,
  FloatTypeAnnotation,
  Int32TypeAnnotation,
  NamedShape,
  NativeModuleAliasMap,
  NativeModuleBaseTypeAnnotation,
  NativeModuleEnumDeclaration,
  NativeModuleEnumMap,
  NativeModuleFunctionTypeAnnotation,
  NativeModuleGenericObjectTypeAnnotation,
  NativeModuleMixedTypeAnnotation,
  NativeModuleNumberTypeAnnotation,
  NativeModuleObjectTypeAnnotation,
  NativeModulePromiseTypeAnnotation,
  NativeModuleTypeAliasTypeAnnotation,
  NativeModuleTypeAnnotation,
  NativeModuleUnionTypeAnnotation,
  NativeModuleUnionTypeAnnotationMemberType,
  Nullable,
  NumberLiteralTypeAnnotation,
  ObjectTypeAnnotation,
  ReservedTypeAnnotation,
  StringLiteralTypeAnnotation,
  StringTypeAnnotation,
  VoidTypeAnnotation,
} from '../CodegenSchema';
import type {Parser} from './parser';
import type {
  ParserErrorCapturer,
  TypeDeclarationMap,
  TypeResolutionStatus,
} from './utils';

const {
  throwIfArrayElementTypeAnnotationIsUnsupported,
  throwIfPartialNotAnnotatingTypeParameter,
  throwIfPartialWithMoreParameter,
} = require('./error-utils');
const {ParserError, UnsupportedTypeAnnotationParserError} = require('./errors');
const {
  assertGenericTypeAnnotationHasExactlyOneTypeParameter,
  translateFunctionTypeAnnotation,
  unwrapNullable,
  wrapNullable,
} = require('./parsers-commons');
const {nullGuard} = require('./parsers-utils');
const {isModuleRegistryCall} = require('./utils');

function emitBoolean(nullable: boolean): Nullable<BooleanTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'BooleanTypeAnnotation',
  });
}

function emitInt32(nullable: boolean): Nullable<Int32TypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'Int32TypeAnnotation',
  });
}

function emitInt32Prop(
  name: string,
  optional: boolean,
): NamedShape<Int32TypeAnnotation> {
  return {
    name,
    optional,
    typeAnnotation: {
      type: 'Int32TypeAnnotation',
    },
  };
}

function emitNumber(
  nullable: boolean,
): Nullable<NativeModuleNumberTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'NumberTypeAnnotation',
  });
}

function emitRootTag(nullable: boolean): Nullable<ReservedTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'ReservedTypeAnnotation',
    name: 'RootTag',
  });
}

function emitDouble(nullable: boolean): Nullable<DoubleTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'DoubleTypeAnnotation',
  });
}

function emitDoubleProp(
  name: string,
  optional: boolean,
): NamedShape<DoubleTypeAnnotation> {
  return {
    name,
    optional,
    typeAnnotation: {
      type: 'DoubleTypeAnnotation',
    },
  };
}

function emitVoid(nullable: boolean): Nullable<VoidTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'VoidTypeAnnotation',
  });
}

function emitArrayBuffer(
  nullable: boolean,
): Nullable<ArrayBufferTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'ArrayBufferTypeAnnotation',
  });
}

function emitStringish(nullable: boolean): Nullable<StringTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'StringTypeAnnotation',
  });
}

function emitFunction(
  nullable: boolean,
  hasteModuleName: string,
  typeAnnotation: $FlowFixMe,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  enumMap: {...NativeModuleEnumMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
  translateTypeAnnotation: $FlowFixMe,
  parser: Parser,
): Nullable<NativeModuleFunctionTypeAnnotation> {
  const translateFunctionTypeAnnotationValue: NativeModuleFunctionTypeAnnotation =
    translateFunctionTypeAnnotation(
      hasteModuleName,
      typeAnnotation,
      types,
      aliasMap,
      enumMap,
      tryParse,
      cxxOnly,
      translateTypeAnnotation,
      parser,
    );
  return wrapNullable(nullable, translateFunctionTypeAnnotationValue);
}

function emitMixed(
  nullable: boolean,
): Nullable<NativeModuleMixedTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'MixedTypeAnnotation',
  });
}

function emitNumberLiteral(
  nullable: boolean,
  value: number,
): Nullable<NumberLiteralTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'NumberLiteralTypeAnnotation',
    value,
  });
}

function emitBooleanLiteral(
  nullable: boolean,
  value: boolean,
): Nullable<BooleanLiteralTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'BooleanLiteralTypeAnnotation',
    value,
  });
}

function emitString(nullable: boolean): Nullable<StringTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'StringTypeAnnotation',
  });
}

function emitStringLiteral(
  nullable: boolean,
  value: string,
): Nullable<StringLiteralTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'StringLiteralTypeAnnotation',
    value,
  });
}

function emitStringProp(
  name: string,
  optional: boolean,
): NamedShape<StringTypeAnnotation> {
  return {
    name,
    optional,
    typeAnnotation: {
      type: 'StringTypeAnnotation',
    },
  };
}

function typeAliasResolution(
  typeResolution: TypeResolutionStatus,
  objectTypeAnnotation: ObjectTypeAnnotation<
    Nullable<NativeModuleBaseTypeAnnotation>,
  >,
  aliasMap: {...NativeModuleAliasMap},
  nullable: boolean,
):
  | Nullable<NativeModuleTypeAliasTypeAnnotation>
  | Nullable<ObjectTypeAnnotation<Nullable<NativeModuleBaseTypeAnnotation>>> {
  if (!typeResolution.successful) {
    return wrapNullable(nullable, objectTypeAnnotation);
  }

  /**
   * All aliases RHS are required.
   */
  aliasMap[typeResolution.name] = objectTypeAnnotation;

  /**
   * Nullability of type aliases is transitive.
   *
   * Consider this case:
   *
   * type Animal = ?{
   *   name: string,
   * };
   *
   * type B = Animal
   *
   * export interface Spec extends TurboModule {
   *   +greet: (animal: B) => void;
   * }
   *
   * In this case, we follow B to Animal, and then Animal to ?{name: string}.
   *
   * We:
   *   1. Replace `+greet: (animal: B) => void;` with `+greet: (animal: ?Animal) => void;`,
   *   2. Pretend that Animal = {name: string}.
   *
   * Why do we do this?
   *  1. In ObjC, we need to generate a struct called Animal, not B.
   *  2. This design is simpler than managing nullability within both the type alias usage, and the type alias RHS.
   *  3. What does it mean for a C++ struct, which is what this type alias RHS will generate, to be nullable? ¯\_(ツ)_/¯
   *     Nullability is a concept that only makes sense when talking about instances (i.e: usages) of the C++ structs.
   *     Hence, it's better to manage nullability within the actual TypeAliasTypeAnnotation nodes, and not the
   *     associated ObjectTypeAnnotations.
   */
  return wrapNullable(nullable, {
    type: 'TypeAliasTypeAnnotation',
    name: typeResolution.name,
  });
}

function typeEnumResolution(
  typeAnnotation: $FlowFixMe,
  typeResolution: TypeResolutionStatus,
  nullable: boolean,
  hasteModuleName: string,
  enumMap: {...NativeModuleEnumMap},
  parser: Parser,
): Nullable<NativeModuleEnumDeclaration> {
  if (!typeResolution.successful || typeResolution.type !== 'enum') {
    throw new UnsupportedTypeAnnotationParserError(
      hasteModuleName,
      typeAnnotation,
      parser.language(),
    );
  }

  const enumName = typeResolution.name;

  const enumMemberType = parser.parseEnumMembersType(typeAnnotation);

  try {
    parser.validateEnumMembersSupported(typeAnnotation, enumMemberType);
  } catch (e) {
    if (e instanceof Error) {
      throw new ParserError(
        hasteModuleName,
        typeAnnotation,
        `Failed parsing the enum ${enumName} in ${hasteModuleName} with the error: ${e.message}`,
      );
    } else {
      throw e;
    }
  }

  const enumMembers = parser.parseEnumMembers(typeAnnotation);

  enumMap[enumName] = {
    name: enumName,
    type: 'EnumDeclarationWithMembers',
    memberType: enumMemberType,
    members: enumMembers,
  };

  return wrapNullable(nullable, {
    name: enumName,
    type: 'EnumDeclaration',
    memberType: enumMemberType,
  });
}

function emitPromise(
  hasteModuleName: string,
  typeAnnotation: $FlowFixMe,
  parser: Parser,
  nullable: boolean,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  enumMap: {...NativeModuleEnumMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
  translateTypeAnnotation: $FlowFixMe,
): Nullable<NativeModulePromiseTypeAnnotation> {
  assertGenericTypeAnnotationHasExactlyOneTypeParameter(
    hasteModuleName,
    typeAnnotation,
    parser,
  );

  const elementType = typeAnnotation.typeParameters.params[0];
  if (
    elementType.type === 'ExistsTypeAnnotation' ||
    elementType.type === 'EmptyTypeAnnotation'
  ) {
    return wrapNullable(nullable, {
      type: 'PromiseTypeAnnotation',
      elementType: {
        type: 'VoidTypeAnnotation',
      },
    });
  } else {
    let elementTypeResult;
    try {
      elementTypeResult = translateTypeAnnotation(
        hasteModuleName,
        typeAnnotation.typeParameters.params[0],
        types,
        aliasMap,
        enumMap,
        tryParse,
        cxxOnly,
        parser,
      );
    } catch {
      return wrapNullable(nullable, {
        type: 'PromiseTypeAnnotation',
        elementType: {
          type: 'VoidTypeAnnotation',
        },
      });
    }

    return wrapNullable(nullable, {
      type: 'PromiseTypeAnnotation',
      elementType: elementTypeResult,
    });
  }
}

function emitGenericObject(
  nullable: boolean,
): Nullable<NativeModuleGenericObjectTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'GenericObjectTypeAnnotation',
  });
}

function emitDictionary(
  nullable: boolean,
  valueType: Nullable<NativeModuleTypeAnnotation>,
): Nullable<NativeModuleGenericObjectTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'GenericObjectTypeAnnotation',
    dictionaryValueType: valueType,
  });
}

function emitObject(
  nullable: boolean,
  properties: Array<$FlowFixMe>,
): Nullable<NativeModuleObjectTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'ObjectTypeAnnotation',
    properties,
  });
}

function emitFloat(nullable: boolean): Nullable<FloatTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'FloatTypeAnnotation',
  });
}

function emitFloatProp(
  name: string,
  optional: boolean,
): NamedShape<EventTypeAnnotation> {
  return {
    name,
    optional,
    typeAnnotation: {
      type: 'FloatTypeAnnotation',
    },
  };
}

function emitUnion(
  nullable: boolean,
  hasteModuleName: string,
  typeAnnotation: $FlowFixMe,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  enumMap: {...NativeModuleEnumMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
  translateTypeAnnotation: $FlowFixMe,
  parser: Parser,
): Nullable<NativeModuleUnionTypeAnnotation> {
  const unparsedMemberTypes: ReadonlyArray<$FlowFixMe> =
    typeAnnotation.types as ReadonlyArray<$FlowFixMe>;

  const memberTypes = unparsedMemberTypes.map(
    (memberType: $FlowFixMe): NativeModuleUnionTypeAnnotationMemberType => {
      const memberTypeAnnotation = translateTypeAnnotation(
        hasteModuleName,
        memberType,
        types,
        aliasMap,
        enumMap,
        tryParse,
        cxxOnly,
        parser,
      );

      switch (memberTypeAnnotation.type) {
        case 'StringTypeAnnotation':
        case 'NumberTypeAnnotation':
        case 'BooleanTypeAnnotation':
        case 'NumberLiteralTypeAnnotation':
        case 'StringLiteralTypeAnnotation':
        case 'BooleanLiteralTypeAnnotation':
        case 'ObjectTypeAnnotation':
        case 'TypeAliasTypeAnnotation':
          return memberTypeAnnotation;
        default:
          throw new UnsupportedTypeAnnotationParserError(
            hasteModuleName,
            memberType,
            parser.language(),
          );
      }
    },
  );

  return wrapNullable(nullable, {
    type: 'UnionTypeAnnotation',
    types: memberTypes,
  });
}

function translateArrayTypeAnnotation(
  hasteModuleName: string,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  enumMap: {...NativeModuleEnumMap},
  cxxOnly: boolean,
  arrayType: 'Array' | 'ReadonlyArray',
  elementType: $FlowFixMe,
  nullable: boolean,
  translateTypeAnnotation: $FlowFixMe,
  parser: Parser,
): Nullable<NativeModuleTypeAnnotation> {
  try {
    /**
     * TODO(T72031674): Migrate all our NativeModule specs to not use
     * invalid Array ElementTypes. Then, make the elementType a required
     * parameter.
     */
    const [_elementType, isElementTypeNullable] = unwrapNullable<$FlowFixMe>(
      translateTypeAnnotation(
        hasteModuleName,
        elementType,
        types,
        aliasMap,
        enumMap,
        /**
         * TODO(T72031674): Ensure that all ParsingErrors that are thrown
         * while parsing the array element don't get captured and collected.
         * Why? If we detect any parsing error while parsing the element,
         * we should default it to null down the line, here. This is
         * the correct behaviour until we migrate all our NativeModule specs
         * to be parseable.
         */
        nullGuard,
        cxxOnly,
        parser,
      ),
    );

    throwIfArrayElementTypeAnnotationIsUnsupported(
      hasteModuleName,
      elementType,
      arrayType,
      _elementType.type,
    );

    return wrapNullable(nullable, {
      type: 'ArrayTypeAnnotation',
      // $FlowFixMe[incompatible-type]
      elementType: wrapNullable(isElementTypeNullable, _elementType),
    });
  } catch (ex) {
    return wrapNullable(nullable, {
      type: 'ArrayTypeAnnotation',
      elementType: {
        type: 'AnyTypeAnnotation',
      },
    });
  }
}

function emitArrayType(
  hasteModuleName: string,
  typeAnnotation: $FlowFixMe,
  parser: Parser,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  enumMap: {...NativeModuleEnumMap},
  cxxOnly: boolean,
  nullable: boolean,
  translateTypeAnnotation: $FlowFixMe,
): Nullable<NativeModuleTypeAnnotation> {
  assertGenericTypeAnnotationHasExactlyOneTypeParameter(
    hasteModuleName,
    typeAnnotation,
    parser,
  );

  return translateArrayTypeAnnotation(
    hasteModuleName,
    types,
    aliasMap,
    enumMap,
    cxxOnly,
    typeAnnotation.type,
    typeAnnotation.typeParameters.params[0],
    nullable,
    translateTypeAnnotation,
    parser,
  );
}

function Visitor(infoMap: {isComponent: boolean, isModule: boolean}): {
  [type: string]: (node: $FlowFixMe) => void,
} {
  return {
    CallExpression(node: $FlowFixMe) {
      if (
        node.callee.type === 'Identifier' &&
        node.callee.name === 'codegenNativeComponent'
      ) {
        infoMap.isComponent = true;
      }

      if (isModuleRegistryCall(node)) {
        infoMap.isModule = true;
      }
    },
    InterfaceExtends(node: $FlowFixMe) {
      if (node.id.name === 'TurboModule') {
        infoMap.isModule = true;
      }
    },
    TSInterfaceDeclaration(node: $FlowFixMe) {
      if (
        Array.isArray(node.extends) &&
        node.extends.some(
          extension => extension.expression.name === 'TurboModule',
        )
      ) {
        infoMap.isModule = true;
      }
    },
  };
}

function emitPartial(
  nullable: boolean,
  hasteModuleName: string,
  typeAnnotation: $FlowFixMe,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  enumMap: {...NativeModuleEnumMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
  parser: Parser,
): Nullable<NativeModuleTypeAnnotation> {
  throwIfPartialWithMoreParameter(typeAnnotation);

  throwIfPartialNotAnnotatingTypeParameter(typeAnnotation, types, parser);

  const annotatedElement = parser.extractAnnotatedElement(
    typeAnnotation,
    types,
  );
  const annotatedElementProperties =
    parser.getAnnotatedElementProperties(annotatedElement);

  const partialProperties = parser.computePartialProperties(
    annotatedElementProperties,
    hasteModuleName,
    types,
    aliasMap,
    enumMap,
    tryParse,
    cxxOnly,
  );

  return emitObject(nullable, partialProperties);
}

function emitCommonTypes(
  hasteModuleName: string,
  types: TypeDeclarationMap,
  typeAnnotation: $FlowFixMe,
  aliasMap: {...NativeModuleAliasMap},
  enumMap: {...NativeModuleEnumMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
  nullable: boolean,
  parser: Parser,
): $FlowFixMe {
  const typeMap = {
    Stringish: emitStringish,
    Int32: emitInt32,
    Double: emitDouble,
    Float: emitFloat,
    UnsafeObject: emitGenericObject,
    Object: emitGenericObject,
    $Partial: emitPartial,
    Partial: emitPartial,
    BooleanTypeAnnotation: emitBoolean,
    NumberTypeAnnotation: emitNumber,
    VoidTypeAnnotation: emitVoid,
    StringTypeAnnotation: emitString,
    MixedTypeAnnotation: cxxOnly ? emitMixed : emitGenericObject,
    UnsafeMixed: cxxOnly ? emitMixed : emitGenericObject,
    unknown: cxxOnly ? emitMixed : emitGenericObject,
    UnknownTypeAnnotation: cxxOnly ? emitMixed : emitGenericObject,
    ArrayBuffer: emitArrayBuffer,
  };

  const typeAnnotationName = parser.convertKeywordToTypeAnnotation(
    typeAnnotation.type,
  );

  // $FlowFixMe[invalid-computed-prop]
  const simpleEmitter = typeMap[typeAnnotationName];
  if (simpleEmitter) {
    return simpleEmitter(nullable);
  }

  const genericTypeAnnotationName =
    parser.getTypeAnnotationName(typeAnnotation);

  // $FlowFixMe[invalid-computed-prop]
  const emitter = typeMap[genericTypeAnnotationName];
  if (!emitter) {
    return null;
  }

  return emitter(
    nullable,
    hasteModuleName,
    typeAnnotation,
    types,
    aliasMap,
    enumMap,
    tryParse,
    cxxOnly,
    parser,
  );
}

function emitBoolProp(
  name: string,
  optional: boolean,
): NamedShape<EventTypeAnnotation> {
  return {
    name,
    optional,
    typeAnnotation: {
      type: 'BooleanTypeAnnotation',
    },
  };
}

function emitMixedProp(
  name: string,
  optional: boolean,
): NamedShape<EventTypeAnnotation> {
  return {
    name,
    optional,
    typeAnnotation: {
      type: 'MixedTypeAnnotation',
    },
  };
}

function emitObjectProp(
  name: string,
  optional: boolean,
  parser: Parser,
  typeAnnotation: $FlowFixMe,
  extractArrayElementType: (
    typeAnnotation: $FlowFixMe,
    name: string,
    parser: Parser,
  ) => EventTypeAnnotation,
): NamedShape<EventTypeAnnotation> {
  return {
    name,
    optional,
    typeAnnotation: extractArrayElementType(typeAnnotation, name, parser),
  };
}

function emitUnionProp(
  name: string,
  optional: boolean,
  parser: Parser,
  typeAnnotation: $FlowFixMe,
): NamedShape<EventTypeAnnotation> {
  return {
    name,
    optional,
    typeAnnotation: {
      type: 'UnionTypeAnnotation',
      types: typeAnnotation.types.map(option => ({
        type: 'StringLiteralTypeAnnotation',
        value: parser.getLiteralValue(option),
      })),
    },
  };
}

module.exports = {
  emitArrayBuffer,
  emitArrayType,
  emitBoolean,
  emitBooleanLiteral,
  emitBoolProp,
  emitDouble,
  emitDoubleProp,
  emitFloat,
  emitFloatProp,
  emitFunction,
  emitInt32,
  emitInt32Prop,
  emitMixedProp,
  emitNumber,
  emitNumberLiteral,
  emitGenericObject,
  emitDictionary,
  emitObject,
  emitPromise,
  emitRootTag,
  emitVoid,
  emitString,
  emitStringish,
  emitStringProp,
  emitStringLiteral,
  emitMixed,
  emitUnion,
  emitPartial,
  emitCommonTypes,
  typeAliasResolution,
  typeEnumResolution,
  translateArrayTypeAnnotation,
  Visitor,
  emitObjectProp,
  emitUnionProp,
};

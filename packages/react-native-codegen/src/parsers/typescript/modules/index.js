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
  NativeModuleAliasMap,
  NativeModuleBaseTypeAnnotation,
  NativeModuleEnumMap,
  NativeModuleTypeAnnotation,
  Nullable,
} from '../../../CodegenSchema';
import type {Parser} from '../../parser';
import type {
  ParserErrorCapturer,
  TypeDeclarationMap,
  TypeResolutionStatus,
} from '../../utils';

const {
  UnsupportedEnumDeclarationParserError,
  UnsupportedGenericParserError,
  UnsupportedObjectPropertyWithIndexerTypeAnnotationParserError,
  UnsupportedTypeAnnotationParserError,
} = require('../../errors');
const {parseObjectProperty} = require('../../parsers-commons');
const {
  emitArrayType,
  emitBooleanLiteral,
  emitCommonTypes,
  emitDictionary,
  emitFunction,
  emitNumberLiteral,
  emitPromise,
  emitRootTag,
  emitStringLiteral,
  emitUnion,
  translateArrayTypeAnnotation,
  typeAliasResolution,
  typeEnumResolution,
} = require('../../parsers-primitives');
const {flattenProperties} = require('../components/componentsUtils');
const {flattenIntersectionType} = require('../parseTopLevelType');

function translateObjectTypeAnnotation(
  hasteModuleName: string,
  /**
   * TODO(T108222691): Use flow-types for @babel/parser
   */
  typeScriptTypeAnnotation: $FlowFixMe,
  nullable: boolean,
  objectMembers: ReadonlyArray<$FlowFixMe>,
  typeResolutionStatus: TypeResolutionStatus,
  baseTypes: ReadonlyArray<string>,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  enumMap: {...NativeModuleEnumMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
  parser: Parser,
): Nullable<NativeModuleTypeAnnotation> {
  // $FlowFixMe[missing-type-arg]
  const properties = objectMembers
    .map<?NamedShape<Nullable<NativeModuleBaseTypeAnnotation>>>(property => {
      return tryParse(() => {
        return parseObjectProperty(
          typeScriptTypeAnnotation,
          property,
          hasteModuleName,
          types,
          aliasMap,
          enumMap,
          tryParse,
          cxxOnly,
          nullable,
          translateTypeAnnotation,
          parser,
        );
      });
    })
    .filter(Boolean);

  let objectTypeAnnotation;
  if (baseTypes.length === 0) {
    objectTypeAnnotation = {
      type: 'ObjectTypeAnnotation',
      properties,
    };
  } else {
    objectTypeAnnotation = {
      type: 'ObjectTypeAnnotation',
      properties,
      baseTypes,
    };
  }

  return typeAliasResolution(
    typeResolutionStatus,
    /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
     * https://fburl.com/workplace/6291gfvu */
    objectTypeAnnotation,
    aliasMap,
    nullable,
  );
}

function translateTypeReferenceAnnotation(
  typeName: string,
  nullable: boolean,
  typeAnnotation: $FlowFixMe,
  hasteModuleName: string,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  enumMap: {...NativeModuleEnumMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
  parser: Parser,
): Nullable<NativeModuleTypeAnnotation> {
  switch (typeName) {
    case 'RootTag': {
      return emitRootTag(nullable);
    }
    case 'Promise': {
      return emitPromise(
        hasteModuleName,
        typeAnnotation,
        parser,
        nullable,
        types,
        aliasMap,
        enumMap,
        tryParse,
        cxxOnly,
        translateTypeAnnotation,
      );
    }
    case 'Array':
    case 'ReadonlyArray': {
      return emitArrayType(
        hasteModuleName,
        typeAnnotation,
        parser,
        types,
        aliasMap,
        enumMap,
        cxxOnly,
        nullable,
        translateTypeAnnotation,
      );
    }
    default: {
      const commonType = emitCommonTypes(
        hasteModuleName,
        types,
        typeAnnotation,
        aliasMap,
        enumMap,
        tryParse,
        cxxOnly,
        nullable,
        parser,
      );

      if (!commonType) {
        throw new UnsupportedGenericParserError(
          hasteModuleName,
          typeAnnotation,
          parser,
        );
      }
      return commonType;
    }
  }
}
function translateTypeAnnotation(
  hasteModuleName: string,
  /**
   * TODO(T108222691): Use flow-types for @babel/parser
   */
  typeScriptTypeAnnotation: $FlowFixMe,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  enumMap: {...NativeModuleEnumMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
  parser: Parser,
): Nullable<NativeModuleTypeAnnotation> {
  const {nullable, typeAnnotation, typeResolutionStatus} =
    parser.getResolvedTypeAnnotation(typeScriptTypeAnnotation, types, parser);
  const resolveTypeaAnnotationFn = parser.getResolveTypeAnnotationFN();
  resolveTypeaAnnotationFn(typeScriptTypeAnnotation, types, parser);

  switch (typeAnnotation.type) {
    case 'TSArrayType': {
      return translateArrayTypeAnnotation(
        hasteModuleName,
        types,
        aliasMap,
        enumMap,
        cxxOnly,
        'Array',
        typeAnnotation.elementType,
        nullable,
        translateTypeAnnotation,
        parser,
      );
    }
    case 'TSTypeOperator': {
      if (
        typeAnnotation.operator === 'readonly' &&
        typeAnnotation.typeAnnotation.type === 'TSArrayType'
      ) {
        return translateArrayTypeAnnotation(
          hasteModuleName,
          types,
          aliasMap,
          enumMap,
          cxxOnly,
          'ReadonlyArray',
          typeAnnotation.typeAnnotation.elementType,
          nullable,
          translateTypeAnnotation,
          parser,
        );
      } else {
        throw new UnsupportedGenericParserError(
          hasteModuleName,
          typeAnnotation,
          parser,
        );
      }
    }
    case 'TSTypeReference': {
      return translateTypeReferenceAnnotation(
        parser.getTypeAnnotationName(typeAnnotation),
        nullable,
        typeAnnotation,
        hasteModuleName,
        types,
        aliasMap,
        enumMap,
        tryParse,
        cxxOnly,
        parser,
      );
    }
    case 'TSInterfaceDeclaration': {
      const baseTypes = (typeAnnotation.extends ?? []).map(
        extend => extend.expression.name,
      );
      for (const baseType of baseTypes) {
        // ensure base types exist and appear in aliasMap
        translateTypeAnnotation(
          hasteModuleName,
          {
            type: 'TSTypeReference',
            typeName: {type: 'Identifier', name: baseType},
          },
          types,
          aliasMap,
          enumMap,
          tryParse,
          cxxOnly,
          parser,
        );
      }

      return translateObjectTypeAnnotation(
        hasteModuleName,
        typeScriptTypeAnnotation,
        nullable,
        flattenProperties([typeAnnotation], types, parser),
        typeResolutionStatus,
        baseTypes,
        types,
        aliasMap,
        enumMap,
        tryParse,
        cxxOnly,
        parser,
      );
    }
    case 'TSIntersectionType': {
      return translateObjectTypeAnnotation(
        hasteModuleName,
        typeScriptTypeAnnotation,
        nullable,
        flattenProperties(
          flattenIntersectionType(typeAnnotation, parser, types),
          types,
          parser,
        ),
        typeResolutionStatus,
        [],
        types,
        aliasMap,
        enumMap,
        tryParse,
        cxxOnly,
        parser,
      );
    }
    case 'TSTypeLiteral': {
      // if there is TSIndexSignature, then it is a dictionary
      if (typeAnnotation.members) {
        const indexSignatures = typeAnnotation.members.filter(
          member => member.type === 'TSIndexSignature',
        );

        const properties = typeAnnotation.members.filter(
          member => member.type === 'TSPropertySignature',
        );

        if (indexSignatures.length > 0 && properties.length > 0) {
          throw new UnsupportedObjectPropertyWithIndexerTypeAnnotationParserError(
            hasteModuleName,
            typeAnnotation,
          );
        }

        if (indexSignatures.length > 0) {
          // check the property type to prevent developers from using unsupported types
          // the return value from `translateTypeAnnotation` is unused
          const propertyType = indexSignatures[0].typeAnnotation;
          const valueType = translateTypeAnnotation(
            hasteModuleName,
            propertyType,
            types,
            aliasMap,
            enumMap,
            tryParse,
            cxxOnly,
            parser,
          );
          // no need to do further checking
          return emitDictionary(nullable, valueType);
        }
      }

      return translateObjectTypeAnnotation(
        hasteModuleName,
        typeScriptTypeAnnotation,
        nullable,
        typeAnnotation.members,
        typeResolutionStatus,
        [],
        types,
        aliasMap,
        enumMap,
        tryParse,
        cxxOnly,
        parser,
      );
    }
    case 'TSEnumDeclaration': {
      if (
        typeAnnotation.members.some(
          m =>
            m.initializer &&
            m.initializer.type === 'NumericLiteral' &&
            !Number.isInteger(m.initializer.value),
        )
      ) {
        throw new UnsupportedEnumDeclarationParserError(
          hasteModuleName,
          typeAnnotation,
          parser.language(),
        );
      }
      return typeEnumResolution(
        typeAnnotation,
        typeResolutionStatus,
        nullable,
        hasteModuleName,
        enumMap,
        parser,
      );
    }
    case 'TSFunctionType': {
      return emitFunction(
        nullable,
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
    }
    case 'TSUnionType': {
      return emitUnion(
        nullable,
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
    }
    case 'TSLiteralType': {
      const literal = typeAnnotation.literal;
      switch (literal.type) {
        case 'StringLiteral': {
          return emitStringLiteral(nullable, literal.value);
        }
        case 'NumericLiteral': {
          return emitNumberLiteral(nullable, literal.value);
        }
        case 'BooleanLiteral': {
          return emitBooleanLiteral(nullable, literal.value);
        }
        default: {
          throw new UnsupportedTypeAnnotationParserError(
            hasteModuleName,
            typeAnnotation,
            parser.language(),
          );
        }
      }
    }
    default: {
      const commonType = emitCommonTypes(
        hasteModuleName,
        types,
        typeAnnotation,
        aliasMap,
        enumMap,
        tryParse,
        cxxOnly,
        nullable,
        parser,
      );

      if (!commonType) {
        throw new UnsupportedTypeAnnotationParserError(
          hasteModuleName,
          typeAnnotation,
          parser.language(),
        );
      }
      return commonType;
    }
  }
}

module.exports = {
  typeScriptTranslateTypeAnnotation: translateTypeAnnotation,
};

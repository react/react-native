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
import type {ParserErrorCapturer, TypeDeclarationMap} from '../../utils';

const {
  UnsupportedEnumDeclarationParserError,
  UnsupportedGenericParserError,
  UnsupportedObjectPropertyWithIndexerTypeAnnotationParserError,
  UnsupportedTypeAnnotationParserError,
} = require('../../errors');
const {
  assertGenericTypeAnnotationHasExactlyOneTypeParameter,
  parseObjectProperty,
  unwrapNullable,
  wrapNullable,
} = require('../../parsers-commons');
const {
  emitArrayType,
  emitBooleanLiteral,
  emitCommonTypes,
  emitDictionary,
  emitFunction,
  emitNumberLiteral,
  emitPromise,
  emitRootTag,
  emitUnion,
  translateArrayTypeAnnotation,
  typeAliasResolution,
  typeEnumResolution,
} = require('../../parsers-primitives');

function translateTypeAnnotation(
  hasteModuleName: string,
  /**
   * TODO(T71778680): Flow-type this node.
   */
  flowTypeAnnotation: $FlowFixMe,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  enumMap: {...NativeModuleEnumMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
  parser: Parser,
): Nullable<NativeModuleTypeAnnotation> {
  const resolveTypeAnnotationFN = parser.getResolveTypeAnnotationFN();
  const {nullable, typeAnnotation, typeResolutionStatus} =
    resolveTypeAnnotationFN(flowTypeAnnotation, types, parser);

  switch (typeAnnotation.type) {
    case 'ArrayTypeAnnotation': {
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
    case 'GenericTypeAnnotation': {
      switch (parser.getTypeAnnotationName(typeAnnotation)) {
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
        case '$ReadOnlyArray':
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
        case '$ReadOnly':
        case 'Readonly': {
          assertGenericTypeAnnotationHasExactlyOneTypeParameter(
            hasteModuleName,
            typeAnnotation,
            parser,
          );

          const [paramType, isParamNullable] = unwrapNullable(
            translateTypeAnnotation(
              hasteModuleName,
              typeAnnotation.typeParameters.params[0],
              types,
              aliasMap,
              enumMap,
              tryParse,
              cxxOnly,
              parser,
            ),
          );

          return wrapNullable(nullable || isParamNullable, paramType);
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
    case 'ObjectTypeAnnotation': {
      // if there is any indexer, then it is a dictionary
      if (typeAnnotation.indexers) {
        const indexers = typeAnnotation.indexers.filter(
          member => member.type === 'ObjectTypeIndexer',
        );

        if (indexers.length > 0 && typeAnnotation.properties.length > 0) {
          throw new UnsupportedObjectPropertyWithIndexerTypeAnnotationParserError(
            hasteModuleName,
            typeAnnotation,
          );
        }

        if (indexers.length > 0) {
          // check the property type to prevent developers from using unsupported types
          // the return value from `translateTypeAnnotation` is unused
          const propertyType = indexers[0].value;
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

      const objectTypeAnnotation = {
        type: 'ObjectTypeAnnotation',
        // $FlowFixMe[missing-type-arg]
        properties: (
          [
            ...typeAnnotation.properties,
            ...typeAnnotation.indexers,
          ] as Array<$FlowFixMe>
        )
          .map<?NamedShape<Nullable<NativeModuleBaseTypeAnnotation>>>(
            property => {
              return tryParse(() => {
                return parseObjectProperty(
                  flowTypeAnnotation,
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
            },
          )
          .filter(Boolean),
      };

      return typeAliasResolution(
        typeResolutionStatus,
        /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
         * https://fburl.com/workplace/6291gfvu */
        objectTypeAnnotation,
        aliasMap,
        nullable,
      );
    }
    case 'FunctionTypeAnnotation': {
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
    case 'UnionTypeAnnotation': {
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
    case 'NumberLiteralTypeAnnotation': {
      return emitNumberLiteral(nullable, typeAnnotation.value);
    }
    case 'BooleanLiteralTypeAnnotation': {
      return emitBooleanLiteral(nullable, typeAnnotation.value);
    }
    case 'StringLiteralTypeAnnotation': {
      return wrapNullable(nullable, {
        type: 'StringLiteralTypeAnnotation',
        value: typeAnnotation.value,
      });
    }
    case 'EnumStringBody':
    case 'EnumNumberBody': {
      if (
        typeAnnotation.type === 'EnumNumberBody' &&
        typeAnnotation.members.some(
          m =>
            m.type === 'EnumNumberMember' && !Number.isInteger(m.init?.value),
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
  flowTranslateTypeAnnotation: translateTypeAnnotation,
};

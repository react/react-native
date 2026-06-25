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
  ExtendsPropsShape,
  NamedShape,
  NativeModuleAliasMap,
  NativeModuleEnumMap,
  NativeModuleEnumMember,
  NativeModuleEnumMemberType,
  NativeModuleParamTypeAnnotation,
  NativeModuleUnionTypeAnnotationMemberType,
  Nullable,
  PropTypeAnnotation,
  SchemaType,
} from '../../CodegenSchema';
import type {ParserType} from '../errors';
import type {
  GetSchemaInfoFN,
  GetTypeAnnotationFN,
  Parser,
  ResolveTypeAnnotationFN,
} from '../parser';
import type {
  ParserErrorCapturer,
  PropAST,
  TypeDeclarationMap,
  TypeResolutionStatus,
} from '../utils';

const {
  UnsupportedObjectPropertyTypeAnnotationParserError,
} = require('../errors');
const {
  buildModuleSchema,
  buildPropSchema,
  buildSchema,
  extendsForProp,
  handleGenericTypeAnnotation,
} = require('../parsers-commons.js');
const {Visitor} = require('../parsers-primitives');
const {wrapComponentSchema} = require('../schema.js');
const {buildComponentSchema} = require('./components');
const {
  flattenProperties,
  getSchemaInfo,
  getTypeAnnotation,
} = require('./components/componentsUtils');
const {typeScriptTranslateTypeAnnotation} = require('./modules');
const {parseTopLevelType} = require('./parseTopLevelType');
// $FlowFixMe[untyped-import] Use flow-types for @babel/parser
const babelParser = require('@babel/parser');
const fs = require('fs');
const invariant = require('invariant');

class TypeScriptParser implements Parser {
  typeParameterInstantiation: string = 'TSTypeParameterInstantiation';
  typeAlias: string = 'TSTypeAliasDeclaration';
  enumDeclaration: string = 'TSEnumDeclaration';
  interfaceDeclaration: string = 'TSInterfaceDeclaration';
  nullLiteralTypeAnnotation: string = 'TSNullKeyword';
  undefinedLiteralTypeAnnotation: string = 'TSUndefinedKeyword';

  isProperty(property: $FlowFixMe): boolean {
    return property.type === 'TSPropertySignature';
  }

  getKeyName(property: $FlowFixMe, hasteModuleName: string): string {
    if (!this.isProperty(property)) {
      throw new UnsupportedObjectPropertyTypeAnnotationParserError(
        hasteModuleName,
        property,
        property.type,
        this.language(),
      );
    }
    return property.key.name;
  }

  language(): ParserType {
    return 'TypeScript';
  }

  getTypeAnnotationName(typeAnnotation: $FlowFixMe): string {
    if (typeAnnotation?.typeName?.type === 'TSQualifiedName') {
      return typeAnnotation.typeName.right.name;
    }

    return typeAnnotation?.typeName?.name;
  }

  checkIfInvalidModule(typeArguments: $FlowFixMe): boolean {
    return (
      typeArguments.type !== 'TSTypeParameterInstantiation' ||
      typeArguments.params.length !== 1 ||
      typeArguments.params[0].type !== 'TSTypeReference' ||
      typeArguments.params[0].typeName.name !== 'Spec'
    );
  }

  remapUnionTypeAnnotationMemberNames(
    membersTypes: Array<$FlowFixMe>,
  ): Array<NativeModuleUnionTypeAnnotationMemberType> {
    const remapLiteral = (item: $FlowFixMe) => {
      return item.literal
        ? item.literal.type
            .replace('NumericLiteral', 'NumberTypeAnnotation')
            .replace('StringLiteral', 'StringTypeAnnotation')
        : 'ObjectTypeAnnotation';
    };

    /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
     * https://fburl.com/workplace/6291gfvu */
    return [...new Set(membersTypes.map(remapLiteral))];
  }

  parseFile(filename: string): SchemaType {
    const contents = fs.readFileSync(filename, 'utf8');

    return this.parseString(contents, filename);
  }

  parseString(contents: string, filename: ?string): SchemaType {
    return buildSchema(
      contents,
      filename,
      wrapComponentSchema,
      buildComponentSchema,
      buildModuleSchema,
      Visitor,
      this,
      typeScriptTranslateTypeAnnotation,
    );
  }

  parseModuleFixture(filename: string): SchemaType {
    const contents = fs.readFileSync(filename, 'utf8');

    return this.parseString(contents, 'path/NativeSampleTurboModule.ts');
  }

  getAst(contents: string, filename?: ?string): $FlowFixMe {
    return babelParser.parse(contents, {
      sourceType: 'module',
      plugins: ['typescript'],
    }).program;
  }

  getFunctionTypeAnnotationParameters(
    functionTypeAnnotation: $FlowFixMe,
  ): ReadonlyArray<$FlowFixMe> {
    return functionTypeAnnotation.parameters;
  }

  getFunctionNameFromParameter(
    parameter: NamedShape<Nullable<NativeModuleParamTypeAnnotation>>,
  ): $FlowFixMe {
    return parameter.typeAnnotation;
  }

  getParameterName(parameter: $FlowFixMe): string {
    return parameter.name;
  }

  getParameterTypeAnnotation(parameter: $FlowFixMe): $FlowFixMe {
    return parameter.typeAnnotation.typeAnnotation;
  }

  getFunctionTypeAnnotationReturnType(
    functionTypeAnnotation: $FlowFixMe,
  ): $FlowFixMe {
    return functionTypeAnnotation.typeAnnotation.typeAnnotation;
  }

  parseEnumMembersType(typeAnnotation: $FlowFixMe): NativeModuleEnumMemberType {
    const enumInitializer = typeAnnotation.members[0]?.initializer;
    const enumInitializerType = enumInitializer?.type;

    let enumMembersType: ?NativeModuleEnumMemberType = null;

    if (!enumInitializerType) {
      return 'StringTypeAnnotation';
    }

    switch (enumInitializerType) {
      case 'StringLiteral':
        enumMembersType = 'StringTypeAnnotation';
        break;
      case 'NumericLiteral':
        enumMembersType = 'NumberTypeAnnotation';
        break;
      case 'UnaryExpression':
        if (enumInitializer.operator === '-') {
          enumMembersType = 'NumberTypeAnnotation';
        }
        break;
      default:
        enumMembersType = null;
    }

    if (!enumMembersType) {
      throw new Error(
        'Enum values must be either blank, number, or string values.',
      );
    }
    return enumMembersType;
  }

  validateEnumMembersSupported(
    typeAnnotation: $FlowFixMe,
    enumMembersType: NativeModuleEnumMemberType,
  ): void {
    if (!typeAnnotation.members || typeAnnotation.members.length === 0) {
      throw new Error('Enums should have at least one member.');
    }

    const enumInitializerType =
      enumMembersType === 'StringTypeAnnotation'
        ? 'StringLiteral'
        : enumMembersType === 'NumberTypeAnnotation'
          ? 'NumericLiteral'
          : null;

    typeAnnotation.members.forEach(member => {
      const isNegative =
        member.initializer?.type === 'UnaryExpression' &&
        member.initializer?.operator === '-';
      const initializerType = isNegative
        ? member.initializer?.argument?.type
        : member.initializer?.type;

      if ((initializerType ?? 'StringLiteral') !== enumInitializerType) {
        throw new Error(
          'Enum values can not be mixed. They all must be either blank, number, or string values.',
        );
      }
    });
  }

  parseEnumMembers(
    typeAnnotation: $FlowFixMe,
  ): ReadonlyArray<NativeModuleEnumMember> {
    return typeAnnotation.members.map(member => {
      const value =
        member.initializer?.operator === '-'
          ? {
              type: 'NumberLiteralTypeAnnotation',
              value: -1 * member.initializer?.argument?.value,
            }
          : typeof member.initializer?.value === 'number'
            ? {
                type: 'NumberLiteralTypeAnnotation',
                value: member.initializer?.value,
              }
            : typeof member.initializer?.value === 'string'
              ? {
                  type: 'StringLiteralTypeAnnotation',
                  value: member.initializer?.value,
                }
              : {
                  type: 'StringLiteralTypeAnnotation',
                  value: member.id.name,
                };

      return {
        name: member.id.name,
        value,
      };
    });
  }

  isModuleInterface(node: $FlowFixMe): boolean {
    return (
      node.type === 'TSInterfaceDeclaration' &&
      node.extends?.length === 1 &&
      node.extends[0].type === 'TSExpressionWithTypeArguments' &&
      node.extends[0].expression.name === 'TurboModule'
    );
  }

  isGenericTypeAnnotation(type: $FlowFixMe): boolean {
    return type === 'TSTypeReference';
  }

  extractAnnotatedElement(
    typeAnnotation: $FlowFixMe,
    types: TypeDeclarationMap,
  ): $FlowFixMe {
    return types[typeAnnotation.typeParameters.params[0].typeName.name];
  }

  // TODO(T108222691): Use flow-types for @babel/parser
  getTypes(ast: $FlowFixMe): TypeDeclarationMap {
    return ast.body.reduce((types, node) => {
      switch (node.type) {
        case 'ExportNamedDeclaration': {
          if (node.declaration) {
            switch (node.declaration.type) {
              case 'TSTypeAliasDeclaration':
              case 'TSInterfaceDeclaration':
              case 'TSEnumDeclaration': {
                types[node.declaration.id.name] = node.declaration;
                break;
              }
            }
          }
          break;
        }
        case 'TSTypeAliasDeclaration':
        case 'TSInterfaceDeclaration':
        case 'TSEnumDeclaration': {
          types[node.id.name] = node;
          break;
        }
      }
      return types;
    }, {});
  }

  callExpressionTypeParameters(callExpression: $FlowFixMe): $FlowFixMe | null {
    return callExpression.typeParameters || null;
  }

  computePartialProperties(
    properties: Array<$FlowFixMe>,
    hasteModuleName: string,
    types: TypeDeclarationMap,
    aliasMap: {...NativeModuleAliasMap},
    enumMap: {...NativeModuleEnumMap},
    tryParse: ParserErrorCapturer,
    cxxOnly: boolean,
  ): Array<$FlowFixMe> {
    return properties.map(prop => {
      return {
        name: prop.key.name,
        optional: true,
        typeAnnotation: typeScriptTranslateTypeAnnotation(
          hasteModuleName,
          prop.typeAnnotation.typeAnnotation,
          types,
          aliasMap,
          enumMap,
          tryParse,
          cxxOnly,
          this,
        ),
      };
    });
  }

  functionTypeAnnotation(propertyValueType: string): boolean {
    return (
      propertyValueType === 'TSFunctionType' ||
      propertyValueType === 'TSMethodSignature'
    );
  }

  getTypeArgumentParamsFromDeclaration(declaration: $FlowFixMe): $FlowFixMe {
    return declaration.typeParameters.params;
  }

  // This FlowFixMe is supposed to refer to typeArgumentParams and funcArgumentParams of generated AST.
  getNativeComponentType(
    typeArgumentParams: $FlowFixMe,
    funcArgumentParams: $FlowFixMe,
  ): {[string]: string} {
    return {
      propsTypeName: typeArgumentParams[0].typeName.name,
      componentName: funcArgumentParams[0].value,
    };
  }

  getAnnotatedElementProperties(annotatedElement: $FlowFixMe): $FlowFixMe {
    return annotatedElement.typeAnnotation.members;
  }

  bodyProperties(typeAlias: TypeDeclarationMap): ReadonlyArray<$FlowFixMe> {
    return typeAlias.body.body;
  }

  convertKeywordToTypeAnnotation(keyword: string): string {
    switch (keyword) {
      case 'TSArrayType':
        return 'ArrayTypeAnnotation';
      case 'TSBooleanKeyword':
        return 'BooleanTypeAnnotation';
      case 'TSNumberKeyword':
        return 'NumberTypeAnnotation';
      case 'TSVoidKeyword':
        return 'VoidTypeAnnotation';
      case 'TSStringKeyword':
        return 'StringTypeAnnotation';
      case 'TSTypeLiteral':
        return 'ObjectTypeAnnotation';
      case 'TSUnknownKeyword':
        return 'MixedTypeAnnotation';
    }

    return keyword;
  }

  argumentForProp(prop: PropAST): $FlowFixMe {
    return prop.expression;
  }

  nameForArgument(prop: PropAST): $FlowFixMe {
    return prop.expression.name;
  }

  isOptionalProperty(property: $FlowFixMe): boolean {
    return property.optional || false;
  }

  getGetSchemaInfoFN(): GetSchemaInfoFN {
    return getSchemaInfo;
  }

  getTypeAnnotationFromProperty(property: PropAST): $FlowFixMe {
    return property.typeAnnotation.typeAnnotation;
  }

  getGetTypeAnnotationFN(): GetTypeAnnotationFN {
    return getTypeAnnotation;
  }

  getResolvedTypeAnnotation(
    // TODO(T108222691): Use flow-types for @babel/parser
    typeAnnotation: $FlowFixMe,
    types: TypeDeclarationMap,
    parser: Parser,
  ): {
    nullable: boolean,
    typeAnnotation: $FlowFixMe,
    typeResolutionStatus: TypeResolutionStatus,
  } {
    invariant(
      typeAnnotation != null,
      'resolveTypeAnnotation(): typeAnnotation cannot be null',
    );

    let node =
      typeAnnotation.type === 'TSTypeAnnotation'
        ? typeAnnotation.typeAnnotation
        : typeAnnotation;
    let nullable = false;
    let typeResolutionStatus: TypeResolutionStatus = {
      successful: false,
    };

    for (;;) {
      const topLevelType = parseTopLevelType(node, parser);
      nullable = nullable || topLevelType.optional;
      node = topLevelType.type;

      if (node.type !== 'TSTypeReference') {
        break;
      }

      const typeAnnotationName = this.getTypeAnnotationName(node);
      const resolvedTypeAnnotation = types[typeAnnotationName];
      if (resolvedTypeAnnotation == null) {
        break;
      }

      const {typeAnnotation: typeAnnotationNode, typeResolutionStatus: status} =
        handleGenericTypeAnnotation(node, resolvedTypeAnnotation, this);
      typeResolutionStatus = status;
      node = typeAnnotationNode;
    }

    return {
      nullable: nullable,
      typeAnnotation: node,
      typeResolutionStatus,
    };
  }

  getResolveTypeAnnotationFN(): ResolveTypeAnnotationFN {
    return (
      typeAnnotation: $FlowFixMe,
      types: TypeDeclarationMap,
      parser: Parser,
    ) => {
      return this.getResolvedTypeAnnotation(typeAnnotation, types, parser);
    };
  }

  isEvent(typeAnnotation: $FlowFixMe): boolean {
    if (typeAnnotation.type !== 'TSTypeReference') {
      return false;
    }
    const eventNames = new Set(['BubblingEventHandler', 'DirectEventHandler']);
    return eventNames.has(this.getTypeAnnotationName(typeAnnotation));
  }

  isProp(name: string, typeAnnotation: $FlowFixMe): boolean {
    if (typeAnnotation.type !== 'TSTypeReference') {
      return true;
    }
    const isStyle =
      name === 'style' &&
      typeAnnotation.type === 'GenericTypeAnnotation' &&
      this.getTypeAnnotationName(typeAnnotation) === 'ViewStyleProp';
    return !isStyle;
  }

  getProps(
    typeDefinition: ReadonlyArray<PropAST>,
    types: TypeDeclarationMap,
  ): {
    props: ReadonlyArray<NamedShape<PropTypeAnnotation>>,
    extendsProps: ReadonlyArray<ExtendsPropsShape>,
  } {
    const extendsProps: Array<ExtendsPropsShape> = [];
    const componentPropAsts: Array<PropAST> = [];
    const remaining: Array<PropAST> = [];

    for (const prop of typeDefinition) {
      // find extends
      if (prop.type === 'TSExpressionWithTypeArguments') {
        const extend = extendsForProp(prop, types, this);
        if (extend) {
          extendsProps.push(extend);
          continue;
        }
      }

      remaining.push(prop);
    }

    // find events and props
    for (const prop of flattenProperties(remaining, types, this)) {
      const topLevelType = parseTopLevelType(
        prop.typeAnnotation.typeAnnotation,
        this,
        types,
      );

      if (
        prop.type === 'TSPropertySignature' &&
        !this.isEvent(topLevelType.type) &&
        this.isProp(prop.key.name, prop)
      ) {
        componentPropAsts.push(prop);
      }
    }

    return {
      props: componentPropAsts
        .map(property => buildPropSchema(property, types, this))
        .filter(Boolean),
      extendsProps,
    };
  }

  getProperties(typeName: string, types: TypeDeclarationMap): $FlowFixMe {
    const alias = types[typeName];
    if (!alias) {
      throw new Error(
        `Failed to find definition for "${typeName}", please check that you have a valid codegen typescript file`,
      );
    }
    const aliasKind =
      alias.type === 'TSInterfaceDeclaration' ? 'interface' : 'type';

    try {
      if (aliasKind === 'interface') {
        return [...(alias.extends ?? []), ...alias.body.body];
      }

      return (
        alias.typeAnnotation.members ||
        alias.typeAnnotation.typeParameters.params[0].members ||
        alias.typeAnnotation.typeParameters.params
      );
    } catch (e) {
      throw new Error(
        `Failed to find ${aliasKind} definition for "${typeName}", please check that you have a valid codegen typescript file`,
      );
    }
  }

  nextNodeForTypeAlias(typeAnnotation: $FlowFixMe): $FlowFixMe {
    return typeAnnotation.typeAnnotation;
  }

  nextNodeForEnum(typeAnnotation: $FlowFixMe): $FlowFixMe {
    return typeAnnotation;
  }

  genericTypeAnnotationErrorMessage(typeAnnotation: $FlowFixMe): string {
    return `A non GenericTypeAnnotation must be a type declaration ('${this.typeAlias}'), an interface ('${this.interfaceDeclaration}'), or enum ('${this.enumDeclaration}'). Instead, got the unsupported ${typeAnnotation.type}.`;
  }

  extractTypeFromTypeAnnotation(typeAnnotation: $FlowFixMe): string {
    return typeAnnotation.type === 'TSTypeReference'
      ? typeAnnotation.typeName.name
      : typeAnnotation.type;
  }

  getObjectProperties(typeAnnotation: $FlowFixMe): $FlowFixMe {
    return typeAnnotation.members;
  }

  getLiteralValue(option: $FlowFixMe): $FlowFixMe {
    return option.literal.value;
  }

  getPaperTopLevelNameDeprecated(typeAnnotation: $FlowFixMe): $FlowFixMe {
    return typeAnnotation.typeParameters.params.length > 1
      ? typeAnnotation.typeParameters.params[1].literal.value
      : null;
  }
}

module.exports = {
  TypeScriptParser,
};

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
  handleGenericTypeAnnotation,
} = require('../parsers-commons');
const {Visitor} = require('../parsers-primitives');
const {wrapComponentSchema} = require('../schema.js');
const {buildComponentSchema} = require('./components');
const {
  flattenProperties,
  getSchemaInfo,
  getTypeAnnotation,
} = require('./components/componentsUtils');
const {flowTranslateTypeAnnotation} = require('./modules');
const {parseFlowAndThrowErrors} = require('./parseFlowAndThrowErrors');
const fs = require('fs');
const invariant = require('invariant');

type ExtendsForProp = null | {
  type: 'ReactNativeBuiltInType',
  knownTypeName: 'ReactNativeCoreViewProps',
};

class FlowParser implements Parser {
  typeParameterInstantiation: string = 'TypeParameterInstantiation';
  typeAlias: string = 'TypeAlias';
  enumDeclaration: string = 'EnumDeclaration';
  interfaceDeclaration: string = 'InterfaceDeclaration';
  nullLiteralTypeAnnotation: string = 'NullLiteralTypeAnnotation';
  undefinedLiteralTypeAnnotation: string = 'VoidLiteralTypeAnnotation';

  isProperty(property: $FlowFixMe): boolean {
    return property.type === 'ObjectTypeProperty';
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
    return 'Flow';
  }

  getTypeAnnotationName(typeAnnotation: $FlowFixMe): string {
    if (typeAnnotation?.id?.type === 'QualifiedTypeIdentifier') {
      return typeAnnotation.id.id.name;
    }

    return typeAnnotation?.id?.name;
  }

  checkIfInvalidModule(typeArguments: $FlowFixMe): boolean {
    return (
      typeArguments.type !== 'TypeParameterInstantiation' ||
      typeArguments.params.length !== 1 ||
      typeArguments.params[0].type !== 'GenericTypeAnnotation' ||
      typeArguments.params[0].id.name !== 'Spec'
    );
  }

  remapUnionTypeAnnotationMemberNames(
    membersTypes: $FlowFixMe[],
  ): NativeModuleUnionTypeAnnotationMemberType[] {
    const remapLiteral = (item: $FlowFixMe) => {
      return item.type
        .replace('NumberLiteralTypeAnnotation', 'NumberTypeAnnotation')
        .replace('StringLiteralTypeAnnotation', 'StringTypeAnnotation');
    };

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
      flowTranslateTypeAnnotation,
    );
  }

  parseModuleFixture(filename: string): SchemaType {
    const contents = fs.readFileSync(filename, 'utf8');

    return this.parseString(contents, 'path/NativeSampleTurboModule.js');
  }

  getAst(contents: string, filename?: ?string): $FlowFixMe {
    return parseFlowAndThrowErrors(contents, {filename});
  }

  getFunctionTypeAnnotationParameters(
    functionTypeAnnotation: $FlowFixMe,
  ): ReadonlyArray<$FlowFixMe> {
    return functionTypeAnnotation.params;
  }

  getFunctionNameFromParameter(
    parameter: NamedShape<Nullable<NativeModuleParamTypeAnnotation>>,
  ): $FlowFixMe {
    return parameter.name;
  }

  getParameterName(parameter: $FlowFixMe): string {
    return parameter.name.name;
  }

  getParameterTypeAnnotation(parameter: $FlowFixMe): $FlowFixMe {
    return parameter.typeAnnotation;
  }

  getFunctionTypeAnnotationReturnType(
    functionTypeAnnotation: $FlowFixMe,
  ): $FlowFixMe {
    return functionTypeAnnotation.returnType;
  }

  parseEnumMembersType(typeAnnotation: $FlowFixMe): NativeModuleEnumMemberType {
    const enumMembersType: ?NativeModuleEnumMemberType =
      typeAnnotation.type === 'EnumStringBody'
        ? 'StringTypeAnnotation'
        : typeAnnotation.type === 'EnumNumberBody'
          ? 'NumberTypeAnnotation'
          : null;
    if (!enumMembersType) {
      throw new Error(
        `Unknown enum type annotation type. Got: ${typeAnnotation.type}. Expected: EnumStringBody or EnumNumberBody.`,
      );
    }
    return enumMembersType;
  }

  validateEnumMembersSupported(
    typeAnnotation: $FlowFixMe,
    enumMembersType: NativeModuleEnumMemberType,
  ): void {
    if (!typeAnnotation.members || typeAnnotation.members.length === 0) {
      // passing mixed members to flow would result in a flow error
      // if the tool is launched ignoring that error, the enum would appear like not having enums
      throw new Error(
        'Enums should have at least one member and member values can not be mixed- they all must be either blank, number, or string values.',
      );
    }

    typeAnnotation.members.forEach(member => {
      if (
        enumMembersType === 'StringTypeAnnotation' &&
        (!member.init || typeof member.init.value === 'string')
      ) {
        return;
      }

      if (
        enumMembersType === 'NumberTypeAnnotation' &&
        member.init &&
        typeof member.init.value === 'number'
      ) {
        return;
      }

      throw new Error(
        'Enums can not be mixed- they all must be either blank, number, or string values.',
      );
    });
  }

  parseEnumMembers(
    typeAnnotation: $FlowFixMe,
  ): ReadonlyArray<NativeModuleEnumMember> {
    return typeAnnotation.members.map(member => {
      const value =
        typeof member.init?.value === 'number'
          ? {
              type: 'NumberLiteralTypeAnnotation',
              value: member.init.value,
            }
          : typeof member.init?.value === 'string'
            ? {
                type: 'StringLiteralTypeAnnotation',
                value: member.init.value,
              }
            : {
                type: 'StringLiteralTypeAnnotation',
                value: member.id.name,
              };

      return {
        name: member.id.name,
        value: value,
      };
    });
  }

  isModuleInterface(node: $FlowFixMe): boolean {
    return (
      node.type === 'InterfaceDeclaration' &&
      node.extends.length === 1 &&
      node.extends[0].type === 'InterfaceExtends' &&
      node.extends[0].id.name === 'TurboModule'
    );
  }

  isGenericTypeAnnotation(type: $FlowFixMe): boolean {
    return type === 'GenericTypeAnnotation';
  }

  extractAnnotatedElement(
    typeAnnotation: $FlowFixMe,
    types: TypeDeclarationMap,
  ): $FlowFixMe {
    return types[typeAnnotation.typeParameters.params[0].id.name];
  }

  // TODO(T71778680): Flow type AST Nodes
  getTypes(ast: $FlowFixMe): TypeDeclarationMap {
    return ast.body.reduce((types, node) => {
      if (
        node.type === 'ExportNamedDeclaration' &&
        node.exportKind === 'type'
      ) {
        if (
          node.declaration != null &&
          (node.declaration.type === 'TypeAlias' ||
            node.declaration.type === 'OpaqueType' ||
            node.declaration.type === 'InterfaceDeclaration')
        ) {
          types[node.declaration.id.name] = node.declaration;
        }
      } else if (
        node.type === 'ExportNamedDeclaration' &&
        node.exportKind === 'value' &&
        node.declaration &&
        node.declaration.type === 'EnumDeclaration'
      ) {
        types[node.declaration.id.name] = node.declaration;
      } else if (
        node.type === 'TypeAlias' ||
        node.type === 'OpaqueType' ||
        node.type === 'InterfaceDeclaration' ||
        node.type === 'EnumDeclaration'
      ) {
        types[node.id.name] = node;
      }
      return types;
    }, {});
  }

  callExpressionTypeParameters(callExpression: $FlowFixMe): $FlowFixMe | null {
    return callExpression.typeArguments || null;
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
        typeAnnotation: flowTranslateTypeAnnotation(
          hasteModuleName,
          prop.value,
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
    return propertyValueType === 'FunctionTypeAnnotation';
  }

  getTypeArgumentParamsFromDeclaration(declaration: $FlowFixMe): $FlowFixMe {
    return declaration.typeArguments.params;
  }

  /**
   * This FlowFixMe is supposed to refer to typeArgumentParams and
   * funcArgumentParams of generated AST.
   */
  getNativeComponentType(
    typeArgumentParams: $FlowFixMe,
    funcArgumentParams: $FlowFixMe,
  ): {[string]: string} {
    return {
      propsTypeName: typeArgumentParams[0].id.name,
      componentName: funcArgumentParams[0].value,
    };
  }

  getAnnotatedElementProperties(annotatedElement: $FlowFixMe): $FlowFixMe {
    return annotatedElement.right.properties;
  }

  bodyProperties(typeAlias: $FlowFixMe): ReadonlyArray<$FlowFixMe> {
    return typeAlias.body.properties;
  }

  convertKeywordToTypeAnnotation(keyword: string): string {
    return keyword;
  }

  argumentForProp(prop: PropAST): $FlowFixMe {
    return prop.argument;
  }

  nameForArgument(prop: PropAST): $FlowFixMe {
    return prop.argument.id.name;
  }

  isOptionalProperty(property: $FlowFixMe): boolean {
    return (
      property.value.type === 'NullableTypeAnnotation' || property.optional
    );
  }

  getGetSchemaInfoFN(): GetSchemaInfoFN {
    return getSchemaInfo;
  }

  getTypeAnnotationFromProperty(property: PropAST): $FlowFixMe {
    return property.value.type === 'NullableTypeAnnotation'
      ? property.value.typeAnnotation
      : property.value;
  }

  getGetTypeAnnotationFN(): GetTypeAnnotationFN {
    return getTypeAnnotation;
  }

  getResolvedTypeAnnotation(
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

    let node = typeAnnotation;
    let nullable = false;
    let typeResolutionStatus: TypeResolutionStatus = {
      successful: false,
    };

    for (;;) {
      if (node.type === 'NullableTypeAnnotation') {
        nullable = true;
        node = node.typeAnnotation;
        continue;
      }

      if (node.type !== 'GenericTypeAnnotation') {
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
    return (typeAnnotation, types, parser) =>
      this.getResolvedTypeAnnotation(typeAnnotation, types, parser);
  }
  extendsForProp(
    prop: PropAST,
    types: TypeDeclarationMap,
    parser: Parser,
  ): ExtendsForProp {
    const argument = this.argumentForProp(prop);
    if (!argument) {
      console.log('null', prop);
    }
    const name = parser.nameForArgument(prop);

    if (types[name] != null) {
      // This type is locally defined in the file
      return null;
    }

    switch (name) {
      case 'ViewProps':
        return {
          type: 'ReactNativeBuiltInType',
          knownTypeName: 'ReactNativeCoreViewProps',
        };
      default: {
        throw new Error(`Unable to handle prop spread: ${name}`);
      }
    }
  }

  removeKnownExtends(
    typeDefinition: ReadonlyArray<PropAST>,
    types: TypeDeclarationMap,
  ): ReadonlyArray<PropAST> {
    return typeDefinition.filter(
      prop =>
        prop.type !== 'ObjectTypeSpreadProperty' ||
        this.extendsForProp(prop, types, this) === null,
    );
  }

  getExtendsProps(
    typeDefinition: ReadonlyArray<PropAST>,
    types: TypeDeclarationMap,
  ): ReadonlyArray<ExtendsPropsShape> {
    return typeDefinition
      .filter(prop => prop.type === 'ObjectTypeSpreadProperty')
      .map(prop => this.extendsForProp(prop, types, this))
      .filter(Boolean);
  }

  getProps(
    typeDefinition: ReadonlyArray<PropAST>,
    types: TypeDeclarationMap,
  ): {
    props: ReadonlyArray<NamedShape<PropTypeAnnotation>>,
    extendsProps: ReadonlyArray<ExtendsPropsShape>,
  } {
    const nonExtendsProps = this.removeKnownExtends(typeDefinition, types);
    const props = flattenProperties(nonExtendsProps, types, this)
      .map(property => buildPropSchema(property, types, this))
      .filter(Boolean);

    return {
      props,
      extendsProps: this.getExtendsProps(typeDefinition, types),
    };
  }

  getProperties(typeName: string, types: TypeDeclarationMap): $FlowFixMe {
    const typeAlias = types[typeName];
    try {
      return typeAlias.right.typeParameters.params[0].properties;
    } catch (e) {
      throw new Error(
        `Failed to find type definition for "${typeName}", please check that you have a valid codegen flow file`,
      );
    }
  }

  nextNodeForTypeAlias(typeAnnotation: $FlowFixMe): $FlowFixMe {
    if (typeAnnotation.type === 'OpaqueType') {
      return typeAnnotation.impltype;
    }

    return typeAnnotation.right;
  }

  nextNodeForEnum(typeAnnotation: $FlowFixMe): $FlowFixMe {
    return typeAnnotation.body;
  }

  genericTypeAnnotationErrorMessage(typeAnnotation: $FlowFixMe): string {
    return `A non GenericTypeAnnotation must be a type declaration ('${this.typeAlias}') or enum ('${this.enumDeclaration}'). Instead, got the unsupported ${typeAnnotation.type}.`;
  }

  extractTypeFromTypeAnnotation(typeAnnotation: $FlowFixMe): string {
    return typeAnnotation.type === 'GenericTypeAnnotation'
      ? typeAnnotation.id.name
      : typeAnnotation.type;
  }

  getObjectProperties(typeAnnotation: $FlowFixMe): $FlowFixMe {
    return typeAnnotation.properties;
  }

  getLiteralValue(option: $FlowFixMe): $FlowFixMe {
    return option.value;
  }

  getPaperTopLevelNameDeprecated(typeAnnotation: $FlowFixMe): $FlowFixMe {
    return typeAnnotation.typeParameters.params.length > 1
      ? typeAnnotation.typeParameters.params[1].value
      : null;
  }
}

module.exports = {
  FlowParser,
};

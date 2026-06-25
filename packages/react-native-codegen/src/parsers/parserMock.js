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
} from '../CodegenSchema';
import type {ParserType} from './errors';
import type {
  GetSchemaInfoFN,
  GetTypeAnnotationFN,
  Parser,
  ResolveTypeAnnotationFN,
} from './parser';
import type {
  ParserErrorCapturer,
  PropAST,
  TypeDeclarationMap,
  TypeResolutionStatus,
} from './utils';

import invariant from 'invariant';

const {
  UnsupportedObjectPropertyTypeAnnotationParserError,
} = require('./errors');
const {parseFlowAndThrowErrors} = require('./flow/parseFlowAndThrowErrors');
const {buildPropSchema} = require('./parsers-commons');
const {flattenProperties} = require('./typescript/components/componentsUtils');

type ExtendsForProp = null | {
  type: 'ReactNativeBuiltInType',
  knownTypeName: 'ReactNativeCoreViewProps',
};

const schemaMock = {
  modules: {
    StringPropNativeComponentView: {
      type: 'Component',
      components: {
        StringPropNativeComponentView: {
          extendsProps: [],
          events: [],
          props: [],
          commands: [],
        },
      },
    },
  },
};

export class MockedParser implements Parser {
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
    return typeAnnotation?.id?.name;
  }

  checkIfInvalidModule(typeArguments: $FlowFixMe): boolean {
    return false;
  }

  remapUnionTypeAnnotationMemberNames(
    membersTypes: $FlowFixMe[],
  ): NativeModuleUnionTypeAnnotationMemberType[] {
    return [];
  }

  parseFile(filename: string): SchemaType {
    /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
     * https://fburl.com/workplace/6291gfvu */
    return schemaMock;
  }

  parseString(contents: string, filename: ?string): SchemaType {
    /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
     * https://fburl.com/workplace/6291gfvu */
    return schemaMock;
  }

  parseModuleFixture(filename: string): SchemaType {
    /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
     * https://fburl.com/workplace/6291gfvu */
    return schemaMock;
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
    return typeAnnotation.type;
  }

  validateEnumMembersSupported(
    typeAnnotation: $FlowFixMe,
    enumMembersType: NativeModuleEnumMemberType,
  ): void {
    return;
  }

  parseEnumMembers(
    typeAnnotation: $FlowFixMe,
  ): ReadonlyArray<NativeModuleEnumMember> {
    return typeAnnotation.type === 'StringTypeAnnotation'
      ? [
          {
            name: 'Hello',
            value: {
              type: 'StringLiteralTypeAnnotation',
              value: 'hello',
            },
          },
          {
            name: 'Goodbye',
            value: {
              type: 'StringLiteralTypeAnnotation',
              value: 'goodbye',
            },
          },
        ]
      : [
          {
            name: 'On',
            value: {
              type: 'NumberLiteralTypeAnnotation',
              value: 1,
            },
          },
          {
            name: 'Off',
            value: {
              type: 'NumberLiteralTypeAnnotation',
              value: 0,
            },
          },
        ];
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
    return true;
  }

  extractAnnotatedElement(
    typeAnnotation: $FlowFixMe,
    types: TypeDeclarationMap,
  ): $FlowFixMe {
    return types[typeAnnotation.typeParameters.params[0].id.name];
  }

  getTypes(ast: $FlowFixMe): TypeDeclarationMap {
    return {};
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
    return [
      {
        name: 'a',
        optional: true,
        typeAnnotation: {type: 'StringTypeAnnotation'},
      },
      {
        name: 'b',
        optional: true,
        typeAnnotation: {type: 'BooleanTypeAnnotation'},
      },
    ];
  }

  functionTypeAnnotation(propertyValueType: string): boolean {
    return propertyValueType === 'FunctionTypeAnnotation';
  }

  getTypeArgumentParamsFromDeclaration(declaration: $FlowFixMe): $FlowFixMe {
    return declaration.typeArguments.params;
  }

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
    return prop.expression;
  }

  nameForArgument(prop: PropAST): $FlowFixMe {
    return prop.expression.name;
  }

  isOptionalProperty(property: $FlowFixMe): boolean {
    return property.optional || false;
  }

  getTypeAnnotationFromProperty(property: PropAST): $FlowFixMe {
    return property.typeAnnotation.typeAnnotation;
  }

  getGetTypeAnnotationFN(): GetTypeAnnotationFN {
    return () => {
      return {};
    };
  }

  getGetSchemaInfoFN(): GetSchemaInfoFN {
    return () => {
      return {
        name: 'MockedSchema',
        optional: false,
        typeAnnotation: 'BooleanTypeAnnotation',
        defaultValue: false,
        withNullDefault: false,
      };
    };
  }

  getResolveTypeAnnotationFN(): ResolveTypeAnnotationFN {
    return () => {
      return {
        nullable: false,
        typeAnnotation: null,
        typeResolutionStatus: {successful: false},
      };
    };
  }

  getResolvedTypeAnnotation(
    typeAnnotation: $FlowFixMe,
    types: TypeDeclarationMap,
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

      const resolvedTypeAnnotation = types[node.id.name];
      if (resolvedTypeAnnotation == null) {
        break;
      }

      switch (resolvedTypeAnnotation.type) {
        case 'TypeAlias': {
          typeResolutionStatus = {
            successful: true,
            type: 'alias',
            name: node.id.name,
          };
          node = resolvedTypeAnnotation.right;
          break;
        }
        case 'EnumDeclaration': {
          typeResolutionStatus = {
            successful: true,
            type: 'enum',
            name: node.id.name,
          };
          node = resolvedTypeAnnotation.body;
          break;
        }
        default: {
          throw new TypeError(
            `A non GenericTypeAnnotation must be a type declaration ('TypeAlias') or enum ('EnumDeclaration'). Instead, got the unsupported ${resolvedTypeAnnotation.type}.`,
          );
        }
      }
    }

    return {
      nullable: nullable,
      typeAnnotation: node,
      typeResolutionStatus,
    };
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

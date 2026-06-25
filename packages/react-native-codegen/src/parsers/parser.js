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
  ASTNode,
  ParserErrorCapturer,
  PropAST,
  TypeDeclarationMap,
  TypeResolutionStatus,
} from './utils';

export type GetTypeAnnotationFN = (
  name: string,
  annotation: $FlowFixMe | ASTNode,
  defaultValue: $FlowFixMe | void,
  withNullDefault: boolean,
  types: TypeDeclarationMap,
  parser: Parser,
  buildSchema: (
    property: PropAST,
    types: TypeDeclarationMap,
    parser: Parser,
  ) => $FlowFixMe,
) => $FlowFixMe;

export type SchemaInfo = {
  name: string,
  optional: boolean,
  typeAnnotation: $FlowFixMe,
  defaultValue: $FlowFixMe,
  withNullDefault: boolean,
};

export type GetSchemaInfoFN = (
  property: PropAST,
  types: TypeDeclarationMap,
  parser: Parser,
) => ?SchemaInfo;

export type BuildSchemaFN<T> = (
  property: PropAST,
  types: TypeDeclarationMap,
  parser: Parser,
) => ?NamedShape<T>;

export type ResolveTypeAnnotationFN = (
  typeAnnotation: $FlowFixMe,
  types: TypeDeclarationMap,
  parser: Parser,
) => {
  nullable: boolean,
  typeAnnotation: $FlowFixMe,
  typeResolutionStatus: TypeResolutionStatus,
};

/**
 * This is the main interface for Parsers of various languages.
 * It exposes all the methods that contain language-specific logic.
 */
export interface Parser {
  /**
   * This is the TypeParameterInstantiation value
   */
  typeParameterInstantiation: string;

  /**
   * TypeAlias property of the Parser
   */
  typeAlias: string;

  /**
   * enumDeclaration Property of the Parser
   */
  enumDeclaration: string;

  /**
   * InterfaceDeclaration property of the Parser
   */
  interfaceDeclaration: string;

  /**
   * This is the NullLiteralTypeAnnotation value
   */
  nullLiteralTypeAnnotation: string;

  /**
   * UndefinedLiteralTypeAnnotation property of the Parser
   */
  undefinedLiteralTypeAnnotation: string;

  /**
   * Given a declaration, it returns true if it is a property
   */
  isProperty(property: $FlowFixMe): boolean;
  /**
   * Given a property declaration, it returns the key name.
   * @parameter property: an object containing a property declaration.
   * @parameter hasteModuleName: a string with the native module name.
   * @returns: the key name.
   * @throws if property does not contain a property declaration.
   */
  getKeyName(property: $FlowFixMe, hasteModuleName: string): string;
  /**
   * @returns: the Parser language.
   */
  language(): ParserType;
  /**
   * Given a type annotation, it returns the type name.
   * @parameter typeAnnotation: the annotation for a type in the AST.
   * @returns: the name of the type.
   */
  getTypeAnnotationName(typeAnnotation: $FlowFixMe): string;
  /**
   * Given a type arguments, it returns a boolean specifying if the Module is Invalid.
   * @parameter typeArguments: the type arguments.
   * @returns: a boolean specifying if the Module is Invalid.
   */
  checkIfInvalidModule(typeArguments: $FlowFixMe): boolean;
  /**
   * Given a union annotation members types, it returns an array of remaped members names without duplicates.
   * @parameter membersTypes: union annotation members types
   * @returns: an array of remaped members names without duplicates.
   */
  remapUnionTypeAnnotationMemberNames(
    types: $FlowFixMe,
  ): NativeModuleUnionTypeAnnotationMemberType[];
  /**
   * Given the name of a file, it returns a Schema.
   * @parameter filename: the name of the file.
   * @returns: the Schema of the file.
   */
  parseFile(filename: string): SchemaType;
  /**
   * Given the content of a file, it returns a Schema.
   * @parameter contents: the content of the file.
   * @parameter filename: the name of the file.
   * @returns: the Schema of the file.
   */
  parseString(contents: string, filename: ?string): SchemaType;
  /**
   * Given the name of a file, it returns a Schema.
   * @parameter filename: the name of the file.
   * @returns: the Schema of the file.
   */
  parseModuleFixture(filename: string): SchemaType;

  /**
   * Given the content of a file, it returns an AST.
   * @parameter contents: the content of the file.
   * @parameter filename: the name of the file, if available.
   * @throws if there is a syntax error.
   * @returns: the AST of the file.
   */
  getAst(contents: string, filename?: ?string): $FlowFixMe;

  /**
   * Given a FunctionTypeAnnotation, it returns an array of its parameters.
   * @parameter functionTypeAnnotation: a FunctionTypeAnnotation
   * @returns: the parameters of the FunctionTypeAnnotation.
   */
  getFunctionTypeAnnotationParameters(
    functionTypeAnnotation: $FlowFixMe,
  ): ReadonlyArray<$FlowFixMe>;

  /**
   * Given a parameter, it returns the function name of the parameter.
   * @parameter parameter: a parameter of a FunctionTypeAnnotation.
   * @returns: the function name of the parameter.
   */
  getFunctionNameFromParameter(
    parameter: NamedShape<Nullable<NativeModuleParamTypeAnnotation>>,
  ): $FlowFixMe;

  /**
   * Given a parameter, it returns its name.
   * @parameter parameter: a parameter of a FunctionTypeAnnotation.
   * @returns: the name of the parameter.
   */
  getParameterName(parameter: $FlowFixMe): string;

  /**
   * Given a parameter, it returns its typeAnnotation.
   * @parameter parameter: a parameter of a FunctionTypeAnnotation.
   * @returns: the typeAnnotation of the parameter.
   */
  getParameterTypeAnnotation(param: $FlowFixMe): $FlowFixMe;

  /**
   * Given a FunctionTypeAnnotation, it returns its returnType.
   * @parameter functionTypeAnnotation: a FunctionTypeAnnotation
   * @returns: the returnType of the FunctionTypeAnnotation.
   */
  getFunctionTypeAnnotationReturnType(
    functionTypeAnnotation: $FlowFixMe,
  ): $FlowFixMe;

  /**
   * Calculates an enum's members type
   */
  parseEnumMembersType(typeAnnotation: $FlowFixMe): NativeModuleEnumMemberType;

  /**
   * Throws if enum mebers are not supported
   */
  validateEnumMembersSupported(
    typeAnnotation: $FlowFixMe,
    enumMembersType: NativeModuleEnumMemberType,
  ): void;

  /**
   * Calculates enum's members
   */
  parseEnumMembers(
    typeAnnotation: $FlowFixMe,
  ): ReadonlyArray<NativeModuleEnumMember>;

  /**
   * Given a node, it returns true if it is a module interface
   */
  isModuleInterface(node: $FlowFixMe): boolean;

  /**
   * Given a type name, it returns true if it is a generic type annotation
   */
  isGenericTypeAnnotation(type: $FlowFixMe): boolean;

  /**
   * Given a typeAnnotation, it returns the annotated element.
   * @parameter typeAnnotation: the annotation for a type.
   * @parameter types: a map of type declarations.
   * @returns: the annotated element.
   */
  extractAnnotatedElement(
    typeAnnotation: $FlowFixMe,
    types: TypeDeclarationMap,
  ): $FlowFixMe;

  /**
   * Given the AST, returns the TypeDeclarationMap
   */
  getTypes(ast: $FlowFixMe): TypeDeclarationMap;

  /**
   * Given a callExpression, it returns the typeParameters of the callExpression.
   * @parameter callExpression: the callExpression.
   * @returns: the typeParameters of the callExpression or null if it does not exist.
   */
  callExpressionTypeParameters(callExpression: $FlowFixMe): $FlowFixMe | null;

  /**
   * Given an array of properties from a Partial type, it returns an array of remaped properties.
   * @parameter properties: properties from a Partial types.
   * @parameter hasteModuleName: a string with the native module name.
   * @parameter types: a map of type declarations.
   * @parameter aliasMap: a map of type aliases.
   * @parameter enumMap: a map of type enums.
   * @parameter tryParse: a parser error capturer.
   * @parameter cxxOnly: a boolean specifying if the module is Cxx only.
   * @returns: an array of remaped properties
   */
  computePartialProperties(
    properties: Array<$FlowFixMe>,
    hasteModuleName: string,
    types: TypeDeclarationMap,
    aliasMap: {...NativeModuleAliasMap},
    enumMap: {...NativeModuleEnumMap},
    tryParse: ParserErrorCapturer,
    cxxOnly: boolean,
  ): Array<$FlowFixMe>;

  /**
   * Given a propertyValueType, it returns a boolean specifying if the property is a function type annotation.
   * @parameter propertyValueType: the propertyValueType.
   * @returns: a boolean specifying if the property is a function type annotation.
   */
  functionTypeAnnotation(propertyValueType: string): boolean;

  /**
   * Given a declaration, it returns the typeArgumentParams of the declaration.
   * @parameter declaration: the declaration.
   * @returns: the typeArgumentParams of the declaration.
   */
  getTypeArgumentParamsFromDeclaration(declaration: $FlowFixMe): $FlowFixMe;

  /**
   * Given a typeArgumentParams and funcArgumentParams it returns a native component type.
   * @parameter typeArgumentParams: the typeArgumentParams.
   * @parameter funcArgumentParams: the funcArgumentParams.
   * @returns: a native component type.
   */
  getNativeComponentType(
    typeArgumentParams: $FlowFixMe,
    funcArgumentParams: $FlowFixMe,
  ): {[string]: string};

  /**
   * Given a annotatedElement, it returns the properties of annotated element.
   * @parameter annotatedElement: the annotated element.
   * @returns: the properties of annotated element.
   */
  getAnnotatedElementProperties(annotatedElement: $FlowFixMe): $FlowFixMe;

  /**
   * Given a typeAlias, it returns an array of properties.
   * @parameter typeAlias: the type alias.
   * @returns: an array of properties.
   */
  bodyProperties(typeAlias: $FlowFixMe): ReadonlyArray<$FlowFixMe>;

  /**
   * Given a keyword convert it to TypeAnnotation.
   * @parameter keyword
   * @returns: converted TypeAnnotation to Keywords
   */
  convertKeywordToTypeAnnotation(keyword: string): string;

  /**
   * Given a prop return its arguments.
   * @parameter prop
   * @returns: Arguments of the prop
   */
  argumentForProp(prop: PropAST): $FlowFixMe;

  /**
   * Given a prop return its name.
   * @parameter prop
   * @returns: name property
   */
  nameForArgument(prop: PropAST): $FlowFixMe;

  /**
   * Given a property return if it is optional.
   * @parameter property
   * @returns: a boolean specifying if the Property is optional
   */
  isOptionalProperty(property: $FlowFixMe): boolean;

  getGetTypeAnnotationFN(): GetTypeAnnotationFN;

  getGetSchemaInfoFN(): GetSchemaInfoFN;

  /**
   * Given a property return the type annotation.
   * @parameter property
   * @returns: the annotation for a type in the AST.
   */
  getTypeAnnotationFromProperty(property: PropAST): $FlowFixMe;

  getResolvedTypeAnnotation(
    typeAnnotation: $FlowFixMe,
    types: TypeDeclarationMap,
    parser: Parser,
  ): {
    nullable: boolean,
    typeAnnotation: $FlowFixMe,
    typeResolutionStatus: TypeResolutionStatus,
  };

  getResolveTypeAnnotationFN(): ResolveTypeAnnotationFN;

  getProps(
    typeDefinition: ReadonlyArray<PropAST>,
    types: TypeDeclarationMap,
  ): {
    props: ReadonlyArray<NamedShape<PropTypeAnnotation>>,
    extendsProps: ReadonlyArray<ExtendsPropsShape>,
  };

  getProperties(typeName: string, types: TypeDeclarationMap): $FlowFixMe;

  /**
   * Given a typeAlias, it returns the next node.
   */
  nextNodeForTypeAlias(typeAnnotation: $FlowFixMe): $FlowFixMe;

  /**
   * Given an enum Declaration, it returns the next node.
   */
  nextNodeForEnum(typeAnnotation: $FlowFixMe): $FlowFixMe;

  /**
   * Given a unsupported typeAnnotation, returns an error message.
   */
  genericTypeAnnotationErrorMessage(typeAnnotation: $FlowFixMe): string;

  /**
   * Given a type annotation, it extracts the type.
   * @parameter typeAnnotation: the annotation for a type in the AST.
   * @returns: the extracted type.
   */
  extractTypeFromTypeAnnotation(typeAnnotation: $FlowFixMe): string;

  /**
   * Given a typeAnnotation return the properties of an object.
   * @parameter property
   * @returns: the properties of an object represented by a type annotation.
   */
  getObjectProperties(typeAnnotation: $FlowFixMe): $FlowFixMe;

  /**
   * Given a option return the literal value.
   * @parameter option
   * @returns: the literal value of an union represented.
   */
  getLiteralValue(option: $FlowFixMe): $FlowFixMe;

  /**
   * Given a type annotation, it returns top level name in the AST if it exists else returns null.
   * @parameter typeAnnotation: the annotation for a type in the AST.
   * @returns: the top level name properties in the AST if it exists else null.
   */
  getPaperTopLevelNameDeprecated(typeAnnotation: $FlowFixMe): $FlowFixMe;
}

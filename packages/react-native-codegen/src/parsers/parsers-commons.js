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
  EventTypeAnnotation,
  EventTypeShape,
  NamedShape,
  NativeModuleAliasMap,
  NativeModuleBaseTypeAnnotation,
  NativeModuleEnumMap,
  NativeModuleEventEmitterShape,
  NativeModuleFunctionTypeAnnotation,
  NativeModuleParamTypeAnnotation,
  NativeModulePropertyShape,
  NativeModuleSchema,
  NativeModuleTypeAnnotation,
  Nullable,
  ObjectTypeAnnotation,
  OptionsShape,
  PropTypeAnnotation,
  SchemaType,
} from '../CodegenSchema.js';
import type {ParserType} from './errors';
import type {Parser} from './parser';
import type {ComponentSchemaBuilderConfig} from './schema.js';
import type {
  ParserErrorCapturer,
  PropAST,
  TypeDeclarationMap,
  TypeResolutionStatus,
} from './utils';

const {
  throwIfConfigNotfound,
  throwIfEventEmitterEventTypeIsUnsupported,
  throwIfEventEmitterTypeIsUnsupported,
  throwIfIncorrectModuleRegistryCallArgument,
  throwIfIncorrectModuleRegistryCallTypeParameterParserError,
  throwIfModuleInterfaceIsMisnamed,
  throwIfModuleInterfaceNotFound,
  throwIfModuleTypeIsUnsupported,
  throwIfMoreThanOneCodegenNativecommands,
  throwIfMoreThanOneConfig,
  throwIfMoreThanOneModuleInterfaceParserError,
  throwIfMoreThanOneModuleRegistryCalls,
  throwIfPropertyValueTypeIsUnsupported,
  throwIfTypeAliasIsNotInterface,
  throwIfUnsupportedFunctionParamTypeAnnotationParserError,
  throwIfUnsupportedFunctionReturnTypeAnnotationParserError,
  throwIfUntypedModule,
  throwIfUnusedModuleInterfaceParserError,
  throwIfWrongNumberOfCallExpressionArgs,
} = require('./error-utils');
const {
  MissingTypeParameterGenericParserError,
  MoreThanOneTypeParameterGenericParserError,
  UnnamedFunctionParamParserError,
  UnsupportedObjectDirectRecursivePropertyParserError,
} = require('./errors');
const {
  createParserErrorCapturer,
  extractNativeModuleName,
  getConfigType,
  getSortedObject,
  isModuleRegistryCall,
  verifyPlatforms,
  visit,
} = require('./utils');
const invariant = require('invariant');

export type CommandOptions = Readonly<{
  supportedCommands: ReadonlyArray<string>,
}>;

// $FlowFixMe[unclear-type] TODO(T108222691): Use flow-types for @babel/parser
type OptionsAST = Object;

type ExtendedPropResult = {
  type: 'ReactNativeBuiltInType',
  knownTypeName: 'ReactNativeCoreViewProps',
} | null;

export type EventArgumentReturnType = {
  argumentProps: ?ReadonlyArray<$FlowFixMe>,
  paperTopLevelNameDeprecated: ?$FlowFixMe,
  bubblingType: ?'direct' | 'bubble',
};

function wrapModuleSchema(
  nativeModuleSchema: NativeModuleSchema,
  hasteModuleName: string,
): SchemaType {
  return {
    modules: {
      [hasteModuleName]: nativeModuleSchema,
    },
  };
}

// $FlowFixMe[unsupported-variance-annotation]
function unwrapNullable<out T extends NativeModuleTypeAnnotation>(
  x: Nullable<T>,
): [T, boolean] {
  if (x.type === 'NullableTypeAnnotation') {
    return [x.typeAnnotation, true];
  }

  return [x, false];
}

// $FlowFixMe[unsupported-variance-annotation]
function wrapNullable<out T extends NativeModuleTypeAnnotation>(
  nullable: boolean,
  typeAnnotation: T,
): Nullable<T> {
  if (!nullable) {
    return typeAnnotation;
  }

  return {
    type: 'NullableTypeAnnotation',
    typeAnnotation,
  };
}

function assertGenericTypeAnnotationHasExactlyOneTypeParameter(
  moduleName: string,
  /**
   * TODO(T108222691): Use flow-types for @babel/parser
   */
  typeAnnotation: $FlowFixMe,
  parser: Parser,
) {
  if (typeAnnotation.typeParameters == null) {
    throw new MissingTypeParameterGenericParserError(
      moduleName,
      typeAnnotation,
      parser,
    );
  }

  const typeAnnotationType = parser.typeParameterInstantiation;

  invariant(
    typeAnnotation.typeParameters.type === typeAnnotationType,
    `assertGenericTypeAnnotationHasExactlyOneTypeParameter: Type parameters must be an AST node of type '${typeAnnotationType}'`,
  );

  if (typeAnnotation.typeParameters.params.length !== 1) {
    throw new MoreThanOneTypeParameterGenericParserError(
      moduleName,
      typeAnnotation,
      parser,
    );
  }
}

function isObjectProperty(property: $FlowFixMe, language: ParserType): boolean {
  switch (language) {
    case 'Flow':
      return property.type === 'ObjectTypeProperty';
    case 'TypeScript':
      return property.type === 'TSPropertySignature';
    default:
      return false;
  }
}

function getObjectTypeAnnotations(
  hasteModuleName: string,
  types: TypeDeclarationMap,
  tryParse: ParserErrorCapturer,
  translateTypeAnnotation: $FlowFixMe,
  parser: Parser,
): {...NativeModuleAliasMap} {
  const aliasMap: {...NativeModuleAliasMap} = {};
  Object.entries(types).forEach(([key, value]) => {
    const isTypeAlias =
      value.type === 'TypeAlias' || value.type === 'TSTypeAliasDeclaration';
    if (!isTypeAlias) {
      return;
    }
    let parent = parser.nextNodeForTypeAlias(value);
    // Unwrap $ReadOnly/Readonly wrappers to get the inner object type
    if (
      parent.type === 'GenericTypeAnnotation' &&
      (parent.id?.name === '$ReadOnly' || parent.id?.name === 'Readonly') &&
      parent.typeParameters?.params?.length === 1
    ) {
      parent = parent.typeParameters.params[0];
    } else if (
      parent.type === 'TSTypeReference' &&
      parent.typeName?.name === 'Readonly' &&
      parent.typeParameters?.params?.length === 1
    ) {
      parent = parent.typeParameters.params[0];
    }
    if (
      parent.type !== 'ObjectTypeAnnotation' &&
      parent.type !== 'TSTypeLiteral'
    ) {
      return;
    }
    const typeProperties = (parent.properties ?? parent.members).map(prop =>
      parseObjectProperty(
        parent,
        prop,
        hasteModuleName,
        types,
        aliasMap,
        {}, // enumMap
        tryParse,
        true, // cxxOnly
        prop?.optional || false,
        translateTypeAnnotation,
        parser,
      ),
    );
    aliasMap[key] = {
      type: 'ObjectTypeAnnotation',
      properties: typeProperties,
    };
  });
  return aliasMap;
}

function parseObjectProperty(
  parentObject?: $FlowFixMe,
  property: $FlowFixMe,
  hasteModuleName: string,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  enumMap: {...NativeModuleEnumMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
  nullable: boolean,
  translateTypeAnnotation: $FlowFixMe,
  parser: Parser,
): NamedShape<Nullable<NativeModuleBaseTypeAnnotation>> {
  const language = parser.language();

  const name = parser.getKeyName(property, hasteModuleName);
  const {optional = false} = property;
  const languageTypeAnnotation =
    language === 'TypeScript'
      ? property.typeAnnotation.typeAnnotation
      : property.value;

  // Handle recursive types
  if (parentObject) {
    const propertyType = parser.getResolveTypeAnnotationFN()(
      languageTypeAnnotation,
      types,
      parser,
    );
    if (
      propertyType.typeResolutionStatus.successful === true &&
      propertyType.typeResolutionStatus.type === 'alias' &&
      (language === 'TypeScript'
        ? parentObject.typeName &&
          parentObject.typeName.name === languageTypeAnnotation.typeName?.name
        : parentObject.id &&
          parentObject.id.name === languageTypeAnnotation.id?.name)
    ) {
      if (!optional) {
        throw new UnsupportedObjectDirectRecursivePropertyParserError(
          name,
          languageTypeAnnotation,
          hasteModuleName,
        );
      }
      return {
        name,
        optional,
        typeAnnotation: {
          type: 'TypeAliasTypeAnnotation',
          name: propertyType.typeResolutionStatus.name,
        },
      };
    }
  }

  // Handle non-recursive types
  const [propertyTypeAnnotation, isPropertyNullable] =
    unwrapNullable<$FlowFixMe>(
      translateTypeAnnotation(
        hasteModuleName,
        languageTypeAnnotation,
        types,
        aliasMap,
        enumMap,
        tryParse,
        cxxOnly,
        parser,
      ),
    );

  if (
    (propertyTypeAnnotation.type === 'FunctionTypeAnnotation' && !cxxOnly) ||
    propertyTypeAnnotation.type === 'PromiseTypeAnnotation' ||
    propertyTypeAnnotation.type === 'VoidTypeAnnotation' ||
    propertyTypeAnnotation.type === 'ArrayBufferTypeAnnotation'
  ) {
    throwIfPropertyValueTypeIsUnsupported(
      hasteModuleName,
      languageTypeAnnotation,
      property.key,
      propertyTypeAnnotation.type,
    );
  }

  return {
    name,
    optional,
    typeAnnotation: wrapNullable(isPropertyNullable, propertyTypeAnnotation),
  };
}

function translateFunctionTypeAnnotation(
  hasteModuleName: string,
  // TODO(T108222691): Use flow-types for @babel/parser
  // TODO(T71778680): This is a FunctionTypeAnnotation. Type this.
  functionTypeAnnotation: $FlowFixMe,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  enumMap: {...NativeModuleEnumMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
  translateTypeAnnotation: $FlowFixMe,
  parser: Parser,
): NativeModuleFunctionTypeAnnotation {
  type Param = NamedShape<Nullable<NativeModuleParamTypeAnnotation>>;
  const params: Array<Param> = [];

  for (const param of parser.getFunctionTypeAnnotationParameters(
    functionTypeAnnotation,
  )) {
    const parsedParam = tryParse(() => {
      if (parser.getFunctionNameFromParameter(param) == null) {
        throw new UnnamedFunctionParamParserError(param, hasteModuleName);
      }

      const paramName = parser.getParameterName(param);

      const [paramTypeAnnotation, isParamTypeAnnotationNullable] =
        unwrapNullable<$FlowFixMe>(
          translateTypeAnnotation(
            hasteModuleName,
            parser.getParameterTypeAnnotation(param),
            types,
            aliasMap,
            enumMap,
            tryParse,
            cxxOnly,
            parser,
          ),
        );

      if (
        paramTypeAnnotation.type === 'VoidTypeAnnotation' ||
        paramTypeAnnotation.type === 'PromiseTypeAnnotation'
      ) {
        return throwIfUnsupportedFunctionParamTypeAnnotationParserError(
          hasteModuleName,
          param.typeAnnotation,
          paramName,
          paramTypeAnnotation.type,
        );
      }

      return {
        name: paramName,
        optional: Boolean(param.optional),
        typeAnnotation: wrapNullable(
          isParamTypeAnnotationNullable,
          paramTypeAnnotation,
        ),
      };
    });

    if (parsedParam != null) {
      params.push(parsedParam);
    }
  }

  const [returnTypeAnnotation, isReturnTypeAnnotationNullable] =
    unwrapNullable<$FlowFixMe>(
      translateTypeAnnotation(
        hasteModuleName,
        parser.getFunctionTypeAnnotationReturnType(functionTypeAnnotation),
        types,
        aliasMap,
        enumMap,
        tryParse,
        cxxOnly,
        parser,
      ),
    );

  throwIfUnsupportedFunctionReturnTypeAnnotationParserError(
    hasteModuleName,
    functionTypeAnnotation,
    'FunctionTypeAnnotation',
    cxxOnly,
    returnTypeAnnotation.type,
  );

  return {
    type: 'FunctionTypeAnnotation',
    returnTypeAnnotation: wrapNullable(
      isReturnTypeAnnotationNullable,
      returnTypeAnnotation,
    ),
    params,
  };
}

function buildPropertySchema(
  hasteModuleName: string,
  // TODO(T108222691): [TS] Use flow-types for @babel/parser
  // TODO(T71778680): [Flow] This is an ObjectTypeProperty containing either:
  // - a FunctionTypeAnnotation or GenericTypeAnnotation
  // - a NullableTypeAnnoation containing a FunctionTypeAnnotation or GenericTypeAnnotation
  // Flow type this node
  property: $FlowFixMe,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  enumMap: {...NativeModuleEnumMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
  translateTypeAnnotation: $FlowFixMe,
  parser: Parser,
): NativeModulePropertyShape {
  let nullable: boolean = false;
  let {key, value} = property;
  const methodName: string = key.name;

  if (parser.language() === 'TypeScript') {
    value =
      property.type === 'TSMethodSignature'
        ? property
        : property.typeAnnotation;
  }

  const resolveTypeAnnotationFN = parser.getResolveTypeAnnotationFN();
  ({nullable, typeAnnotation: value} = resolveTypeAnnotationFN(
    value,
    types,
    parser,
  ));

  throwIfModuleTypeIsUnsupported(
    hasteModuleName,
    property.value,
    key.name,
    value.type,
    parser,
  );

  return {
    name: methodName,
    optional: Boolean(property.optional),
    typeAnnotation: wrapNullable(
      nullable,
      translateFunctionTypeAnnotation(
        hasteModuleName,
        value,
        types,
        aliasMap,
        enumMap,
        tryParse,
        cxxOnly,
        translateTypeAnnotation,
        parser,
      ),
    ),
  };
}

function buildEventEmitterSchema(
  hasteModuleName: string,
  // TODO(T108222691): [TS] Use flow-types for @babel/parser
  // TODO(T71778680): [Flow] This is an ObjectTypeProperty containing either:
  // - a FunctionTypeAnnotation or GenericTypeAnnotation
  // - a NullableTypeAnnoation containing a FunctionTypeAnnotation or GenericTypeAnnotation
  // Flow type this node
  property: $FlowFixMe,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  enumMap: {...NativeModuleEnumMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
  translateTypeAnnotation: $FlowFixMe,
  parser: Parser,
): NativeModuleEventEmitterShape {
  const {key} = property;
  const value =
    parser.language() === 'TypeScript'
      ? property.typeAnnotation.typeAnnotation
      : property.value;

  const eventemitterName: string = key.name;
  const resolveTypeAnnotationFN = parser.getResolveTypeAnnotationFN();
  const [typeAnnotation, typeAnnotationNullable] = unwrapNullable(value);
  const typeAnnotationUntyped =
    value.typeParameters.params.length === 1 &&
    parser.language() === 'TypeScript'
      ? value.typeParameters.params[0].type === 'TSTypeLiteral' &&
        value.typeParameters.params[0].members.length === 0
      : value.typeParameters.params[0].type === 'ObjectTypeAnnotation' &&
        value.typeParameters.params[0].properties.length === 0;

  throwIfEventEmitterTypeIsUnsupported(
    hasteModuleName,
    key.name,
    typeAnnotation.type,
    parser,
    typeAnnotationNullable,
    typeAnnotationUntyped,
  );
  const eventTypeResolutionStatus = resolveTypeAnnotationFN(
    typeAnnotation.typeParameters.params[0],
    types,
    parser,
  );
  throwIfEventEmitterEventTypeIsUnsupported(
    hasteModuleName,
    key.name,
    eventTypeResolutionStatus.typeAnnotation,
    parser,
    eventTypeResolutionStatus.nullable,
  );

  const eventTypeAnnotation = translateTypeAnnotation(
    hasteModuleName,
    typeAnnotation.typeParameters.params[0],
    types,
    aliasMap,
    enumMap,
    tryParse,
    cxxOnly,
    parser,
  );

  return {
    name: eventemitterName,
    optional: Boolean(property.optional),
    typeAnnotation: {
      type: 'EventEmitterTypeAnnotation',
      typeAnnotation: eventTypeAnnotation,
    },
  };
}

function buildSchemaFromConfigType(
  configType: 'module' | 'component' | 'none',
  filename: ?string,
  ast: $FlowFixMe,
  wrapComponentSchema: (config: ComponentSchemaBuilderConfig) => SchemaType,
  buildComponentSchema: (
    ast: $FlowFixMe,
    parser: Parser,
  ) => ComponentSchemaBuilderConfig,
  buildModuleSchema: (
    hasteModuleName: string,
    ast: $FlowFixMe,
    tryParse: ParserErrorCapturer,
    parser: Parser,
    translateTypeAnnotation: $FlowFixMe,
  ) => NativeModuleSchema,
  parser: Parser,
  translateTypeAnnotation: $FlowFixMe,
): SchemaType {
  switch (configType) {
    case 'component': {
      return wrapComponentSchema(buildComponentSchema(ast, parser));
    }
    case 'module': {
      if (filename === undefined || filename === null) {
        throw new Error('Filepath expected while parasing a module');
      }
      const nativeModuleName = extractNativeModuleName(filename);

      const [parsingErrors, tryParse] = createParserErrorCapturer();

      const schema = tryParse(() =>
        buildModuleSchema(
          nativeModuleName,
          ast,
          tryParse,
          parser,
          translateTypeAnnotation,
        ),
      );

      if (parsingErrors.length > 0) {
        /**
         * TODO(T77968131): We have two options:
         *  - Throw the first error, but indicate there are more than one error.
         *  - Display all errors, nicely formatted.
         *
         * For the time being, we're just throwing the first error.
         **/

        throw parsingErrors[0];
      }

      invariant(
        schema != null,
        'When there are no parsing errors, the schema should not be null',
      );

      return wrapModuleSchema(schema, nativeModuleName);
    }
    default:
      return {modules: {}};
  }
}

function buildSchema(
  contents: string,
  filename: ?string,
  wrapComponentSchema: (config: ComponentSchemaBuilderConfig) => SchemaType,
  buildComponentSchema: (
    ast: $FlowFixMe,
    parser: Parser,
  ) => ComponentSchemaBuilderConfig,
  buildModuleSchema: (
    hasteModuleName: string,
    ast: $FlowFixMe,
    tryParse: ParserErrorCapturer,
    parser: Parser,
    translateTypeAnnotation: $FlowFixMe,
  ) => NativeModuleSchema,
  Visitor: ({isComponent: boolean, isModule: boolean}) => {
    [type: string]: (node: $FlowFixMe) => void,
  },
  parser: Parser,
  translateTypeAnnotation: $FlowFixMe,
): SchemaType {
  // Early return for non-Spec JavaScript files
  if (
    !contents.includes('codegenNativeComponent') &&
    !contents.includes('TurboModule')
  ) {
    return {modules: {}};
  }

  const ast = parser.getAst(contents, filename);
  const configType = getConfigType(ast, Visitor);

  return buildSchemaFromConfigType(
    configType,
    filename,
    ast,
    wrapComponentSchema,
    buildComponentSchema,
    buildModuleSchema,
    parser,
    translateTypeAnnotation,
  );
}

function createComponentConfig(
  foundConfig: $FlowFixMe,
  commandsTypeNames: $FlowFixMe,
): $FlowFixMe {
  return {
    ...foundConfig,
    commandTypeName:
      commandsTypeNames[0] == null
        ? null
        : commandsTypeNames[0].commandTypeName,
    commandOptionsExpression:
      commandsTypeNames[0] == null
        ? null
        : commandsTypeNames[0].commandOptionsExpression,
  };
}

const parseModuleName = (
  hasteModuleName: string,
  moduleSpec: $FlowFixMe,
  ast: $FlowFixMe,
  parser: Parser,
): string => {
  const callExpressions = [];
  visit(ast, {
    CallExpression(node) {
      if (isModuleRegistryCall(node)) {
        callExpressions.push(node);
      }
    },
  });

  throwIfUnusedModuleInterfaceParserError(
    hasteModuleName,
    moduleSpec,
    callExpressions,
  );

  throwIfMoreThanOneModuleRegistryCalls(
    hasteModuleName,
    callExpressions,
    callExpressions.length,
  );

  const [callExpression] = callExpressions;
  const typeParameters = parser.callExpressionTypeParameters(callExpression);
  const methodName = callExpression.callee.property.name;

  throwIfWrongNumberOfCallExpressionArgs(
    hasteModuleName,
    callExpression,
    methodName,
    callExpression.arguments.length,
  );

  throwIfIncorrectModuleRegistryCallArgument(
    hasteModuleName,
    callExpression.arguments[0],
    methodName,
  );

  const $moduleName = callExpression.arguments[0].value;

  throwIfUntypedModule(
    typeParameters,
    hasteModuleName,
    callExpression,
    methodName,
    $moduleName,
  );

  throwIfIncorrectModuleRegistryCallTypeParameterParserError(
    hasteModuleName,
    typeParameters,
    methodName,
    $moduleName,
    parser,
  );

  return $moduleName;
};

const buildModuleSchema = (
  hasteModuleName: string,
  /**
   * TODO(T71778680): Flow-type this node.
   */
  ast: $FlowFixMe,
  tryParse: ParserErrorCapturer,
  parser: Parser,
  translateTypeAnnotation: $FlowFixMe,
): NativeModuleSchema => {
  const language = parser.language();
  const types = parser.getTypes(ast);
  const moduleSpecs = (
    Object.values(types) as ReadonlyArray<$FlowFixMe>
  ).filter(t => parser.isModuleInterface(t));

  throwIfModuleInterfaceNotFound(
    moduleSpecs.length,
    hasteModuleName,
    ast,
    language,
  );

  throwIfMoreThanOneModuleInterfaceParserError(
    hasteModuleName,
    moduleSpecs,
    language,
  );

  const [moduleSpec] = moduleSpecs;

  throwIfModuleInterfaceIsMisnamed(hasteModuleName, moduleSpec.id, language);

  // Parse Module Name
  const moduleName = parseModuleName(hasteModuleName, moduleSpec, ast, parser);

  // Some module names use platform suffix to indicate platform-exclusive modules.
  // Eventually this should be made explicit in the Flow type itself.
  // Also check the hasteModuleName for platform suffix.
  // Note: this shape is consistent with ComponentSchema.
  const {cxxOnly, excludedPlatforms} = verifyPlatforms(
    hasteModuleName,
    moduleName,
  );

  const aliasMap: {...NativeModuleAliasMap} = cxxOnly
    ? getObjectTypeAnnotations(
        hasteModuleName,
        types,
        tryParse,
        translateTypeAnnotation,
        parser,
      )
    : {};
  const properties: ReadonlyArray<$FlowFixMe> =
    language === 'Flow' ? moduleSpec.body.properties : moduleSpec.body.body;

  type PropertyShape =
    | {type: 'eventEmitter', value: NativeModuleEventEmitterShape}
    | {type: 'method', value: NativeModulePropertyShape};

  // $FlowFixMe[missing-type-arg]
  const nativeModuleSchema = properties
    .filter(
      property =>
        property.type === 'ObjectTypeProperty' ||
        property.type === 'TSPropertySignature' ||
        property.type === 'TSMethodSignature',
    )
    .map<?{
      aliasMap: NativeModuleAliasMap,
      enumMap: NativeModuleEnumMap,
      propertyShape: PropertyShape,
    }>(property => {
      const enumMap: {...NativeModuleEnumMap} = {};
      const isEventEmitter =
        language === 'TypeScript'
          ? property?.type === 'TSPropertySignature' &&
            parser.getTypeAnnotationName(
              property?.typeAnnotation?.typeAnnotation,
            ) === 'EventEmitter'
          : property?.value?.type === 'GenericTypeAnnotation' &&
            parser.getTypeAnnotationName(property?.value) === 'EventEmitter';
      return tryParse(() => ({
        aliasMap,
        enumMap,
        propertyShape: isEventEmitter
          ? {
              type: 'eventEmitter',
              value: buildEventEmitterSchema(
                hasteModuleName,
                property,
                types,
                aliasMap,
                enumMap,
                tryParse,
                cxxOnly,
                translateTypeAnnotation,
                parser,
              ),
            }
          : {
              type: 'method',
              value: buildPropertySchema(
                hasteModuleName,
                property,
                types,
                aliasMap,
                enumMap,
                tryParse,
                cxxOnly,
                translateTypeAnnotation,
                parser,
              ),
            },
      }));
    })
    .filter(Boolean)
    .reduce(
      (moduleSchema: NativeModuleSchema, {enumMap, propertyShape}) => ({
        type: 'NativeModule',
        aliasMap: {...moduleSchema.aliasMap, ...aliasMap},
        enumMap: {...moduleSchema.enumMap, ...enumMap},
        spec: {
          eventEmitters: [...moduleSchema.spec.eventEmitters].concat(
            propertyShape.type === 'eventEmitter' ? [propertyShape.value] : [],
          ),
          methods: [...moduleSchema.spec.methods].concat(
            propertyShape.type === 'method' ? [propertyShape.value] : [],
          ),
        },
        moduleName: moduleSchema.moduleName,
        excludedPlatforms: moduleSchema.excludedPlatforms,
      }),
      {
        type: 'NativeModule',
        aliasMap: {},
        enumMap: {},
        spec: {eventEmitters: [], methods: []},
        moduleName,
        excludedPlatforms:
          excludedPlatforms.length !== 0 ? [...excludedPlatforms] : undefined,
      },
    );

  return {
    type: 'NativeModule',
    aliasMap: getSortedObject(nativeModuleSchema.aliasMap),
    enumMap: getSortedObject(nativeModuleSchema.enumMap),
    spec: {
      eventEmitters: nativeModuleSchema.spec.eventEmitters.sort(),
      methods: nativeModuleSchema.spec.methods.sort(),
    },
    moduleName,
    excludedPlatforms: nativeModuleSchema.excludedPlatforms,
  };
};

/**
 * This function is used to find the type of a native component
 * provided the default exports statement from generated AST.
 * @param statement The statement to be parsed.
 * @param foundConfigs The 'mutable' array of configs that have been found.
 * @param parser The language parser to be used.
 * @returns void
 */
function findNativeComponentType(
  statement: $FlowFixMe,
  foundConfigs: Array<{[string]: string}>,
  parser: Parser,
): void {
  let declaration = statement.declaration;

  // codegenNativeComponent can be nested inside a cast
  // expression so we need to go one level deeper
  if (
    declaration.type === 'TSAsExpression' ||
    declaration.type === 'AsExpression' ||
    declaration.type === 'TypeCastExpression'
  ) {
    declaration = declaration.expression;
  }

  try {
    if (declaration.callee.name === 'codegenNativeComponent') {
      const typeArgumentParams =
        parser.getTypeArgumentParamsFromDeclaration(declaration);
      const funcArgumentParams = declaration.arguments;

      const nativeComponentType: {[string]: string} =
        parser.getNativeComponentType(typeArgumentParams, funcArgumentParams);
      if (funcArgumentParams.length > 1) {
        nativeComponentType.optionsExpression = funcArgumentParams[1];
      }
      foundConfigs.push(nativeComponentType);
    }
  } catch (e) {
    // ignore
  }
}

function getCommandOptions(
  commandOptionsExpression: OptionsAST,
): ?CommandOptions {
  if (commandOptionsExpression == null) {
    return null;
  }

  let foundOptions;
  try {
    foundOptions = commandOptionsExpression.properties.reduce(
      (options, prop) => {
        options[prop.key.name] = (
          (prop && prop.value && prop.value.elements) ||
          []
        ).map(element => element && element.value);
        return options;
      },
      {},
    );
  } catch (e) {
    throw new Error(
      'Failed to parse command options, please check that they are defined correctly',
    );
  }

  return foundOptions;
}

function getOptions(optionsExpression: OptionsAST): ?OptionsShape {
  if (!optionsExpression) {
    return null;
  }
  let foundOptions;
  try {
    foundOptions = optionsExpression.properties.reduce((options, prop) => {
      if (prop.value.type === 'ArrayExpression') {
        options[prop.key.name] = prop.value.elements.map(
          element => element.value,
        );
      } else {
        options[prop.key.name] = prop.value.value;
      }
      return options;
    }, {});
  } catch (e) {
    throw new Error(
      'Failed to parse codegen options, please check that they are defined correctly',
    );
  }

  if (
    foundOptions.paperComponentName &&
    foundOptions.paperComponentNameDeprecated
  ) {
    throw new Error(
      'Failed to parse codegen options, cannot use both paperComponentName and paperComponentNameDeprecated',
    );
  }
  return foundOptions;
}

function getCommandTypeNameAndOptionsExpression(
  namedExport: $FlowFixMe,
  parser: Parser,
): {
  commandOptionsExpression: OptionsAST,
  commandTypeName: string,
} | void {
  let callExpression;
  let calleeName;
  try {
    callExpression = namedExport.declaration.declarations[0].init;
    calleeName = callExpression.callee.name;
  } catch (e) {
    return;
  }

  if (calleeName !== 'codegenNativeCommands') {
    return;
  }

  if (callExpression.arguments.length !== 1) {
    throw new Error(
      'codegenNativeCommands must be passed options including the supported commands',
    );
  }

  const typeArgumentParam =
    parser.getTypeArgumentParamsFromDeclaration(callExpression)[0];

  if (!parser.isGenericTypeAnnotation(typeArgumentParam.type)) {
    throw new Error(
      "codegenNativeCommands doesn't support inline definitions. Specify a file local type alias",
    );
  }

  return {
    commandTypeName: parser.getTypeAnnotationName(typeArgumentParam),
    commandOptionsExpression: callExpression.arguments[0],
  };
}

function propertyNames(
  properties: ReadonlyArray<$FlowFixMe>,
): ReadonlyArray<$FlowFixMe> {
  return properties
    .map(property => property && property.key && property.key.name)
    .filter(Boolean);
}

function extendsForProp(
  prop: PropAST,
  types: TypeDeclarationMap,
  parser: Parser,
): ExtendedPropResult {
  const argument = parser.argumentForProp(prop);

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

function buildPropSchema(
  property: PropAST,
  types: TypeDeclarationMap,
  parser: Parser,
): ?NamedShape<PropTypeAnnotation> {
  const getSchemaInfoFN = parser.getGetSchemaInfoFN();
  const info = getSchemaInfoFN(property, types, parser);
  if (info == null) {
    return null;
  }
  const {name, optional, typeAnnotation, defaultValue, withNullDefault} = info;

  const getTypeAnnotationFN = parser.getGetTypeAnnotationFN();

  return {
    name,
    optional,
    typeAnnotation: getTypeAnnotationFN(
      name,
      typeAnnotation,
      defaultValue,
      withNullDefault,
      types,
      parser,
      buildPropSchema,
    ),
  };
}

/* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
 * LTI update could not be added via codemod */
function getEventArgument(
  argumentProps: PropAST,
  parser: Parser,
  getPropertyType: (
    name: $FlowFixMe,
    optional: boolean,
    typeAnnotation: $FlowFixMe,
    parser: Parser,
  ) => NamedShape<EventTypeAnnotation>,
): ObjectTypeAnnotation<EventTypeAnnotation> {
  return {
    type: 'ObjectTypeAnnotation',
    properties: argumentProps.map(member =>
      buildPropertiesForEvent(member, parser, getPropertyType),
    ),
  };
}

/* $FlowFixMe[signature-verification-failure] there's no flowtype for AST.
 * TODO(T108222691): Use flow-types for @babel/parser */
function findComponentConfig(ast: $FlowFixMe, parser: Parser) {
  const foundConfigs: Array<{[string]: string}> = [];

  const defaultExports = ast.body.filter(
    node => node.type === 'ExportDefaultDeclaration',
  );

  defaultExports.forEach(statement => {
    findNativeComponentType(statement, foundConfigs, parser);
  });

  throwIfConfigNotfound(foundConfigs);
  throwIfMoreThanOneConfig(foundConfigs);

  const foundConfig = foundConfigs[0];

  const namedExports = ast.body.filter(
    node => node.type === 'ExportNamedDeclaration',
  );

  const commandsTypeNames = namedExports
    .map(statement => getCommandTypeNameAndOptionsExpression(statement, parser))
    .filter(Boolean);

  throwIfMoreThanOneCodegenNativecommands(commandsTypeNames);

  return createComponentConfig(foundConfig, commandsTypeNames);
}

// $FlowFixMe[signature-verification-failure] there's no flowtype for AST
function getCommandProperties(ast: $FlowFixMe, parser: Parser) {
  const {commandTypeName, commandOptionsExpression} = findComponentConfig(
    ast,
    parser,
  );

  if (commandTypeName == null) {
    return [];
  }
  const types = parser.getTypes(ast);

  const typeAlias = types[commandTypeName];

  throwIfTypeAliasIsNotInterface(typeAlias, parser);

  const properties = parser.bodyProperties(typeAlias);
  if (!properties) {
    throw new Error(
      `Failed to find type definition for "${commandTypeName}", please check that you have a valid codegen file`,
    );
  }

  const commandPropertyNames = propertyNames(properties);

  const commandOptions = getCommandOptions(commandOptionsExpression);

  if (commandOptions == null || commandOptions.supportedCommands == null) {
    throw new Error(
      'codegenNativeCommands must be given an options object with supportedCommands array',
    );
  }

  if (
    commandOptions.supportedCommands.length !== commandPropertyNames.length ||
    !commandOptions.supportedCommands.every(supportedCommand =>
      commandPropertyNames.includes(supportedCommand),
    )
  ) {
    throw new Error(
      `codegenNativeCommands expected the same supportedCommands specified in the ${commandTypeName} interface: ${commandPropertyNames.join(
        ', ',
      )}`,
    );
  }

  return properties;
}

function getTypeResolutionStatus(
  type: 'alias' | 'enum',
  typeAnnotation: $FlowFixMe,
  parser: Parser,
): TypeResolutionStatus {
  return {
    successful: true,
    type,
    name: parser.getTypeAnnotationName(typeAnnotation),
  };
}

function handleGenericTypeAnnotation(
  typeAnnotation: $FlowFixMe,
  resolvedTypeAnnotation: TypeDeclarationMap,
  parser: Parser,
): {
  typeAnnotation: $FlowFixMe,
  typeResolutionStatus: TypeResolutionStatus,
} {
  let typeResolutionStatus;
  let node;

  switch (resolvedTypeAnnotation.type) {
    case parser.typeAlias:
    case 'OpaqueType': {
      typeResolutionStatus = getTypeResolutionStatus(
        'alias',
        typeAnnotation,
        parser,
      );
      node = parser.nextNodeForTypeAlias(resolvedTypeAnnotation);
      break;
    }
    case parser.enumDeclaration: {
      typeResolutionStatus = getTypeResolutionStatus(
        'enum',
        typeAnnotation,
        parser,
      );
      node = parser.nextNodeForEnum(resolvedTypeAnnotation);
      break;
    }
    // parser.interfaceDeclaration is not used here because for flow it should fall through to default case and throw an error
    case 'TSInterfaceDeclaration': {
      typeResolutionStatus = getTypeResolutionStatus(
        'alias',
        typeAnnotation,
        parser,
      );
      node = resolvedTypeAnnotation;
      break;
    }
    default: {
      throw new TypeError(
        parser.genericTypeAnnotationErrorMessage(resolvedTypeAnnotation),
      );
    }
  }

  return {
    typeAnnotation: node,
    typeResolutionStatus,
  };
}

function buildPropertiesForEvent(
  property: $FlowFixMe,
  parser: Parser,
  getPropertyType: (
    name: $FlowFixMe,
    optional: boolean,
    typeAnnotation: $FlowFixMe,
    parser: Parser,
  ) => NamedShape<EventTypeAnnotation>,
): NamedShape<EventTypeAnnotation> {
  const name = property.key.name;
  const optional = parser.isOptionalProperty(property);
  const typeAnnotation = parser.getTypeAnnotationFromProperty(property);

  return getPropertyType(name, optional, typeAnnotation, parser);
}

function verifyPropNotAlreadyDefined(
  props: ReadonlyArray<PropAST>,
  needleProp: PropAST,
) {
  const propName = needleProp.key.name;
  const foundProp = props.some(prop => prop.key.name === propName);
  if (foundProp) {
    throw new Error(`A prop was already defined with the name ${propName}`);
  }
}

function handleEventHandler(
  name: 'BubblingEventHandler' | 'DirectEventHandler',
  typeAnnotation: $FlowFixMe,
  parser: Parser,
  types: TypeDeclarationMap,
  findEventArgumentsAndType: (
    parser: Parser,
    typeAnnotation: $FlowFixMe,
    types: TypeDeclarationMap,
    bubblingType: void | 'direct' | 'bubble',
    paperName: ?$FlowFixMe,
  ) => EventArgumentReturnType,
): EventArgumentReturnType {
  const eventType = name === 'BubblingEventHandler' ? 'bubble' : 'direct';
  const paperTopLevelNameDeprecated =
    parser.getPaperTopLevelNameDeprecated(typeAnnotation);

  switch (typeAnnotation.typeParameters.params[0].type) {
    case parser.nullLiteralTypeAnnotation:
    case parser.undefinedLiteralTypeAnnotation:
      return {
        argumentProps: [],
        bubblingType: eventType,
        paperTopLevelNameDeprecated,
      };
    default:
      return findEventArgumentsAndType(
        parser,
        typeAnnotation.typeParameters.params[0],
        types,
        eventType,
        paperTopLevelNameDeprecated,
      );
  }
}

function emitBuildEventSchema(
  paperTopLevelNameDeprecated: $FlowFixMe,
  name: $FlowFixMe,
  optional: $FlowFixMe,
  nonNullableBubblingType: 'direct' | 'bubble',
  argument: ObjectTypeAnnotation<EventTypeAnnotation>,
): ?EventTypeShape {
  if (paperTopLevelNameDeprecated != null) {
    return {
      name,
      optional,
      bubblingType: nonNullableBubblingType,
      paperTopLevelNameDeprecated,
      typeAnnotation: {
        type: 'EventTypeAnnotation',
        argument: argument,
      },
    };
  }

  return {
    name,
    optional,
    bubblingType: nonNullableBubblingType,
    typeAnnotation: {
      type: 'EventTypeAnnotation',
      argument: argument,
    },
  };
}

module.exports = {
  wrapModuleSchema,
  unwrapNullable,
  wrapNullable,
  assertGenericTypeAnnotationHasExactlyOneTypeParameter,
  isObjectProperty,
  parseObjectProperty,
  translateFunctionTypeAnnotation,
  buildPropertySchema,
  buildSchemaFromConfigType,
  buildSchema,
  createComponentConfig,
  parseModuleName,
  buildModuleSchema,
  findNativeComponentType,
  propertyNames,
  getCommandOptions,
  getOptions,
  getCommandTypeNameAndOptionsExpression,
  extendsForProp,
  buildPropSchema,
  getEventArgument,
  findComponentConfig,
  getCommandProperties,
  handleGenericTypeAnnotation,
  getTypeResolutionStatus,
  buildPropertiesForEvent,
  verifyPropNotAlreadyDefined,
  handleEventHandler,
  emitBuildEventSchema,
};

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
  NativeModuleEnumMember,
  NativeModuleEnumMemberType,
  NativeModuleEventEmitterShape,
  NativeModuleFunctionTypeAnnotation,
  NativeModuleParamTypeAnnotation,
  NativeModulePropertyShape,
  NativeModuleTypeAnnotation,
  Nullable,
  SchemaType,
} from '../../CodegenSchema';
import type {AliasResolver} from './Utils';

const {unwrapNullable} = require('../../parsers/parsers-commons');
const {wrapOptional} = require('../TypeUtils/Cxx');
const {
  getEnumName,
  parseValidUnionType,
  toPascalCase,
  toSafeCppString,
} = require('../Utils');
const {
  createAliasResolver,
  getModules,
  isArrayRecursiveMember,
  isDirectRecursiveMember,
} = require('./Utils');

type FilesOutput = Map<string, string>;

type Param = NamedShape<Nullable<NativeModuleParamTypeAnnotation>>;

function serializeArg(
  moduleName: string,
  arg: Param,
  index: number,
  resolveAlias: AliasResolver,
  enumMap: NativeModuleEnumMap,
): string {
  const {typeAnnotation: nullableTypeAnnotation, optional} = arg;
  const [typeAnnotation, nullable] =
    unwrapNullable<NativeModuleParamTypeAnnotation>(nullableTypeAnnotation);

  let realTypeAnnotation = typeAnnotation;
  if (realTypeAnnotation.type === 'TypeAliasTypeAnnotation') {
    realTypeAnnotation = resolveAlias(realTypeAnnotation.name);
  }

  function wrap(callback: (val: string) => string) {
    const val = `args[${index}]`;
    const expression = callback(val);

    // param?: T
    if (optional && !nullable) {
      return `count <= ${index} || ${val}.isUndefined() ? std::nullopt : std::make_optional(${expression})`;
    }

    // param: ?T
    // param?: ?T
    if (nullable || optional) {
      return `count <= ${index} || ${val}.isNull() || ${val}.isUndefined() ? std::nullopt : std::make_optional(${expression})`;
    }

    // param: T
    return `count <= ${index} ? throw jsi::JSError(rt, "Expected argument in position ${index} to be passed") : ${expression}`;
  }

  switch (realTypeAnnotation.type) {
    case 'ReservedTypeAnnotation':
      switch (realTypeAnnotation.name) {
        case 'RootTag':
          return wrap(val => `${val}.asNumber()`);
        default:
          realTypeAnnotation.name as empty;
          throw new Error(
            `Unknown prop type for "${arg.name}, found: ${realTypeAnnotation.name}"`,
          );
      }
    case 'StringTypeAnnotation':
      return wrap(val => `${val}.asString(rt)`);
    case 'StringLiteralTypeAnnotation':
      return wrap(val => `${val}.asString(rt)`);
    case 'BooleanTypeAnnotation':
      return wrap(val => `${val}.asBool()`);
    case 'BooleanLiteralTypeAnnotation':
      return wrap(val => `${val}.asBool()`);
    case 'EnumDeclaration':
      switch (realTypeAnnotation.memberType) {
        case 'NumberTypeAnnotation':
          return wrap(val => `${val}.asNumber()`);
        case 'StringTypeAnnotation':
          return wrap(val => `${val}.asString(rt)`);
        default:
          throw new Error(
            `Unknown enum type for "${arg.name}, found: ${realTypeAnnotation.type}"`,
          );
      }
    case 'NumberTypeAnnotation':
      return wrap(val => `${val}.asNumber()`);
    case 'FloatTypeAnnotation':
      return wrap(val => `${val}.asNumber()`);
    case 'DoubleTypeAnnotation':
      return wrap(val => `${val}.asNumber()`);
    case 'Int32TypeAnnotation':
      return wrap(val => `${val}.asNumber()`);
    case 'NumberLiteralTypeAnnotation':
      return wrap(val => `${val}.asNumber()`);
    case 'ArrayTypeAnnotation':
      return wrap(val => `${val}.asObject(rt).asArray(rt)`);
    case 'FunctionTypeAnnotation':
      return wrap(val => `${val}.asObject(rt).asFunction(rt)`);
    case 'GenericObjectTypeAnnotation':
      return wrap(val => `${val}.asObject(rt)`);
    case 'UnionTypeAnnotation':
      const validUnionType = parseValidUnionType(realTypeAnnotation);
      switch (validUnionType) {
        case 'boolean':
          return wrap(val => `${val}.asBool()`);
        case 'number':
          return wrap(val => `${val}.asNumber()`);
        case 'object':
          return wrap(val => `${val}.asObject(rt)`);
        case 'string':
          return wrap(val => `${val}.asString(rt)`);
        default:
          validUnionType as empty;
          throw new Error(`Unsupported union member type`);
      }
    case 'ObjectTypeAnnotation':
      return wrap(val => `${val}.asObject(rt)`);
    case 'MixedTypeAnnotation':
      return wrap(val => `jsi::Value(rt, ${val})`);
    case 'ArrayBufferTypeAnnotation':
      return wrap(val => `${val}.asObject(rt).getArrayBuffer(rt)`);
    default:
      realTypeAnnotation.type as empty;
      throw new Error(
        `Unknown prop type for "${arg.name}, found: ${realTypeAnnotation.type}"`,
      );
  }
}

const ModuleSpecClassDeclarationTemplate = ({
  hasteModuleName,
  moduleName,
  structs,
  enums,
  moduleEventEmitters,
  moduleFunctions,
  methods,
}: Readonly<{
  hasteModuleName: string,
  moduleName: string,
  structs: string,
  enums: string,
  moduleEventEmitters: EventEmitterCpp[],
  moduleFunctions: string[],
  methods: ReadonlyArray<Readonly<{methodName: string, paramCount: number}>>,
}>) => {
  return `${enums}${structs}
template <typename T>
class JSI_EXPORT ${hasteModuleName}CxxSpec : public TurboModule {
public:
  static constexpr std::string_view kModuleName = "${moduleName}";

protected:
  ${hasteModuleName}CxxSpec(std::shared_ptr<CallInvoker> jsInvoker) : TurboModule(std::string{${hasteModuleName}CxxSpec::kModuleName}, jsInvoker) {
${methods
  .map(({methodName, paramCount}) => {
    return `    methodMap_["${methodName}"] = MethodMetadata {.argCount = ${paramCount}, .invoker = __${methodName}};`;
  })
  .join(
    '\n',
  )}${moduleEventEmitters.length > 0 ? '\n' : ''}${moduleEventEmitters.map(e => e.registerEventEmitter).join('\n')}
  }
  ${moduleEventEmitters.map(e => e.emitFunction).join('\n')}
private:
${moduleFunctions.join('\n\n')}
};`;
};

const FileTemplate = ({
  modules,
}: Readonly<{
  modules: string[],
}>) => {
  return `/**
 * This code was generated by [react-native-codegen](https://www.npmjs.com/package/react-native-codegen).
 *
 * Do not edit this file as changes may cause incorrect behavior and will be lost
 * once the code is regenerated.
 *
 * ${'@'}generated by codegen project: GenerateModuleH.js
 */

#pragma once

#include <ReactCommon/TurboModule.h>
#include <react/bridging/Bridging.h>

namespace facebook::react {

${modules.join('\n\n')}

} // namespace facebook::react
`;
};

function translatePrimitiveJSTypeToCpp(
  moduleName: string,
  parentObjectAliasName: ?string,
  nullableTypeAnnotation: Nullable<NativeModuleTypeAnnotation>,
  optional: boolean,
  createErrorMessage: (typeName: string) => string,
  resolveAlias: AliasResolver,
  enumMap: NativeModuleEnumMap,
) {
  const [typeAnnotation, nullable] = unwrapNullable<NativeModuleTypeAnnotation>(
    nullableTypeAnnotation,
  );
  const isRecursiveType = isDirectRecursiveMember(
    parentObjectAliasName,
    nullableTypeAnnotation,
  );
  const isRequired = (!optional && !nullable) || isRecursiveType;
  let realTypeAnnotation = typeAnnotation;
  if (realTypeAnnotation.type === 'TypeAliasTypeAnnotation') {
    realTypeAnnotation = resolveAlias(realTypeAnnotation.name);
  }

  switch (realTypeAnnotation.type) {
    case 'ReservedTypeAnnotation':
      switch (realTypeAnnotation.name) {
        case 'RootTag':
          return wrapOptional('double', isRequired);
        default:
          realTypeAnnotation.name as empty;
          throw new Error(createErrorMessage(realTypeAnnotation.name));
      }
    case 'VoidTypeAnnotation':
      return 'void';
    case 'StringTypeAnnotation':
      return wrapOptional('jsi::String', isRequired);
    case 'StringLiteralTypeAnnotation':
      return wrapOptional('jsi::String', isRequired);
    case 'NumberTypeAnnotation':
      return wrapOptional('double', isRequired);
    case 'NumberLiteralTypeAnnotation':
      return wrapOptional('double', isRequired);
    case 'DoubleTypeAnnotation':
      return wrapOptional('double', isRequired);
    case 'FloatTypeAnnotation':
      return wrapOptional('double', isRequired);
    case 'Int32TypeAnnotation':
      return wrapOptional('int', isRequired);
    case 'BooleanTypeAnnotation':
      return wrapOptional('bool', isRequired);
    case 'BooleanLiteralTypeAnnotation':
      return wrapOptional('bool', isRequired);
    case 'EnumDeclaration':
      switch (realTypeAnnotation.memberType) {
        case 'NumberTypeAnnotation':
          return wrapOptional('jsi::Value', isRequired);
        case 'StringTypeAnnotation':
          return wrapOptional('jsi::String', isRequired);
        default:
          throw new Error(createErrorMessage(realTypeAnnotation.type));
      }
    case 'GenericObjectTypeAnnotation':
      return wrapOptional('jsi::Object', isRequired);
    case 'UnionTypeAnnotation':
      const validUnionType = parseValidUnionType(realTypeAnnotation);
      switch (validUnionType) {
        case 'boolean':
          return wrapOptional('bool', isRequired);
        case 'number':
          return wrapOptional('double', isRequired);
        case 'object':
          return wrapOptional('jsi::Object', isRequired);
        case 'string':
          return wrapOptional('jsi::String', isRequired);
        default:
          validUnionType as empty;
          throw new Error(`Unsupported union member type`);
      }
    case 'ObjectTypeAnnotation':
      return wrapOptional('jsi::Object', isRequired);
    case 'ArrayTypeAnnotation':
      return wrapOptional('jsi::Array', isRequired);
    case 'FunctionTypeAnnotation':
      return wrapOptional('jsi::Function', isRequired);
    case 'PromiseTypeAnnotation':
      return wrapOptional('jsi::Value', isRequired);
    case 'MixedTypeAnnotation':
      return wrapOptional('jsi::Value', isRequired);
    case 'ArrayBufferTypeAnnotation':
      return wrapOptional('jsi::ArrayBuffer', isRequired);
    default:
      realTypeAnnotation.type as empty;
      throw new Error(createErrorMessage(realTypeAnnotation.type));
  }
}

function createStructsString(
  hasteModuleName: string,
  aliasMap: NativeModuleAliasMap,
  resolveAlias: AliasResolver,
  enumMap: NativeModuleEnumMap,
): string {
  const getCppType = (
    parentObjectAlias: string,
    v: NamedShape<Nullable<NativeModuleBaseTypeAnnotation>>,
  ) =>
    translatePrimitiveJSTypeToCpp(
      hasteModuleName,
      parentObjectAlias,
      v.typeAnnotation,
      false,
      typeName => `Unsupported type for param "${v.name}". Found: ${typeName}`,
      resolveAlias,
      enumMap,
    );

  return Object.keys(aliasMap)
    .map(alias => {
      const value = aliasMap[alias];
      if (value.properties.length === 0) {
        return '';
      }
      const structName = `${hasteModuleName}${alias}`;
      const templateParameter = value.properties.filter(
        v =>
          !isDirectRecursiveMember(alias, v.typeAnnotation) &&
          !isArrayRecursiveMember(alias, v.typeAnnotation),
      );
      const templateParameterWithTypename = templateParameter
        .map((v, i) => `typename P${i}`)
        .join(', ');
      const templateParameterWithoutTypename = templateParameter
        .map((v, i) => `P${i}`)
        .join(', ');
      let i = -1;
      const templateMemberTypes = value.properties.map(v => {
        if (isDirectRecursiveMember(alias, v.typeAnnotation)) {
          return `std::unique_ptr<${structName}<${templateParameterWithoutTypename}>> ${v.name}`;
        } else if (isArrayRecursiveMember(alias, v.typeAnnotation)) {
          const [nullable] = unwrapNullable<NativeModuleTypeAnnotation>(
            v.typeAnnotation,
          );
          return (
            (nullable
              ? `std::optional<std::vector<${structName}<${templateParameterWithoutTypename}>>>`
              : `std::vector<${structName}<${templateParameterWithoutTypename}>>`) +
            ` ${v.name}`
          );
        } else {
          i++;
          return `P${i} ${v.name}`;
        }
      });
      const debugParameterConversion = value.properties
        .map(
          v => `  static ${getCppType(alias, v)} ${
            v.name
          }ToJs(jsi::Runtime &rt, decltype(types.${v.name}) value) {
    return bridging::toJs(rt, value);
  }`,
        )
        .join('\n');
      return `
#pragma mark - ${structName}

template <${templateParameterWithTypename}>
struct ${structName} {
${templateMemberTypes.map(v => '  ' + v).join('{};\n')};
  bool operator==(const ${structName} &other) const {
    return ${value.properties
      .map(v => `${v.name} == other.${v.name}`)
      .join(' && ')};
  }
};

template <typename T>
struct ${structName}Bridging {
  static T types;

  static T fromJs(
      jsi::Runtime &rt,
      const jsi::Object &value,
      const std::shared_ptr<CallInvoker> &jsInvoker) {
    T result{
${value.properties
  .map(v => {
    if (isDirectRecursiveMember(alias, v.typeAnnotation)) {
      return `      value.hasProperty(rt, "${v.name}") ? std::make_unique<T>(bridging::fromJs<T>(rt, value.getProperty(rt, "${v.name}"), jsInvoker)) : nullptr`;
    } else {
      return `      bridging::fromJs<decltype(types.${v.name})>(rt, value.getProperty(rt, "${v.name}"), jsInvoker)`;
    }
  })
  .join(',\n')}};
    return result;
  }

#ifdef DEBUG
${debugParameterConversion}
#endif

  static jsi::Object toJs(
      jsi::Runtime &rt,
      const T &value,
      const std::shared_ptr<CallInvoker> &jsInvoker) {
    auto result = facebook::jsi::Object(rt);
${value.properties
  .map(v => {
    if (isDirectRecursiveMember(alias, v.typeAnnotation)) {
      return `    if (value.${v.name}) {
        result.setProperty(rt, "${v.name}", bridging::toJs(rt, *value.${v.name}, jsInvoker));
      }`;
    } else if (v.optional) {
      return `    if (value.${v.name}) {
      result.setProperty(rt, "${v.name}", bridging::toJs(rt, value.${v.name}.value(), jsInvoker));
    }`;
    } else {
      return `    result.setProperty(rt, "${v.name}", bridging::toJs(rt, value.${v.name}, jsInvoker));`;
    }
  })
  .join('\n')}
    return result;
  }
};

`;
    })
    .join('\n');
}

type NativeEnumMemberValueType = 'std::string' | 'int32_t';

const EnumTemplate = ({
  enumName,
  values,
  fromCases,
  toCases,
  nativeEnumMemberType,
}: {
  enumName: string,
  values: string,
  fromCases: string,
  toCases: string,
  nativeEnumMemberType: NativeEnumMemberValueType,
}) => {
  const [fromValue, fromValueConversion, toValue] =
    nativeEnumMemberType === 'std::string'
      ? [
          'const jsi::String &rawValue',
          'std::string value = rawValue.utf8(rt);',
          'jsi::String',
        ]
      : [
          'const jsi::Value &rawValue',
          'double value = (double)rawValue.asNumber();',
          'jsi::Value',
        ];

  return `
#pragma mark - ${enumName}

enum class ${enumName} { ${values} };

template <>
struct Bridging<${enumName}> {
  static ${enumName} fromJs(jsi::Runtime &rt, ${fromValue}) {
    ${fromValueConversion}
    ${fromCases}
  }

  static ${toValue} toJs(jsi::Runtime &rt, ${enumName} value) {
    ${toCases}
  }
};`;
};

function getMemberValueAppearance(member: NativeModuleEnumMember['value']) {
  if (member.type === 'StringLiteralTypeAnnotation') {
    return `"${member.value}"`;
  } else {
    return member.value;
  }
}

function generateEnum(
  hasteModuleName: string,
  origEnumName: string,
  members: ReadonlyArray<NativeModuleEnumMember>,
  memberType: NativeModuleEnumMemberType,
): string {
  const enumName = getEnumName(hasteModuleName, origEnumName);

  const nativeEnumMemberType: NativeEnumMemberValueType =
    memberType === 'StringTypeAnnotation' ? 'std::string' : 'int32_t';

  const fromCases =
    members
      .map(
        member => `if (value == ${getMemberValueAppearance(member.value)}) {
      return ${enumName}::${toSafeCppString(member.name)};
    }`,
      )
      .join(' else ') +
    ` else {
      throw jsi::JSError(rt, "No appropriate enum member found for value in ${enumName}");
    }`;

  const toCases =
    members
      .map(
        member => `if (value == ${enumName}::${toSafeCppString(member.name)}) {
      return bridging::toJs(rt, ${getMemberValueAppearance(member.value)});
    }`,
      )
      .join(' else ') +
    ` else {
      throw jsi::JSError(rt, "No appropriate enum member found for enum value in ${enumName}");
    }`;

  return EnumTemplate({
    enumName,
    values: members
      .map(member => {
        const name = toSafeCppString(member.name);
        if (Number.isInteger(member.value.value)) {
          return `${name} = ${member.value.value}`;
        }
        return name;
      })
      .join(', '),
    fromCases,
    toCases,
    nativeEnumMemberType,
  });
}

function createEnums(
  hasteModuleName: string,
  enumMap: NativeModuleEnumMap,
  resolveAlias: AliasResolver,
): string {
  return Object.entries(enumMap)
    .map(([enumName, enumNode]) => {
      return generateEnum(
        hasteModuleName,
        enumName,
        enumNode.members,
        enumNode.memberType,
      );
    })
    .filter(Boolean)
    .join('\n');
}

function translateFunctionToCpp(
  hasteModuleName: string,
  prop: NativeModulePropertyShape,
  resolveAlias: AliasResolver,
  enumMap: NativeModuleEnumMap,
  args: Array<string>,
  returnTypeAnnotation: Nullable<NativeModuleTypeAnnotation>,
): string {
  const [propTypeAnnotation] =
    unwrapNullable<NativeModuleFunctionTypeAnnotation>(prop.typeAnnotation);

  const isNullable = returnTypeAnnotation.type === 'NullableTypeAnnotation';
  const isVoid = returnTypeAnnotation.type === 'VoidTypeAnnotation';

  const paramTypes = propTypeAnnotation.params.map(param => {
    const translatedParam = translatePrimitiveJSTypeToCpp(
      hasteModuleName,
      null,
      param.typeAnnotation,
      param.optional,
      typeName =>
        `Unsupported type for param "${param.name}" in ${prop.name}. Found: ${typeName}`,
      resolveAlias,
      enumMap,
    );
    return `${translatedParam} ${param.name}`;
  });
  paramTypes.unshift('jsi::Runtime &rt');

  const returnType = translatePrimitiveJSTypeToCpp(
    hasteModuleName,
    null,
    propTypeAnnotation.returnTypeAnnotation,
    false,
    typeName => `Unsupported return type for ${prop.name}. Found: ${typeName}`,
    resolveAlias,
    enumMap,
  );

  let methodCallArgs = [...args].join(',\n      ');
  if (methodCallArgs.length > 0) {
    methodCallArgs = `,\n      ${methodCallArgs}`;
  }

  return `  static jsi::Value __${prop.name}(jsi::Runtime &rt, TurboModule &turboModule, const jsi::Value* ${args.length > 0 ? 'args' : '/*args*/'}, size_t ${args.length > 0 ? 'count' : '/*count*/'}) {
    static_assert(
      bridging::getParameterCount(&T::${prop.name}) == ${paramTypes.length},
      "Expected ${prop.name}(...) to have ${paramTypes.length} parameters");
    ${!isVoid ? (!isNullable ? 'return ' : 'auto result = ') : ''}bridging::callFromJs<${returnType}>(rt, &T::${prop.name},  static_cast<${hasteModuleName}CxxSpec*>(&turboModule)->jsInvoker_, static_cast<T*>(&turboModule)${methodCallArgs});${!isVoid ? (!isNullable ? '' : 'return result ? jsi::Value(std::move(*result)) : jsi::Value::null();') : 'return jsi::Value::undefined();'}\n  }`;
}

type EventEmitterCpp = {
  isVoidTypeAnnotation: boolean,
  templateName: string,
  registerEventEmitter: string,
  emitFunction: string,
};

function translateEventEmitterToCpp(
  moduleName: string,
  eventEmitter: NativeModuleEventEmitterShape,
  resolveAlias: AliasResolver,
  enumMap: NativeModuleEnumMap,
): EventEmitterCpp {
  const isVoidTypeAnnotation =
    eventEmitter.typeAnnotation.typeAnnotation.type === 'VoidTypeAnnotation';
  const templateName = `${toPascalCase(eventEmitter.name)}Type`;
  const jsiType = translatePrimitiveJSTypeToCpp(
    moduleName,
    null,
    eventEmitter.typeAnnotation.typeAnnotation,
    false,
    typeName =>
      `Unsupported type for eventEmitter "${eventEmitter.name}" in ${moduleName}. Found: ${typeName}`,
    resolveAlias,
    enumMap,
  );
  const isArray = jsiType === 'jsi::Array';
  return {
    isVoidTypeAnnotation: isVoidTypeAnnotation,
    templateName: isVoidTypeAnnotation ? `/*${templateName}*/` : templateName,
    registerEventEmitter: `    eventEmitterMap_["${
      eventEmitter.name
    }"] = std::make_shared<AsyncEventEmitter<${
      isVoidTypeAnnotation ? '' : 'jsi::Value'
    }>>();`,
    emitFunction: `
  ${
    isVoidTypeAnnotation ? '' : `template <typename ${templateName}> `
  }void emit${toPascalCase(eventEmitter.name)}(${
    isVoidTypeAnnotation
      ? ''
      : `${isArray ? `std::vector<${templateName}>` : templateName} value`
  }) {${
    isVoidTypeAnnotation
      ? ''
      : `
    static_assert(bridging::supportsFromJs<${
      isArray ? `std::vector<${templateName}>` : templateName
    }, ${jsiType}>, "value cannnot be converted to ${jsiType}");`
  }
    static_cast<AsyncEventEmitter<${
      isVoidTypeAnnotation ? '' : 'jsi::Value'
    }>&>(*eventEmitterMap_["${eventEmitter.name}"]).emit(${
      isVoidTypeAnnotation
        ? ''
        : `[jsInvoker = jsInvoker_, eventValue = value](jsi::Runtime& rt) -> jsi::Value {
      return bridging::toJs(rt, eventValue, jsInvoker);
    }`
    });
  }`,
  };
}

module.exports = {
  generate(
    libraryName: string,
    schema: SchemaType,
    packageName?: string,
    assumeNonnull: boolean = false,
    headerPrefix?: string,
  ): FilesOutput {
    const nativeModules = getModules(schema);

    const modules = Object.keys(nativeModules).flatMap(hasteModuleName => {
      const nativeModule = nativeModules[hasteModuleName];
      const {
        aliasMap,
        enumMap,
        spec: {methods},
        spec,
        moduleName,
      } = nativeModule;
      const resolveAlias = createAliasResolver(aliasMap);
      const structs = createStructsString(
        hasteModuleName,
        aliasMap,
        resolveAlias,
        enumMap,
      );
      const enums = createEnums(hasteModuleName, enumMap, resolveAlias);
      return [
        ModuleSpecClassDeclarationTemplate({
          hasteModuleName,
          moduleName,
          structs,
          enums,
          moduleEventEmitters: spec.eventEmitters.map(eventEmitter =>
            translateEventEmitterToCpp(
              moduleName,
              eventEmitter,
              resolveAlias,
              enumMap,
            ),
          ),
          moduleFunctions: spec.methods.map(property => {
            const [propertyTypeAnnotation] =
              unwrapNullable<NativeModuleFunctionTypeAnnotation>(
                property.typeAnnotation,
              );
            return translateFunctionToCpp(
              hasteModuleName,
              property,
              resolveAlias,
              enumMap,
              propertyTypeAnnotation.params.map((p, i) =>
                serializeArg(moduleName, p, i, resolveAlias, enumMap),
              ),
              propertyTypeAnnotation.returnTypeAnnotation,
            );
          }),
          methods: methods.map(
            ({name: propertyName, typeAnnotation: nullableTypeAnnotation}) => {
              const [{params}] = unwrapNullable(nullableTypeAnnotation);
              return {
                methodName: propertyName,
                paramCount: params.length,
              };
            },
          ),
        }),
      ];
    });

    const fileName = `${libraryName}JSI.h`;
    const replacedTemplate = FileTemplate({modules});

    return new Map([[fileName, replacedTemplate]]);
  },
};

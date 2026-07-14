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

export type PlatformType = 'iOS' | 'android';

export type SchemaType = Readonly<{
  libraryName?: string,
  modules: Readonly<{
    [hasteModuleName: string]: ComponentSchema | NativeModuleSchema,
  }>,
}>;

/**
 * Component Type Annotations
 */
export type DoubleTypeAnnotation = Readonly<{
  type: 'DoubleTypeAnnotation',
}>;

export type FloatTypeAnnotation = Readonly<{
  type: 'FloatTypeAnnotation',
}>;

export type NumberTypeAnnotation = Readonly<{
  type: 'NumberTypeAnnotation',
}>;

export type BooleanTypeAnnotation = Readonly<{
  type: 'BooleanTypeAnnotation',
}>;

export type Int32TypeAnnotation = Readonly<{
  type: 'Int32TypeAnnotation',
}>;

export type NumberLiteralTypeAnnotation = Readonly<{
  type: 'NumberLiteralTypeAnnotation',
  value: number,
}>;

export type StringTypeAnnotation = Readonly<{
  type: 'StringTypeAnnotation',
}>;

export type StringLiteralTypeAnnotation = Readonly<{
  type: 'StringLiteralTypeAnnotation',
  value: string,
}>;

export type BooleanLiteralTypeAnnotation = Readonly<{
  type: 'BooleanLiteralTypeAnnotation',
  value: boolean,
}>;

export type StringLiteralUnionTypeAnnotation =
  UnionTypeAnnotation<StringLiteralTypeAnnotation>;

export type VoidTypeAnnotation = Readonly<{
  type: 'VoidTypeAnnotation',
}>;

export type ArrayBufferTypeAnnotation = Readonly<{
  type: 'ArrayBufferTypeAnnotation',
}>;

export type ObjectTypeAnnotation<out T> = Readonly<{
  type: 'ObjectTypeAnnotation',
  properties: ReadonlyArray<NamedShape<T>>,
  // metadata for objects that generated from interfaces
  baseTypes?: ReadonlyArray<string>,
}>;

export type UnionTypeAnnotation<out T> = Readonly<{
  type: 'UnionTypeAnnotation',
  types: ReadonlyArray<T>,
}>;

export type MixedTypeAnnotation = Readonly<{
  type: 'MixedTypeAnnotation',
}>;

export type EventEmitterTypeAnnotation = Readonly<{
  type: 'EventEmitterTypeAnnotation',
  typeAnnotation: NativeModuleEventEmitterTypeAnnotation | $FlowFixMe,
}>;

type FunctionTypeAnnotation<out P, out R> = Readonly<{
  type: 'FunctionTypeAnnotation',
  params: ReadonlyArray<NamedShape<P>>,
  returnTypeAnnotation: R,
}>;

export type NamedShape<out T> = Readonly<{
  name: string,
  optional: boolean,
  typeAnnotation: T,
}>;

export type ComponentSchema = Readonly<{
  type: 'Component',
  components: Readonly<{
    [componentName: string]: ComponentShape,
  }>,
}>;

export type ComponentShape = Readonly<{
  ...OptionsShape,
  extendsProps: ReadonlyArray<ExtendsPropsShape>,
  events: ReadonlyArray<EventTypeShape>,
  props: ReadonlyArray<NamedShape<PropTypeAnnotation>>,
  commands: ReadonlyArray<NamedShape<CommandTypeAnnotation>>,
}>;

export type OptionsShape = Readonly<{
  // Use to generate only interfaces of components (C++ Props, C++ EventEmitters, JVM interfaces) and not their implementation.
  // This is useful for components that have a custom implementation of ShadowNode, ComponentDescriptor, State.
  interfaceOnly?: boolean,
  // Use for components with no current paper rename in progress
  // Does not check for new name
  paperComponentName?: string,
  // Use for components that are not used on other platforms.
  excludedPlatforms?: ReadonlyArray<PlatformType>,
  // Use for components currently being renamed in paper
  // Will use new name if it is available and fallback to this name
  paperComponentNameDeprecated?: string,
  // Use to generate C++ Props with optional types for properties defined as optional
  generateOptionalProperties?: boolean,
  // Use to generate C++ Props with optional types for object properties defined as optional
  generateOptionalObjectProperties?: boolean,
}>;

export type ExtendsPropsShape = Readonly<{
  type: 'ReactNativeBuiltInType',
  knownTypeName: 'ReactNativeCoreViewProps',
}>;

export type EventTypeShape = Readonly<{
  name: string,
  bubblingType: 'direct' | 'bubble',
  optional: boolean,
  paperTopLevelNameDeprecated?: string,
  typeAnnotation: Readonly<{
    type: 'EventTypeAnnotation',
    argument?: ObjectTypeAnnotation<EventTypeAnnotation>,
  }>,
}>;

export type EventTypeAnnotation =
  | BooleanTypeAnnotation
  | StringTypeAnnotation
  | DoubleTypeAnnotation
  | FloatTypeAnnotation
  | Int32TypeAnnotation
  | MixedTypeAnnotation
  | StringLiteralUnionTypeAnnotation
  | ObjectTypeAnnotation<EventTypeAnnotation>
  | ArrayTypeAnnotation<EventTypeAnnotation>;

export type ComponentArrayTypeAnnotation = ArrayTypeAnnotation<
  | BooleanTypeAnnotation
  | StringTypeAnnotation
  | DoubleTypeAnnotation
  | FloatTypeAnnotation
  | Int32TypeAnnotation
  | MixedTypeAnnotation
  | Readonly<{
      type: 'StringEnumTypeAnnotation',
      default: string,
      options: ReadonlyArray<string>,
    }>
  | ObjectTypeAnnotation<PropTypeAnnotation>
  | ReservedPropTypeAnnotation
  | ArrayTypeAnnotation<ObjectTypeAnnotation<PropTypeAnnotation>>,
>;

export type ComponentCommandArrayTypeAnnotation = ArrayTypeAnnotation<
  | BooleanTypeAnnotation
  | StringTypeAnnotation
  | DoubleTypeAnnotation
  | FloatTypeAnnotation
  | Int32TypeAnnotation
  // Mixed is not great. This generally means its a type alias to another type
  // like an object or union. Ideally we'd encode that type in the schema so the compat-check can
  // validate those deeper objects for breaking changes and the generators can do something smarter.
  // As of now, the generators just create ReadableMap or (const NSArray *) which are untyped
  | MixedTypeAnnotation,
>;

export type ArrayTypeAnnotation<out T> = Readonly<{
  type: 'ArrayTypeAnnotation',
  elementType: T,
}>;

export type PropTypeAnnotation =
  | Readonly<{
      type: 'BooleanTypeAnnotation',
      default: boolean | null,
    }>
  | Readonly<{
      type: 'StringTypeAnnotation',
      default: string | null,
    }>
  | Readonly<{
      type: 'DoubleTypeAnnotation',
      default: number,
    }>
  | Readonly<{
      type: 'FloatTypeAnnotation',
      default: number | null,
    }>
  | Readonly<{
      type: 'Int32TypeAnnotation',
      default: number,
    }>
  | Readonly<{
      type: 'StringEnumTypeAnnotation',
      default: string,
      options: ReadonlyArray<string>,
    }>
  | Readonly<{
      type: 'Int32EnumTypeAnnotation',
      default: number,
      options: ReadonlyArray<number>,
    }>
  | ReservedPropTypeAnnotation
  | ObjectTypeAnnotation<PropTypeAnnotation>
  | ComponentArrayTypeAnnotation
  | MixedTypeAnnotation;

export type ReservedPropTypeAnnotation = Readonly<{
  type: 'ReservedPropTypeAnnotation',
  name:
    | 'ColorPrimitive'
    | 'ImageSourcePrimitive'
    | 'PointPrimitive'
    | 'EdgeInsetsPrimitive'
    | 'ImageRequestPrimitive'
    | 'DimensionPrimitive',
}>;

export type CommandTypeAnnotation = FunctionTypeAnnotation<
  CommandParamTypeAnnotation,
  VoidTypeAnnotation,
>;

export type CommandParamTypeAnnotation =
  | ReservedTypeAnnotation
  | BooleanTypeAnnotation
  | Int32TypeAnnotation
  | DoubleTypeAnnotation
  | FloatTypeAnnotation
  | StringTypeAnnotation
  | ComponentCommandArrayTypeAnnotation;

export type ReservedTypeAnnotation = Readonly<{
  type: 'ReservedTypeAnnotation',
  name: 'RootTag', // Union with more custom types.
}>;

/**
 * NativeModule Types
 */
export type Nullable<out T extends NativeModuleTypeAnnotation> =
  NullableTypeAnnotation<T> | T;

export type NullableTypeAnnotation<out T extends NativeModuleTypeAnnotation> =
  Readonly<{
    type: 'NullableTypeAnnotation',
    typeAnnotation: T,
  }>;

export type NativeModuleSchema = Readonly<{
  type: 'NativeModule',
  aliasMap: NativeModuleAliasMap,
  enumMap: NativeModuleEnumMap,
  spec: NativeModuleSpec,
  moduleName: string,
  // Use for modules that are not used on other platforms.
  // TODO: It's clearer to define `restrictedToPlatforms` instead, but
  // `excludedPlatforms` is used here to be consistent with ComponentSchema.
  excludedPlatforms?: ReadonlyArray<PlatformType>,
}>;

type NativeModuleSpec = Readonly<{
  eventEmitters: ReadonlyArray<NativeModuleEventEmitterShape>,
  methods: ReadonlyArray<NativeModulePropertyShape>,
}>;

export type NativeModuleEventEmitterShape =
  NamedShape<EventEmitterTypeAnnotation>;

export type NativeModulePropertyShape = NamedShape<
  Nullable<NativeModuleFunctionTypeAnnotation>,
>;

export type NativeModuleEnumMap = Readonly<{
  [enumName: string]: NativeModuleEnumDeclarationWithMembers,
}>;

export type NativeModuleAliasMap = Readonly<{
  [aliasName: string]: NativeModuleObjectTypeAnnotation,
}>;

export type NativeModuleFunctionTypeAnnotation = FunctionTypeAnnotation<
  Nullable<NativeModuleParamTypeAnnotation>,
  Nullable<NativeModuleReturnTypeAnnotation>,
>;

export type NativeModuleObjectTypeAnnotation = ObjectTypeAnnotation<
  Nullable<NativeModuleBaseTypeAnnotation>,
>;

export type NativeModuleArrayTypeAnnotation<
  out T extends Nullable<NativeModuleBaseTypeAnnotation>,
> = ArrayTypeAnnotation<
  | T
  /**
   * TODO(T72031674): Migrate all our NativeModule specs to not use
   * invalid Array ElementTypes. Then, make the elementType required.
   */
  | UnsafeAnyTypeAnnotation,
>;

export type UnsafeAnyTypeAnnotation = {
  type: 'AnyTypeAnnotation',
};

export type NativeModuleNumberTypeAnnotation = Readonly<{
  type: 'NumberTypeAnnotation',
}>;

export type NativeModuleEnumMember = {
  name: string,
  value: StringLiteralTypeAnnotation | NumberLiteralTypeAnnotation,
};

export type NativeModuleEnumMemberType =
  'NumberTypeAnnotation' | 'StringTypeAnnotation';

export type NativeModuleEnumDeclaration = Readonly<{
  name: string,
  type: 'EnumDeclaration',
  memberType: NativeModuleEnumMemberType,
}>;

export type NativeModuleEnumDeclarationWithMembers = {
  name: string,
  type: 'EnumDeclarationWithMembers',
  memberType: NativeModuleEnumMemberType,
  members: ReadonlyArray<NativeModuleEnumMember>,
};

export type NativeModuleGenericObjectTypeAnnotation = Readonly<{
  type: 'GenericObjectTypeAnnotation',
  // a dictionary type is codegen as "Object"
  // but we know all its members are in the same type
  // when it happens, the following field is non-null
  dictionaryValueType?: Nullable<NativeModuleTypeAnnotation>,
}>;

export type NativeModuleTypeAliasTypeAnnotation = Readonly<{
  type: 'TypeAliasTypeAnnotation',
  name: string,
}>;

export type NativeModulePromiseTypeAnnotation = Readonly<{
  type: 'PromiseTypeAnnotation',
  elementType: VoidTypeAnnotation | Nullable<NativeModuleBaseTypeAnnotation>,
}>;

export type NativeModuleUnionTypeAnnotationMemberType =
  | NativeModuleObjectTypeAnnotation
  | StringLiteralTypeAnnotation
  | NumberLiteralTypeAnnotation
  | BooleanLiteralTypeAnnotation
  | BooleanTypeAnnotation
  | StringTypeAnnotation
  | NumberTypeAnnotation;

export type NativeModuleUnionTypeAnnotation =
  UnionTypeAnnotation<NativeModuleUnionTypeAnnotationMemberType>;

export type NativeModuleMixedTypeAnnotation = Readonly<{
  type: 'MixedTypeAnnotation',
}>;

type NativeModuleEventEmitterBaseTypeAnnotation =
  | BooleanTypeAnnotation
  | DoubleTypeAnnotation
  | FloatTypeAnnotation
  | Int32TypeAnnotation
  | NativeModuleNumberTypeAnnotation
  | NumberLiteralTypeAnnotation
  | BooleanLiteralTypeAnnotation
  | StringTypeAnnotation
  | StringLiteralTypeAnnotation
  | StringLiteralUnionTypeAnnotation
  | NativeModuleTypeAliasTypeAnnotation
  | NativeModuleGenericObjectTypeAnnotation
  | VoidTypeAnnotation;

export type NativeModuleEventEmitterTypeAnnotation =
  | NativeModuleEventEmitterBaseTypeAnnotation
  | ArrayTypeAnnotation<NativeModuleEventEmitterBaseTypeAnnotation>;

export type NativeModuleBaseTypeAnnotation =
  | ArrayBufferTypeAnnotation
  | StringTypeAnnotation
  | StringLiteralTypeAnnotation
  | StringLiteralUnionTypeAnnotation
  | NativeModuleNumberTypeAnnotation
  | NumberLiteralTypeAnnotation
  | BooleanLiteralTypeAnnotation
  | Int32TypeAnnotation
  | DoubleTypeAnnotation
  | FloatTypeAnnotation
  | BooleanTypeAnnotation
  | NativeModuleEnumDeclaration
  | NativeModuleGenericObjectTypeAnnotation
  | ReservedTypeAnnotation
  | NativeModuleTypeAliasTypeAnnotation
  | NativeModuleArrayTypeAnnotation<Nullable<NativeModuleBaseTypeAnnotation>>
  | NativeModuleObjectTypeAnnotation
  | NativeModuleUnionTypeAnnotation
  | NativeModuleMixedTypeAnnotation;

export type NativeModuleParamTypeAnnotation =
  NativeModuleBaseTypeAnnotation | NativeModuleParamOnlyTypeAnnotation;

export type NativeModuleReturnTypeAnnotation =
  NativeModuleBaseTypeAnnotation | NativeModuleReturnOnlyTypeAnnotation;

export type NativeModuleTypeAnnotation =
  | NativeModuleBaseTypeAnnotation
  | NativeModuleParamOnlyTypeAnnotation
  | NativeModuleReturnOnlyTypeAnnotation
  | NativeModuleEventEmitterTypeAnnotation;

type NativeModuleParamOnlyTypeAnnotation = NativeModuleFunctionTypeAnnotation;

type NativeModuleReturnOnlyTypeAnnotation =
  NativeModulePromiseTypeAnnotation | VoidTypeAnnotation;

// Add the allowed component reserved types to the native module union
export type CompleteReservedTypeAnnotation =
  | ReservedTypeAnnotation
  | {
      type: 'ReservedTypeAnnotation',
      name: ReservedPropTypeAnnotation['name'],
    };

// Used by compatibility check which needs to handle all possible types
// This will eventually also include the union of all view manager types
export type CompleteTypeAnnotation =
  | NativeModuleTypeAnnotation
  | NativeModuleFunctionTypeAnnotation
  | NullableTypeAnnotation<NativeModuleTypeAnnotation>
  | EventEmitterTypeAnnotation
  | NativeModuleEnumDeclarationWithMembers
  | UnsafeAnyTypeAnnotation
  | ArrayTypeAnnotation<CompleteTypeAnnotation>
  | ObjectTypeAnnotation<CompleteTypeAnnotation>
  | NativeModuleUnionTypeAnnotationMemberType
  // Components
  | CommandTypeAnnotation
  | CompleteReservedTypeAnnotation;

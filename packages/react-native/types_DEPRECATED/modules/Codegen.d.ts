/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

declare module 'react-native/Libraries/Utilities/codegenNativeCommands' {
  export interface Options<T extends string> {
    readonly supportedCommands: ReadonlyArray<T>;
  }

  function codegenNativeCommands<T extends object>(
    options: Options<keyof T extends string ? keyof T : never>,
  ): T;

  export default codegenNativeCommands;
}

declare module 'react-native/Libraries/Utilities/codegenNativeComponent' {
  import type {HostComponent} from 'react-native';

  export interface Options {
    readonly interfaceOnly?: boolean | undefined;
    readonly paperComponentName?: string | undefined;
    readonly paperComponentNameDeprecated?: string | undefined;
    readonly excludedPlatforms?: ReadonlyArray<'iOS' | 'android'> | undefined;
  }

  export type NativeComponentType<T> = HostComponent<T>;

  function codegenNativeComponent<Props extends object>(
    componentName: string,
    options?: Options,
  ): NativeComponentType<Props>;

  export default codegenNativeComponent;
}

declare module 'react-native/Libraries/Types/CodegenTypes' {
  import type {NativeSyntheticEvent} from 'react-native';
  import type {EventSubscription} from 'react-native/Libraries/vendor/emitter/EventEmitter';

  // Event types
  // We're not using the PaperName, it is only used to codegen view config settings

  export type BubblingEventHandler<
    T,
    PaperName extends string | never = never,
  > = (event: NativeSyntheticEvent<T>) => void | Promise<void>;
  export type DirectEventHandler<
    T,
    PaperName extends string | never = never,
  > = (event: NativeSyntheticEvent<T>) => void | Promise<void>;

  // Prop types
  export type Double = number;
  export type Float = number;
  export type Int32 = number;
  export type UnsafeObject = object;
  export type UnsafeMixed = unknown;

  type DefaultTypes = number | boolean | string | ReadonlyArray<string>;
  // Default handling, ignore the unused value
  // we're only using it for type checking
  //
  // TODO: (rickhanlonii) T44881457 If a default is provided, it should always be optional
  //  but that is currently not supported in the codegen since we require a default

  export type WithDefault<
    Type extends DefaultTypes,
    Value extends Type | string | undefined | null,
  > = Type | undefined | null;

  export type EventEmitter<T> = (
    handler: (arg: T) => void | Promise<void>,
  ) => EventSubscription;
}

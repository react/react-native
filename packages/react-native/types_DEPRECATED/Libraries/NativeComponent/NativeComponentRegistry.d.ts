/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {HostComponent} from '../../public/ReactNativeTypes';
import * as React from 'react';

/**
 * Configures a function that is called to determine whether a given component
 * should be registered using reflection of the native component at runtime.
 *
 * The provider should return null if the native component is unavailable in
 * the current environment.
 */
export function setRuntimeConfigProvider(
  runtimeConfigProvider: (name: string) => {
    native: boolean;
    verify: boolean;
  } | null,
): void;

/**
 * Gets a `NativeComponent` that can be rendered by React Native.
 *
 * The supplied `viewConfigProvider` may or may not be invoked and utilized,
 * depending on how `setRuntimeConfigProvider` is configured.
 */
export function get<Config extends object>(
  name: string,
  viewConfigProvider: () => PartialViewConfig,
): HostComponent<Config>;

/**
 * Same as `NativeComponentRegistry.get(...)`, except this will check either
 * the `setRuntimeConfigProvider` configuration or use native reflection (slow)
 * to determine whether this native component is available.
 *
 * If the native component is not available, a stub component is returned. Note
 * that the return value of this is not `HostComponent` because the returned
 * component instance is not guaranteed to have native methods.
 */
export function getWithFallback_DEPRECATED<Config extends object>(
  name: string,
  viewConfigProvider: () => PartialViewConfig,
): React.ComponentType<Config>;

/**
 * Unstable API. Do not use!
 *
 * This method returns if there is a StaticViewConfig registered for the
 * component name received as a parameter.
 */
export function unstable_hasStaticViewConfig(name: string): boolean;

type AttributeType<T, V> =
  | true
  | {
      readonly diff?: ((arg1: T, arg2: T) => boolean) | undefined;
      readonly process?: ((arg1: V) => T) | undefined;
    };
type AnyAttributeType = AttributeType<any, any>;
type AttributeConfiguration = {
  readonly [propName: string]: AnyAttributeType | void;
  readonly style?:
    | {
        readonly [propName: string]: AnyAttributeType;
      }
    | undefined;
};

type PartialViewConfig = Readonly<{
  bubblingEventTypes?:
    | {
        readonly [eventName: string]: {
          readonly phasedRegistrationNames: {
            readonly bubbled: string;
            readonly captured: string;
            readonly skipBubbling?: boolean | undefined;
          };
        };
      }
    | undefined;
  directEventTypes?:
    | {
        readonly [eventName: string]: {
          readonly registrationName: string;
        };
      }
    | undefined;
  supportsRawText?: boolean | undefined;
  uiViewClassName: string;
  validAttributes?: AttributeConfiguration | undefined;
}>;

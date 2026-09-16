/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {NativeSyntheticEvent} from 'react-native';
import type {EventSubscription} from 'react-native/Libraries/vendor/emitter/EventEmitter';

// Event types
// We're not using the PaperName, it is only used to codegen view config settings

export type BubblingEventHandler<
  T,
  PaperName extends string | never = never,
> = (event: NativeSyntheticEvent<T>) => void | Promise<void>;
export type DirectEventHandler<T, PaperName extends string | never = never> = (
  event: NativeSyntheticEvent<T>,
) => void | Promise<void>;

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

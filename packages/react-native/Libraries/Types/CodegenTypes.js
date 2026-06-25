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

import type {EventSubscription} from '../vendor/emitter/EventEmitter';
import type {NativeSyntheticEvent} from './CoreEventTypes';

// Event types
// We're not using the PaperName, it is only used to codegen view config settings

export type BubblingEventHandler<
  T,
  PaperName extends string | empty = empty, // eslint-disable-line no-unused-vars
> = (event: NativeSyntheticEvent<T>) => void | Promise<void>;
export type DirectEventHandler<
  T,
  PaperName extends string | empty = empty, // eslint-disable-line no-unused-vars
> = (event: NativeSyntheticEvent<T>) => void | Promise<void>;

// Prop types
export type Double = number;
export type Float = number;
export type Int32 = number;
/* $FlowFixMe[unclear-type] Object is forbidden in strict mode */
export type UnsafeObject = Object;
export type UnsafeMixed = unknown;

type DefaultTypes = number | boolean | string | ReadonlyArray<string>;
// Default handling, ignore the unused value
// we're only using it for type checking
//
// TODO: (rickhanlonii) T44881457 If a default is provided, it should always be optional
//  but that is currently not supported in the codegen since we require a default
//
export type WithDefault<
  Type extends DefaultTypes,
  // eslint-disable-next-line no-unused-vars
  Value extends ?Type | string,
> = ?Type;

export type EventEmitter<T> = (
  handler: (T) => void | Promise<void>,
) => EventSubscription;

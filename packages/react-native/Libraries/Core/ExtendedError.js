/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

export type ExtendedError = Error &
  interface {
    jsEngine?: string,
    preventSymbolication?: boolean,
    componentStack?: string,
    isComponentError?: boolean,
    type?: string,
    // Note: A field keyed by the Symbol ExceptionsManager.decoratedExtraDataKey is also read from ExtendedErrors.
    // This field isn't documented in the types as Flow does not support this usecase, but it's effectively:
    // [decoratedExtraDataKey]?: {[string]: mixed},

    // Included for native errors
    cause?: {
      name: string,
      message: string,
      // $FlowFixMe[unclear-type]
      stackElements?: ReadonlyArray<Object>,
      // $FlowFixMe[unclear-type]
      stackSymbols?: ReadonlyArray<Object>,
      // $FlowFixMe[unclear-type]
      stackReturnAddresses?: ReadonlyArray<Object>,
    },
  };

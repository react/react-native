/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

/**
 * `global` is a object containing all the global variables for React Native.
 *
 * NOTE: Consider cross-platform as well as JS environments compatibility
 * when defining the types here. Consider both presence (`?`) as well as
 * writeability (`+`) when defining types.
 */
// $FlowFixMe[libdef-override]
declare var global: {
  // setUpGlobals
  readonly window: typeof global,
  readonly self: typeof global,
  readonly process: {
    readonly env: {
      readonly NODE_ENV: 'development' | 'production',
    },
    readonly argv?: ReadonlyArray<string>,
  },

  // setUpPerformance
  readonly performance: Performance,

  // setUpXHR
  readonly XMLHttpRequest: typeof XMLHttpRequest,
  readonly FormData: typeof FormData,
  readonly fetch: typeof fetch,
  readonly Headers: typeof Headers,
  readonly Request: typeof Request,
  readonly Response: typeof Response,
  readonly WebSocket: typeof WebSocket,
  readonly Blob: typeof Blob,
  readonly File: typeof File,
  readonly FileReader: typeof FileReader,
  readonly URL: typeof URL,
  readonly URLSearchParams: typeof URLSearchParams,
  readonly AbortController: typeof AbortController,
  readonly AbortSignal: typeof AbortSignal,

  // setUpAlert
  readonly alert: typeof alert,

  // setUpNavigator
  readonly navigator: {
    readonly product: 'ReactNative',
    readonly appName?: ?string,
    ...
  },

  // setUpTimers
  readonly setInterval: typeof setInterval,
  readonly clearInterval: typeof clearInterval,
  readonly setTimeout: typeof setTimeout,
  readonly clearTimeout: typeof clearTimeout,
  readonly requestAnimationFrame: typeof requestAnimationFrame,
  readonly cancelAnimationFrame: typeof cancelAnimationFrame,
  readonly requestIdleCallback: typeof requestIdleCallback,
  readonly cancelIdleCallback: typeof cancelIdleCallback,
  readonly queueMicrotask: typeof queueMicrotask,
  readonly setImmediate: typeof setImmediate,
  readonly clearImmediate: typeof clearImmediate,

  // Polyfills
  readonly console: typeof console,

  // JavaScript environments specific
  readonly HermesInternal: ?$HermesInternalType,

  // Internal-specific
  readonly __DEV__?: boolean,
  readonly RN$Bridgeless?: boolean,

  // setupDOM
  readonly DOMRect: typeof DOMRect,
  readonly DOMRectReadOnly: typeof DOMRectReadOnly,

  // Undeclared properties are implicitly `any`.
  [string | symbol]: any,
};

// Declared as a bare global so unqualified `__DEV__` references type-check as
// `boolean`. The suppression is a no-op in this checkout but avoids a duplicate
// declaration where `__DEV__` is also declared by another Flow libdef.
// $FlowFixMe[libdef-override]
declare var __DEV__: boolean;

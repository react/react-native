/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

// ----------------------------------------------------------------------------
// Types entry point for react-native/unstable-internals-do-not-use.
//
// IMPORTANT: Keep this file in sync with unstable-internals-do-not-use.js.
// ----------------------------------------------------------------------------

import type * as React from 'react';

// #region AppContainer

interface AppContainerProps {
  children?: React.ReactNode | undefined;
  rootTag: number;
  initialProps?: object | undefined;
  WrapperComponent?: React.ComponentType<any> | null | undefined;
  rootViewStyle?: unknown | undefined;
  internal_excludeLogBox?: boolean | undefined;
  internal_excludeInspector?: boolean | undefined;
}

/** Root component that wraps and mounts a React Native app tree. */
export const AppContainer: React.ComponentType<AppContainerProps>;

// #endregion
// #region AssetSourceResolver

interface ResolvedAssetSource {
  readonly __packager_asset: boolean;
  readonly width: number | null | undefined;
  readonly height: number | null | undefined;
  readonly uri: string;
  readonly scale: number;
}

/** Resolves a packager asset descriptor to a loadable source for the current platform. */
export class AssetSourceResolver {
  serverUrl: string | null | undefined;
  jsbundleUrl: string | null | undefined;
  asset: unknown;
  constructor(
    serverUrl: string | null | undefined,
    jsbundleUrl: string | null | undefined,
    asset: unknown,
  );
  isLoadedFromServer(): boolean;
  isLoadedFromFileSystem(): boolean;
  defaultAsset(): ResolvedAssetSource;
  getAssetUsingResolver(resolver: 'android' | 'generic'): ResolvedAssetSource;
  assetServerURL(): ResolvedAssetSource;
  scaledAssetPath(): ResolvedAssetSource;
  scaledAssetURLNearBundle(): ResolvedAssetSource;
  resourceIdentifierWithoutScale(): ResolvedAssetSource;
  drawableFolderInBundle(): ResolvedAssetSource;
  fromSource(source: string): ResolvedAssetSource;
  static pickScale(scales: number[], deviceScale?: number): number;
}

// #endregion
// #region customDirectEventTypes

/** Registry mapping custom direct (non-bubbling) event names to their registration names. */
export const customDirectEventTypes: {
  [eventName: string]: Readonly<{
    registrationName: string;
  }>;
};

// #endregion
// #region DevLoadingView

/** Dev-only overlay banner showing bundle load, refresh, and error status. */
export const DevLoadingView: {
  showMessage(
    message: string,
    type: 'load' | 'refresh' | 'error',
    options?: {dismissButton?: boolean | undefined},
  ): void;
  hide(): void;
};

// #endregion
// #region getDevServer

interface DevServerInfo {
  url: string;
  fullBundleUrl: string | null;
  bundleLoadedFromServer: boolean;
}

/** Returns information about the running dev server. */
export function getDevServer(): DevServerInfo;

// #endregion
// #region HMRClient

/** Client that receives Fast Refresh updates and applies them at runtime. */
export class HMRClient {
  enable(): void;
  disable(): void;
  registerBundle(requestUrl: string): void;
  log(
    level:
      | 'trace'
      | 'info'
      | 'warn'
      | 'error'
      | 'log'
      | 'group'
      | 'groupCollapsed'
      | 'groupEnd'
      | 'debug',
    data: ReadonlyArray<unknown>,
  ): void;
  setup(
    platform: string,
    bundleEntry: string,
    host: string,
    port: number | string,
    isEnabled: boolean,
    scheme?: string,
  ): void;
}

// #endregion
// #region NativeExceptionsManager

interface StackFrame {
  column: number | null;
  file: string | null;
  lineNumber: number | null;
  methodName: string;
  collapse?: boolean | undefined;
}

interface ExceptionData {
  message: string;
  originalMessage: string | null;
  name: string | null;
  componentStack: string | null;
  stack: StackFrame[];
  id: number;
  isFatal: boolean;
  extraData?: object | undefined;
}

/** Reports JS exceptions to native and manages RedBox. */
export const NativeExceptionsManager: {
  reportFatalException(
    message: string,
    stack: StackFrame[],
    exceptionId: number,
  ): void;
  reportSoftException(
    message: string,
    stack: StackFrame[],
    exceptionId: number,
  ): void;
  dismissRedbox(): void;
  reportException(data: ExceptionData): void;
};

// #endregion
// #region NativeRedBox

interface NativeRedBoxSpec {
  setExtraData(extraData: object, forIdentifier: string): void;
  dismiss(): void;
}

/** Native module for the RedBox error overlay; null when unavailable. */
export const NativeRedBox: NativeRedBoxSpec | null;

// #endregion
// #region NativeSourceCode

interface SourceCodeConstants {
  scriptURL: string;
}

/** Native module exposing source-code constants such as the bundle scriptURL. */
export const NativeSourceCode: {
  getConstants(): SourceCodeConstants;
};

// #endregion
// #region PressabilityDebugView

type Rect = Readonly<{
  bottom?: number | null | undefined;
  left?: number | null | undefined;
  right?: number | null | undefined;
  top?: number | null | undefined;
}>;

type RectOrSize = Rect | number;

interface PressabilityDebugViewProps {
  color: unknown;
  hitSlop: RectOrSize | null | undefined;
}

/** Debug overlay that visualizes press targets when enabled via the Inspector. */
export const PressabilityDebugView: React.ComponentType<PressabilityDebugViewProps>;

// #endregion

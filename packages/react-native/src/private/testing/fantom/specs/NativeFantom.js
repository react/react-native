/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {
  RootTag,
  TurboModule,
} from '../../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../../Libraries/TurboModule/TurboModuleRegistry';

// match RenderFormatOptions.h
export type RenderFormatOptions = {
  includeRoot: boolean,
  includeLayoutMetrics: boolean,
};

// match RawEvent.h
export enum NativeEventCategory {
  /*
   * Start of a continuous event. To be used with touchStart.
   */
  ContinuousStart = 0,

  /*
   * End of a continuous event. To be used with touchEnd.
   */
  ContinuousEnd = 1,

  /*
   * Priority for this event will be determined from other events in the
   * queue. If it is triggered by continuous event, its priority will be
   * default. If it is not triggered by continuous event, its priority will be
   * discrete.
   */
  Unspecified = 2,

  /*
   * Forces discrete type for the event. Regardless if continuous event is
   * ongoing.
   */
  Discrete = 3,

  /*
   * Forces continuous type for the event. Regardless if continuous event
   * isn't ongoing.
   */
  Continuous = 4,

  /*
   * Priority for events that can be processed in idle times or in the
   * background.
   */
  Idle = 5,
}

export type ScrollOptions = {
  x: number,
  y: number,
  zoomScale?: number,
};

export type ImageResponse = {
  width: number,
  height: number,
  cacheStatus?: 'memory' | 'disk' | 'disk/memory',
  errorMessage?: string,
};

interface Spec extends TurboModule {
  startSurface: (
    viewportWidth: number,
    viewportHeight: number,
    devicePixelRatio: number,
    viewportOffsetX?: number,
    viewportOffsetY?: number,
  ) => RootTag;
  stopSurface: (surfaceId: RootTag) => void;
  enqueueNativeEvent: (
    shadowNode: unknown /* ShadowNode */,
    type: string,
    payload?: unknown,
    category?: NativeEventCategory,
    isUnique?: boolean,
  ) => void;
  enqueueScrollEvent: (
    shadowNode: unknown /* ShadowNode */,
    options: ScrollOptions,
  ) => void;
  enqueueModalSizeUpdate: (
    shadowNode: unknown /* ShadowNode */,
    height: number,
    width: number,
  ) => void;
  takeMountingManagerLogs: (surfaceId: RootTag) => Array<string>;
  getDirectManipulationProps: (
    shadowNode: unknown /* ShadowNode */,
  ) => Readonly<{
    [string]: unknown,
  }>;
  getFabricUpdateProps: (shadowNode: unknown /* ShadowNode */) => Readonly<{
    [string]: unknown,
  }>;
  flushMessageQueue: () => void;
  flushEventQueue: () => void;
  produceFramesForDuration: (miliseconds: number) => void;
  validateEmptyMessageQueue: () => void;
  getRenderedOutput: (
    surfaceId: RootTag,
    config: RenderFormatOptions,
  ) => string;
  reportTestSuiteResultsJSON: (results: string) => void;
  createShadowNodeReferenceCounter(
    shadowNode: unknown /* ShadowNode */,
  ): () => number;
  createShadowNodeRevisionGetter(
    shadowNode: unknown /* ShadowNode */,
  ): () => ?number;
  saveJSMemoryHeapSnapshot: (filePath: string) => void;
  forceHighResTimeStamp: (timeStamp: ?number) => void;
  startJSSamplingProfiler: () => void;
  stopJSSamplingProfilerAndSaveToFile: (filePath: string) => void;
  setImageResponse(uri: string, imageResponse: ImageResponse): void;
  clearImage(uri: string): void;
  clearAllImages(): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'NativeFantomCxx',
) as Spec;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';
import type {ViewStyle} from '../StyleSheet/StyleSheetTypes';
import type {IPerformanceLogger} from './IPerformanceLogger';

type Task = (taskData: any) => Promise<void>;
type TaskProvider = () => Task;
type TaskCanceller = () => void;
type TaskCancelProvider = () => TaskCanceller;

export type ComponentProvider = () => React.ComponentType<any>;

export type Runnable = (appParameters: any) => void;

export type AppConfig = {
  appKey: string;
  component?: ComponentProvider | undefined;
  run?: Runnable | undefined;
};

export type ComponentProviderInstrumentationHook = (
  component: ComponentProvider,
  scopedPerformanceLogger: IPerformanceLogger,
) => React.ComponentType<any>;

export type WrapperComponentProvider = (
  appParameters: any,
) => React.ComponentType<any>;

export type RootViewStyleProvider = (appParameters: any) => ViewStyle;

/**
 * `AppRegistry` is the JS entry point to running all React Native apps.  App
 * root components should register themselves with
 * `AppRegistry.registerComponent`, then the native system can load the bundle
 * for the app and then actually run the app when it's ready by invoking
 * `AppRegistry.runApplication`.
 *
 * To "stop" an application when a view should be destroyed, call
 * `AppRegistry.unmountApplicationComponentAtRootTag` with the tag that was
 * pass into `runApplication`. These should always be used as a pair.
 *
 * `AppRegistry` should be `require`d early in the `require` sequence to make
 * sure the JS execution environment is setup before other modules are
 * `require`d.
 */
export namespace AppRegistry {
  export function setWrapperComponentProvider(
    provider: WrapperComponentProvider,
  ): void;

  export function setRootViewStyleProvider(
    provider: RootViewStyleProvider,
  ): void;

  export function registerConfig(config: AppConfig[]): void;

  export function registerComponent(
    appKey: string,
    getComponentFunc: ComponentProvider,
    section?: boolean,
  ): string;

  export function registerRunnable(appKey: string, func: Runnable): string;

  export function registerSection(
    appKey: string,
    component: ComponentProvider,
  ): void;

  export function getAppKeys(): string[];

  export function getSectionKeys(): string[];

  export function getSections(): Record<string, Runnable>;

  export function unmountApplicationComponentAtRootTag(rootTag: number): void;

  export function runApplication(appKey: string, appParameters: any): void;

  export function setSurfaceProps(
    appKey: string,
    appParameters: any,
    displayMode?: number,
  ): void;

  export function getRunnable(appKey: string): Runnable | undefined;

  export function getRegistry(): {sections: string[]; runnables: Runnable[]};

  export function setComponentProviderInstrumentationHook(
    hook: ComponentProviderInstrumentationHook,
  ): void;

  export function registerHeadlessTask(
    taskKey: string,
    taskProvider: TaskProvider,
  ): void;

  export function registerCancellableHeadlessTask(
    taskKey: string,
    taskProvider: TaskProvider,
    taskCancelProvider: TaskCancelProvider,
  ): void;

  export function startHeadlessTask(
    taskId: number,
    taskKey: string,
    data: any,
  ): void;

  export function cancelHeadlessTask(taskId: number, taskKey: string): void;
}

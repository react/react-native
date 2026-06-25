/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {RootTag} from '../Types/RootTagTypes';
import type {
  AppConfig,
  AppParameters,
  ComponentProvider,
  ComponentProviderInstrumentationHook,
  Registry,
  RootViewStyleProvider,
  Runnable,
  Runnables,
  TaskProvider,
  WrapperComponentProvider,
} from './AppRegistry.flow';

import SceneTracker from '../Utilities/SceneTracker';
import DeprecatedPerformanceLoggerStub from './DeprecatedPerformanceLoggerStub';
import {coerceDisplayMode} from './DisplayMode';
import HeadlessJsTaskError from './HeadlessJsTaskError';
import invariant from 'invariant';

type TaskCanceller = () => void;
type TaskCancelProvider = () => TaskCanceller;

const runnables: Runnables = {};
const sections: Runnables = {};
const taskProviders: Map<string, TaskProvider> = new Map();
const taskCancelProviders: Map<string, TaskCancelProvider> = new Map();
let componentProviderInstrumentationHook: ComponentProviderInstrumentationHook =
  (component: ComponentProvider) => component();

let wrapperComponentProvider: ?WrapperComponentProvider;
let rootViewStyleProvider: ?RootViewStyleProvider;

export function setWrapperComponentProvider(
  provider: WrapperComponentProvider,
) {
  wrapperComponentProvider = provider;
}

export function setRootViewStyleProvider(provider: RootViewStyleProvider) {
  rootViewStyleProvider = provider;
}

export function registerConfig(config: Array<AppConfig>): void {
  config.forEach(appConfig => {
    if (appConfig.run) {
      registerRunnable(appConfig.appKey, appConfig.run);
    } else {
      invariant(
        appConfig.component != null,
        'AppRegistry.registerConfig(...): Every config is expected to set ' +
          'either `run` or `component`, but `%s` has neither.',
        appConfig.appKey,
      );
      registerComponent(
        appConfig.appKey,
        appConfig.component,
        appConfig.section,
      );
    }
  });
}

/**
 * Registers an app's root component.
 *
 * See https://reactnative.dev/docs/appregistry#registercomponent
 */
export function registerComponent(
  appKey: string,
  componentProvider: ComponentProvider,
  section?: boolean,
): string {
  runnables[appKey] = (appParameters, displayMode) => {
    const renderApplication = require('./renderApplication').default;
    renderApplication({
      RootComponent: componentProviderInstrumentationHook(
        componentProvider,
        DeprecatedPerformanceLoggerStub,
      ),
      initialProps: appParameters.initialProps,
      rootTag: appParameters.rootTag,
      WrapperComponent:
        wrapperComponentProvider && wrapperComponentProvider(appParameters),
      rootViewStyle:
        rootViewStyleProvider && rootViewStyleProvider(appParameters),
      isLogBox: appKey === 'LogBox',
      debugName: appKey,
      displayMode,
    });
  };
  if (section) {
    sections[appKey] = runnables[appKey];
  }
  return appKey;
}

export function registerRunnable(appKey: string, run: Runnable): string {
  runnables[appKey] = run;
  return appKey;
}

export function registerSection(
  appKey: string,
  component: ComponentProvider,
): void {
  registerComponent(appKey, component, true);
}

export function getAppKeys(): ReadonlyArray<string> {
  return Object.keys(runnables);
}

export function getSectionKeys(): ReadonlyArray<string> {
  return Object.keys(sections);
}

export function getSections(): Runnables {
  return {
    ...sections,
  };
}

export function getRunnable(appKey: string): ?Runnable {
  return runnables[appKey];
}

export function getRegistry(): Registry {
  return {
    sections: getSectionKeys(),
    runnables: {...runnables},
  };
}

export function setComponentProviderInstrumentationHook(
  hook: ComponentProviderInstrumentationHook,
) {
  componentProviderInstrumentationHook = hook;
}

/**
 * Loads the JavaScript bundle and runs the app.
 *
 * See https://reactnative.dev/docs/appregistry#runapplication
 */
export function runApplication(
  appKey: string,
  appParameters: AppParameters,
  displayMode?: number,
): void {
  if (appKey !== 'LogBox') {
    const logParams = __DEV__ ? ` with ${JSON.stringify(appParameters)}` : '';
    const msg = `Running "${appKey}"${logParams}`;
    console.log(msg);
  }
  invariant(
    runnables[appKey],
    `"${appKey}" has not been registered. This can happen if:\n` +
      '* Metro (the local dev server) is run from the wrong folder. ' +
      'Check if Metro is running, stop it and restart it in the current project.\n' +
      "* A module failed to load due to an error and `AppRegistry.registerComponent` wasn't called.",
  );

  SceneTracker.setActiveScene({name: appKey});
  runnables[appKey](appParameters, coerceDisplayMode(displayMode));
}

/**
 * Update initial props for a surface that's already rendered
 */
export function setSurfaceProps(
  appKey: string,
  appParameters: Object,
  displayMode?: number,
): void {
  if (appKey !== 'LogBox') {
    const msg =
      'Updating props for Surface "' +
      appKey +
      '" with ' +
      JSON.stringify(appParameters);
    console.log(msg);
  }
  invariant(
    runnables[appKey],
    `"${appKey}" has not been registered. This can happen if:\n` +
      '* Metro (the local dev server) is run from the wrong folder. ' +
      'Check if Metro is running, stop it and restart it in the current project.\n' +
      "* A module failed to load due to an error and `AppRegistry.registerComponent` wasn't called.",
  );

  runnables[appKey](appParameters, coerceDisplayMode(displayMode));
}

/**
 * Stops an application when a view should be destroyed.
 *
 * See https://reactnative.dev/docs/appregistry#unmountapplicationcomponentatroottag
 */
export function unmountApplicationComponentAtRootTag(rootTag: RootTag): void {
  console.error(
    'Unexpected call to unmountApplicationComponentAtRootTag in Fabric.',
  );
}

/**
 * Register a headless task. A headless task is a bit of code that runs without a UI.
 *
 * See https://reactnative.dev/docs/appregistry#registerheadlesstask
 */
export function registerHeadlessTask(
  taskKey: string,
  taskProvider: TaskProvider,
): void {
  // $FlowFixMe[object-this-reference]
  registerCancellableHeadlessTask(taskKey, taskProvider, () => () => {
    /* Cancel is no-op */
  });
}

/**
 * Register a cancellable headless task. A headless task is a bit of code that runs without a UI.
 *
 * See https://reactnative.dev/docs/appregistry#registercancellableheadlesstask
 */
export function registerCancellableHeadlessTask(
  taskKey: string,
  taskProvider: TaskProvider,
  taskCancelProvider: TaskCancelProvider,
): void {
  if (taskProviders.has(taskKey)) {
    console.warn(
      `registerHeadlessTask or registerCancellableHeadlessTask called multiple times for same key '${taskKey}'`,
    );
  }
  taskProviders.set(taskKey, taskProvider);
  taskCancelProviders.set(taskKey, taskCancelProvider);
}

/**
 * Only called from native code. Starts a headless task.
 *
 * See https://reactnative.dev/docs/appregistry#startheadlesstask
 */
export function startHeadlessTask(
  taskId: number,
  taskKey: string,
  data: any,
): void {
  const NativeHeadlessJsTaskSupport =
    require('./NativeHeadlessJsTaskSupport').default;

  const taskProvider = taskProviders.get(taskKey);
  if (!taskProvider) {
    console.warn(`No task registered for key ${taskKey}`);
    if (NativeHeadlessJsTaskSupport) {
      NativeHeadlessJsTaskSupport.notifyTaskFinished(taskId);
    }
    return;
  }
  taskProvider()(data)
    .then(() => {
      if (NativeHeadlessJsTaskSupport) {
        NativeHeadlessJsTaskSupport.notifyTaskFinished(taskId);
      }
    })
    .catch(reason => {
      console.error(reason);

      if (
        NativeHeadlessJsTaskSupport &&
        reason instanceof HeadlessJsTaskError
      ) {
        // $FlowFixMe[unused-promise]
        NativeHeadlessJsTaskSupport.notifyTaskRetry(taskId).then(
          retryPosted => {
            if (!retryPosted) {
              NativeHeadlessJsTaskSupport.notifyTaskFinished(taskId);
            }
          },
        );
      }
    });
}

/**
 * Only called from native code. Cancels a headless task.
 *
 * See https://reactnative.dev/docs/appregistry#cancelheadlesstask
 */
export function cancelHeadlessTask(taskId: number, taskKey: string): void {
  const taskCancelProvider = taskCancelProviders.get(taskKey);
  if (!taskCancelProvider) {
    throw new Error(`No task canceller registered for key '${taskKey}'`);
  }
  taskCancelProvider()();
}

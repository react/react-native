/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostInstance} from '../../src/private/types/HostInstance';
import type ReactNativeElement from '../../src/private/webapis/dom/nodes/ReactNativeElement';
import type ReadOnlyElement from '../../src/private/webapis/dom/nodes/ReadOnlyElement';
import type {
  AppContainerRootViewRef,
  DebuggingOverlayRef,
} from '../ReactNative/AppContainer-dev';
import type {
  InstanceFromReactDevTools,
  ReactDevToolsAgent,
  ReactDevToolsAgentEvents,
  ReactDevToolsGlobalHook,
} from '../Types/ReactDevToolsTypes';
import type {
  ElementRectangle,
  TraceUpdate,
} from './DebuggingOverlayNativeComponent';

import {
  findNodeHandle,
  isChildPublicInstance,
} from '../ReactNative/RendererProxy';
import processColor from '../StyleSheet/processColor';

// TODO(T171193075): __REACT_DEVTOOLS_GLOBAL_HOOK__ is always injected in dev-bundles,
// but it is not mocked in some Jest tests. We should update Jest tests setup, so it would be the same as expected testing environment.
const reactDevToolsHook: ?ReactDevToolsGlobalHook = (window as $FlowFixMe)
  .__REACT_DEVTOOLS_GLOBAL_HOOK__;

export type DebuggingOverlayRegistrySubscriberProtocol = {
  rootViewRef: AppContainerRootViewRef,
  debuggingOverlayRef: DebuggingOverlayRef,
};

type ModernNodeUpdate = {
  id: number,
  instance: ReactNativeElement,
  color: string,
};

type LegacyNodeUpdate = {
  id: number,
  instance: HostInstance,
  color: string,
};

class DebuggingOverlayRegistry {
  #registry: Set<DebuggingOverlayRegistrySubscriberProtocol> = new Set();
  #reactDevToolsAgent: ReactDevToolsAgent | null = null;

  constructor() {
    if (reactDevToolsHook?.reactDevtoolsAgent != null) {
      this.#onReactDevToolsAgentAttached(reactDevToolsHook.reactDevtoolsAgent);
    }

    // There could be cases when frontend is disconnected and then connected again for the same React Native runtime.
    reactDevToolsHook?.on?.(
      'react-devtools',
      this.#onReactDevToolsAgentAttached,
    );
  }

  subscribe(subscriber: DebuggingOverlayRegistrySubscriberProtocol) {
    this.#registry.add(subscriber);
  }

  unsubscribe(subscriber: DebuggingOverlayRegistrySubscriberProtocol) {
    const wasPresent = this.#registry.delete(subscriber);
    if (!wasPresent) {
      console.error(
        '[DebuggingOverlayRegistry] Unexpected argument for unsubscription, which was not previously subscribed:',
        subscriber,
      );
    }
  }

  #onReactDevToolsAgentAttached = (agent: ReactDevToolsAgent): void => {
    this.#reactDevToolsAgent = agent;

    agent.addListener('drawTraceUpdates', this.#onDrawTraceUpdates);
    agent.addListener('showNativeHighlight', this.#onHighlightElements);
    agent.addListener('hideNativeHighlight', this.#onClearElementsHighlights);
  };

  #getPublicInstanceFromInstance = (
    instanceHandle: InstanceFromReactDevTools,
  ): HostInstance | null => {
    // `canonical.publicInstance` => Fabric
    // $FlowExpectedError[prop-missing]
    if (instanceHandle.canonical?.publicInstance != null) {
      // $FlowExpectedError[incompatible-type]
      return instanceHandle.canonical?.publicInstance;
    }

    // `canonical` => Legacy Fabric
    if (instanceHandle.canonical != null) {
      // $FlowFixMe[incompatible-type]
      return instanceHandle.canonical;
    }

    // `instanceHandle` => Legacy renderer
    // $FlowExpectedError[method-unbinding]
    if (instanceHandle.measure != null) {
      // $FlowFixMe[incompatible-return]
      return instanceHandle;
    }

    return null;
  };

  #findLowestParentFromRegistryForInstance(
    instance: ReactNativeElement,
  ): ?DebuggingOverlayRegistrySubscriberProtocol {
    let iterator: ?ReadOnlyElement = instance;
    while (iterator != null) {
      for (const subscriber of this.#registry) {
        /* $FlowFixMe[invalid-compare] Error discovered during Constant
         * Condition roll out. See https://fburl.com/workplace/4oq3zi07. */
        if (subscriber.rootViewRef.current === iterator) {
          return subscriber;
        }
      }

      iterator = iterator.parentElement;
    }

    return null;
  }

  #findLowestParentFromRegistryForInstanceLegacy(
    instance: HostInstance,
  ): ?DebuggingOverlayRegistrySubscriberProtocol {
    const candidates: Array<DebuggingOverlayRegistrySubscriberProtocol> = [];

    for (const subscriber of this.#registry) {
      if (
        subscriber.rootViewRef.current != null &&
        // $FlowFixMe[incompatible-call] There is a lot of stuff to untangle to make types for refs work.
        isChildPublicInstance(subscriber.rootViewRef.current, instance)
      ) {
        candidates.push(subscriber);
      }
    }

    if (candidates.length === 0) {
      // In some cases, like with LogBox in custom integrations, the whole subtree for specific React root might not have an AppContainer.
      return null;
    }

    if (candidates.length === 1) {
      return candidates[0];
    }

    // If there are multiple candidates, we need to find the lowest.
    // Imagine the case when there is a modal on the screen, both of them will have their own AppContainers,
    // but modal's AppContainer is a child of screen's AppContainer.
    const candidatesWithNoChildren: Array<DebuggingOverlayRegistrySubscriberProtocol> =
      [];
    for (const potentialParent of candidates) {
      let shouldSkipThisParent = false;

      if (potentialParent.rootViewRef.current == null) {
        continue;
      }

      for (const potentialChild of candidates) {
        if (potentialChild === potentialParent) {
          continue;
        }

        if (potentialChild.rootViewRef.current == null) {
          continue;
        }

        if (
          isChildPublicInstance(
            // $FlowFixMe[incompatible-type] There is a lot of stuff to untangle to make types for refs work.
            potentialParent.rootViewRef.current,
            // $FlowFixMe[incompatible-call] There is a lot of stuff to untangle to make types for refs work.
            potentialChild.rootViewRef.current,
          )
        ) {
          shouldSkipThisParent = true;
          break;
        }
      }

      if (!shouldSkipThisParent) {
        candidatesWithNoChildren.push(potentialParent);
      }
    }

    if (candidatesWithNoChildren.length === 0) {
      console.error(
        '[DebuggingOverlayRegistry] Unexpected circular relationship between AppContainers',
      );
      return null;
    } else if (candidatesWithNoChildren.length > 1) {
      console.error(
        '[DebuggingOverlayRegistry] Unexpected multiple options for lowest parent AppContainer',
      );
      return null;
    }

    return candidatesWithNoChildren[0];
  }

  #onDrawTraceUpdates: (
    ...ReactDevToolsAgentEvents['drawTraceUpdates']
  ) => void = traceUpdates => {
    const modernNodesUpdates: Array<ModernNodeUpdate> = [];
    const legacyNodesUpdates: Array<LegacyNodeUpdate> = [];

    for (const {node, color} of traceUpdates) {
      const publicInstance = this.#getPublicInstanceFromInstance(node);
      if (publicInstance == null) {
        return;
      }

      const instanceReactTag = findNodeHandle<$FlowFixMe>(node);
      if (instanceReactTag == null) {
        return;
      }

      // Lazy import to avoid dependency cycle.
      const ReactNativeElementClass =
        require('../../src/private/webapis/dom/nodes/ReactNativeElement').default;
      if (publicInstance instanceof ReactNativeElementClass) {
        modernNodesUpdates.push({
          id: instanceReactTag,
          instance: publicInstance,
          color,
        });
      } else {
        legacyNodesUpdates.push({
          id: instanceReactTag,
          instance: publicInstance,
          color,
        });
      }
    }

    if (modernNodesUpdates.length > 0) {
      this.#drawTraceUpdatesModern(modernNodesUpdates);
    }

    if (legacyNodesUpdates.length > 0) {
      this.#drawTraceUpdatesLegacy(legacyNodesUpdates);
    }
  };

  #drawTraceUpdatesModern(updates: Array<ModernNodeUpdate>): void {
    const parentToTraceUpdatesMap = new Map<
      DebuggingOverlayRegistrySubscriberProtocol,
      Array<TraceUpdate>,
    >();
    for (const {id, instance, color} of updates) {
      const parent = this.#findLowestParentFromRegistryForInstance(instance);
      if (parent == null) {
        continue;
      }

      let traceUpdatesForParent = parentToTraceUpdatesMap.get(parent);
      if (traceUpdatesForParent == null) {
        traceUpdatesForParent = [];
        parentToTraceUpdatesMap.set(parent, traceUpdatesForParent);
      }

      const {x, y, width, height} = instance.getBoundingClientRect();

      const rootViewInstance = parent.rootViewRef.current;
      if (rootViewInstance == null) {
        continue;
      }

      const {x: parentX, y: parentY} =
        // $FlowFixMe[prop-missing] React Native View is not a descendant of ReactNativeElement yet. We should be able to remove it once Paper is no longer supported.
        rootViewInstance.getBoundingClientRect();

      // DebuggingOverlay will scale to the same size as a Root view. Substract Root view position from the element position
      // to calculate the element's position relatively to its parent DebuggingOverlay.
      // We can't call `getBoundingClientRect` on the debuggingOverlayRef, because its a ref for the native component, which doesn't have it, hopefully yet.
      traceUpdatesForParent.push({
        id,
        rectangle: {x: x - parentX, y: y - parentY, width, height},
        color: processColor(color),
      });
    }

    for (const [parent, traceUpdates] of parentToTraceUpdatesMap.entries()) {
      const {debuggingOverlayRef} = parent;
      debuggingOverlayRef.current?.highlightTraceUpdates(traceUpdates);
    }
  }

  // TODO: remove once DOM Node APIs are opt-in by default and Paper is no longer supported.
  #drawTraceUpdatesLegacy(updates: Array<LegacyNodeUpdate>): void {
    const parentToTraceUpdatesPromisesMap = new Map<
      DebuggingOverlayRegistrySubscriberProtocol,
      Array<Promise<TraceUpdate>>,
    >();

    for (const {id, instance, color} of updates) {
      const parent =
        this.#findLowestParentFromRegistryForInstanceLegacy(instance);

      if (parent == null) {
        continue;
      }

      let traceUpdatesPromisesForParent =
        parentToTraceUpdatesPromisesMap.get(parent);
      if (traceUpdatesPromisesForParent == null) {
        traceUpdatesPromisesForParent = [];
        parentToTraceUpdatesPromisesMap.set(
          parent,
          traceUpdatesPromisesForParent,
        );
      }

      const frameToDrawPromise = new Promise<TraceUpdate>((resolve, reject) => {
        instance.measure((x, y, width, height, left, top) => {
          // measure can execute callback without any values provided to signal error.
          if (left == null || top == null || width == null || height == null) {
            reject(
              new Error('Unexpectedly failed to call measure on an instance.'),
            );
          }

          resolve({
            id,
            rectangle: {x: left, y: top, width, height},
            color: processColor(color),
          });
        });
      });

      traceUpdatesPromisesForParent.push(frameToDrawPromise);
    }

    for (const [
      parent,
      traceUpdatesPromises,
    ] of parentToTraceUpdatesPromisesMap.entries()) {
      Promise.all(traceUpdatesPromises)
        .then(resolvedTraceUpdates =>
          parent.debuggingOverlayRef.current?.highlightTraceUpdates(
            resolvedTraceUpdates,
          ),
        )
        .catch(() => {
          // noop. For legacy architecture (Paper) this can happen for root views or LogBox button.
          // LogBox case: it has a separate React root, so `measure` fails.
          // Calling `console.error` here would trigger rendering a new LogBox button, for which we will call measure again, this is a cycle.
          // Don't spam the UI with errors for such cases.
        });
    }
  }

  #onHighlightElements: (
    ...ReactDevToolsAgentEvents['showNativeHighlight']
  ) => void = nodes => {
    // First clear highlights for every container
    for (const subscriber of this.#registry) {
      subscriber.debuggingOverlayRef.current?.clearElementsHighlight();
    }

    // Lazy import to avoid dependency cycle.
    const ReactNativeElementClass =
      require('../../src/private/webapis/dom/nodes/ReactNativeElement').default;

    const reactNativeElements: Array<ReactNativeElement> = [];
    const legacyPublicInstances: Array<HostInstance> = [];

    for (const node of nodes) {
      const publicInstance = this.#getPublicInstanceFromInstance(node);
      if (publicInstance == null) {
        continue;
      }

      if (publicInstance instanceof ReactNativeElementClass) {
        reactNativeElements.push(publicInstance);
      } else {
        legacyPublicInstances.push(publicInstance);
      }
    }

    if (reactNativeElements.length > 0) {
      this.#onHighlightElementsModern(reactNativeElements);
    }

    if (legacyPublicInstances.length > 0) {
      this.#onHighlightElementsLegacy(legacyPublicInstances);
    }
  };

  #onHighlightElementsModern(elements: Array<ReactNativeElement>): void {
    const parentToElementsMap = new Map<
      DebuggingOverlayRegistrySubscriberProtocol,
      Array<ReactNativeElement>,
    >();

    for (const element of elements) {
      const parent = this.#findLowestParentFromRegistryForInstance(element);
      if (parent == null) {
        continue;
      }

      let childElementOfAParent = parentToElementsMap.get(parent);
      if (childElementOfAParent == null) {
        childElementOfAParent = [];
        parentToElementsMap.set(parent, childElementOfAParent);
      }

      childElementOfAParent.push(element);
    }

    for (const [parent, elementsToHighlight] of parentToElementsMap.entries()) {
      const rootViewInstance = parent.rootViewRef.current;
      if (rootViewInstance == null) {
        return;
      }

      const {x: parentX, y: parentY} =
        // $FlowFixMe[prop-missing] React Native View is not a descendant of ReactNativeElement yet. We should be able to remove it once Paper is no longer supported.
        rootViewInstance.getBoundingClientRect();

      // DebuggingOverlay will scale to the same size as a Root view. Substract Root view position from the element position
      // to calculate the element's position relatively to its parent DebuggingOverlay.
      // We can't call `getBoundingClientRect` on the debuggingOverlayRef, because its a ref for the native component, which doesn't have it, hopefully yet.
      const elementsRectangles = elementsToHighlight.map(element => {
        const {x, y, width, height} = element.getBoundingClientRect();
        return {x: x - parentX, y: y - parentY, width, height};
      });

      parent.debuggingOverlayRef.current?.highlightElements(elementsRectangles);
    }
  }

  // TODO: remove once DOM Node APIs are opt-in by default and Paper is no longer supported.
  #onHighlightElementsLegacy(elements: Array<HostInstance>): void {
    const parentToElementsMap = new Map<
      DebuggingOverlayRegistrySubscriberProtocol,
      Array<HostInstance>,
    >();

    for (const element of elements) {
      const parent =
        this.#findLowestParentFromRegistryForInstanceLegacy(element);
      if (parent == null) {
        continue;
      }

      let childElementOfAParent = parentToElementsMap.get(parent);
      if (childElementOfAParent == null) {
        childElementOfAParent = [];
        parentToElementsMap.set(parent, childElementOfAParent);
      }

      childElementOfAParent.push(element);
    }

    for (const [parent, elementsToHighlight] of parentToElementsMap.entries()) {
      const promises = elementsToHighlight.map(
        element =>
          new Promise<ElementRectangle>((resolve, reject) => {
            element.measure((x, y, width, height, left, top) => {
              // measure can execute callback without any values provided to signal error.
              if (
                left == null ||
                top == null ||
                width == null ||
                height == null
              ) {
                reject(
                  new Error(
                    'Unexpectedly failed to call measure on an instance.',
                  ),
                );
              }

              resolve({x: left, y: top, width, height});
            });
          }),
      );

      Promise.all(promises)
        .then(resolvedElementsRectangles =>
          parent.debuggingOverlayRef.current?.highlightElements(
            resolvedElementsRectangles,
          ),
        )
        .catch(() => {
          // noop. For legacy architecture (Paper) this can happen for root views or LogBox button.
          // LogBox case: it has a separate React root, so `measure` fails.
          // Calling `console.error` here would trigger rendering a new LogBox button, for which we will call measure again, this is a cycle.
          // Don't spam the UI with errors for such cases.
        });
    }
  }

  #onClearElementsHighlights: (
    ...ReactDevToolsAgentEvents['hideNativeHighlight']
  ) => void = () => {
    for (const subscriber of this.#registry) {
      subscriber.debuggingOverlayRef.current?.clearElementsHighlight();
    }
  };
}

const debuggingOverlayRegistryInstance: DebuggingOverlayRegistry =
  new DebuggingOverlayRegistry();
export default debuggingOverlayRegistryInstance;

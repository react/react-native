/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {
  MeasureInWindowOnSuccessCallback,
  MeasureLayoutOnSuccessCallback,
  MeasureOnSuccessCallback,
} from '../../src/private/types/HostInstance';
import type {NativeElementReference} from '../../src/private/webapis/dom/nodes/specs/NativeDOM';
import type {
  InternalInstanceHandle,
  LayoutAnimationConfig,
  Node,
} from '../Renderer/shims/ReactNativeTypes';
import type {RootTag} from '../Types/RootTagTypes';

import defineLazyObjectProperty from '../Utilities/defineLazyObjectProperty';

export type NodeSet = Array<Node>;
export type NodeProps = {...};
type EventHandler = (
  target: ?InternalInstanceHandle,
  type: string,
  payload: {[string]: unknown},
) => void;
type Rect = {
  x: number,
  y: number,
  width: number,
  height: number,
};
type RelativeLayoutMetrics = {
  left: number,
  top: number,
  width: number,
  height: number,
};
type ViewTransition = {
  ready: Promise<void>,
  finished: Promise<void>,
};
export interface Spec {
  readonly createNode: (
    reactTag: number,
    viewName: string,
    rootTag: RootTag,
    props: NodeProps,
    instanceHandle: InternalInstanceHandle,
  ) => Node;
  readonly cloneNodeWithNewChildren: (node: Node) => Node;
  readonly cloneNodeWithNewProps: (node: Node, newProps: NodeProps) => Node;
  readonly cloneNodeWithNewChildrenAndProps: (
    node: Node,
    newProps: NodeProps,
  ) => Node;
  readonly createChildSet: (rootTag: RootTag) => NodeSet;
  readonly appendChild: (parentNode: Node, child: Node) => Node;
  readonly appendChildToSet: (childSet: NodeSet, child: Node) => void;
  readonly completeRoot: (rootTag: RootTag, childSet: NodeSet) => void;
  readonly registerEventHandler: (eventHandler: EventHandler) => void;
  readonly getRelativeLayoutMetrics: (
    node: Node,
    ancestorNode: Node,
  ) => RelativeLayoutMetrics;
  readonly measure: (
    node: Node | NativeElementReference,
    callback: MeasureOnSuccessCallback,
  ) => void;
  readonly measureInstance: (node: Node) => Rect;
  readonly measureInWindow: (
    node: Node | NativeElementReference,
    callback: MeasureInWindowOnSuccessCallback,
  ) => void;
  readonly measureLayout: (
    node: Node | NativeElementReference,
    relativeNode: Node | NativeElementReference,
    onFail: () => void,
    onSuccess: MeasureLayoutOnSuccessCallback,
  ) => void;
  readonly configureNextLayoutAnimation: (
    config: LayoutAnimationConfig,
    callback: () => void, // check what is returned here
    errorCallback: () => void,
  ) => void;
  readonly sendAccessibilityEvent: (node: Node, eventType: string) => void;
  readonly findShadowNodeByTag_DEPRECATED: (reactTag: number) => ?Node;
  readonly setNativeProps: (
    node: Node | NativeElementReference,
    newProps: NodeProps,
  ) => void;
  readonly dispatchCommand: (
    node: Node,
    commandName: string,
    args: Array<unknown>,
  ) => void;
  readonly findNodeAtPoint: (
    node: Node,
    locationX: number,
    locationY: number,
    callback: (instanceHandle: ?InternalInstanceHandle) => void,
  ) => void;
  readonly compareDocumentPosition: (
    node: Node | NativeElementReference,
    otherNode: Node | NativeElementReference,
  ) => number;
  readonly getBoundingClientRect: (
    node: Node | NativeElementReference,
    includeTransform: boolean,
  ) => ?[
    /* x: */ number,
    /* y: */ number,
    /* width: */ number,
    /* height: */ number,
  ];
  readonly setIsJSResponder: (
    node: Node | NativeElementReference,
    isJSResponder: boolean,
    blockNativeResponder: boolean,
  ) => void;
  readonly applyViewTransitionName: (
    node: Node,
    transitionName: string,
    className: string,
  ) => void;
  readonly createViewTransitionInstance: (
    transitionName: string,
    pseudoElementTag: number,
  ) => void;
  readonly cancelViewTransitionName: (
    node: Node,
    transitionName: string,
  ) => void;
  readonly restoreViewTransitionName: (node: Node) => void;
  readonly suspendOnActiveViewTransition: () => void;
  readonly startViewTransitionReadyFinished: () => void;
  readonly startViewTransition: (
    mutationCallback: () => void,
  ) => ?ViewTransition;
  readonly unstable_DefaultEventPriority: number;
  readonly unstable_DiscreteEventPriority: number;
  readonly unstable_ContinuousEventPriority: number;
  readonly unstable_IdleEventPriority: number;
  readonly unstable_getCurrentEventPriority: () => number;
}

let nativeFabricUIManagerProxy: ?Spec;

// This is a list of all the methods in global.nativeFabricUIManager that we'll
// cache in JavaScript, as the current implementation of the binding
// creates a new host function every time methods are accessed.
const CACHED_PROPERTIES: ReadonlyArray<keyof Spec> = [
  'createNode',
  'cloneNodeWithNewChildren',
  'cloneNodeWithNewProps',
  'cloneNodeWithNewChildrenAndProps',
  'createChildSet',
  'appendChild',
  'appendChildToSet',
  'completeRoot',
  'registerEventHandler',
  'getRelativeLayoutMetrics',
  'measure',
  'measureInstance',
  'measureInWindow',
  'measureLayout',
  'configureNextLayoutAnimation',
  'sendAccessibilityEvent',
  'findShadowNodeByTag_DEPRECATED',
  'setNativeProps',
  'dispatchCommand',
  'findNodeAtPoint',
  'compareDocumentPosition',
  'getBoundingClientRect',
  'setIsJSResponder',
  'applyViewTransitionName',
  'createViewTransitionInstance',
  'cancelViewTransitionName',
  'restoreViewTransitionName',
  'suspendOnActiveViewTransition',
  'startViewTransitionReadyFinished',
  'startViewTransition',
  'unstable_DefaultEventPriority',
  'unstable_DiscreteEventPriority',
  'unstable_ContinuousEventPriority',
  'unstable_IdleEventPriority',
  'unstable_getCurrentEventPriority',
];

// This is exposed as a getter because apps using the legacy renderer AND
// Fabric can define the binding lazily. If we evaluated the global and cached
// it in the module we might be caching an `undefined` value before it is set.
export function getFabricUIManager(): ?Spec {
  if (
    nativeFabricUIManagerProxy == null &&
    global.nativeFabricUIManager != null
  ) {
    nativeFabricUIManagerProxy = createProxyWithCachedProperties(
      global.nativeFabricUIManager,
      CACHED_PROPERTIES,
    );
  }
  return nativeFabricUIManagerProxy;
}

/**
 *
 * Returns an object that caches the specified properties the first time they
 * are accessed, and falls back to the original object for other properties.
 */
function createProxyWithCachedProperties(
  implementation: Spec,
  propertiesToCache: ReadonlyArray<keyof Spec>,
): Spec {
  const proxy = Object.create(implementation);
  for (const propertyName of propertiesToCache) {
    defineLazyObjectProperty(proxy, propertyName, {
      get: () => implementation[propertyName],
    });
  }
  return proxy;
}

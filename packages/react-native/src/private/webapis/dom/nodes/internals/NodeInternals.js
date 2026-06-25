/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {InternalInstanceHandle} from '../../../../../../Libraries/Renderer/shims/ReactNativeTypes';
import type ReactNativeDocument from '../ReactNativeDocument';
import type ReadOnlyCharacterData from '../ReadOnlyCharacterData';
import type ReadOnlyElement from '../ReadOnlyElement';
import type ReadOnlyNode from '../ReadOnlyNode';
import type {
  NativeElementReference,
  NativeNodeReference,
  NativeTextReference,
} from '../specs/NativeDOM';
import type {ReactNativeDocumentElementInstanceHandle} from './ReactNativeDocumentElementInstanceHandle';
import type {ReactNativeDocumentInstanceHandle} from './ReactNativeDocumentInstanceHandle';

import {
  getNativeElementReferenceFromReactNativeDocumentElementInstanceHandle,
  getPublicInstanceFromReactNativeDocumentElementInstanceHandle,
  isReactNativeDocumentElementInstanceHandle,
} from './ReactNativeDocumentElementInstanceHandle';
import {
  getNativeNodeReferenceFromReactNativeDocumentInstanceHandle,
  getPublicInstanceFromReactNativeDocumentInstanceHandle,
  isReactNativeDocumentInstanceHandle,
} from './ReactNativeDocumentInstanceHandle';

export type InstanceHandle =
  | InternalInstanceHandle // component managed by React
  | ReactNativeDocumentElementInstanceHandle // root element managed by React Native
  | ReactNativeDocumentInstanceHandle; // document node managed by React Native

let cachedGetNodeFromInternalInstanceHandle;
function getNodeFromInternalInstanceHandle(
  instanceHandle: InternalInstanceHandle,
) {
  if (cachedGetNodeFromInternalInstanceHandle == null) {
    // Lazy import Fabric here to avoid DOM Node APIs classes from having side-effects.
    // With a static import we can't use these classes for Paper-only variants.
    cachedGetNodeFromInternalInstanceHandle =
      require('../../../../../../Libraries/ReactNative/RendererProxy').getNodeFromInternalInstanceHandle;
  }
  return cachedGetNodeFromInternalInstanceHandle(instanceHandle);
}

let cachedGetPublicInstanceFromInternalInstanceHandle;
function getPublicInstanceFromInternalInstanceHandle(
  instanceHandle: InternalInstanceHandle,
) {
  if (cachedGetPublicInstanceFromInternalInstanceHandle == null) {
    // Lazy import Fabric here to avoid DOM Node APIs classes from having side-effects.
    // With a static import we can't use these classes for Paper-only variants.
    cachedGetPublicInstanceFromInternalInstanceHandle =
      require('../../../../../../Libraries/ReactNative/RendererProxy').getPublicInstanceFromInternalInstanceHandle;
  }
  return cachedGetPublicInstanceFromInternalInstanceHandle(instanceHandle);
}

const INSTANCE_HANDLE_KEY = Symbol('internalInstanceHandle');
const OWNER_DOCUMENT_KEY = Symbol('ownerDocument');

export function getInstanceHandle(node: ReadOnlyNode): InstanceHandle {
  // $FlowExpectedError[prop-missing]
  return node[INSTANCE_HANDLE_KEY];
}

export function setInstanceHandle(
  node: ReadOnlyNode,
  instanceHandle: InstanceHandle,
): void {
  // $FlowExpectedError[prop-missing]
  node[INSTANCE_HANDLE_KEY] = instanceHandle;
}

export function getOwnerDocument(
  node: ReadOnlyNode,
): ReactNativeDocument | null {
  // $FlowExpectedError[prop-missing]
  return node[OWNER_DOCUMENT_KEY] ?? null;
}

export function setOwnerDocument(
  node: ReadOnlyNode,
  ownerDocument: ReactNativeDocument | null,
): void {
  // $FlowExpectedError[prop-missing]
  node[OWNER_DOCUMENT_KEY] = ownerDocument;
}

export function getPublicInstanceFromInstanceHandle(
  instanceHandle: InstanceHandle,
): ?ReadOnlyNode {
  const mixedPublicInstance =
    // $FlowExpectedError[incompatible-type]
    getPublicInstanceFromInternalInstanceHandle(instanceHandle);

  if (mixedPublicInstance != null) {
    // $FlowExpectedError[incompatible-type] React defines public instances as "mixed" because it can't access the definition from React Native.
    return mixedPublicInstance;
  }

  if (isReactNativeDocumentInstanceHandle(instanceHandle)) {
    return getPublicInstanceFromReactNativeDocumentInstanceHandle(
      instanceHandle,
    );
  }

  if (isReactNativeDocumentElementInstanceHandle(instanceHandle)) {
    return getPublicInstanceFromReactNativeDocumentElementInstanceHandle(
      instanceHandle,
    );
  }
}

export function getNativeNodeReference(
  node: ReadOnlyNode,
): ?NativeNodeReference {
  const instanceHandle = getInstanceHandle(node);

  // Try React nodes first
  const nativeReference =
    // $FlowExpectedError[incompatible-type]
    getNodeFromInternalInstanceHandle(instanceHandle);
  if (nativeReference != null) {
    // $FlowExpectedError[incompatible-type]
    return nativeReference;
  }

  if (isReactNativeDocumentInstanceHandle(instanceHandle)) {
    return getNativeNodeReferenceFromReactNativeDocumentInstanceHandle(
      instanceHandle,
    );
  }

  if (isReactNativeDocumentElementInstanceHandle(instanceHandle)) {
    return getNativeElementReferenceFromReactNativeDocumentElementInstanceHandle(
      instanceHandle,
    );
  }
}

export function getNativeElementReference(
  node: ReadOnlyElement,
): ?NativeElementReference {
  // $FlowExpectedError[incompatible-type] We know ReadOnlyElement instances provide InternalInstanceHandle
  const instanceHandle = getInstanceHandle(node) as InternalInstanceHandle;

  if (isReactNativeDocumentElementInstanceHandle(instanceHandle)) {
    return getNativeElementReferenceFromReactNativeDocumentElementInstanceHandle(
      instanceHandle,
    );
  }

  // $FlowExpectedError[incompatible-type]
  return getNodeFromInternalInstanceHandle(instanceHandle);
}

/**
 * Returns the current props for a node managed by React.
 * This accesses React internals (fiber.stateNode.canonical.currentProps).
 */
export function getCurrentProps(node: ReadOnlyNode): {[string]: unknown} {
  const instanceHandle = getInstanceHandle(node);
  // $FlowExpectedError[incompatible-use] instanceHandle is opaque
  return instanceHandle?.stateNode?.canonical?.currentProps ?? {};
}

export function getNativeTextReference(
  node: ReadOnlyCharacterData,
): ?NativeTextReference {
  // $FlowExpectedError[incompatible-type] We know ReadOnlyText instances provide InternalInstanceHandle
  const instanceHandle = getInstanceHandle(node) as InternalInstanceHandle;

  // $FlowExpectedError[incompatible-type]
  return getNodeFromInternalInstanceHandle(instanceHandle);
}

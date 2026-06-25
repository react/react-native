/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type ReadOnlyNode from '../ReadOnlyNode';
import type {NativeElementReference} from '../specs/NativeDOM';

class ReactNativeDocumentElementInstanceHandleImpl {
  publicInstance: ?ReadOnlyNode;
  nativeElementReference: ?NativeElementReference;
}

export opaque type ReactNativeDocumentElementInstanceHandle = ReactNativeDocumentElementInstanceHandleImpl;

export function createReactNativeDocumentElementInstanceHandle(): ReactNativeDocumentElementInstanceHandle {
  return new ReactNativeDocumentElementInstanceHandleImpl();
}

export function getNativeElementReferenceFromReactNativeDocumentElementInstanceHandle(
  instanceHandle: ReactNativeDocumentElementInstanceHandle,
): ?NativeElementReference {
  return instanceHandle.nativeElementReference;
}

export function setNativeElementReferenceForReactNativeDocumentElementInstanceHandle(
  instanceHandle: ReactNativeDocumentElementInstanceHandle,
  nativeElementReference: ?NativeElementReference,
): void {
  instanceHandle.nativeElementReference = nativeElementReference;
}

export function getPublicInstanceFromReactNativeDocumentElementInstanceHandle(
  instanceHandle: ReactNativeDocumentElementInstanceHandle,
): ?ReadOnlyNode {
  return instanceHandle.publicInstance;
}

export function setPublicInstanceForReactNativeDocumentElementInstanceHandle(
  instanceHandle: ReactNativeDocumentElementInstanceHandle,
  publicInstance: ?ReadOnlyNode,
): void {
  instanceHandle.publicInstance = publicInstance;
}

export function isReactNativeDocumentElementInstanceHandle(
  instanceHandle: unknown,
): instanceHandle is ReactNativeDocumentElementInstanceHandle {
  return instanceHandle instanceof ReactNativeDocumentElementInstanceHandleImpl;
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

/**
 * This module is meant to be used by the React renderers to create public
 * instances and get some data from them (like their instance handle / fiber).
 */

import type {
  InternalInstanceHandle,
  Node,
  ViewConfig,
} from '../../Renderer/shims/ReactNativeTypes';
import type {RootTag} from '../RootTag';

import ReactNativeDocument, {
  createReactNativeDocument,
} from '../../../src/private/webapis/dom/nodes/ReactNativeDocument';
import ReactNativeElement from '../../../src/private/webapis/dom/nodes/ReactNativeElement';
import ReadOnlyText from '../../../src/private/webapis/dom/nodes/ReadOnlyText';
import * as RendererProxy from '../../ReactNative/RendererProxy';

export opaque type PublicRootInstance = unknown;

export function createPublicRootInstance(rootTag: RootTag): PublicRootInstance {
  // $FlowExpectedError[incompatible-return]
  return createReactNativeDocument(rootTag);
}

export function createPublicInstance(
  tag: number,
  viewConfig: ViewConfig,
  internalInstanceHandle: InternalInstanceHandle,
  ownerDocument: ReactNativeDocument,
): ReactNativeElement {
  return new ReactNativeElement(
    tag,
    viewConfig,
    internalInstanceHandle,
    ownerDocument,
  );
}

export function createPublicTextInstance(
  internalInstanceHandle: InternalInstanceHandle,
  ownerDocument: ReactNativeDocument,
): ReadOnlyText {
  return new ReadOnlyText(internalInstanceHandle, ownerDocument);
}

export function getNativeTagFromPublicInstance(
  publicInstance: ReactNativeElement,
): number {
  return publicInstance.__nativeTag;
}

export function getNodeFromPublicInstance(
  publicInstance: ReactNativeElement,
): ?Node {
  // Avoid loading ReactFabric if using an instance from the legacy renderer.
  if (publicInstance.__internalInstanceHandle == null) {
    return null;
  }

  return RendererProxy.getNodeFromInternalInstanceHandle(
    // $FlowExpectedError[incompatible-type] __internalInstanceHandle is always an InternalInstanceHandle from React when we get here.
    publicInstance.__internalInstanceHandle,
  );
}

export function getInternalInstanceHandleFromPublicInstance(
  publicInstance: ReactNativeElement,
): InternalInstanceHandle {
  // TODO(T174762768): Remove this once OSS versions of renderers will be synced.
  // $FlowExpectedError[prop-missing] Keeping this for backwards-compatibility with the renderers versions in open source.
  if (publicInstance._internalInstanceHandle != null) {
    // $FlowExpectedError[incompatible-type] Keeping this for backwards-compatibility with the renderers versions in open source.
    return publicInstance._internalInstanceHandle;
  }

  // $FlowExpectedError[incompatible-type] __internalInstanceHandle is always an InternalInstanceHandle from React when we get here.
  return publicInstance.__internalInstanceHandle;
}

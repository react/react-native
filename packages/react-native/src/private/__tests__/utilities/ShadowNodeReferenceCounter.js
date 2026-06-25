/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import ReactNativeElement from '../../webapis/dom/nodes/ReadOnlyNode';
import ensureInstance from './ensureInstance';
import * as Fantom from '@react-native/fantom';

export function createShadowNodeReferenceCounter(
  element: ReactNativeElement,
): () => number {
  const getReferenceCount = Fantom.createShadowNodeReferenceCounter(element);
  // Create the reference counting function in a helper instead of creating a
  // closure here, which would unintentionally retain a reference to `element`.
  return createExpirationChecker(getReferenceCount);
}

function createExpirationChecker(
  getReferenceCount: () => number,
): () => number {
  return () => {
    Fantom.runTask(() => {
      global.gc();
    });
    return getReferenceCount();
  };
}

export function createShadowNodeReferenceCountingRef(): [
  () => number,
  React.RefSetter<unknown>,
] {
  let getReferenceCount: ?() => number;

  function getShadowNodeReferenceCount() {
    if (getReferenceCount == null) {
      throw new Error('ShadowNode reference counter was not initialized.');
    }
    return getReferenceCount();
  }

  function ref(instance: unknown | null) {
    if (instance == null) {
      return;
    }
    const element = ensureInstance(instance, ReactNativeElement);
    if (getReferenceCount != null) {
      throw new Error('ShadowNode reference counter was already initialized.');
    }
    getReferenceCount = createShadowNodeReferenceCounter(element);
  }

  return [getShadowNodeReferenceCount, ref];
}

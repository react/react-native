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

function createShadowNodeRevisionGetter(
  element: ReactNativeElement,
): () => ?number {
  const getRevision = Fantom.createShadowNodeRevisionGetter(element);
  return () => {
    return getRevision();
  };
}

export function createShadowNodeReferenceGetterRef(): [
  () => ?number,
  React.RefSetter<unknown>,
] {
  let getRevision: ?() => ?number;

  function getShadowNodeReferenceCount() {
    if (getRevision == null) {
      throw new Error('ShadowNode revision getter was not initialized.');
    }
    return getRevision();
  }

  function ref(instance: unknown | null) {
    if (instance == null) {
      return;
    }
    const element = ensureInstance(instance, ReactNativeElement);
    if (getRevision != null) {
      throw new Error('ShadowNode revision getter was already initialized.');
    }
    getRevision = createShadowNodeRevisionGetter(element);
  }

  return [getShadowNodeReferenceCount, ref];
}

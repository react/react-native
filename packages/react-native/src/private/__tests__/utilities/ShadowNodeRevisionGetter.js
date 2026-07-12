/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostInstance} from 'react-native';

import * as Fantom from '@react-native/fantom';

function createShadowNodeRevisionGetter(element: HostInstance): () => ?number {
  const getRevision = Fantom.createShadowNodeRevisionGetter(element);
  return () => {
    return getRevision();
  };
}

export function createShadowNodeReferenceGetterRef(): [
  () => ?number,
  React.RefSetter<HostInstance>,
] {
  let getRevision: ?() => ?number;

  function getShadowNodeReferenceCount() {
    if (getRevision == null) {
      throw new Error('ShadowNode revision getter was not initialized.');
    }
    return getRevision();
  }

  function ref(instance: HostInstance | null) {
    if (instance == null) {
      return;
    }
    if (getRevision != null) {
      throw new Error('ShadowNode revision getter was already initialized.');
    }
    getRevision = createShadowNodeRevisionGetter(instance);
  }

  return [getShadowNodeReferenceCount, ref];
}

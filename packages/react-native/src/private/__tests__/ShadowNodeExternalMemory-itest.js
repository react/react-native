/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_mode *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {View} from 'react-native';

// Must match `kCreatedShadowNodeNativeMemory` in UIManagerBinding.cpp.
const CREATED_SHADOW_NODE_NATIVE_MEMORY = 2048;

function getExternalMemoryAfterGC(): number {
  global.gc();
  const stats = nullthrows(
    nullthrows(global.HermesInternal).getInstrumentedStats,
  )();
  const externalBytes = stats.js_externalBytes;
  if (typeof externalBytes !== 'number') {
    throw new Error('Expected js_externalBytes to be a number');
  }
  return externalBytes;
}

describe('shadow node external memory', () => {
  it('reports the native memory of created shadow nodes to the GC until they are collected', () => {
    const before = getExternalMemoryAfterGC();

    let root: ?Fantom.Root = Fantom.createRoot();
    Fantom.runTask(() => {
      nullthrows(root).render(
        <View>
          {Array.from({length: 100}, (_, i) => (
            <View key={i} />
          ))}
        </View>,
      );
    });

    // The 100 children and their parent are alive, so their native memory
    // stays reported after a GC.
    expect(getExternalMemoryAfterGC() - before).toBeGreaterThanOrEqual(
      101 * CREATED_SHADOW_NODE_NATIVE_MEMORY,
    );

    Fantom.runTask(() => {
      nullthrows(root).destroy();
    });
    root = null;

    // Once the tree is unmounted and collected, its memory isn't reported
    // anymore.
    expect(getExternalMemoryAfterGC() - before).toBeLessThan(
      CREATED_SHADOW_NODE_NATIVE_MEMORY,
    );
  });
});

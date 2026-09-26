/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {ComponentList} from '../types/RNTesterTypes';

import {getUpdatedRecentlyUsed} from './RNTesterNavigationReducer';
import {useSyncExternalStore} from 'react';

// Shared across every surface, since each native screen mounts its own root.
let recentlyUsed: NonNullable<ComponentList> = {components: [], apis: []};
const listeners: Set<() => void> = new Set();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function addRecentlyUsed(
  exampleType: 'apis' | 'components',
  key: string,
): void {
  recentlyUsed = getUpdatedRecentlyUsed({exampleType, key, recentlyUsed});
  listeners.forEach(listener => listener());
}

export function useRecentlyUsed(): NonNullable<ComponentList> {
  return useSyncExternalStore(subscribe, () => recentlyUsed);
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TurboModule} from '../../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../../Libraries/TurboModule/TurboModuleRegistry';

export type MutationObserverId = number;

// These types are not supported by the codegen.
type ShadowNode = unknown;
type InstanceHandle = unknown;
type ReactNativeElement = unknown;
type ReadOnlyNode = unknown;

export type NativeMutationRecord = {
  mutationObserverId: MutationObserverId,
  target: ReactNativeElement,
  addedNodes: ReadonlyArray<ReadOnlyNode>,
  removedNodes: ReadonlyArray<ReadOnlyNode>,
  ...
};

export type NativeMutationObserverObserveOptions = {
  mutationObserverId: number,
  targetShadowNode: ShadowNode,
  subtree: boolean,
};

export interface Spec extends TurboModule {
  readonly observe: (options: NativeMutationObserverObserveOptions) => void;
  readonly unobserveAll: (mutationObserverId: number) => void;
  readonly connect: (
    notifyMutationObservers: () => void,
    // We need this to retain the public instance before React removes the
    // reference to it (which happen in mutations that remove nodes, or when
    // nodes are removed between the change and the callback is executed in JS).
    getPublicInstanceFromInstanceHandle: (
      instanceHandle: InstanceHandle,
    ) => ReadOnlyNode,
  ) => void;
  readonly disconnect: () => void;
  readonly takeRecords: () => ReadonlyArray<NativeMutationRecord>;
}

export default TurboModuleRegistry.get<Spec>(
  'NativeMutationObserverCxx',
) as ?Spec;

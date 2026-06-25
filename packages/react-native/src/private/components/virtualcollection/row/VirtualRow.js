/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Item, VirtualCollection} from '../Virtual';

import {createVirtualCollectionView} from '../VirtualCollectionView';
import VirtualRowGenerator from './VirtualRowGenerator';
import * as React from 'react';

component VirtualRowLayout(
  children: ReadonlyArray<React.Node>,
  spacer: React.Node,
) {
  return (
    <>
      {children}
      {spacer}
    </>
  );
}

const VirtualRow = createVirtualCollectionView(
  VirtualRowLayout,
  VirtualRowGenerator,
);

// TODO: Figure out component generic resolution.
// @see https://fb.workplace.com/groups/flow/posts/29355518614070041
// export default VirtualRow as VirtualCollectionViewComponent<VirtualRowLayoutProps>;
export default VirtualRow as component<out TItem extends Item>(
  children: (item: TItem, key: string) => React.Node,
  items: VirtualCollection<TItem>,
  itemToKey?: (TItem) => string,
  removeClippedSubviews?: boolean,
  testID?: ?string,
);

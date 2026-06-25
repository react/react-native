/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ViewStyleProp} from '../../../../Libraries/StyleSheet/StyleSheet';
import type {ModeChangeEvent} from '../virtualview/VirtualView';
import type {Item, VirtualCollection} from './Virtual';

import VirtualView from '../virtualview/VirtualView';
import {
  VirtualViewMode,
  createHiddenVirtualView,
} from '../virtualview/VirtualView';
import * as React from 'react';
import {useCallback, useMemo, useState} from 'react';

export type VirtualCollectionLayoutComponent<TLayoutProps extends {...}> =
  component(
    children: ReadonlyArray<React.Node>,
    spacer: React.Node,
    ...TLayoutProps
  );

export type VirtualCollectionGenerator = Readonly<{
  initial: Readonly<{
    itemCount: number,
    spacerStyle: (itemCount: number) => ViewStyleProp,
  }>,
  next: (event: ModeChangeEvent) => {
    itemCount: number,
    spacerStyle: (itemCount: number) => ViewStyleProp,
  },
}>;

export type VirtualCollectionViewComponent<TLayoutProps extends {...}> =
  component<out TItem extends Item>(
    children: (item: TItem, key: string) => React.Node,
    items: VirtualCollection<TItem>,
    itemToKey?: (TItem) => string,
    removeClippedSubviews?: boolean,
    testID?: ?string,
    ...TLayoutProps
  );

/**
 * Creates a component that virtually renders a collection of items and manages
 * lazy rendering, memoization, and pagination. The resulting component accepts
 * the following base props:
 *
 * - `children`: A function maps an item to a React node.
 * - `items`: A collection of items to render.
 * - `itemToKey`: A function maps an item to a unique key.
 *
 * The first argument is a layout component that defines layout of the item and
 * spacer. It always receives the following props:
 *
 * - `children`: An array of React nodes (for items rendered so far).
 * - `spacer`: A React node (estimates layout for items not yet rendered).
 *
 * The layout component must render `children` and `spacer`. It can also define
 * additional props that will be passed through from the resulting component.
 *
 * The second argument is a generator that defines the initial rendering and
 * pagination behavior. The initial rendering behavior is defined by the
 * `initial` property with the following properties:
 *
 * - `itemCount`: Number of items to render initially.
 * - `spacerStyle`: A function that estimates the layout of the spacer. It
 *   receives the number of items being rendered as an argument.
 *
 * The pagination behavior is defined by the `next` function that receives a
 * `ModeChangeEvent` and then returns an object with the following properties:
 *
 * - `itemCount`: Number of additional items needed to fill `thresholdRect`.
 * - `spacerStyle`: A function that estimates the layout of the spacer. It
 *   receives the number of items being rendered as an argument.
 *
 */
export function createVirtualCollectionView<TLayoutProps extends {...}>(
  VirtualLayout: VirtualCollectionLayoutComponent<TLayoutProps>,
  {initial, next}: VirtualCollectionGenerator,
): VirtualCollectionViewComponent<TLayoutProps> {
  component VirtualCollectionView<out TItem extends Item>(
    children: (item: TItem, key: string) => React.Node,
    items: VirtualCollection<TItem>,
    itemToKey: TItem => string = defaultItemToKey,
    removeClippedSubviews: boolean = false,
    testID?: ?string,
    ...layoutProps: TLayoutProps
  ) {
    const [desiredItemCount, setDesiredItemCount] = useState(
      Math.ceil(initial.itemCount),
    );

    const renderItem = useMemoCallback(
      useCallback(
        (item: TItem) => {
          const key = itemToKey(item);
          return (
            <VirtualView
              key={key}
              nativeID={key}
              removeClippedSubviews={removeClippedSubviews}>
              {children(item, key)}
            </VirtualView>
          );
        },
        [children, itemToKey, removeClippedSubviews],
      ),
    );

    const mountedItemCount = Math.min(desiredItemCount, items.size);
    const mountedItemViews = Array.from(
      {length: mountedItemCount},
      (_, index) => renderItem(items.at(index)),
    );

    const virtualItemCount = items.size - mountedItemCount;
    const virtualItemSpacer = useMemo(
      () =>
        virtualItemCount === 0 ? null : (
          <VirtualCollectionSpacer
            nativeID={`${testID ?? ''}:Spacer`}
            virtualItemCount={virtualItemCount}
            onRenderMoreItems={(itemCount: number) => {
              setDesiredItemCount(
                prevElementCount => prevElementCount + itemCount,
              );
            }}
          />
        ),
      [virtualItemCount, testID],
    );

    return (
      <VirtualLayout {...layoutProps} spacer={virtualItemSpacer}>
        {mountedItemViews}
      </VirtualLayout>
    );
  }

  function createSpacerView(spacerStyle: (itemCount: number) => ViewStyleProp) {
    component SpacerView(
      itemCount: number,
      ref?: React.RefSetter<React.RefOf<VirtualView> | null>,
      ...props: Omit<React.PropsOf<VirtualView>, 'ref'>
    ) {
      const HiddenVirtualView = useMemo(
        () => createHiddenVirtualView(spacerStyle(itemCount)),
        [itemCount],
      );
      return <HiddenVirtualView ref={ref} {...props} />;
    }
    return SpacerView;
  }

  const initialSpacerView = {
    SpacerView: createSpacerView(initial.spacerStyle),
  };

  component VirtualCollectionSpacer(
    nativeID: string,
    virtualItemCount: number,

    onRenderMoreItems: (itemCount: number) => void,
  ) {
    // NOTE: Store `SpacerView` in a wrapper object because otherwise, `useState`
    // will confuse `SpacerView` (a component) as being an updater function.
    const [{SpacerView}, setSpacerView] = useState(initialSpacerView);

    const handleModeChange = (event: ModeChangeEvent) => {
      if (event.mode === VirtualViewMode.Hidden) {
        // This should never happen; this starts hidden and otherwise unmounts.
        return;
      }
      const {itemCount, spacerStyle} = next(event);

      // Refine the estimated item size when computing spacer size.
      setSpacerView({
        SpacerView: createSpacerView(spacerStyle),
      });

      // Render more items to fill `thresholdRect`.
      onRenderMoreItems(Math.min(Math.ceil(itemCount), virtualItemCount));
    };

    return (
      <SpacerView
        itemCount={virtualItemCount}
        nativeID={nativeID}
        onModeChange={handleModeChange}
      />
    );
  }

  return VirtualCollectionView;
}

hook useMemoCallback<TInput extends interface {}, TOutput>(
  callback: TInput => TOutput,
): TInput => TOutput {
  return useMemo(() => memoize(callback), [callback]);
}

function memoize<TInput extends interface {}, TOutput>(
  callback: TInput => TOutput,
): TInput => TOutput {
  const cache = new WeakMap<TInput, TOutput>();
  return (input: TInput) => {
    let output = cache.get(input);
    if (output == null) {
      output = callback(input);
      cache.set(input, output);
    }
    return output;
  };
}

function defaultItemToKey(item: Item): string {
  // $FlowExpectedError[prop-missing] - Flow cannot model this dynamic pattern.
  const key = item.key;
  if (typeof key !== 'string') {
    throw new TypeError(
      `Expected 'id' of item to be a string, got: ${typeof key}`,
    );
  }
  return key;
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type ReadOnlyElement from '../../../webapis/dom/nodes/ReadOnlyElement';
import type {ModeChangeEvent} from '../../virtualview/VirtualView';
import type {VirtualCollectionGenerator} from '../VirtualCollectionView';

import ReactNativeElement from '../../../webapis/dom/nodes/ReactNativeElement';
import {
  FALLBACK_ESTIMATED_WIDTH,
  INITIAL_NUM_TO_RENDER,
} from '../FlingConstants';

function isVirtualView(element: ReadOnlyElement) {
  // True for `VirtualView` and `VirtualViewExperimental`.
  return element.nodeName.startsWith('RN:VirtualView');
}

const VirtualRowGenerator: VirtualCollectionGenerator = {
  initial: {
    itemCount: INITIAL_NUM_TO_RENDER,
    spacerStyle: (itemCount: number) => ({
      width: itemCount * FALLBACK_ESTIMATED_WIDTH,
    }),
  },
  next({target, targetRect, thresholdRect}: ModeChangeEvent) {
    if (!(target instanceof ReactNativeElement)) {
      throw new Error(
        'Expected target to be a ReactNativeElement. VirtualRow requires DOM APIs to be enabled in React Native.',
      );
    }

    const widthToFill =
      Math.min(
        targetRect.x + targetRect.width,
        thresholdRect.x + thresholdRect.width,
      ) - Math.max(targetRect.x, thresholdRect.x);

    // Estimate each item's size by averaging up to the 3 last items.
    let previous: ReadOnlyElement = target;
    let count = 0;
    let maybePrevious = previous.previousElementSibling;
    while (count < 3 && maybePrevious != null && isVirtualView(maybePrevious)) {
      previous = maybePrevious;
      count++;
      maybePrevious = previous.previousElementSibling;
    }

    const itemWidth =
      count > 0
        ? (target.getBoundingClientRect().left -
            previous.getBoundingClientRect().left) /
          count
        : FALLBACK_ESTIMATED_WIDTH;

    return {
      itemCount: widthToFill / itemWidth,
      spacerStyle: (itemCount: number) => ({
        width: itemCount * itemWidth,
      }),
    };
  },
};

export default VirtualRowGenerator;

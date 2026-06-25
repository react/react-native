/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import ReactNativeElement from '../../../webapis/dom/nodes/ReactNativeElement';
import isScrollableNode from './isScrollableNode';

/**
 * Finds the nearest ancestor of the supplied node that is a scrollable node.
 *
 * Unlike the web-equivalent function, the return type is nullable because the
 * root is not an implicitly scrollable node.
 */
export default function getScrollParent(
  node: ReactNativeElement,
): ReactNativeElement | null {
  let element: ReactNativeElement | null = node;
  while (element != null) {
    if (isScrollableNode(element)) {
      return element;
    }
    const parent = element.parentElement;
    // Currently, the only subclass of `ReadOnlyNode` is `ReactNativeElement`.
    if (parent instanceof ReactNativeElement || parent == null) {
      element = parent;
    } else {
      console.error(
        'Expected `element.parentElement` to be `?ReactNativeElement`, got: %s',
        parent,
      );
      element = null;
    }
    // So this is equivalent to a null check with type safety.
    element = parent instanceof ReactNativeElement ? parent : null;
  }
  return null;
}

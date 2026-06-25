/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type ReactNativeElement from '../../../webapis/dom/nodes/ReactNativeElement';

/**
 * Checks whether the supplied node is a scrollable node, ignoring whether
 * there is sufficient content to scroll or whether scrolling is disabled.
 */
export default function isScrollableNode(node: ReactNativeElement): boolean {
  // Applies for vertical and horizontal `ScrollView` on both Android and iOS.
  // The content container might have a different `nodeName`, but its parent
  // always has this `nodeName`.
  return node.nodeName === 'RN:ScrollView';
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {EVENT_TARGET_GET_THE_PARENT_KEY} from '../internals/EventTargetInternals';

/**
 * Returns a tree of EventTargets with the given depth (starting from the root).
 */
export default function createEventTargetHierarchyWithDepth(
  depth: number,
): Array<EventTarget> {
  if (depth < 1) {
    throw new Error('Depth must be greater or equal to 1');
  }

  const targets = [];

  for (let i = 0; i < depth; i++) {
    const target = new EventTarget();
    const parentTarget = targets[targets.length - 1];

    // $FlowExpectedError[prop-missing]
    target[EVENT_TARGET_GET_THE_PARENT_KEY] = () => parentTarget;

    targets.push(target);
  }

  return targets;
}

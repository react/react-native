/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

module.exports = {
  // When enableEagerAlternateStateNodeCleanup is enabled, alternate.stateNode is proactively
  // pointed towards finishedWork's stateNode, releasing resources sooner.
  // With enableEagerAlternateStateNodeCleanup enabled, we can remove workarounds in tests
  // and have predictable memory model.
  // See https://github.com/facebook/react/pull/33161 for details.
  enableEagerAlternateStateNodeCleanup: true,
  enableFragmentRefs: true,
  enableFragmentRefsInstanceHandles: true,
  enableFragmentRefsTextNodes: true,
  enableViewTransitionForPersistenceMode: true,
};

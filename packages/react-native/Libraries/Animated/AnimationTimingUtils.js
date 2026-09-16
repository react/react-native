/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

export type AnimationTimeProvider = () => number;

const defaultAnimationTimeProvider: AnimationTimeProvider = () => Date.now();

let animationTimeProvider: AnimationTimeProvider = defaultAnimationTimeProvider;

/**
 * Returns the current time, in milliseconds, used to drive JavaScript-based
 * animations (timing, spring and decay).
 *
 * Defaults to `Date.now()`. The value can be overridden with
 * `setAnimationTimeProvider`, e.g. to drive animations from a controlled clock
 * in tests.
 */
export function getCurrentAnimationTime(): number {
  return animationTimeProvider();
}

/**
 * Overrides the time source used by `getCurrentAnimationTime`. Pass `null` to restore
 * the default `Date.now()`-based provider.
 */
export function setAnimationTimeProvider(
  provider: ?AnimationTimeProvider,
): void {
  animationTimeProvider = provider ?? defaultAnimationTimeProvider;
}

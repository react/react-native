/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import {useCallback, useRef} from 'react';

type CallbackRef<T> = T => unknown;

/**
 * Constructs a callback ref that provides similar semantics as `useEffect`. The
 * supplied `effect` callback will be called with non-null component instances.
 * The `effect` callback can also optionally return a cleanup function.
 *
 * When a component is updated or unmounted, the cleanup function is called. The
 * `effect` callback will then be called again, if applicable.
 *
 * When a new `effect` callback is supplied, the previously returned cleanup
 * function will be called before the new `effect` callback is called with the
 * same instance.
 *
 * WARNING: The `effect` callback should be stable (e.g. using `useCallback`).
 */
export default function useRefEffect<TInstance>(
  effect: TInstance => (() => void) | void,
): CallbackRef<TInstance | null> {
  const cleanupRef = useRef<(() => void) | void>(undefined);
  return useCallback(
    (instance: null | TInstance) => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = undefined;
      }
      if (instance != null) {
        cleanupRef.current = effect(instance);
      }
    },
    [effect],
  );
}

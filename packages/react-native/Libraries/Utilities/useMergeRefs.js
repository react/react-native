/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import useRefEffect from './useRefEffect';
import * as React from 'react';
import {useCallback} from 'react';

/**
 * Constructs a new ref that forwards new values to each of the given refs. The
 * given refs will always be invoked in the order that they are supplied.
 *
 * WARNING: A known problem of merging refs using this approach is that if any
 * of the given refs change, the returned callback ref will also be changed. If
 * the returned callback ref is supplied as a `ref` to a React element, this may
 * lead to problems with the given refs being invoked more times than desired.
 */
export default function useMergeRefs<Instance>(
  ...refs: ReadonlyArray<?React.RefSetter<Instance>>
): React.RefSetter<Instance> {
  const refEffect = useCallback(
    (current: Instance) => {
      const cleanups: ReadonlyArray<void | (() => void)> = refs.map(ref => {
        if (ref == null) {
          return undefined;
        } else {
          if (typeof ref === 'function') {
            // $FlowFixMe[incompatible-type] - Flow does not understand ref cleanup.
            const cleanup: void | (() => void) = ref(current);
            return typeof cleanup === 'function'
              ? cleanup
              : () => {
                  ref(null);
                };
          } else {
            ref.current = current;
            return () => {
              ref.current = null;
            };
          }
        }
      });

      return () => {
        for (const cleanup of cleanups) {
          cleanup?.();
        }
      };
    },
    [...refs], // eslint-disable-line react-hooks/exhaustive-deps
  );
  return useRefEffect(refEffect);
}

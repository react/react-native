/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostInstance} from '../../../src/private/types/HostInstance';
import type {ViewProps} from '../View/ViewPropTypes';
import type {Edge, EdgeMode, EdgeRecord, Edges} from './SafeAreaViewTypes';

import SafeAreaViewNativeComponent from '../../../src/private/components/safeareaview/specs/RCTSafeAreaViewNativeComponent';
import * as React from 'react';

export type SafeAreaViewInstance = HostInstance;

export type SafeAreaViewProps = Readonly<{
  ...ViewProps,
  /**
   * Apply the safe area insets as `padding` (default) or `margin`.
   */
  mode?: 'padding' | 'margin',
  /**
   * Which edges to inset. Either a list of edges (each applied `additive`) or a
   * per-edge record of `'off' | 'additive' | 'maximum'`. Defaults to all four
   * edges `additive`.
   */
  edges?: Edges,
}>;

const defaultEdges: {[Edge]: EdgeMode} = {
  top: 'additive',
  right: 'additive',
  bottom: 'additive',
  left: 'additive',
};

/**
 * Renders content within the safe area boundaries of a device, applying padding
 * (or margin) that reflects the portion of the view covered by system bars,
 * notches, and other ancestor views.
 *
 * @see https://reactnative.dev/docs/safeareaview
 */
const SafeAreaView: component(
  ref?: React.RefSetter<SafeAreaViewInstance>,
  ...props: SafeAreaViewProps
) = React.forwardRef<SafeAreaViewProps, SafeAreaViewInstance>(
  ({edges, mode, ...props}, ref) => {
    const nativeEdges = React.useMemo(() => {
      if (edges == null) {
        return defaultEdges;
      }
      const edgesObj: EdgeRecord = Array.isArray(edges)
        ? edges.reduce(
            (acc, edge) => {
              acc[edge] = 'additive';
              return acc;
            },
            ({}: {[Edge]: EdgeMode}),
          )
        : edges;
      // Fabric requires every edge to be present.
      return {
        top: edgesObj.top ?? 'off',
        right: edgesObj.right ?? 'off',
        bottom: edgesObj.bottom ?? 'off',
        left: edgesObj.left ?? 'off',
      };
    }, [edges]);

    return (
      <SafeAreaViewNativeComponent
        {...props}
        mode={mode}
        edges={nativeEdges}
        ref={ref}
      />
    );
  },
);

export default SafeAreaView;

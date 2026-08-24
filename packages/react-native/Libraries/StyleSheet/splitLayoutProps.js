/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {____ViewStyle_Internal} from './StyleSheetTypes';

export default function splitLayoutProps(props: ?____ViewStyle_Internal): {
  outer: ?____ViewStyle_Internal,
  inner: ?____ViewStyle_Internal,
} {
  let outer: ?____ViewStyle_Internal = null;
  let inner: ?____ViewStyle_Internal = null;

  if (props != null) {
    // $FlowFixMe[incompatible-exact] Will contain a subset of keys from `props`.
    outer = {};
    // $FlowFixMe[incompatible-exact] Will contain a subset of keys from `props`.
    inner = {};

    for (const prop of Object.keys(props)) {
      switch (prop) {
        case 'margin':
        case 'marginHorizontal':
        case 'marginVertical':
        case 'marginBottom':
        case 'marginTop':
        case 'marginLeft':
        case 'marginRight':
        case 'flex':
        case 'flexGrow':
        case 'flexShrink':
        case 'flexBasis':
        case 'alignSelf':
        case 'height':
        case 'minHeight':
        case 'maxHeight':
        case 'width':
        case 'minWidth':
        case 'maxWidth':
        case 'position':
        case 'zIndex':
        case 'left':
        case 'right':
        case 'bottom':
        case 'top':
        case 'transform':
        case 'transformOrigin':
        case 'rowGap':
        case 'columnGap':
        case 'gap':
          // $FlowFixMe[cannot-write]
          // $FlowFixMe[incompatible-use]
          // $FlowFixMe[prop-missing]
          outer[prop] = props[prop];
          break;
        default:
          // $FlowFixMe[cannot-write]
          // $FlowFixMe[incompatible-use]
          // $FlowFixMe[prop-missing]
          inner[prop] = props[prop];
          break;
      }
    }
  }

  return {outer, inner};
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ViewProps} from '../../../../../Libraries/Components/View/ViewPropTypes';
import type {WithDefault} from '../../../../../Libraries/Types/CodegenTypes';
import type {HostComponent} from '../../../types/HostComponent';

import codegenNativeComponent from '../../../../../Libraries/Utilities/codegenNativeComponent';

type RCTSafeAreaViewNativeProps = Readonly<{
  ...ViewProps,

  /**
   * Whether the safe area insets are applied as `padding` (default) or
   * `margin`. Applied per-edge according to `edges`.
   */
  mode?: WithDefault<'padding' | 'margin', 'padding'>,

  /**
   * Which edges to apply the safe area insets to, and how. Each edge is one of
   * `'off'` (ignore), `'additive'` (add the inset to any existing
   * padding/margin), or `'maximum'` (use the larger of the inset and the
   * existing padding/margin). The JS `SafeAreaView` normalizes the public
   * `edges` prop into this fully-specified object before it reaches native.
   */
  edges?: Readonly<{
    top: string,
    right: string,
    bottom: string,
    left: string,
  }>,
}>;

export default codegenNativeComponent<RCTSafeAreaViewNativeProps>(
  'SafeAreaView',
  {
    paperComponentName: 'RCTSafeAreaView',
    interfaceOnly: true,
  },
) as HostComponent<RCTSafeAreaViewNativeProps>;

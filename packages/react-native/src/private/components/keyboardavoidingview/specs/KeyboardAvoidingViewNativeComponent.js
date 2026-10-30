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
import type {
  Float,
  WithDefault,
} from '../../../../../Libraries/Types/CodegenTypes';
import type {HostComponent} from '../../../types/HostComponent';

import codegenNativeComponent from '../../../../../Libraries/Utilities/codegenNativeComponent';

type KeyboardAvoidingViewNativeProps = Readonly<{
  ...ViewProps,

  behavior?: WithDefault<'none' | 'height' | 'padding' | 'position', 'none'>,
  enabled?: WithDefault<boolean, true>,
  keyboardVerticalOffset?: WithDefault<Float, 0>,

  /**
   * Written by native code through the shared animation backend on each
   * keyboard animation frame. Do not set from JavaScript.
   */
  keyboardInset?: WithDefault<Float, 0>,
  keyboardRestingHeight?: WithDefault<Float, 0>,
}>;

export default codegenNativeComponent<KeyboardAvoidingViewNativeProps>(
  'KeyboardAvoidingView',
  {
    interfaceOnly: true,
  },
) as HostComponent<KeyboardAvoidingViewNativeProps>;

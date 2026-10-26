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
  DirectEventHandler,
  Float,
  WithDefault,
} from '../../../../../Libraries/Types/CodegenTypes';
import type {HostComponent} from '../../../types/HostComponent';

import codegenNativeComponent from '../../../../../Libraries/Utilities/codegenNativeComponent';

type KeyboardInsetChangeEvent = Readonly<{
  inset: Float,
  maxHeight: Float,
}>;

type KeyboardAvoidingViewNativeProps = Readonly<{
  ...ViewProps,

  enabled?: WithDefault<boolean, true>,
  keyboardVerticalOffset?: WithDefault<Float, 0>,
  onKeyboardInsetChange?: ?DirectEventHandler<KeyboardInsetChangeEvent>,
}>;

export default codegenNativeComponent<KeyboardAvoidingViewNativeProps>(
  'KeyboardAvoidingView',
) as HostComponent<KeyboardAvoidingViewNativeProps>;

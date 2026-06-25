/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ViewProps} from '../../../../Libraries/Components/View/ViewPropTypes';
import type {WithDefault} from '../../../../Libraries/Types/CodegenTypes';
import type {HostComponent} from '../../types/HostComponent';

import codegenNativeComponent from '../../../../Libraries/Utilities/codegenNativeComponent';

type UnimplementedNativeViewNativeProps = Readonly<{
  ...ViewProps,
  name?: WithDefault<string, ''>,
}>;

// NOTE: This component is not implemented in paper
// Do not require this file in paper builds
export default codegenNativeComponent<UnimplementedNativeViewNativeProps>(
  'UnimplementedNativeView',
) as HostComponent<UnimplementedNativeViewNativeProps>;

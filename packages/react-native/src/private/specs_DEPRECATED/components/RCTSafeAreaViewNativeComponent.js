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
import type {HostComponent} from '../../types/HostComponent';

import codegenNativeComponent from '../../../../Libraries/Utilities/codegenNativeComponent';

type RCTSafeAreaViewNativeProps = Readonly<{
  ...ViewProps,

  // No props
}>;

export default codegenNativeComponent<RCTSafeAreaViewNativeProps>(
  'SafeAreaView',
  {
    paperComponentName: 'RCTSafeAreaView',
    interfaceOnly: true,
  },
) as HostComponent<RCTSafeAreaViewNativeProps>;

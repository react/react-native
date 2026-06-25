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
import type {ColorValue} from '../../../../Libraries/StyleSheet/StyleSheet';
import type {HostComponent} from '../../types/HostComponent';

import codegenNativeComponent from '../../../../Libraries/Utilities/codegenNativeComponent';

type InputAccessoryNativeProps = Readonly<{
  ...ViewProps,
  backgroundColor?: ?ColorValue,
}>;

export default codegenNativeComponent<InputAccessoryNativeProps>(
  'InputAccessory',
  {
    interfaceOnly: true,
    paperComponentName: 'RCTInputAccessoryView',
    excludedPlatforms: ['android'],
  },
) as HostComponent<InputAccessoryNativeProps>;

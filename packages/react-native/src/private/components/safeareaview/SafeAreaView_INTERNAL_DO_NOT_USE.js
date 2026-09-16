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

import View from '../../../../Libraries/Components/View/View';
import UIManager from '../../../../Libraries/ReactNative/UIManager';
import Platform from '../../../../Libraries/Utilities/Platform';
import * as React from 'react';

const exported: component(
  ref?: React.RefSetter<React.ElementRef<typeof View>>,
  ...ViewProps
) = Platform.select({
  ios: require('../../../../src/private/components/safeareaview/specs/RCTSafeAreaViewNativeComponent')
    .default,
  android: UIManager.hasViewManagerConfig('RCTSafeAreaView')
    ? require('../../../../src/private/components/safeareaview/specs/RCTSafeAreaViewNativeComponent')
        .default
    : View,
  default: View,
});

export default exported;

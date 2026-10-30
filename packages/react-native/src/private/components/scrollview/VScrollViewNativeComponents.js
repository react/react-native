/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ScrollViewNativeProps} from '../../../../Libraries/Components/ScrollView/ScrollViewNativeComponentType';
import type {ViewProps} from '../../../../Libraries/Components/View/ViewPropTypes';
import type {HostComponent} from '../../types/HostComponent';

import ScrollContentViewNativeComponent from '../../../../Libraries/Components/ScrollView/ScrollContentViewNativeComponent';
import ScrollViewNativeComponent from '../../../../Libraries/Components/ScrollView/ScrollViewNativeComponent';
import View from '../../../../Libraries/Components/View/View';
import Platform from '../../../../Libraries/Utilities/Platform';

export const VScrollViewNativeComponent: HostComponent<ScrollViewNativeProps> =
  ScrollViewNativeComponent;

export const VScrollContentViewNativeComponent: HostComponent<ViewProps> =
  Platform.OS === 'ios' ? ScrollContentViewNativeComponent : View;

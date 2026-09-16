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

import AndroidHorizontalScrollViewNativeComponent from '../../../../Libraries/Components/ScrollView/AndroidHorizontalScrollViewNativeComponent';
import ScrollContentViewNativeComponent from '../../../../Libraries/Components/ScrollView/ScrollContentViewNativeComponent';
import ScrollViewNativeComponent from '../../../../Libraries/Components/ScrollView/ScrollViewNativeComponent';
import Platform from '../../../../Libraries/Utilities/Platform';
import AndroidHorizontalScrollContentViewNativeComponent from '../../components/scrollview/specs/AndroidHorizontalScrollContentViewNativeComponent';

export const HScrollViewNativeComponent: HostComponent<ScrollViewNativeProps> =
  Platform.OS === 'android'
    ? AndroidHorizontalScrollViewNativeComponent
    : ScrollViewNativeComponent;

export const HScrollContentViewNativeComponent: HostComponent<ViewProps> =
  Platform.OS === 'android'
    ? AndroidHorizontalScrollContentViewNativeComponent
    : ScrollContentViewNativeComponent;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostInstance} from '../../../src/private/types/HostInstance';
import type {ViewProps} from '../View/ViewPropTypes';

import Platform from '../../Utilities/Platform';
import View from '../View/View';
import * as React from 'react';

export type SafeAreaViewInstance = HostInstance;

/**
 * Renders content within the safe area boundaries of a device. Currently only applicable to iOS devices with iOS version 11 or later. Automatically applies padding to reflect the portion of the view not covered by navigation bars, tab bars, toolbars, and other ancestor views.
 *
 * @see https://reactnative.dev/docs/safeareaview
 * @deprecated Use `react-native-safe-area-context` instead.
 * @platform ios
 */
const SafeAreaView: component(
  ref?: React.RefSetter<SafeAreaViewInstance>,
  ...props: ViewProps
) = Platform.select({
  ios: require('./RCTSafeAreaViewNativeComponent').default,
  default: View,
});

export default SafeAreaView;

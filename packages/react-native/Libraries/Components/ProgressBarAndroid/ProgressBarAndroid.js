/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {HostInstance} from '../../../src/private/types/HostInstance';
import type {ProgressBarAndroidProps} from './ProgressBarAndroidTypes';

import Platform from '../../Utilities/Platform';

export type ProgressBarAndroidInstance = HostInstance;

export type {ProgressBarAndroidProps};

// A utility type to preserve the semantics of the union uses in the definition
// of ProgressBarAndroidProps. TS's Omit does not distribute over unions, so
// we define our own version which does. This does not affect Flow.
// $FlowExpectedError[unclear-type]
type Omit<T, K> = T extends any ? Pick<T, Exclude<keyof T, K>> : T;

/**
 * ProgressBarAndroid has been extracted from react-native core and will be removed in a future release.
 * It can now be installed and imported from `@react-native-community/progress-bar-android` instead of 'react-native'.
 * @see https://github.com/react-native-community/progress-bar-android
 * @deprecated
 */
let ProgressBarAndroid: component(
  ref?: React.RefSetter<ProgressBarAndroidInstance>,
  ...props: Omit<ProgressBarAndroidProps, empty>
);

if (Platform.OS === 'android') {
  ProgressBarAndroid = require('./ProgressBarAndroid').default;
} else {
  ProgressBarAndroid = require('../UnimplementedViews/UnimplementedView')
    .default as $FlowFixMe;
}

export default ProgressBarAndroid;

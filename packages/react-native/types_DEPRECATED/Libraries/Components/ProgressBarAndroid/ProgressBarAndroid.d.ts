/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';
import {Constructor} from '../../../private/Utilities';
import {HostInstance} from '../../../public/ReactNativeTypes';
import {ColorValue} from '../../StyleSheet/StyleSheet';
import {ViewProps} from '../View/ViewPropTypes';

/**
 * ProgressBarAndroid has been extracted from react-native core and will be removed in a future release.
 * It can now be installed and imported from `@react-native-community/progress-bar-android` instead of 'react-native'.
 * @see https://github.com/react-native-community/progress-bar-android
 * @deprecated
 */
export interface ProgressBarAndroidProps extends ViewProps {
  /**
     * Style of the ProgressBar. One of:
         Horizontal
         Normal (default)
         Small
         Large
         Inverse
         SmallInverse
         LargeInverse
     */
  styleAttr?:
    | 'Horizontal'
    | 'Normal'
    | 'Small'
    | 'Large'
    | 'Inverse'
    | 'SmallInverse'
    | 'LargeInverse'
    | undefined;

  /**
   * If the progress bar will show indeterminate progress.
   * Note that this can only be false if styleAttr is Horizontal.
   */
  indeterminate?: boolean | undefined;

  /**
   * The progress value (between 0 and 1).
   */
  progress?: number | undefined;

  /**
   * Whether to show the ProgressBar (true, the default) or hide it (false).
   */
  animating?: boolean | undefined;

  /**
   * Color of the progress bar.
   */
  color?: ColorValue | undefined;

  /**
   * Used to locate this view in end-to-end tests.
   */
  testID?: string | undefined;
}

/**
 * React component that wraps the Android-only `ProgressBar`. This component is used to indicate
 * that the app is loading or there is some activity in the app.
 */
declare class ProgressBarAndroidComponent extends React.Component<ProgressBarAndroidProps> {}
declare const ProgressBarAndroidBase: Constructor<HostInstance> &
  typeof ProgressBarAndroidComponent;
/**
 * ProgressBarAndroid has been extracted from react-native core and will be removed in a future release.
 * It can now be installed and imported from `@react-native-community/progress-bar-android` instead of 'react-native'.
 * @see https://github.com/react-native-progress-view/progress-bar-android
 * @deprecated
 */
export class ProgressBarAndroid extends ProgressBarAndroidBase {}

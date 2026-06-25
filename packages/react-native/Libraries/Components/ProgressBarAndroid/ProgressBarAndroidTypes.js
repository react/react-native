/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ColorValue} from '../../StyleSheet/StyleSheet';
import type {ViewProps} from '../View/ViewPropTypes';

/**
 * Style of the ProgressBar and whether it shows indeterminate progress (e.g. spinner).
 *
 * `indeterminate` can only be false if `styleAttr` is Horizontal, and requires a
 * `progress` value.
 */
type DeterminateProgressBarAndroidStyleAttrProp = {
  styleAttr: 'Horizontal',
  indeterminate: false,
  progress: number,
};

type IndeterminateProgressBarAndroidStyleAttrProp = {
  styleAttr:
    | 'Horizontal'
    | 'Normal'
    | 'Small'
    | 'Large'
    | 'Inverse'
    | 'SmallInverse'
    | 'LargeInverse',
  indeterminate: true,
};

type ProgressBarAndroidBaseProps = Readonly<{
  /**
   * Whether to show the ProgressBar (true, the default) or hide it (false).
   */
  animating?: ?boolean,
  /**
   * Color of the progress bar.
   */
  color?: ?ColorValue,
  /**
   * Used to locate this view in end-to-end tests.
   */
  testID?: ?string,
}>;

export type ProgressBarAndroidProps =
  | Readonly<{
      ...ViewProps,
      ...ProgressBarAndroidBaseProps,
      ...DeterminateProgressBarAndroidStyleAttrProp,
    }>
  | Readonly<{
      ...ViewProps,
      ...ProgressBarAndroidBaseProps,
      ...IndeterminateProgressBarAndroidStyleAttrProp,
    }>;

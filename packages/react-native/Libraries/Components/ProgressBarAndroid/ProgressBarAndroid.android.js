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
import type {ProgressBarAndroidProps} from './ProgressBarAndroidTypes';

import ProgressBarAndroidNativeComponent from './ProgressBarAndroidNativeComponent';

const React = require('react');

export type ProgressBarAndroidInstance = HostInstance;

export type {ProgressBarAndroidProps};

/**
 * React component that wraps the Android-only `ProgressBar`. This component is
 * used to indicate that the app is loading or there is activity in the app.
 *
 * Example:
 *
 * ```
 * render: function() {
 *   var progressBar =
 *     <View style={styles.container}>
 *       <ProgressBar styleAttr="Inverse" />
 *     </View>;

 *   return (
 *     <MyLoadingComponent
 *       componentView={componentView}
 *       loadingView={progressBar}
 *       style={styles.loadingComponent}
 *     />
 *   );
 * },
 * ```
 */
const ProgressBarAndroid: component(
  ref?: React.RefSetter<ProgressBarAndroidInstance>,
  ...props: ProgressBarAndroidProps
) = function ProgressBarAndroid({
  ref: forwardedRef,
  // $FlowFixMe[incompatible-type]
  styleAttr = 'Normal',
  indeterminate = true,
  animating = true,
  ...restProps
}: {
  ref?: React.RefSetter<ProgressBarAndroidInstance>,
  ...ProgressBarAndroidProps,
}) {
  return (
    <ProgressBarAndroidNativeComponent
      styleAttr={styleAttr}
      indeterminate={indeterminate}
      animating={animating}
      {...restProps}
      ref={forwardedRef}
    />
  );
};

export default ProgressBarAndroid;

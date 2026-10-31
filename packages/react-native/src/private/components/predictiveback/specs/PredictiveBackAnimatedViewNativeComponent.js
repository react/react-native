/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ViewProps} from '../../../../../Libraries/Components/View/ViewPropTypes';
import type {
  DirectEventHandler,
  Double,
  Int32,
} from '../../../../../Libraries/Types/CodegenTypes';
import type {HostComponent} from '../../../types/HostComponent';

import codegenNativeComponent from '../../../../../Libraries/Utilities/codegenNativeComponent';

export type PredictiveBackNativeEvent = Readonly<{
  progress: Double,
  swipeEdge: Int32,
  touchX: Double,
  touchY: Double,
  phase: Int32,
}>;

type NativeProps = Readonly<{
  ...ViewProps,
  onProgress?: ?DirectEventHandler<PredictiveBackNativeEvent>,
}>;

export default codegenNativeComponent<NativeProps>(
  'PredictiveBackAnimatedView',
  {
    excludedPlatforms: ['iOS'],
  },
) as HostComponent<NativeProps>;

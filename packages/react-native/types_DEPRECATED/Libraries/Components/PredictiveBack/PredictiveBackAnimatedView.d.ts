/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';
import {ViewProps} from '../View/ViewPropTypes';

export interface PredictiveBackNativeEvent {
  readonly progress: number;
  readonly swipeEdge: number;
  readonly touchX: number;
  readonly touchY: number;
  readonly phase: number;
}

export interface PredictiveBackAnimatedViewProps extends ViewProps {
  onProgress?: (event: {nativeEvent: PredictiveBackNativeEvent}) => void;
}

export const PredictiveBackAnimatedView: React.ComponentType<PredictiveBackAnimatedViewProps>;
export default PredictiveBackAnimatedView;

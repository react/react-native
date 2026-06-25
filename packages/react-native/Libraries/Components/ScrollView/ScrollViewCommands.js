/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostComponent} from '../../../src/private/types/HostComponent';
import type {Double} from '../../Types/CodegenTypes';

import codegenNativeCommands from '../../Utilities/codegenNativeCommands';
import * as React from 'react';

type ScrollViewNativeComponentType = HostComponent<{...}>;
interface NativeCommands {
  readonly flashScrollIndicators: (
    viewRef: React.ElementRef<ScrollViewNativeComponentType>,
  ) => void;
  readonly scrollTo: (
    viewRef: React.ElementRef<ScrollViewNativeComponentType>,
    x: Double,
    y: Double,
    animated: boolean,
  ) => void;
  readonly scrollToEnd: (
    viewRef: React.ElementRef<ScrollViewNativeComponentType>,
    animated: boolean,
  ) => void;
  readonly zoomToRect: (
    viewRef: React.ElementRef<ScrollViewNativeComponentType>,
    rect: {
      x: Double,
      y: Double,
      width: Double,
      height: Double,
      animated?: boolean,
    },
    animated?: boolean,
  ) => void;
}

export default codegenNativeCommands<NativeCommands>({
  supportedCommands: [
    'flashScrollIndicators',
    'scrollTo',
    'scrollToEnd',
    'zoomToRect',
  ],
}) as NativeCommands;

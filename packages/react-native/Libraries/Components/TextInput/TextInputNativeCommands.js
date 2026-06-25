/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Int32} from '../../Types/CodegenTypes';

import * as React from 'react';

export interface TextInputNativeCommands<T> {
  readonly focus: (viewRef: React.ElementRef<T>) => void;
  readonly blur: (viewRef: React.ElementRef<T>) => void;
  readonly setTextAndSelection: (
    viewRef: React.ElementRef<T>,
    mostRecentEventCount: Int32,
    value: ?string, // in theory this is nullable
    start: Int32,
    end: Int32,
  ) => void;
}

const supportedCommands = ['focus', 'blur', 'setTextAndSelection'] as string[];

export default supportedCommands;

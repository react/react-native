/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {CodegenTypes, HostComponent, ViewProps} from 'react-native';

import * as React from 'react';
import {codegenNativeCommands, codegenNativeComponent} from 'react-native';

type Event = Readonly<{
  values: ReadonlyArray<CodegenTypes.Int32>,
  boolValues: ReadonlyArray<boolean>,
  floats: ReadonlyArray<CodegenTypes.Float>,
  doubles: ReadonlyArray<CodegenTypes.Double>,
  yesNos: ReadonlyArray<'yep' | 'nope'>,
  strings: ReadonlyArray<string>,
  latLons: ReadonlyArray<{lat: CodegenTypes.Double, lon: CodegenTypes.Double}>,
  multiArrays: ReadonlyArray<ReadonlyArray<CodegenTypes.Int32>>,
}>;

type LegacyStyleEvent = Readonly<{
  string: string,
}>;

type NativeProps = Readonly<{
  ...ViewProps,
  opacity?: CodegenTypes.Float,
  values: ReadonlyArray<CodegenTypes.Int32>,

  // Events
  onIntArrayChanged?: ?CodegenTypes.BubblingEventHandler<Event>,
  onLegacyStyleEvent?: ?CodegenTypes.BubblingEventHandler<
    LegacyStyleEvent,
    'alternativeLegacyName',
  >,
}>;

export type MyNativeViewType = HostComponent<NativeProps>;

interface NativeCommands {
  readonly callNativeMethodToChangeBackgroundColor: (
    viewRef: React.ElementRef<MyNativeViewType>,
    color: string,
  ) => void;

  readonly callNativeMethodToAddOverlays: (
    viewRef: React.ElementRef<MyNativeViewType>,
    overlayColors: ReadonlyArray<string>,
  ) => void;

  readonly callNativeMethodToRemoveOverlays: (
    viewRef: React.ElementRef<MyNativeViewType>,
  ) => void;

  readonly fireLagacyStyleEvent: (
    viewRef: React.ElementRef<MyNativeViewType>,
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: [
    'callNativeMethodToChangeBackgroundColor',
    'callNativeMethodToAddOverlays',
    'callNativeMethodToRemoveOverlays',
    'fireLagacyStyleEvent',
  ],
});

export default codegenNativeComponent<NativeProps>(
  'RNTMyNativeView',
) as MyNativeViewType;

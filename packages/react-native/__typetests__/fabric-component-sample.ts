/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {
  CodegenTypes,
  HostComponent,
  ViewProps,
  codegenNativeCommands,
  codegenNativeComponent,
} from 'react-native';

type Event = Readonly<{
  value: CodegenTypes.Double;
}>;

interface NativeProps extends ViewProps {
  string?: string | undefined;
  number?: number | undefined;
  boolean?: boolean | undefined;
  default?:
    | CodegenTypes.WithDefault<'option1' | 'option2', 'option1'>
    | undefined;
  double?: CodegenTypes.Double | undefined;
  float?: CodegenTypes.Float | undefined;
  int32?: CodegenTypes.Int32 | undefined;
  unsafeObject?: CodegenTypes.UnsafeObject | undefined;
  onBubblingEventHandler?: CodegenTypes.BubblingEventHandler<Event> | undefined;
  onDirectEventHandler?: CodegenTypes.DirectEventHandler<Event> | undefined;
}

export type SampleViewType = HostComponent<NativeProps>;

interface NativeCommands {
  changeBackgroundColor: (
    viewRef: React.ComponentRef<SampleViewType>,
    color: string,
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['changeBackgroundColor'],
});

export default codegenNativeComponent<NativeProps>('SampleView');

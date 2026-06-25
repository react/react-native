/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostComponent} from 'react-native';
import type {ViewProps} from 'react-native/Libraries/Components/View/ViewPropTypes';
import type {
  BubblingEventHandler,
  DirectEventHandler,
  Float,
  Int32,
  WithDefault,
} from 'react-native/Libraries/Types/CodegenTypes';

import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

type OnChangeEvent = Readonly<{
  value: boolean,
  source?: string,
  progress: ?Int32,
  scale?: ?Float,
}>;

type OnEventDirect = Readonly<{
  value: boolean,
}>;

type OnOrientationChangeEvent = Readonly<{
  orientation: 'landscape' | 'portrait',
}>;

type NativeProps = Readonly<{
  ...ViewProps,

  // Props
  disabled?: WithDefault<boolean, false>,

  // Events
  onChange?: ?BubblingEventHandler<OnChangeEvent, 'paperDirectName'>,
  onEventDirect?: ?DirectEventHandler<OnEventDirect>,
  onEventDirectWithPaperName?: ?DirectEventHandler<
    OnEventDirect,
    'paperDirectName',
  >,
  onOrientationChange?: ?DirectEventHandler<
    OnOrientationChangeEvent,
    'paperBubblingName',
  >,
  onEnd?: ?BubblingEventHandler<null>,
  onEventBubblingWithPaperName?: ?BubblingEventHandler<
    null,
    'paperBubblingName',
  >,
}>;

export default codegenNativeComponent<NativeProps>(
  'EventPropsNativeComponentView',
) as HostComponent<NativeProps>;

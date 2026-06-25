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
import type {HostInstance} from '../../../src/private/types/HostInstance';

import * as NativeComponentRegistry from '../../NativeComponent/NativeComponentRegistry';
import codegenNativeCommands from '../../Utilities/codegenNativeCommands';
import {type ViewProps as Props} from './ViewPropTypes';

const ViewNativeComponent: HostComponent<Props> =
  NativeComponentRegistry.get<Props>('RCTView', () => ({
    uiViewClassName: 'RCTView',
  }));

interface NativeCommands {
  readonly focus: (viewRef: HostInstance) => void;
  readonly blur: (viewRef: HostInstance) => void;
  readonly hotspotUpdate: (viewRef: HostInstance, x: number, y: number) => void;
  readonly setPressed: (viewRef: HostInstance, pressed: boolean) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['focus', 'blur', 'hotspotUpdate', 'setPressed'],
});

/**
 * `ViewNativeComponent` is an internal React Native host component, and is
 * exported to provide lower-level access for libraries.
 *
 * @warning `<unstable_NativeView>` provides no semver guarantees and is not
 *   intended to be used in app code. Please use
 *   [`<View>`](https://reactnative.dev/docs/view) instead.
 */
// Additional note: Our long term plan is to reduce the overhead of the <Text>
// and <View> wrappers so that we no longer have any reason to export these APIs.
export default ViewNativeComponent;

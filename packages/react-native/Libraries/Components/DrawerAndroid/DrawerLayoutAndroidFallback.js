/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {
  MeasureInWindowOnSuccessCallback,
  MeasureLayoutOnSuccessCallback,
  MeasureOnSuccessCallback,
} from '../../../src/private/types/HostInstance';
import type {
  DrawerLayoutAndroidMethods,
  DrawerLayoutAndroidProps,
  DrawerLayoutAndroidState,
} from './DrawerLayoutAndroidTypes';

import UnimplementedView from '../UnimplementedViews/UnimplementedView';
import * as React from 'react';

export default class DrawerLayoutAndroid
  extends React.Component<DrawerLayoutAndroidProps, DrawerLayoutAndroidState>
  implements DrawerLayoutAndroidMethods
{
  render(): React.Node {
    return <UnimplementedView {...this.props} />;
  }

  openDrawer(): void {
    throw new Error('DrawerLayoutAndroid is only available on Android');
  }

  closeDrawer(): void {
    throw new Error('DrawerLayoutAndroid is only available on Android');
  }

  blur(): void {
    throw new Error('DrawerLayoutAndroid is only available on Android');
  }

  focus(): void {
    throw new Error('DrawerLayoutAndroid is only available on Android');
  }

  measure(callback: MeasureOnSuccessCallback): void {
    throw new Error('DrawerLayoutAndroid is only available on Android');
  }

  measureInWindow(callback: MeasureInWindowOnSuccessCallback): void {
    throw new Error('DrawerLayoutAndroid is only available on Android');
  }

  measureLayout(
    relativeToNativeNode: number,
    onSuccess: MeasureLayoutOnSuccessCallback,
    onFail?: () => void,
  ): void {
    throw new Error('DrawerLayoutAndroid is only available on Android');
  }

  setNativeProps(nativeProps: Object): void {
    throw new Error('DrawerLayoutAndroid is only available on Android');
  }
}

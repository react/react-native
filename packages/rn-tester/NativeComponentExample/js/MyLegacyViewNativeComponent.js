/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostComponent, ViewProps} from 'react-native';

import ReactFabric from '../../../react-native/Libraries/Renderer/shims/ReactFabric';
import * as React from 'react';
import {UIManager, requireNativeComponent} from 'react-native';

type ColorChangedEvent = {
  nativeEvent: {
    backgroundColor: {
      hue: number,
      saturation: number,
      brightness: number,
      alpha: number,
    },
  },
};

type NativeProps = Readonly<{
  ...ViewProps,
  opacity?: number,
  color?: string,
  onColorChanged?: (event: ColorChangedEvent) => void,
}>;

export type MyLegacyViewType = HostComponent<NativeProps>;

export function callNativeMethodToChangeBackgroundColor(
  viewRef: React.ElementRef<MyLegacyViewType> | null,
  color: string,
) {
  if (!viewRef) {
    console.log('viewRef is null');
    return;
  }
  const reactTag = ReactFabric.findNodeHandle<$FlowFixMe>(viewRef);
  if (reactTag == null) {
    console.log('reactTag is null');
    return;
  }
  UIManager.dispatchViewManagerCommand(
    reactTag,
    UIManager.getViewManagerConfig('RNTMyLegacyNativeView').Commands
      .changeBackgroundColor,
    [color],
  );
}

export function callNativeMethodToAddOverlays(
  viewRef: React.ElementRef<MyLegacyViewType> | null,
  overlayColors: ReadonlyArray<string>,
) {
  if (!viewRef) {
    console.log('viewRef is null');
    return;
  }
  const reactTag = ReactFabric.findNodeHandle<$FlowFixMe>(viewRef);
  if (reactTag == null) {
    console.log('reactTag is null');
    return;
  }

  UIManager.dispatchViewManagerCommand(
    reactTag,
    UIManager.getViewManagerConfig('RNTMyLegacyNativeView').Commands
      .addOverlays,
    [overlayColors],
  );
}

export function callNativeMethodToRemoveOverlays(
  viewRef: React.ElementRef<MyLegacyViewType> | null,
) {
  if (!viewRef) {
    console.log('viewRef is null');
    return;
  }
  const reactTag = ReactFabric.findNodeHandle<$FlowFixMe>(viewRef);
  if (reactTag == null) {
    console.log('reactTag is null');
    return;
  }

  UIManager.dispatchViewManagerCommand(
    reactTag,
    UIManager.getViewManagerConfig('RNTMyLegacyNativeView').Commands
      .removeOverlays,
    [],
  );
}

export default requireNativeComponent(
  'RNTMyLegacyNativeView',
) as HostComponent<NativeProps>;

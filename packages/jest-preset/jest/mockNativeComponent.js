/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {HostInstance} from 'react-native/src/private/types/HostInstance';

import * as React from 'react';
import {createElement} from 'react';

let nativeTag = 1;

type MockNativeComponent<TProps extends {...}> = component(
  ref?: ?React.RefSetter<HostInstance>,
  ...props: TProps
);

export default function mockNativeComponent<TProps extends {...}>(
  viewName: string,
): MockNativeComponent<TProps> {
  const Component = class extends React.Component<TProps> {
    _nativeTag: number = nativeTag++;

    render(): React.Node {
      // $FlowFixMe[not-a-function]
      // $FlowFixMe[prop-missing]
      return createElement(viewName, this.props, this.props.children);
    }

    // The methods that exist on host components
    blur: () => void = jest.fn();
    focus: () => void = jest.fn();
    measure: () => void = jest.fn();
    measureInWindow: () => void = jest.fn();
    measureLayout: () => void = jest.fn();
    setNativeProps: () => void = jest.fn();
    getBoundingClientRect: () => {
      x: number,
      y: number,
      width: number,
      height: number,
      top: number,
      left: number,
      right: number,
      bottom: number,
    } = jest.fn(function () {
      return {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      };
    });
  };

  if (viewName === 'RCTView') {
    Component.displayName = 'View';
  } else {
    Component.displayName = viewName;
  }

  // $FlowFixMe[incompatible-type] - Error supressed during the migration of HostInstance to ReactNativeElement
  return Component;
}

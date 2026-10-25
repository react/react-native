/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ViewProps} from 'react-native';

import MockNativeMethods from '../MockNativeMethods';
import * as React from 'react';
import {createElement} from 'react';

export default class View extends React.Component<ViewProps> {
  measure: typeof MockNativeMethods.measure = MockNativeMethods.measure;
  measureInWindow: typeof MockNativeMethods.measureInWindow =
    MockNativeMethods.measureInWindow;
  measureLayout: typeof MockNativeMethods.measureLayout =
    MockNativeMethods.measureLayout;
  setNativeProps: typeof MockNativeMethods.setNativeProps =
    MockNativeMethods.setNativeProps;
  focus: typeof MockNativeMethods.focus = MockNativeMethods.focus;
  blur: typeof MockNativeMethods.blur = MockNativeMethods.blur;

  render(): React.Node {
    // $FlowFixMe[not-a-function]
    return createElement('View', this.props, this.props.children);
  }
}

View.displayName = 'View';

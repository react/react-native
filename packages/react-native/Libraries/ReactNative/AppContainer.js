/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {ViewStyleProp} from '../StyleSheet/StyleSheet';
import type {RootTag} from './RootTag';

import * as React from 'react';

export type Props = Readonly<{
  children?: React.Node,
  rootTag: number | RootTag,
  initialProps?: {...},
  WrapperComponent?: ?React.ComponentType<any>,
  rootViewStyle?: ?ViewStyleProp,
  internal_excludeLogBox?: boolean,
  internal_excludeInspector?: boolean,
}>;

const AppContainer: component(...Props) = __DEV__
  ? require('./AppContainer-dev').default
  : require('./AppContainer-prod').default;

export default AppContainer;

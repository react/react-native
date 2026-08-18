/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {AnimatedProps} from '../createAnimatedComponent';

import FlatList, {type FlatListProps} from '../../Lists/FlatList';
import createAnimatedComponent from '../createAnimatedComponent';
import * as React from 'react';

const AnimatedFlatList: component<
  // $FlowExpectedError[unclear-type]
  ItemT = any,
>(
  ref?: React.RefSetter<FlatList<ItemT>>,
  ...props: AnimatedProps<FlatListProps<ItemT>>
) = createAnimatedComponent(FlatList) as $FlowFixMe;

export default AnimatedFlatList;

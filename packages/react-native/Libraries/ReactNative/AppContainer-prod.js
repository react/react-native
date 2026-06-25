/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Props} from './AppContainer';

import View from '../Components/View/View';
import StyleSheet from '../StyleSheet/StyleSheet';
import {RootTagContext, createRootTag} from './RootTag';
import * as React from 'react';

const AppContainer = ({
  children,
  initialProps,
  rootTag,
  WrapperComponent,
  rootViewStyle,
}: Props): React.Node => {
  let innerView = children;

  if (WrapperComponent != null) {
    innerView = (
      <WrapperComponent initialProps={initialProps}>
        {innerView}
      </WrapperComponent>
    );
  }

  return (
    <RootTagContext.Provider value={createRootTag(rootTag)}>
      <View style={rootViewStyle || styles.root} pointerEvents="box-none">
        {innerView}
      </View>
    </RootTagContext.Provider>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
});

export default AppContainer;

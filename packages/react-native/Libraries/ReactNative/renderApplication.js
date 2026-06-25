/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ViewStyleProp} from '../StyleSheet/StyleSheet';
import type {RootTag} from './RootTag';

import AppContainer from './AppContainer';
import DisplayMode, {type DisplayModeType} from './DisplayMode';
import getCachedComponentWithDebugName from './getCachedComponentWithDebugName';
import * as Renderer from './RendererProxy';
import {createRootTag} from './RootTag';
import invariant from 'invariant';
import * as React from 'react';

// require BackHandler so it sets the default handler that exits the app if no listeners respond
import '../Utilities/BackHandler';

type ActivityType = component(mode: 'visible' | 'hidden', children: React.Node);

export type RenderApplicationOptions<Props extends {...}> = {
  RootComponent: component(...Props),
  initialProps: Props,
  rootTag: number | RootTag,
  WrapperComponent?: ?component(initialProps: Props, children: React.Node),
  rootViewStyle?: ?ViewStyleProp,
  isLogBox?: boolean,
  debugName?: string,
  displayMode?: ?DisplayModeType,
  useOffscreen?: boolean,
};

export default function renderApplication<Props extends {...}>({
  RootComponent,
  initialProps,
  rootTag,
  WrapperComponent,
  rootViewStyle,
  isLogBox,
  debugName,
  displayMode,
  useOffscreen,
}: RenderApplicationOptions<Props>) {
  invariant(rootTag, 'Expect to have a valid rootTag, instead got %s', rootTag);

  let renderable: React.MixedElement = (
    <AppContainer
      rootTag={rootTag}
      WrapperComponent={WrapperComponent}
      rootViewStyle={rootViewStyle}
      initialProps={initialProps ?? Object.freeze({})}
      internal_excludeLogBox={isLogBox}>
      <RootComponent {...initialProps} rootTag={rootTag} />
    </AppContainer>
  );

  if (__DEV__ && debugName != null) {
    const RootComponentWithMeaningfulName = getCachedComponentWithDebugName(
      `${debugName}(RootComponent)`,
    );
    renderable = (
      <RootComponentWithMeaningfulName>
        {renderable}
      </RootComponentWithMeaningfulName>
    );
  }

  if (useOffscreen === true && displayMode != null) {
    // $FlowFixMe[incompatible-type]
    // $FlowFixMe[missing-export]
    // $FlowFixMe[prop-missing] `unstable_Activity` is not yet in the React types.
    const Activity: ActivityType = React.unstable_Activity;

    renderable = (
      <Activity
        mode={displayMode === DisplayMode.VISIBLE ? 'visible' : 'hidden'}>
        {renderable}
      </Activity>
    );
  }

  Renderer.renderElement({
    element: renderable,
    rootTag: createRootTag(rootTag),
  });
}

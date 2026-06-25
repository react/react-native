/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import measureRenderTime from '../../../../src/private/__tests__/utilities/measureRenderTime';
import ViewNativeComponent from '../ViewNativeComponent';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {View} from 'react-native';

let root;
let testViews: React.MixedElement;

const NUMBER_OF_VIEWS = 100;
const NUMBER_OF_ITERATIONS = 1000;

component Noop(children: React.Node, style?: unknown) {
  return children;
}

Noop.displayName = 'Noop';

Fantom.unstable_benchmark
  .suite('View vs. ViewNativeComponent', {minIterations: NUMBER_OF_ITERATIONS})
  .test.each(
    [Noop, ViewNativeComponent, View],
    Component =>
      `render ${NUMBER_OF_VIEWS} views (${Component.displayName ?? Component.name ?? 'ViewNativeComponent'})`,
    () => {
      return {
        overriddenDuration: measureRenderTime(root, testViews),
      };
    },
    Component => ({
      beforeAll: () => {
        let views: React.Node = null;
        for (let i = 0; i < NUMBER_OF_VIEWS; i++) {
          views = (
            <Component style={{width: i + 1, height: i + 1}}>{views}</Component>
          );
        }
        // $FlowExpectedError[incompatible-type]
        testViews = views;
      },
      beforeEach: () => {
        root = Fantom.createRoot();
      },
      afterEach: () => {
        root.destroy();
      },
    }),
  );

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags enableNativeEventTargetEventDispatching:*
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {HostInstance} from 'react-native';
import type {FnOptions} from 'tinybench';

import ensureInstance from '../../../../__tests__/utilities/ensureInstance';
import ReactNativeElement from '../ReactNativeElement';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {View} from 'react-native';

let root;
let node;

const commonOptions: FnOptions = {
  beforeAll: () => {
    root = Fantom.createRoot();

    const viewRef = React.createRef<HostInstance>();

    Fantom.runTask(() => {
      root.render(
        <View>
          <View />
          <View ref={viewRef}>
            <View />
          </View>
          <View />
        </View>,
      );
    });

    node = ensureInstance(viewRef.current, ReactNativeElement);
  },
  afterAll: () => {
    Fantom.runTask(() => root.destroy());
  },
};

Fantom.unstable_benchmark
  .suite('ReactNativeElement (traversal)', {
    minIterations: 100000,
  })
  .test('noop', () => {})
  .test(
    'parentNode',
    () => {
      node.parentNode;
    },
    commonOptions,
  )
  .test(
    'parentElement',
    () => {
      node.parentElement;
    },
    commonOptions,
  )
  .test(
    'childNodes',
    () => {
      node.childNodes;
    },
    commonOptions,
  )
  .test(
    'children',
    () => {
      node.children;
    },
    commonOptions,
  )
  .test(
    'firstChild',
    () => {
      node.firstChild;
    },
    commonOptions,
  )
  .test(
    'firstElementChild',
    () => {
      node.firstElementChild;
    },
    commonOptions,
  )
  .test(
    'lastChild',
    () => {
      node.lastChild;
    },
    commonOptions,
  )
  .test(
    'lastElementChild',
    () => {
      node.lastElementChild;
    },
    commonOptions,
  )
  .test(
    'childElementCount',
    () => {
      node.childElementCount;
    },
    commonOptions,
  )
  .test(
    'previousSibling',
    () => {
      node.previousSibling;
    },
    commonOptions,
  )
  .test(
    'previousElementSibling',
    () => {
      node.previousElementSibling;
    },
    commonOptions,
  )
  .test(
    'nextSibling',
    () => {
      node.nextSibling;
    },
    commonOptions,
  )
  .test(
    'nextElementSibling',
    () => {
      node.nextElementSibling;
    },
    commonOptions,
  )
  .test(
    'offsetParent',
    () => {
      node.offsetParent;
    },
    commonOptions,
  )
  .test(
    'isConnected',
    () => {
      node.isConnected;
    },
    commonOptions,
  )
  .test(
    'ownerDocument',
    () => {
      node.ownerDocument;
    },
    commonOptions,
  )
  .test(
    'getRootNode()',
    () => {
      node.getRootNode();
    },
    commonOptions,
  )
  .test(
    'hasChildNodes()',
    () => {
      node.hasChildNodes();
    },
    commonOptions,
  );

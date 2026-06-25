/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import BaseFlatListExample from './BaseFlatListExample';
import * as React from 'react';
import {useRef, useState} from 'react';

export component FlatList_onEndReached() {
  const [output, setOutput] = useState('');
  const exampleProps = {
    onEndReached: (info: {distanceFromEnd: number, ...}) =>
      setOutput('onEndReached'),
    onEndReachedThreshold: 0,
  };
  const ref = useRef<any>(null);

  const onTest = () => {
    const scrollResponder = ref?.current?.getScrollResponder();
    if (scrollResponder != null) {
      scrollResponder.scrollToEnd();
    }
  };

  return (
    <BaseFlatListExample
      ref={ref}
      exampleProps={exampleProps}
      testOutput={output}
      onTest={onTest}
    />
  );
}

export default {
  title: 'onEndReached',
  name: 'onEndReached',
  description:
    'Scroll to end of list or tap Test button to see `onEndReached` triggered.',
  render: function () {
    return <FlatList_onEndReached />;
  },
} as RNTesterModuleExample;

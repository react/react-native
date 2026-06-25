/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import BaseFlatListExample from './BaseFlatListExample';
import * as React from 'react';
import {useState} from 'react';

export component FlatList_inverted() {
  const [output, setOutput] = useState('inverted false');
  const [exampleProps, setExampleProps] = useState({
    inverted: false,
  });

  const onTest = () => {
    setExampleProps({
      inverted: !exampleProps.inverted,
    });
    setOutput(`Is inverted: ${(!exampleProps.inverted).toString()}`);
  };

  return (
    <BaseFlatListExample
      exampleProps={exampleProps}
      testOutput={output}
      onTest={onTest}
      testLabel={exampleProps.inverted ? 'Toggle false' : 'Toggle true'}
    />
  );
}

export default {
  title: 'Inverted',
  name: 'inverted',
  description: 'Test inverted prop on FlatList',
  render: () => <FlatList_inverted />,
} as RNTesterModuleExample;

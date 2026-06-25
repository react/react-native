/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import SectionListBaseExample from './SectionListBaseExample';
import * as React from 'react';
import {useState} from 'react';

export component SectionList_inverted() {
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
    <SectionListBaseExample
      exampleProps={exampleProps}
      testOutput={output}
      onTest={onTest}
      testLabel={exampleProps.inverted ? 'Toggle false' : 'Toggle true'}
    />
  );
}

export default {
  title: 'SectionList Inverted',
  name: 'inverted',
  render: function (): React.MixedElement {
    return <SectionList_inverted />;
  },
};

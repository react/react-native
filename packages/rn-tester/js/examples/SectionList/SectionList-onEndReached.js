/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import SectionListBaseExample from './SectionListBaseExample';
import * as React from 'react';
import {useRef, useState} from 'react';

export component SectionList_onEndReached() {
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
    <SectionListBaseExample
      ref={ref}
      exampleProps={exampleProps}
      testOutput={output}
      onTest={onTest}
    />
  );
}

export default {
  title: 'SectionList onEndReached',
  name: 'onEndReached',
  description: 'Test onEndReached behavior',
  render: function (): React.MixedElement {
    return <SectionList_onEndReached />;
  },
};

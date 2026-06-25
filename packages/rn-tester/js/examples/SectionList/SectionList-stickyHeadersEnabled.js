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

export component SectionList_stickySectionHeadersEnabled() {
  const [output, setOutput] = useState('stickySectionHeadersEnabled false');
  const [exampleProps, setExampleProps] = useState({
    stickySectionHeadersEnabled: false,
  });

  const onTest = () => {
    setExampleProps({
      stickySectionHeadersEnabled: !exampleProps.stickySectionHeadersEnabled,
    });
    setOutput(
      `stickySectionHeadersEnabled ${(!exampleProps.stickySectionHeadersEnabled).toString()}`,
    );
  };

  return (
    <SectionListBaseExample
      exampleProps={exampleProps}
      testOutput={output}
      onTest={onTest}
      testLabel={
        exampleProps.stickySectionHeadersEnabled ? 'Sticky Off' : 'Sticky On'
      }
    />
  );
}

export default {
  title: 'SectionList Sticky Headers Enabled',
  name: 'stickyHeadersEnabled',
  description: 'Toggle sticky headers on/off',
  render: function (): React.MixedElement {
    return <SectionList_stickySectionHeadersEnabled />;
  },
};

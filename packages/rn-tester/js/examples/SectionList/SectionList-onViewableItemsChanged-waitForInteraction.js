/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import {SectionList_BaseOnViewableItemsChanged} from './SectionList-BaseOnViewableItemsChanged';
import * as React from 'react';

export default {
  title: 'onViewableItemsChanged',
  name: 'onViewableItemsChanged-waitForInteraction',
  description: 'E2E Test:\nonViewableItemsChanged-waitForInteraction',
  hidden: true,
  render: function (): React.MixedElement {
    return (
      <SectionList_BaseOnViewableItemsChanged
        waitForInteraction={true}
        // Desserts section, Cheesecake item (see SectionListBaseExample DATA).
        scrollToLocationOnTest={{sectionIndex: 3, itemIndex: 0}}
      />
    );
  },
};

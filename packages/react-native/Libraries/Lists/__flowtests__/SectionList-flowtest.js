/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import SectionList from '../SectionList';
import * as React from 'react';

function renderMyListItem(info: {
  item: {title: string, ...},
  index: number,
  ...
}) {
  return <span />;
}

const renderMyHeader = ({
  section,
}: {
  section: {fooNumber: number, ...} & Object,
  ...
}) => <span />;

export function testGoodDataWithGoodItem(): React.Node {
  const sections = [
    {
      key: 'a',
      data: [
        {
          title: 'foo',
          key: 1,
        },
      ],
    },
  ];
  return <SectionList renderItem={renderMyListItem} sections={sections} />;
}

export function testBadRenderItemFunction(): ReadonlyArray<React.Node> {
  const sections = [
    {
      key: 'a',
      data: [
        {
          title: 'foo',
          key: 1,
        },
      ],
    },
  ];
  return [
    <SectionList
      // $FlowExpectedError[incompatible-type] - title should be inside `item`
      renderItem={(info: {title: string, ...}) => <span />}
      sections={sections}
    />,
    <SectionList
      // $FlowExpectedError[incompatible-type] - bad index type string, should be number
      // $FlowExpectedError[incompatible-exact]
      renderItem={(info: {index: string}) => <span />}
      sections={sections}
    />,
    // EverythingIsFine
    <SectionList
      renderItem={(info: {item: {title: string, ...}, ...}) => <span />}
      sections={sections}
    />,
  ];
}

export function testBadInheritedDefaultProp(): React.MixedElement {
  const sections: $FlowFixMe = [];
  return (
    <SectionList
      renderItem={renderMyListItem}
      sections={sections}
      // $FlowExpectedError[incompatible-type] - bad windowSize type "big"
      windowSize="big"
    />
  );
}

export function testMissingData(): React.MixedElement {
  // $FlowExpectedError[incompatible-type] - missing `sections` prop
  return <SectionList renderItem={renderMyListItem} />;
}

export function testBadSectionsShape(): React.MixedElement {
  const sections = [
    {
      key: 'a',
      items: [
        {
          title: 'foo',
          key: 1,
        },
      ],
    },
  ];
  return <SectionList renderItem={renderMyListItem} sections={sections} />;
}

export function testBadSectionsMetadata(): React.MixedElement {
  const sections = [
    {
      key: 'a',
      fooNumber: 'string',
      data: [
        {
          title: 'foo',
          key: 1,
        },
      ],
    },
  ];
  return (
    <SectionList
      renderSectionHeader={renderMyHeader}
      renderItem={renderMyListItem}
      /* $FlowExpectedError[incompatible-type] - section has bad meta data `fooNumber` field of
       * type string */
      sections={sections}
    />
  );
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const FlatList = require('../FlatList').default;
const React = require('react');

function renderMyListItem(info: {
  item: {title: string, ...},
  index: number,
  ...
}) {
  return <span />;
}

export function testEverythingIsFine(): React.Node {
  const data = [
    {
      title: 'Title Text',
      key: 1,
    },
  ];
  return <FlatList renderItem={renderMyListItem} data={data} />;
}

export function testBadDataWithTypicalItem(): React.Node {
  const data = [
    {
      title: 6,
      key: 1,
    },
  ];
  // $FlowExpectedError[incompatible-type] - bad title type 6, should be string
  return <FlatList renderItem={renderMyListItem} data={data} />;
}

export function testMissingFieldWithTypicalItem(): React.Node {
  const data = [
    {
      key: 1,
    },
  ];
  // $FlowExpectedError[incompatible-type] - missing title
  return <FlatList renderItem={renderMyListItem} data={data} />;
}

export function testGoodDataWithBadCustomRenderItemFunction(): React.Node {
  const data = [
    {
      widget: 6,
      key: 1,
    },
  ];
  return (
    <FlatList
      renderItem={info => (
        <span>
          {
            // $FlowExpectedError[prop-missing] - bad widgetCount type 6, should be Object
            info.item.widget.missingProp
          }
        </span>
      )}
      data={data}
    />
  );
}

export function testBadRenderItemFunction(): ReadonlyArray<React.Node> {
  const data = [
    {
      title: 'foo',
      key: 1,
    },
  ];
  return [
    // $FlowExpectedError[incompatible-type] - title should be inside `item`
    // $FlowExpectedError[incompatible-exact]
    <FlatList renderItem={(info: {title: string}) => <span />} data={data} />,
    <FlatList
      // $FlowExpectedError[incompatible-type] - bad index type string, should be number
      // $FlowExpectedError[incompatible-exact]
      // $FlowExpectedError[unclear-type]
      renderItem={(info: {item: any, index: string}) => <span />}
      data={data}
    />,
    <FlatList
      // $FlowExpectedError[incompatible-type] - bad index type string, should be number
      // $FlowExpectedError[incompatible-exact]
      renderItem={(info: {item: {title: number}}) => <span />}
      // $FlowExpectedError[incompatible-type] - bad title type number, should be string
      data={data}
    />,
    // EverythingIsFine
    <FlatList
      // $FlowExpectedError[incompatible-type] - bad title type number, should be string
      renderItem={(info: {item: {title: string, ...}, ...}) => <span />}
      data={data}
    />,
  ];
}

export function testOtherBadProps(): ReadonlyArray<React.Node> {
  return [
    // $FlowExpectedError[incompatible-type] - bad numColumns type "lots"
    <FlatList renderItem={renderMyListItem} data={[]} numColumns="lots" />,
    // $FlowExpectedError[incompatible-type] - bad windowSize type "big"
    <FlatList renderItem={renderMyListItem} data={[]} windowSize="big" />,
    // $FlowExpectedError[incompatible-type] - missing `data` prop
    <FlatList renderItem={renderMyListItem} />,
  ];
}

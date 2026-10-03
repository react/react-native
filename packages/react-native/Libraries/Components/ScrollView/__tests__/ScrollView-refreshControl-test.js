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

import * as React from 'react';

const flattenStyle = require('../../../StyleSheet/flattenStyle').default;
const RefreshControl = require('../../RefreshControl/RefreshControl').default;
const ScrollView = require('../ScrollView').default;
const ReactTestRenderer = require('react-test-renderer');

// This test is about the element tree `ScrollView.render()` builds, so the
// default component mocks have to be turned off.
jest.unmock('react-native/Libraries/Components/ScrollView/ScrollView');
jest.unmock('react-native/Libraries/Components/RefreshControl/RefreshControl');
// On Android a `ScrollView` with a `RefreshControl` is wrapped in an
// `AndroidSwipeRefreshLayout`, and `style` is split across the two nodes.
jest.mock('../../../Utilities/Platform', () =>
  // $FlowFixMe[missing-platform-support]
  require('../../../Utilities/Platform.android'),
);

async function renderScrollView(style: $FlowFixMe): Promise<$FlowFixMe> {
  let testRenderer: $FlowFixMe = null;
  await ReactTestRenderer.act(() => {
    testRenderer = ReactTestRenderer.create(
      <ScrollView
        style={style}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => {}} />
        }
      />,
    );
  });
  return testRenderer.toJSON();
}

describe('ScrollView with a RefreshControl on Android', () => {
  it('applies zIndex to the wrapper, not to the inner ScrollView', async () => {
    const wrapper = await renderScrollView({zIndex: 7});

    // `zIndex` has to reach the wrapper: that is the node parented by the
    // user's view, and on Android z-ordering is applied by the parent.
    expect(wrapper.type).toBe('AndroidSwipeRefreshLayout');
    expect(flattenStyle(wrapper.props.style)?.zIndex).toBe(7);

    // The inner scroll view is an only child, so a `zIndex` left here could
    // never affect stacking.
    const scrollView = wrapper.children[0];
    expect(scrollView.type).toBe('RCTScrollView');
    expect(flattenStyle(scrollView.props.style)?.zIndex).toBeUndefined();
  });

  it('keeps non-layout style on the inner ScrollView', async () => {
    const wrapper = await renderScrollView({backgroundColor: 'red'});

    expect(flattenStyle(wrapper.props.style)?.backgroundColor).toBeUndefined();
    expect(flattenStyle(wrapper.children[0].props.style)?.backgroundColor).toBe(
      'red',
    );
  });
});

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @format
 */

import CellRenderer from '../VirtualizedListCellRenderer';
import * as React from 'react';
import {Fragment} from 'react';
import {act, create} from 'react-test-renderer';
import {StyleSheet, View} from 'react-native';

function getFlattenedZIndex(style) {
  if (style == null) {
    return undefined;
  }
  return StyleSheet.flatten(style)?.zIndex;
}

function findCellWrapperViews(root) {
  return root.findAll(
    node =>
      node.type === View &&
      typeof node.props.onFocusCapture === 'function',
  );
}

function renderCellRenderer(renderItem, extraProps = {}) {
  let component;
  act(() => {
    component = create(
      <CellRenderer
        cellKey="cell-0"
        index={0}
        item={{id: 'item-0'}}
        horizontal={false}
        inversionStyle={null}
        onUnmount={() => {}}
        onUpdateSeparators={() => {}}
        renderItem={renderItem}
        {...extraProps}
      />,
    );
  });
  return component;
}

describe('VirtualizedListCellRenderer zIndex', () => {
  it('lifts zIndex from renderItem root View onto the cell wrapper', () => {
    const component = renderCellRenderer(() => (
      <View style={{zIndex: 10}} testID="list-item" />
    ));

    const cellWrappers = findCellWrapperViews(component.root);
    expect(cellWrappers).toHaveLength(1);
    expect(getFlattenedZIndex(cellWrappers[0].props.style)).toBe(10);
  });

  it('lifts zIndex from style arrays on the renderItem root View', () => {
    const component = renderCellRenderer(() => (
      <View style={[{backgroundColor: 'red'}, {zIndex: 5}]} testID="list-item" />
    ));

    const cellWrappers = findCellWrapperViews(component.root);
    expect(getFlattenedZIndex(cellWrappers[0].props.style)).toBe(5);
  });

  it('lifts the maximum zIndex from Fragment children', () => {
    const component = renderCellRenderer(() => (
      <Fragment>
        <View style={{zIndex: 2}} />
        <View style={{zIndex: 7}} />
      </Fragment>
    ));

    const cellWrappers = findCellWrapperViews(component.root);
    expect(getFlattenedZIndex(cellWrappers[0].props.style)).toBe(7);
  });

  it('does not add zIndex to the cell wrapper when renderItem has none', () => {
    const component = renderCellRenderer(() => (
      <View style={{backgroundColor: 'blue'}} testID="list-item" />
    ));

    const cellWrappers = findCellWrapperViews(component.root);
    expect(getFlattenedZIndex(cellWrappers[0].props.style)).toBeUndefined();
  });

  it('passes lifted zIndex to CellRendererComponent style prop', () => {
    function CustomCellRenderer({children, style}) {
      return (
        <View testID="custom-cell" style={style}>
          {children}
        </View>
      );
    }

    const component = renderCellRenderer(
      () => <View style={{zIndex: 42}} />,
      {CellRendererComponent: CustomCellRenderer},
    );

    const customCell = component.root.findByProps({testID: 'custom-cell'});
    expect(getFlattenedZIndex(customCell.props.style)).toBe(42);
  });
});

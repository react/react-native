/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {CellRendererProps, ListRenderItem} from './VirtualizedListProps';
import type {
  FocusEvent,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle,
} from 'react-native';

import {VirtualizedListCellContextProvider} from './VirtualizedListContext.js';
import invariant from 'invariant';
import * as React from 'react';
import {isValidElement} from 'react';
import {StyleSheet, View} from 'react-native';

export type Props<ItemT> = {
  CellRendererComponent?: ?React.ComponentType<CellRendererProps<ItemT>>,
  ItemSeparatorComponent?: ?(
    | React.ComponentType<any | {highlighted: boolean, leadingItem: ?ItemT}>
    | React.MixedElement
  ),
  ListItemComponent?: ?(React.ComponentType<any> | React.MixedElement),
  cellKey: string,
  horizontal: ?boolean,
  index: number,
  inversionStyle: StyleProp<ViewStyle>,
  item: ItemT,
  onCellLayout?: (
    event: LayoutChangeEvent,
    cellKey: string,
    index: number,
  ) => void,
  onCellFocusCapture?: (cellKey: string) => void,
  onUnmount: (cellKey: string) => void,
  onUpdateSeparators: (
    cellKeys: Array<?string>,
    props: Partial<SeparatorProps<ItemT>>,
  ) => void,
  prevCellKey: ?string,
  renderItem?: ?ListRenderItem<ItemT>,
  ...
};

type SeparatorProps<ItemT> = Readonly<{
  highlighted: boolean,
  leadingItem: ?ItemT,
}>;

type State<ItemT> = {
  separatorProps: SeparatorProps<ItemT>,
  ...
};

export default class CellRenderer<ItemT> extends React.PureComponent<
  Props<ItemT>,
  State<ItemT>,
> {
  state: State<ItemT> = {
    separatorProps: {
      highlighted: false,
      leadingItem: this.props.item,
    },
  };

  static getDerivedStateFromProps<StaticItemT>(
    props: Props<StaticItemT>,
    prevState: State<StaticItemT>,
  ): ?State<StaticItemT> {
    if (props.item !== prevState.separatorProps.leadingItem) {
      return {
        separatorProps: {
          ...prevState.separatorProps,
          leadingItem: props.item,
        },
      };
    }
    return null;
  }

  // TODO: consider factoring separator stuff out of VirtualizedList into FlatList since it's not
  // reused by SectionList and we can keep VirtualizedList simpler.
  // $FlowFixMe[missing-local-annot]
  _separators = {
    highlight: () => {
      const {cellKey, prevCellKey} = this.props;
      this.props.onUpdateSeparators([cellKey, prevCellKey], {
        highlighted: true,
      });
    },
    unhighlight: () => {
      const {cellKey, prevCellKey} = this.props;
      this.props.onUpdateSeparators([cellKey, prevCellKey], {
        highlighted: false,
      });
    },
    updateProps: (
      select: 'leading' | 'trailing',
      newProps: SeparatorProps<ItemT>,
    ) => {
      const {cellKey, prevCellKey} = this.props;
      this.props.onUpdateSeparators(
        [select === 'leading' ? prevCellKey : cellKey],
        newProps,
      );
    },
  };

  updateSeparatorProps(newProps: SeparatorProps<ItemT>) {
    this.setState(state => ({
      separatorProps: {...state.separatorProps, ...newProps},
    }));
  }

  componentWillUnmount() {
    this.props.onUnmount(this.props.cellKey);
  }

  _onLayout = (nativeEvent: LayoutChangeEvent): void => {
    this.props.onCellLayout?.(
      nativeEvent,
      this.props.cellKey,
      this.props.index,
    );
  };

  _onCellFocusCapture = (e: FocusEvent): void => {
    this.props.onCellFocusCapture?.(this.props.cellKey);
  };

  _renderElement(
    renderItem: ?ListRenderItem<ItemT>,
    ListItemComponent: any,
    item: ItemT,
    index: number,
  ): React.Node {
    if (renderItem && ListItemComponent) {
      console.warn(
        'VirtualizedList: Both ListItemComponent and renderItem props are present. ListItemComponent will take' +
          ' precedence over renderItem.',
      );
    }

    if (ListItemComponent) {
      return (
        <ListItemComponent
          item={item}
          index={index}
          separators={this._separators}
        />
      );
    }

    if (renderItem) {
      return renderItem({
        item,
        index,
        separators: this._separators,
      });
    }

    invariant(
      false,
      'VirtualizedList: Either ListItemComponent or renderItem props are required but none were found.',
    );
  }

  render(): React.Node {
    const {
      CellRendererComponent,
      ItemSeparatorComponent,
      ListItemComponent,
      cellKey,
      horizontal,
      item,
      index,
      inversionStyle,
      onCellLayout,
      renderItem,
    } = this.props;
    const element = this._renderElement(
      renderItem,
      ListItemComponent,
      item,
      index,
    );

    // NOTE: that when this is a sticky header, `onLayout` will get automatically extracted and
    // called explicitly by `ScrollViewStickyHeader`.
    const itemSeparator: React.Node = isValidElement(ItemSeparatorComponent)
      ? // $FlowFixMe[incompatible-type]
        ItemSeparatorComponent
      : // $FlowFixMe[incompatible-type]
        ItemSeparatorComponent && (
          // $FlowFixMe[incompatible-type]
          // $FlowFixMe[not-a-component]
          <ItemSeparatorComponent {...this.state.separatorProps} />
        );
    const cellStyle = inversionStyle
      ? horizontal
        ? [styles.rowReverse, inversionStyle]
        : [styles.columnReverse, inversionStyle]
      : horizontal
        ? [styles.row, inversionStyle]
        : inversionStyle;
    const result = !CellRendererComponent ? (
      <View
        style={cellStyle}
        onFocusCapture={this._onCellFocusCapture}
        {...(onCellLayout && {onLayout: this._onLayout})}>
        {element}
        {itemSeparator}
      </View>
    ) : (
      <CellRendererComponent
        cellKey={cellKey}
        index={index}
        item={item}
        style={cellStyle}
        onFocusCapture={this._onCellFocusCapture}
        {...(onCellLayout && {onLayout: this._onLayout})}>
        {element}
        {itemSeparator}
      </CellRendererComponent>
    );

    return (
      <VirtualizedListCellContextProvider cellKey={this.props.cellKey}>
        {result}
      </VirtualizedListCellContextProvider>
    );
  }
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  columnReverse: {
    flexDirection: 'column-reverse',
  },
});

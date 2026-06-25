/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {Item} from '../../components/ListExampleShared';
import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import type {FlatList, ListRenderItemInfo} from 'react-native';

import {
  FooterComponent,
  HeaderComponent,
  ItemComponent,
  ItemSeparatorComponent,
  ListEmptyComponent,
  LoadingComponent,
  PlainInput,
  SeparatorComponent,
  Spindicator,
  genNewerItems,
  genOlderItems,
  getItemLayout,
  pressItem,
  renderSmallSwitchOption,
} from '../../components/ListExampleShared';
import RNTesterPage from '../../components/RNTesterPage';
import * as React from 'react';
import {
  Alert,
  Animated,
  I18nManager,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

const PAGE_SIZE = 100;
const NUM_PAGES = 10;
const INITIAL_PAGE_OFFSET = Math.floor(NUM_PAGES / 2);
const LOAD_TIME = 2000;

const VIEWABILITY_CONFIG = {
  minimumViewTime: 3000,
  viewAreaCoveragePercentThreshold: 100,
  waitForInteraction: true,
};

type Props = Readonly<{}>;
type State = {
  data: Array<Item>,
  first: number,
  last: number,
  debug: boolean,
  horizontal: boolean,
  inverted: boolean,
  filterText: string,
  fixedHeight: boolean,
  logViewable: boolean,
  virtualized: boolean,
  empty: boolean,
  useFlatListItemComponent: boolean,
  fadingEdgeLength: number,
  onPressDisabled: boolean,
  textSelectable: boolean,
  isRTL: boolean,
  maintainVisibleContentPosition: boolean,
  previousLoading: boolean,
  nextLoading: boolean,
};

const IS_RTL = I18nManager.isRTL;

class FlatListExample extends React.PureComponent<Props, State> {
  state: State = {
    data: genNewerItems(PAGE_SIZE, PAGE_SIZE * INITIAL_PAGE_OFFSET),
    first: PAGE_SIZE * INITIAL_PAGE_OFFSET,
    last: PAGE_SIZE + PAGE_SIZE * INITIAL_PAGE_OFFSET,
    debug: false,
    horizontal: false,
    inverted: false,
    filterText: '',
    fixedHeight: true,
    logViewable: false,
    virtualized: true,
    empty: false,
    useFlatListItemComponent: false,
    fadingEdgeLength: 0,
    onPressDisabled: false,
    textSelectable: true,
    isRTL: IS_RTL,
    maintainVisibleContentPosition: true,
    previousLoading: false,
    nextLoading: false,
  };

  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  _onChangeFilterText = filterText => {
    this.setState({filterText});
  };

  _onChangeScrollToIndex = (text: unknown) => {
    this._listRef?.scrollToIndex({viewPosition: 0.5, index: Number(text)});
  };

  // $FlowFixMe[missing-local-annot]
  _scrollPos = new Animated.Value(0);
  // $FlowFixMe[missing-local-annot]
  _scrollSinkX = Animated.event(
    [{nativeEvent: {contentOffset: {x: this._scrollPos}}}],
    {useNativeDriver: true},
  );
  // $FlowFixMe[missing-local-annot]
  _scrollSinkY = Animated.event(
    [{nativeEvent: {contentOffset: {y: this._scrollPos}}}],
    {useNativeDriver: true},
  );

  componentDidUpdate() {
    this._listRef?.recordInteraction(); // e.g. flipping logViewable switch
  }

  _setBooleanValue: string => boolean => void = key => value =>
    // $FlowFixMe[incompatible-type]
    this.setState({[key]: value});

  _setIsRTL: boolean => void = value => {
    I18nManager.forceRTL(value);
    this.setState({isRTL: value});
    Alert.alert(
      'Reload this page',
      'Please reload this page to change the UI direction! ' +
        'All examples in this app will be affected. ' +
        'Check them out to see what they look like in RTL layout.',
    );
  };

  render(): React.Node {
    const filterRegex = new RegExp(String(this.state.filterText), 'i');
    const filter = (item: Item) =>
      filterRegex.test(item.text) || filterRegex.test(item.title);
    const filteredData = this.state.data.filter(filter);
    const flatListItemRendererProps = this._renderItemComponent();
    return (
      <RNTesterPage noScroll={true} title="Simple list of items">
        <View style={styles.container}>
          <View style={styles.searchRow}>
            <View style={styles.options}>
              <PlainInput
                testID="search_bar_flat_list"
                onChangeText={this._onChangeFilterText}
                placeholder="Search..."
                value={this.state.filterText}
              />
              <PlainInput
                onChangeText={this._onChangeScrollToIndex}
                placeholder="scrollToIndex..."
              />
            </View>
            <View style={styles.options}>
              {renderSmallSwitchOption(
                'Virtualized',
                this.state.virtualized,
                this._setBooleanValue('virtualized'),
              )}
              {renderSmallSwitchOption(
                'Horizontal',
                this.state.horizontal,
                this._setBooleanValue('horizontal'),
              )}
              {renderSmallSwitchOption(
                'Fixed Height',
                this.state.fixedHeight,
                this._setBooleanValue('fixedHeight'),
              )}
              {renderSmallSwitchOption(
                'Log Viewable',
                this.state.logViewable,
                this._setBooleanValue('logViewable'),
              )}
              {renderSmallSwitchOption(
                'Inverted',
                this.state.inverted,
                this._setBooleanValue('inverted'),
              )}
              {renderSmallSwitchOption(
                'Empty',
                this.state.empty,
                this._setBooleanValue('empty'),
                'switch_empty_option',
              )}
              {renderSmallSwitchOption(
                'Debug',
                this.state.debug,
                this._setBooleanValue('debug'),
              )}
              {renderSmallSwitchOption(
                'onPress Disabled',
                this.state.onPressDisabled,
                this._setBooleanValue('onPressDisabled'),
              )}
              {renderSmallSwitchOption(
                'Text Selectable',
                this.state.textSelectable,
                this._setBooleanValue('textSelectable'),
              )}
              {renderSmallSwitchOption(
                'Use FlatListItemComponent',
                this.state.useFlatListItemComponent,
                this._setBooleanValue('useFlatListItemComponent'),
              )}
              {renderSmallSwitchOption(
                'Is RTL',
                this.state.isRTL,
                this._setIsRTL,
              )}
              {renderSmallSwitchOption(
                'Maintain content position',
                this.state.maintainVisibleContentPosition,
                this._setBooleanValue('maintainVisibleContentPosition'),
              )}
              {Platform.OS === 'android' && (
                <View>
                  <TextInput
                    placeholder="Fading edge length"
                    underlineColorAndroid="black"
                    keyboardType={'numeric'}
                    onChange={event =>
                      this.setState({
                        fadingEdgeLength: Number(event.nativeEvent.text),
                      })
                    }
                  />
                </View>
              )}
              <Spindicator value={this._scrollPos} />
            </View>
          </View>
          <SeparatorComponent />
          <Animated.FlatList
            fadingEdgeLength={this.state.fadingEdgeLength}
            ItemSeparatorComponent={
              this.state.horizontal ? null : ItemSeparatorComponent
            }
            ListHeaderComponent={
              this.state.previousLoading ? LoadingComponent : HeaderComponent
            }
            ListFooterComponent={
              this.state.nextLoading ? LoadingComponent : FooterComponent
            }
            ListEmptyComponent={ListEmptyComponent}
            // $FlowFixMe[missing-empty-array-annot]
            data={this.state.empty ? [] : filteredData}
            debug={this.state.debug}
            disableVirtualization={!this.state.virtualized}
            getItemLayout={
              this.state.fixedHeight ? this._getItemLayout : undefined
            }
            accessibilityRole="list"
            horizontal={this.state.horizontal}
            inverted={this.state.inverted}
            key={
              (this.state.horizontal ? 'h' : 'v') +
              (this.state.fixedHeight ? 'f' : 'd')
            }
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
            numColumns={1}
            onStartReached={this._onStartReached}
            initialScrollIndex={Math.floor(PAGE_SIZE / 2)}
            onEndReached={this._onEndReached}
            onRefresh={this._onRefresh}
            onScroll={
              this.state.horizontal ? this._scrollSinkX : this._scrollSinkY
            }
            onScrollToIndexFailed={this._onScrollToIndexFailed}
            onViewableItemsChanged={this._onViewableItemsChanged}
            ref={this._captureRef}
            refreshing={false}
            contentContainerStyle={styles.list}
            viewabilityConfig={VIEWABILITY_CONFIG}
            maintainVisibleContentPosition={
              this.state.maintainVisibleContentPosition
                ? {minIndexForVisible: 0}
                : undefined
            }
            {...flatListItemRendererProps}
          />
        </View>
      </RNTesterPage>
    );
  }
  _captureRef = (ref: FlatList<unknown> | null) => {
    this._listRef = ref;
  };
  // $FlowFixMe[missing-local-annot]
  _getItemLayout = (data: any, index: number) => {
    return getItemLayout(data, index, this.state.horizontal);
  };
  _onStartReached = () => {
    if (
      this.state.empty ||
      this.state.first <= 0 ||
      this.state.previousLoading
    ) {
      return;
    }

    this.setState({previousLoading: true});
    setTimeout(() => {
      this.setState(state => ({
        previousLoading: false,
        data: genOlderItems(PAGE_SIZE, state.first).concat(state.data),
        first: state.first - PAGE_SIZE,
      }));
    }, LOAD_TIME);
  };
  _onEndReached = () => {
    if (
      this.state.empty ||
      this.state.last >= PAGE_SIZE * NUM_PAGES ||
      this.state.nextLoading
    ) {
      return;
    }

    this.setState({nextLoading: true});
    setTimeout(() => {
      this.setState(state => ({
        nextLoading: false,
        data: state.data.concat(genNewerItems(PAGE_SIZE, state.last)),
        last: state.last + PAGE_SIZE,
      }));
    }, LOAD_TIME);
  };
  // $FlowFixMe[missing-local-annot]
  _onPressCallback = () => {
    const {onPressDisabled} = this.state;
    const warning = () => console.log('onPress disabled');
    const onPressAction = onPressDisabled ? warning : this._pressItem;
    return onPressAction;
  };
  // $FlowFixMe[missing-local-annot]
  _onRefresh = () => Alert.alert('onRefresh: nothing to refresh :P');
  // $FlowFixMe[missing-local-annot]
  _renderItemComponent = () => {
    const renderProp = ({item, separators}: ListRenderItemInfo<Item>) => {
      return (
        <ItemComponent
          testID={`item_${item.key}`}
          item={item}
          horizontal={this.state.horizontal}
          fixedHeight={this.state.fixedHeight}
          onPress={this._onPressCallback()}
          onShowUnderlay={separators.highlight}
          onHideUnderlay={separators.unhighlight}
          textSelectable={this.state.textSelectable}
        />
      );
    };
    return this.state.useFlatListItemComponent
      ? {
          renderItem: undefined,
          ListItemComponent: renderProp,
        }
      : {renderItem: renderProp};
  };

  _onScrollToIndexFailed = ({
    index,
    highestMeasuredFrameIndex,
  }: {
    index: number,
    highestMeasuredFrameIndex: number,
  }) => {
    console.warn(
      `failed to scroll to index: ${index} (measured up to ${highestMeasuredFrameIndex})`,
    );
  };

  // This is called when items change viewability by scrolling into or out of
  // the viewable area.
  _onViewableItemsChanged = (info: {
    changed: Array<{
      key: string,
      isViewable: boolean,
      item: any,
      index: ?number,
      section?: any,
      ...
    }>,
    ...
  }) => {
    // Impressions can be logged here
    if (this.state.logViewable) {
      console.log(
        'onViewableItemsChanged: ',
        info.changed.map(v => ({...v, item: '...'})),
      );
    }
  };

  _pressItem = (key: string) => {
    this._listRef?.recordInteraction();
    const index = this.state.data.findIndex(item => item.key === key);
    const itemState = pressItem(this.state.data[index]);
    this.setState(state => ({
      ...state,
      data: [
        ...state.data.slice(0, index),
        itemState,
        ...state.data.slice(index + 1),
      ],
    }));
  };

  _listRef: FlatList<unknown> | null;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgb(239, 239, 244)',
    flex: 1,
  },
  list: {
    backgroundColor: 'white',
    flexGrow: 1,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchRow: {
    paddingHorizontal: 10,
  },
});

export default {
  title: 'Basic',
  name: 'basic',
  description: 'Simple list of items',
  render: () => <FlatListExample />,
} as RNTesterModuleExample;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {ScrollViewInstance} from '../Components/ScrollView/ScrollView';
import type {ViewStyleProp} from '../StyleSheet/StyleSheet';
import type {
  ListRenderItem,
  ListRenderItemInfo,
  ListViewToken,
  ViewabilityConfigCallbackPair,
  VirtualizedListProps,
} from '@react-native/virtualized-lists';

import * as ReactNativeFeatureFlags from '../../src/private/featureflags/ReactNativeFeatureFlags';
import {type ScrollResponderType} from '../Components/ScrollView/ScrollView';
import View from '../Components/View/View';
import VirtualizedLists from '@react-native/virtualized-lists';
import memoizeOne from 'memoize-one';
import * as React from 'react';

const StyleSheet = require('../StyleSheet/StyleSheet').default;
const deepDiffer = require('../Utilities/differ/deepDiffer').default;
const Platform = require('../Utilities/Platform').default;
const invariant = require('invariant');

const VirtualizedList = VirtualizedLists.VirtualizedList;
const defaultKeyExtractor = VirtualizedLists.keyExtractor;

type RequiredFlatListProps<ItemT> = {
  /**
   * An array (or array-like list) of items to render. Other data types can be
   * used by targeting VirtualizedList directly.
   */
  data: ?Readonly<$ArrayLike<ItemT>>,
};
type OptionalFlatListProps<ItemT> = {
  /**
   * Takes an item from `data` and renders it into the list. Example usage:
   *
   *     <FlatList
   *       ItemSeparatorComponent={Platform.OS !== 'android' && ({highlighted}) => (
   *         <View style={[style.separator, highlighted && {marginLeft: 0}]} />
   *       )}
   *       data={[{title: 'Title Text', key: 'item1'}]}
   *       renderItem={({item, separators}) => (
   *         <TouchableHighlight
   *           onPress={() => this._onPress(item)}
   *           onShowUnderlay={separators.highlight}
   *           onHideUnderlay={separators.unhighlight}>
   *           <View style={{backgroundColor: 'white'}}>
   *             <Text>{item.title}</Text>
   *           </View>
   *         </TouchableHighlight>
   *       )}
   *     />
   *
   * Provides additional metadata like `index` if you need it, as well as a more generic
   * `separators.updateProps` function which let's you set whatever props you want to change the
   * rendering of either the leading separator or trailing separator in case the more common
   * `highlight` and `unhighlight` (which set the `highlighted: boolean` prop) are insufficient for
   * your use-case.
   */
  renderItem?: ?ListRenderItem<ItemT>,

  /**
   * Optional custom style for multi-item rows generated when numColumns > 1.
   */
  columnWrapperStyle?: ViewStyleProp,
  /**
   * A marker property for telling the list to re-render (since it implements `PureComponent`). If
   * any of your `renderItem`, Header, Footer, etc. functions depend on anything outside of the
   * `data` prop, stick it here and treat it immutably.
   */
  extraData?: any,
  /**
   * `getItemLayout` is an optional optimizations that let us skip measurement of dynamic content if
   * you know the height of items a priori. `getItemLayout` is the most efficient, and is easy to
   * use if you have fixed height items, for example:
   *
   *     getItemLayout={(data, index) => (
   *       {length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index}
   *     )}
   *
   * Adding `getItemLayout` can be a great performance boost for lists of several hundred items.
   * Remember to include separator length (height or width) in your offset calculation if you
   * specify `ItemSeparatorComponent`.
   */
  getItemLayout?: (
    data: ?Readonly<$ArrayLike<ItemT>>,
    index: number,
  ) => {
    length: number,
    offset: number,
    index: number,
    ...
  },
  /**
   * If true, renders items next to each other horizontally instead of stacked vertically.
   */
  horizontal?: ?boolean,
  /**
   * How many items to render in the initial batch. This should be enough to fill the screen but not
   * much more. Note these items will never be unmounted as part of the windowed rendering in order
   * to improve perceived performance of scroll-to-top actions.
   */
  initialNumToRender?: ?number,
  /**
   * Instead of starting at the top with the first item, start at `initialScrollIndex`. This
   * disables the "scroll to top" optimization that keeps the first `initialNumToRender` items
   * always rendered and immediately renders the items starting at this initial index. Requires
   * `getItemLayout` to be implemented.
   */
  initialScrollIndex?: ?number,
  /**
   * Reverses the direction of scroll. Uses scale transforms of -1.
   */
  inverted?: ?boolean,
  /**
   * Used to extract a unique key for a given item at the specified index. Key is used for caching
   * and as the react key to track item re-ordering. The default extractor checks `item.key`, then
   * falls back to using the index, like React does.
   */
  keyExtractor?: ?(item: ItemT, index: number) => string,
  /**
   * Multiple columns can only be rendered with `horizontal={false}` and will zig-zag like a
   * `flexWrap` layout. Items should all be the same height - masonry layouts are not supported.
   *
   * The default value is 1.
   */
  numColumns?: number,
  /**
   * Note: may have bugs (missing content) in some circumstances - use at your own risk.
   *
   * This may improve scroll performance for large lists.
   *
   * The default value is true for Android.
   */
  removeClippedSubviews?: boolean,
  /**
   * See `ScrollView` for flow type and further documentation.
   */
  fadingEdgeLength?: ?number | {start: number, end: number},
  /**
   * Enable an optimization to memoize the item renderer to prevent unnecessary rerenders.
   */
  strictMode?: boolean,
};

/**
 * Default Props Helper Functions
 * Use the following helper functions for default values
 */

// removeClippedSubviewsOrDefault(this.props.removeClippedSubviews)
function removeClippedSubviewsOrDefault(removeClippedSubviews: ?boolean) {
  if (ReactNativeFeatureFlags.shouldUseRemoveClippedSubviewsAsDefaultOnIOS()) {
    return removeClippedSubviews ?? true;
  } else {
    return removeClippedSubviews ?? Platform.OS === 'android';
  }
}

// numColumnsOrDefault(this.props.numColumns)
function numColumnsOrDefault(numColumns: ?number) {
  return numColumns ?? 1;
}

function isArrayLike(data: unknown): boolean {
  // $FlowExpectedError[incompatible-use]
  return typeof Object(data).length === 'number';
}

type FlatListBaseProps<ItemT> = {
  ...RequiredFlatListProps<ItemT>,
  ...OptionalFlatListProps<ItemT>,
};

/** @build-types emit-as-interface Nativewind compatibility */
export type FlatListProps<ItemT> = Readonly<{
  ...Omit<
    VirtualizedListProps,
    | 'data'
    | 'getItem'
    | 'getItemCount'
    | 'getItemLayout'
    | 'renderItem'
    | 'keyExtractor',
  >,
  ...FlatListBaseProps<ItemT>,
  ...
}>;

/**
 * A performant interface for rendering simple, flat lists, supporting the most handy features:
 *
 *  - Fully cross-platform.
 *  - Optional horizontal mode.
 *  - Configurable viewability callbacks.
 *  - Header support.
 *  - Footer support.
 *  - Separator support.
 *  - Pull to Refresh.
 *  - Scroll loading.
 *  - ScrollToIndex support.
 *
 * If you need section support, use [`<SectionList>`](docs/sectionlist.html).
 *
 * Minimal Example:
 *
 *     <FlatList
 *       data={[{key: 'a'}, {key: 'b'}]}
 *       renderItem={({item}) => <Text>{item.key}</Text>}
 *     />
 *
 * More complex, multi-select example demonstrating `PureComponent` usage for perf optimization and avoiding bugs.
 *
 * - By binding the `onPressItem` handler, the props will remain `===` and `PureComponent` will
 *   prevent wasteful re-renders unless the actual `id`, `selected`, or `title` props change, even
 *   if the components rendered in `MyListItem` did not have such optimizations.
 * - By passing `extraData={this.state}` to `FlatList` we make sure `FlatList` itself will re-render
 *   when the `state.selected` changes. Without setting this prop, `FlatList` would not know it
 *   needs to re-render any items because it is also a `PureComponent` and the prop comparison will
 *   not show any changes.
 * - `keyExtractor` tells the list to use the `id`s for the react keys instead of the default `key` property.
 *
 *
 *     class MyListItem extends React.PureComponent {
 *       _onPress = () => {
 *         this.props.onPressItem(this.props.id);
 *       };
 *
 *       render() {
 *         const textColor = this.props.selected ? "red" : "black";
 *         return (
 *           <TouchableOpacity onPress={this._onPress}>
 *             <View>
 *               <Text style={{ color: textColor }}>
 *                 {this.props.title}
 *               </Text>
 *             </View>
 *           </TouchableOpacity>
 *         );
 *       }
 *     }
 *
 *     class MultiSelectList extends React.PureComponent {
 *       state = {selected: (new Map(): Map<string, boolean>)};
 *
 *       _keyExtractor = (item, index) => item.id;
 *
 *       _onPressItem = (id: string) => {
 *         // updater functions are preferred for transactional updates
 *         this.setState((state) => {
 *           // copy the map rather than modifying state.
 *           const selected = new Map(state.selected);
 *           selected.set(id, !selected.get(id)); // toggle
 *           return {selected};
 *         });
 *       };
 *
 *       _renderItem = ({item}) => (
 *         <MyListItem
 *           id={item.id}
 *           onPressItem={this._onPressItem}
 *           selected={!!this.state.selected.get(item.id)}
 *           title={item.title}
 *         />
 *       );
 *
 *       render() {
 *         return (
 *           <FlatList
 *             data={this.props.data}
 *             extraData={this.state}
 *             keyExtractor={this._keyExtractor}
 *             renderItem={this._renderItem}
 *           />
 *         );
 *       }
 *     }
 *
 * This is a convenience wrapper around [`<VirtualizedList>`](docs/virtualizedlist.html),
 * and thus inherits its props (as well as those of `ScrollView`) that aren't explicitly listed
 * here, along with the following caveats:
 *
 * - Internal state is not preserved when content scrolls out of the render window. Make sure all
 *   your data is captured in the item data or external stores like Flux, Redux, or Relay.
 * - This is a `PureComponent` which means that it will not re-render if `props` remain shallow-
 *   equal. Make sure that everything your `renderItem` function depends on is passed as a prop
 *   (e.g. `extraData`) that is not `===` after updates, otherwise your UI may not update on
 *   changes. This includes the `data` prop and parent component state.
 * - In order to constrain memory and enable smooth scrolling, content is rendered asynchronously
 *   offscreen. This means it's possible to scroll faster than the fill rate ands momentarily see
 *   blank content. This is a tradeoff that can be adjusted to suit the needs of each application,
 *   and we are working on improving it behind the scenes.
 * - By default, the list looks for a `key` prop on each item and uses that for the React key.
 *   Alternatively, you can provide a custom `keyExtractor` prop.
 *
 * Also inherits [ScrollView Props](docs/scrollview.html#props), unless it is nested in another FlatList of same orientation.
 */
class FlatList<ItemT = any> extends React.PureComponent<FlatListProps<ItemT>> {
  /**
   * Scrolls to the end of the content. May be janky without `getItemLayout` prop.
   */
  scrollToEnd(params?: ?{animated?: ?boolean, ...}) {
    if (this._listRef) {
      this._listRef.scrollToEnd(params);
    }
  }

  /**
   * Scrolls to the item at the specified index such that it is positioned in the viewable area
   * such that `viewPosition` 0 places it at the top, 1 at the bottom, and 0.5 centered in the
   * middle. `viewOffset` is a fixed number of pixels to offset the final target position.
   *
   * Note: cannot scroll to locations outside the render window without specifying the
   * `getItemLayout` prop.
   */
  scrollToIndex(params: {
    animated?: ?boolean,
    index: number,
    viewOffset?: number,
    viewPosition?: number,
    ...
  }) {
    if (this._listRef) {
      this._listRef.scrollToIndex(params);
    }
  }

  /**
   * Requires linear scan through data - use `scrollToIndex` instead if possible.
   *
   * Note: cannot scroll to locations outside the render window without specifying the
   * `getItemLayout` prop.
   */
  scrollToItem(params: {
    animated?: ?boolean,
    item: ItemT,
    viewOffset?: number,
    viewPosition?: number,
    ...
  }) {
    if (this._listRef) {
      this._listRef.scrollToItem(params);
    }
  }

  /**
   * Scroll to a specific content pixel offset in the list.
   *
   * Check out [scrollToOffset](docs/virtualizedlist.html#scrolltooffset) of VirtualizedList
   */
  scrollToOffset(params: {animated?: ?boolean, offset: number, ...}) {
    if (this._listRef) {
      this._listRef.scrollToOffset(params);
    }
  }

  /**
   * Tells the list an interaction has occurred, which should trigger viewability calculations, e.g.
   * if `waitForInteractions` is true and the user has not scrolled. This is typically called by
   * taps on items or by navigation actions.
   */
  recordInteraction() {
    if (this._listRef) {
      this._listRef.recordInteraction();
    }
  }

  /**
   * Displays the scroll indicators momentarily.
   *
   * @platform ios
   */
  flashScrollIndicators() {
    if (this._listRef) {
      this._listRef.flashScrollIndicators();
    }
  }

  /**
   * Provides a handle to the underlying scroll responder.
   */
  getScrollResponder(): ?ScrollResponderType {
    if (this._listRef) {
      return this._listRef.getScrollResponder();
    }
  }

  /**
   * Provides a reference to the underlying host component
   */
  getNativeScrollRef(): ?ScrollViewInstance {
    if (this._listRef) {
      return this._listRef.getScrollRef();
    }
  }

  getScrollableNode(): any {
    if (this._listRef) {
      return this._listRef.getScrollableNode();
    }
  }

  setNativeProps(props: {[string]: unknown, ...}) {
    if (this._listRef) {
      this._listRef.setNativeProps(props);
    }
  }

  constructor(props: FlatListProps<ItemT>) {
    super(props);
    this._checkProps(this.props);
    if (this.props.viewabilityConfigCallbackPairs) {
      this._virtualizedListPairs =
        this.props.viewabilityConfigCallbackPairs.map(pair => ({
          viewabilityConfig: pair.viewabilityConfig,
          onViewableItemsChanged: this._createOnViewableItemsChanged(
            pair.onViewableItemsChanged,
          ),
        }));
    } else if (this.props.onViewableItemsChanged) {
      this._virtualizedListPairs.push({
        /* $FlowFixMe[incompatible-type] (>=0.63.0 site=react_native_fb) This
         * comment suppresses an error found when Flow v0.63 was deployed. To
         * see the error delete this comment and run Flow. */
        viewabilityConfig: this.props.viewabilityConfig,
        onViewableItemsChanged: this._createOnViewableItemsChanged(
          // NOTE: we use a wrapper function to allow the actual callback to change
          // while still keeping the function provided to native to be stable
          (...args) => {
            invariant(
              this.props.onViewableItemsChanged,
              'Changing the nullability of onViewableItemsChanged is not supported. ' +
                'Once a function or null is supplied that cannot be changed.',
            );
            return this.props.onViewableItemsChanged(...args);
          },
        ),
      });
    }
  }

  // $FlowFixMe[missing-local-annot]
  componentDidUpdate(prevProps: FlatListProps<ItemT>) {
    invariant(
      prevProps.numColumns === this.props.numColumns,
      'Changing numColumns on the fly is not supported. Change the key prop on FlatList when ' +
        'changing the number of columns to force a fresh render of the component.',
    );
    invariant(
      (prevProps.onViewableItemsChanged == null) ===
        (this.props.onViewableItemsChanged == null),
      'Changing onViewableItemsChanged nullability on the fly is not supported',
    );
    invariant(
      !deepDiffer(prevProps.viewabilityConfig, this.props.viewabilityConfig),
      'Changing viewabilityConfig on the fly is not supported',
    );
    invariant(
      prevProps.viewabilityConfigCallbackPairs ===
        this.props.viewabilityConfigCallbackPairs,
      'Changing viewabilityConfigCallbackPairs on the fly is not supported',
    );

    this._checkProps(this.props);
  }

  _listRef: ?VirtualizedList;
  _virtualizedListPairs: Array<ViewabilityConfigCallbackPair> = [];

  _captureRef = (ref: ?VirtualizedList) => {
    this._listRef = ref;
  };

  // $FlowFixMe[missing-local-annot]
  _checkProps(props: FlatListProps<ItemT>) {
    const {
      // $FlowFixMe[prop-missing] this prop doesn't exist, is only used for an invariant
      getItem,
      // $FlowFixMe[prop-missing] this prop doesn't exist, is only used for an invariant
      getItemCount,
      horizontal,
      columnWrapperStyle,
      onViewableItemsChanged,
      viewabilityConfigCallbackPairs,
    } = props;
    const numColumns = numColumnsOrDefault(this.props.numColumns);
    invariant(
      !getItem && !getItemCount,
      'FlatList does not support custom data formats.',
    );
    if (numColumns > 1) {
      invariant(!horizontal, 'numColumns does not support horizontal.');
    } else {
      invariant(
        !columnWrapperStyle,
        'columnWrapperStyle not supported for single column lists',
      );
    }
    invariant(
      !(onViewableItemsChanged && viewabilityConfigCallbackPairs),
      'FlatList does not support setting both onViewableItemsChanged and ' +
        'viewabilityConfigCallbackPairs.',
    );
  }

  _getItem = (
    data: $ArrayLike<ItemT>,
    index: number,
  ): ?(ItemT | ReadonlyArray<ItemT>) => {
    const numColumns = numColumnsOrDefault(this.props.numColumns);
    if (numColumns > 1) {
      const ret = [];
      for (let kk = 0; kk < numColumns; kk++) {
        const itemIndex = index * numColumns + kk;
        if (itemIndex < data.length) {
          const item = data[itemIndex];
          ret.push(item);
        }
      }
      return ret;
    } else {
      return data[index];
    }
  };

  _getItemCount = (data: ?$ArrayLike<ItemT>): number => {
    // Legacy behavior of FlatList was to forward "undefined" length if invalid
    // data like a non-arraylike object is passed. VirtualizedList would then
    // coerce this, and the math would work out to no-op. For compatibility, if
    // invalid data is passed, we tell VirtualizedList there are zero items
    // available to prevent it from trying to read from the invalid data
    // (without propagating invalidly typed data).
    if (data != null && isArrayLike(data)) {
      const numColumns = numColumnsOrDefault(this.props.numColumns);
      return numColumns > 1 ? Math.ceil(data.length / numColumns) : data.length;
    } else {
      return 0;
    }
  };

  _keyExtractor = (items: ItemT | Array<ItemT>, index: number): string => {
    const numColumns = numColumnsOrDefault(this.props.numColumns);
    const keyExtractor = this.props.keyExtractor ?? defaultKeyExtractor;

    if (numColumns > 1) {
      invariant(
        Array.isArray(items),
        'FlatList: Encountered internal consistency error, expected each item to consist of an ' +
          'array with 1-%s columns; instead, received a single item.',
        numColumns,
      );
      return items
        .map((item, kk) =>
          keyExtractor(item as $FlowFixMe as ItemT, index * numColumns + kk),
        )
        .join(':');
    }

    // $FlowFixMe[incompatible-type] Can't call keyExtractor with an array
    return keyExtractor(items, index);
  };

  _pushMultiColumnViewable(arr: Array<ListViewToken>, v: ListViewToken): void {
    const numColumns = numColumnsOrDefault(this.props.numColumns);
    const keyExtractor = this.props.keyExtractor ?? defaultKeyExtractor;
    v.item.forEach((item, ii) => {
      invariant(v.index != null, 'Missing index!');
      const index = v.index * numColumns + ii;
      arr.push({...v, item, key: keyExtractor(item, index), index});
    });
  }

  _createOnViewableItemsChanged(
    onViewableItemsChanged: ?(info: {
      viewableItems: Array<ListViewToken>,
      changed: Array<ListViewToken>,
      ...
    }) => void,
    // $FlowFixMe[missing-local-annot]
  ) {
    return (info: {
      viewableItems: Array<ListViewToken>,
      changed: Array<ListViewToken>,
      ...
    }) => {
      const numColumns = numColumnsOrDefault(this.props.numColumns);
      if (onViewableItemsChanged) {
        if (numColumns > 1) {
          const changed: Array<ListViewToken> = [];
          const viewableItems: Array<ListViewToken> = [];
          info.viewableItems.forEach(v =>
            this._pushMultiColumnViewable(viewableItems, v),
          );
          info.changed.forEach(v => this._pushMultiColumnViewable(changed, v));
          onViewableItemsChanged({viewableItems, changed});
        } else {
          onViewableItemsChanged(info);
        }
      }
    };
  }

  _renderer = (
    ListItemComponent: ?(React.ComponentType<any> | React.MixedElement),
    renderItem: ?ListRenderItem<ItemT>,
    columnWrapperStyle: ?ViewStyleProp,
    numColumns: ?number,
    extraData: ?any,
    // $FlowFixMe[missing-local-annot]
  ) => {
    const cols = numColumnsOrDefault(numColumns);

    const render = (props: ListRenderItemInfo<ItemT>): React.Node => {
      if (ListItemComponent) {
        // $FlowFixMe[not-a-component] Component isn't valid
        // $FlowFixMe[incompatible-type] Component isn't valid
        return <ListItemComponent {...props} />;
      } else if (renderItem) {
        // $FlowFixMe[incompatible-type]
        return renderItem(props);
      } else {
        return null;
      }
    };

    const renderProp = (info: ListRenderItemInfo<ItemT>) => {
      if (cols > 1) {
        const {item, index} = info;
        invariant(
          Array.isArray(item),
          'Expected array of items with numColumns > 1',
        );
        return (
          <View style={StyleSheet.compose(styles.row, columnWrapperStyle)}>
            {item.map((it, kk) => {
              const element = render({
                // $FlowFixMe[incompatible-type]
                item: it,
                index: index * cols + kk,
                separators: info.separators,
              });
              return element != null ? (
                <React.Fragment key={kk}>{element}</React.Fragment>
              ) : null;
            })}
          </View>
        );
      } else {
        return render(info);
      }
    };

    return ListItemComponent
      ? {ListItemComponent: renderProp}
      : {renderItem: renderProp};
  };

  _memoizedRenderer: ReturnType<typeof memoizeOne> = memoizeOne(this._renderer);

  render(): React.Node {
    const {
      numColumns,
      columnWrapperStyle,
      removeClippedSubviews: _removeClippedSubviews,
      strictMode = false,
      ...restProps
    } = this.props;

    const renderer = strictMode ? this._memoizedRenderer : this._renderer;

    return (
      // $FlowFixMe[incompatible-exact] - `restProps` (`Props`) is inexact.
      <VirtualizedList
        {...restProps}
        getItem={this._getItem}
        getItemCount={this._getItemCount}
        keyExtractor={this._keyExtractor}
        ref={this._captureRef}
        viewabilityConfigCallbackPairs={this._virtualizedListPairs}
        removeClippedSubviews={removeClippedSubviewsOrDefault(
          _removeClippedSubviews,
        )}
        {...renderer(
          this.props.ListItemComponent,
          this.props.renderItem,
          columnWrapperStyle,
          numColumns,
          this.props.extraData,
        )}
      />
    );
  }
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row'},
});

export type FlatListInstance = FlatList<>;

export default FlatList;

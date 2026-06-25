/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {ViewToken} from './ViewabilityHelper';
import type {VirtualizedListProps} from './VirtualizedListProps';

import VirtualizedList from './VirtualizedList';
import {keyExtractor as defaultKeyExtractor} from './VirtualizeUtils';
import invariant from 'invariant';
import * as React from 'react';
import {useEffect, useState} from 'react';

type DefaultVirtualizedSectionT = {
  data: any,
  [key: string]: any,
};

export type SectionData<SectionItemT, SectionT = DefaultVirtualizedSectionT> =
  | (Readonly<SectionBase<SectionItemT, SectionT>> & SectionT)
  | (SectionBase<SectionItemT, SectionT> & SectionT)
  | SectionT;

export type SectionBase<SectionItemT, SectionT = DefaultVirtualizedSectionT> = {
  /**
   * The data for rendering items in this section.
   */
  data: ReadonlyArray<SectionItemT>,
  /**
   * Optional key to keep track of section re-ordering. If you don't plan on re-ordering sections,
   * the array index will be used by default.
   */
  key?: string,
  // Optional props will override list-wide props just for this section.
  renderItem?: ?(info: {
    item: SectionItemT,
    index: number,
    section: SectionData<SectionItemT, SectionT>,
    separators: {
      highlight: () => void,
      unhighlight: () => void,
      updateProps: (select: 'leading' | 'trailing', newProps: Object) => void,
      ...
    },
    ...
  }) => null | React.MixedElement,
  ItemSeparatorComponent?: ?(React.ComponentType<any> | React.MixedElement),
  keyExtractor?: (item: ?SectionItemT, index?: ?number) => string,
  ...
};

type RequiredVirtualizedSectionListProps<
  ItemT,
  SectionT = DefaultVirtualizedSectionT,
> = {
  sections: ReadonlyArray<SectionData<ItemT, SectionT>>,
};

type OptionalVirtualizedSectionListProps<
  ItemT,
  SectionT = DefaultVirtualizedSectionT,
> = {
  /**
   * Default renderer for every item in every section.
   */
  renderItem?: (info: {
    item: ItemT,
    index: number,
    section: SectionT,
    separators: {
      highlight: () => void,
      unhighlight: () => void,
      updateProps: (select: 'leading' | 'trailing', newProps: Object) => void,
      ...
    },
    ...
  }) => null | React.Node,
  /**
   * Rendered at the top of each section. These stick to the top of the `ScrollView` by default on
   * iOS. See `stickySectionHeadersEnabled`.
   */
  renderSectionHeader?: ?(info: {section: SectionT, ...}) => null | React.Node,
  /**
   * Rendered at the bottom of each section.
   */
  renderSectionFooter?: ?(info: {section: SectionT, ...}) => null | React.Node,
  /**
   * Rendered at the top and bottom of each section (note this is different from
   * `ItemSeparatorComponent` which is only rendered between items). These are intended to separate
   * sections from the headers above and below and typically have the same highlight response as
   * `ItemSeparatorComponent`. Also receives `highlighted`, `[leading/trailing][Item/Separator]`,
   * and any custom props from `separators.updateProps`.
   */
  SectionSeparatorComponent?: ?React.ComponentType<any>,
  /**
   * Makes section headers stick to the top of the screen until the next one pushes it off. Only
   * enabled by default on iOS because that is the platform standard there.
   */
  stickySectionHeadersEnabled?: boolean,
  onEndReached?: ?({distanceFromEnd: number, ...}) => void,
};

export type VirtualizedSectionListProps<
  ItemT,
  SectionT = DefaultVirtualizedSectionT,
> = {
  ...RequiredVirtualizedSectionListProps<ItemT, SectionT>,
  ...OptionalVirtualizedSectionListProps<ItemT, SectionT>,
  ...Omit<VirtualizedListProps, 'data' | 'renderItem'>,
};
export type ScrollToLocationParamsType = {
  animated?: ?boolean,
  itemIndex: number,
  sectionIndex: number,
  viewOffset?: number,
  viewPosition?: number,
};

type State = {childProps: VirtualizedListProps, ...};

/**
 * Right now this just flattens everything into one list and uses VirtualizedList under the
 * hood. The only operation that might not scale well is concatting the data arrays of all the
 * sections when new props are received, which should be plenty fast for up to ~10,000 items.
 */
class VirtualizedSectionList<
  ItemT,
  SectionT extends SectionBase<
    ItemT,
    DefaultVirtualizedSectionT,
  > = DefaultVirtualizedSectionT,
> extends React.PureComponent<
  VirtualizedSectionListProps<ItemT, SectionT>,
  State,
> {
  scrollToLocation(params: ScrollToLocationParamsType) {
    let index = params.itemIndex;
    for (let i = 0; i < params.sectionIndex; i++) {
      index += this.props.getItemCount(this.props.sections[i].data) + 2;
    }
    let viewOffset = params.viewOffset || 0;
    if (this._listRef == null) {
      return;
    }
    const listRef = this._listRef;
    if (params.itemIndex > 0 && this.props.stickySectionHeadersEnabled) {
      const frame = listRef
        .__getListMetrics()
        .getCellMetricsApprox(index - params.itemIndex, listRef.props);
      viewOffset += frame.length;
    }
    const toIndexParams: {
      animated?: ?boolean,
      index: number,
      viewOffset?: number,
      viewPosition?: number,
      ...
    } = {
      ...params,
      viewOffset,
      index,
    };
    // $FlowFixMe[incompatible-use]
    this._listRef.scrollToIndex(toIndexParams);
  }

  getListRef(): ?VirtualizedList {
    return this._listRef;
  }

  render(): React.Node {
    const {
      ItemSeparatorComponent, // don't pass through, rendered with renderItem
      SectionSeparatorComponent,
      renderItem: _renderItem,
      renderSectionFooter,
      renderSectionHeader,
      sections: _sections,
      stickySectionHeadersEnabled,
      ...passThroughProps
    } = this.props;

    const listHeaderOffset = this.props.ListHeaderComponent ? 1 : 0;

    const stickyHeaderIndices = this.props.stickySectionHeadersEnabled
      ? ([] as Array<number>)
      : undefined;

    let itemCount = 0;
    for (const section of this.props.sections) {
      // Track the section header indices
      if (stickyHeaderIndices != null) {
        stickyHeaderIndices.push(itemCount + listHeaderOffset);
      }

      // Add two for the section header and footer.
      itemCount += 2;
      itemCount += this.props.getItemCount(section.data);
    }
    const renderItem = this._renderItem(itemCount);

    return (
      <VirtualizedList
        {...passThroughProps}
        keyExtractor={this._keyExtractor}
        stickyHeaderIndices={stickyHeaderIndices}
        renderItem={renderItem}
        data={this.props.sections}
        getItem={(sections, index) =>
          this._getItem(this.props, sections, index)
        }
        getItemCount={() => itemCount}
        onViewableItemsChanged={
          this.props.onViewableItemsChanged
            ? this._onViewableItemsChanged
            : undefined
        }
        ref={this._captureRef}
      />
    );
  }

  _getItem(
    props: VirtualizedSectionListProps<ItemT, SectionT>,
    sections: ?ReadonlyArray<SectionData<ItemT, SectionT>>,
    index: number,
  ): ?ItemT {
    if (!sections) {
      return null;
    }
    let itemIdx = index - 1;
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionData = section.data;
      const itemCount = props.getItemCount(sectionData);
      if (itemIdx === -1 || itemIdx === itemCount) {
        // We intend for there to be overflow by one on both ends of the list.
        // This will be for headers and footers. When returning a header or footer
        // item the section itself is the item.
        // $FlowFixMe[incompatible-type]
        return section;
      } else if (itemIdx < itemCount) {
        // If we are in the bounds of the list's data then return the item.
        return props.getItem(sectionData, itemIdx);
      } else {
        itemIdx -= itemCount + 2; // Add two for the header and footer
      }
    }
    return null;
  }

  // $FlowFixMe[missing-local-annot]
  _keyExtractor = (item: ItemT, index: number) => {
    const info = this._subExtractor(index);
    return (info && info.key) || String(index);
  };

  _subExtractor(index: number): ?{
    section: SectionData<ItemT, SectionT>,
    // Key of the section or combined key for section + item
    key: string,
    // Relative index within the section
    index: ?number,
    // True if this is the section header
    header?: ?boolean,
    leadingItem?: ?ItemT,
    leadingSection?: ?SectionData<ItemT, SectionT>,
    trailingItem?: ?ItemT,
    trailingSection?: ?SectionData<ItemT, SectionT>,
    ...
  } {
    let itemIndex = index;
    const {getItem, getItemCount, keyExtractor, sections} = this.props;
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionData = section.data;
      const key = section.key || String(i);
      itemIndex -= 1; // The section adds an item for the header
      if (itemIndex >= getItemCount(sectionData) + 1) {
        itemIndex -= getItemCount(sectionData) + 1; // The section adds an item for the footer.
      } else if (itemIndex === -1) {
        return {
          section,
          key: key + ':header',
          index: null,
          header: true,
          trailingSection: sections[i + 1],
        };
      } else if (itemIndex === getItemCount(sectionData)) {
        return {
          section,
          key: key + ':footer',
          index: null,
          header: false,
          trailingSection: sections[i + 1],
        };
      } else {
        const extractor =
          section.keyExtractor || keyExtractor || defaultKeyExtractor;
        return {
          section,
          key:
            key + ':' + extractor(getItem(sectionData, itemIndex), itemIndex),
          index: itemIndex,
          leadingItem: getItem(sectionData, itemIndex - 1),
          leadingSection: sections[i - 1],
          trailingItem: getItem(sectionData, itemIndex + 1),
          trailingSection: sections[i + 1],
        };
      }
    }
  }

  _convertViewable = (viewable: ViewToken): ?ViewToken => {
    invariant(viewable.index != null, 'Received a broken ViewToken');
    const info = this._subExtractor(viewable.index);
    if (!info) {
      return null;
    }
    const keyExtractorWithNullableIndex = info.section.keyExtractor;
    const keyExtractorWithNonNullableIndex =
      this.props.keyExtractor || defaultKeyExtractor;
    const key =
      keyExtractorWithNullableIndex != null
        ? keyExtractorWithNullableIndex(viewable.item, info.index)
        : keyExtractorWithNonNullableIndex(viewable.item, info.index ?? 0);

    return {
      ...viewable,
      index: info.index,
      key,
      section: info.section,
    };
  };

  _onViewableItemsChanged = ({
    viewableItems,
    changed,
  }: {
    viewableItems: Array<ViewToken>,
    changed: Array<ViewToken>,
    ...
  }) => {
    const onViewableItemsChanged = this.props.onViewableItemsChanged;
    if (onViewableItemsChanged != null) {
      onViewableItemsChanged({
        viewableItems: viewableItems
          .map(this._convertViewable, this)
          .filter(Boolean),
        changed: changed.map(this._convertViewable, this).filter(Boolean),
      });
    }
  };

  _renderItem =
    (listItemCount: number): $FlowFixMe =>
    // eslint-disable-next-line react/no-unstable-nested-components
    ({item, index}: {item: ItemT, index: number, ...}) => {
      const info = this._subExtractor(index);
      if (!info) {
        return null;
      }
      const infoIndex = info.index;
      if (infoIndex == null) {
        const {section} = info;
        if (info.header === true) {
          const {renderSectionHeader} = this.props;
          return renderSectionHeader ? renderSectionHeader({section}) : null;
        } else {
          const {renderSectionFooter} = this.props;
          return renderSectionFooter ? renderSectionFooter({section}) : null;
        }
      } else {
        const renderItem = info.section.renderItem || this.props.renderItem;
        const SeparatorComponent = this._getSeparatorComponent(
          index,
          info,
          listItemCount,
        );
        invariant(renderItem, 'no renderItem!');
        return (
          <ItemWithSeparator
            SeparatorComponent={SeparatorComponent}
            LeadingSeparatorComponent={
              infoIndex === 0 ? this.props.SectionSeparatorComponent : undefined
            }
            cellKey={info.key}
            index={infoIndex}
            item={item}
            leadingItem={info.leadingItem}
            leadingSection={info.leadingSection}
            prevCellKey={(this._subExtractor(index - 1) || {}).key}
            // Callback to provide updateHighlight for this item
            setSelfHighlightCallback={this._setUpdateHighlightFor}
            setSelfUpdatePropsCallback={this._setUpdatePropsFor}
            // Provide child ability to set highlight/updateProps for previous item using prevCellKey
            updateHighlightFor={this._updateHighlightFor}
            updatePropsFor={this._updatePropsFor}
            renderItem={renderItem}
            section={info.section}
            trailingItem={info.trailingItem}
            trailingSection={info.trailingSection}
            inverted={!!this.props.inverted}
          />
        );
      }
    };

  _updatePropsFor = (cellKey: string, value: any) => {
    const updateProps = this._updatePropsMap[cellKey];
    if (updateProps != null) {
      updateProps(value);
    }
  };

  _updateHighlightFor = (cellKey: string, value: boolean) => {
    const updateHighlight = this._updateHighlightMap[cellKey];
    if (updateHighlight != null) {
      updateHighlight(value);
    }
  };

  _setUpdateHighlightFor = (
    cellKey: string,
    updateHighlightFn: ?(boolean) => void,
  ) => {
    if (updateHighlightFn != null) {
      this._updateHighlightMap[cellKey] = updateHighlightFn;
    } else {
      // $FlowFixMe[prop-missing]
      delete this._updateHighlightFor[cellKey];
    }
  };

  _setUpdatePropsFor = (cellKey: string, updatePropsFn: ?(boolean) => void) => {
    if (updatePropsFn != null) {
      this._updatePropsMap[cellKey] = updatePropsFn;
    } else {
      delete this._updatePropsMap[cellKey];
    }
  };

  _getSeparatorComponent(
    index: number,
    info?: ?Object,
    listItemCount: number,
  ): ?(React.ComponentType<any> | React.MixedElement) {
    info = info || this._subExtractor(index);
    if (!info) {
      return null;
    }
    const ItemSeparatorComponent =
      info.section.ItemSeparatorComponent || this.props.ItemSeparatorComponent;
    const {SectionSeparatorComponent} = this.props;
    const isLastItemInList = index === listItemCount - 1;
    const isLastItemInSection =
      info.index === this.props.getItemCount(info.section.data) - 1;
    if (SectionSeparatorComponent && isLastItemInSection) {
      return SectionSeparatorComponent;
    }
    if (ItemSeparatorComponent && !isLastItemInSection && !isLastItemInList) {
      return ItemSeparatorComponent;
    }
    return null;
  }

  _updateHighlightMap: {[string]: (boolean) => void} = {};
  _updatePropsMap: {[string]: void | (boolean => void)} = {};
  _listRef: ?VirtualizedList;
  _captureRef = (ref: null | VirtualizedList) => {
    this._listRef = ref;
  };
}

type ItemWithSeparatorCommonProps<ItemT> = Readonly<{
  leadingItem: ?ItemT,
  leadingSection: ?Object,
  section: Object,
  trailingItem: ?ItemT,
  trailingSection: ?Object,
}>;

type ItemWithSeparatorProps<ItemT> = Readonly<{
  ...ItemWithSeparatorCommonProps<ItemT>,
  LeadingSeparatorComponent: ?(React.ComponentType<any> | React.MixedElement),
  SeparatorComponent: ?(React.ComponentType<any> | React.MixedElement),
  cellKey: string,
  index: number,
  item: ItemT,
  setSelfHighlightCallback: (
    cellKey: string,
    updateFn: ?(boolean) => void,
  ) => void,
  setSelfUpdatePropsCallback: (
    cellKey: string,
    updateFn: ?(boolean) => void,
  ) => void,
  prevCellKey?: ?string,
  updateHighlightFor: (prevCellKey: string, value: boolean) => void,
  updatePropsFor: (prevCellKey: string, value: Object) => void,
  renderItem: Function,
  inverted: boolean,
}>;

function ItemWithSeparator<ItemT>(
  props: ItemWithSeparatorProps<ItemT>,
): React.Node {
  const {
    LeadingSeparatorComponent,
    // this is the trailing separator and is associated with this item
    SeparatorComponent,
    cellKey,
    prevCellKey,
    setSelfHighlightCallback,
    updateHighlightFor,
    setSelfUpdatePropsCallback,
    updatePropsFor,
    item,
    index,
    section,
    inverted,
  } = props;

  const [leadingSeparatorHiglighted, setLeadingSeparatorHighlighted] =
    useState(false);

  const [separatorHighlighted, setSeparatorHighlighted] = useState(false);

  const [leadingSeparatorProps, setLeadingSeparatorProps] = useState<
    ItemWithSeparatorCommonProps<ItemT>,
  >({
    leadingItem: props.leadingItem,
    leadingSection: props.leadingSection,
    section: props.section,
    trailingItem: props.item,
    trailingSection: props.trailingSection,
  });
  const [separatorProps, setSeparatorProps] = useState<
    ItemWithSeparatorCommonProps<ItemT>,
  >({
    leadingItem: props.item,
    leadingSection: props.leadingSection,
    section: props.section,
    trailingItem: props.trailingItem,
    trailingSection: props.trailingSection,
  });

  useEffect(() => {
    setSelfHighlightCallback(cellKey, setSeparatorHighlighted);
    // $FlowFixMe[incompatible-type]
    setSelfUpdatePropsCallback(cellKey, setSeparatorProps);

    return () => {
      setSelfUpdatePropsCallback(cellKey, null);
      setSelfHighlightCallback(cellKey, null);
    };
  }, [
    cellKey,
    setSelfHighlightCallback,
    setSeparatorProps,
    setSelfUpdatePropsCallback,
  ]);

  const separators = {
    highlight: () => {
      setLeadingSeparatorHighlighted(true);
      setSeparatorHighlighted(true);
      if (prevCellKey != null) {
        updateHighlightFor(prevCellKey, true);
      }
    },
    unhighlight: () => {
      setLeadingSeparatorHighlighted(false);
      setSeparatorHighlighted(false);
      if (prevCellKey != null) {
        updateHighlightFor(prevCellKey, false);
      }
    },
    updateProps: (
      select: 'leading' | 'trailing',
      newProps: Partial<ItemWithSeparatorCommonProps<ItemT>>,
    ) => {
      if (select === 'leading') {
        if (LeadingSeparatorComponent != null) {
          setLeadingSeparatorProps({...leadingSeparatorProps, ...newProps});
        } else if (prevCellKey != null) {
          // update the previous item's separator
          updatePropsFor(prevCellKey, {...leadingSeparatorProps, ...newProps});
        }
      } else if (select === 'trailing' && SeparatorComponent != null) {
        setSeparatorProps({...separatorProps, ...newProps});
      }
    },
  };
  const element = props.renderItem({
    item,
    index,
    section,
    separators,
  });
  const leadingSeparator =
    LeadingSeparatorComponent != null &&
    ((React.isValidElement(LeadingSeparatorComponent) ? (
      LeadingSeparatorComponent
    ) : (
      // $FlowFixMe[not-a-component]
      // $FlowFixMe[incompatible-type]
      <LeadingSeparatorComponent
        highlighted={leadingSeparatorHiglighted}
        {...leadingSeparatorProps}
      />
    )) as any);
  const separator =
    SeparatorComponent != null &&
    ((React.isValidElement(SeparatorComponent) ? (
      SeparatorComponent
    ) : (
      // $FlowFixMe[not-a-component]
      // $FlowFixMe[incompatible-type]
      <SeparatorComponent
        highlighted={separatorHighlighted}
        {...separatorProps}
      />
    )) as any);
  const RenderSeparator = leadingSeparator || separator;
  const firstSeparator = inverted === false ? leadingSeparator : separator;
  const secondSeparator = inverted === false ? separator : leadingSeparator;

  return (
    <>
      {RenderSeparator ? firstSeparator : null}
      {element}
      {RenderSeparator ? secondSeparator : null}
    </>
  );
}

const VirtualizedSectionListComponent = VirtualizedSectionList as component<
  ItemT,
  SectionT extends SectionBase<
    ItemT,
    DefaultVirtualizedSectionT,
  > = DefaultVirtualizedSectionT,
>(
  ref?: React.RefSetter<
    interface {
      getListRef(): ?VirtualizedList,
      scrollToLocation(params: ScrollToLocationParamsType): void,
    },
  >,
  ...VirtualizedSectionListProps<ItemT, SectionT>
);

export default VirtualizedSectionListComponent;

export type AnyVirtualizedSectionList = typeof VirtualizedSectionListComponent<
  any,
  any,
>;

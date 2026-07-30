/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @fantom_flags fixYogaFlexBasisFitContentInMainAxis:*
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {HostInstance} from 'react-native';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';

const VIEWPORT_WIDTH = 402;
const VIEWPORT_HEIGHT = 760;
const FEED_CONTENT_HEIGHT = 1800;

test('auto-height wrapper around a feed ScrollView stays bounded by the viewport', () => {
  const root = Fantom.createRoot({
    viewportWidth: VIEWPORT_WIDTH,
    viewportHeight: VIEWPORT_HEIGHT,
  });

  const wrapperRef = createRef<HostInstance>();
  const scrollViewRef = createRef<HostInstance>();
  const feedContentRef = createRef<HostInstance>();

  Fantom.runTask(() => {
    root.render(
      <View collapsable={false} style={styles.screen}>
        <View collapsable={false} ref={wrapperRef} style={styles.feedWrapper}>
          <ScrollView
            collapsable={false}
            ref={scrollViewRef}
            style={styles.feed}>
            <View
              collapsable={false}
              ref={feedContentRef}
              style={styles.feedContent}
            />
          </ScrollView>
        </View>
      </View>,
    );
  });

  const wrapper = nullthrows(wrapperRef.current);
  const scrollView = nullthrows(scrollViewRef.current);
  const feedContent = nullthrows(feedContentRef.current);

  const wrapperRect = wrapper.getBoundingClientRect();
  const scrollViewRect = scrollView.getBoundingClientRect();
  const feedContentRect = feedContent.getBoundingClientRect();

  expect(wrapperRect.height).toBe(VIEWPORT_HEIGHT);
  expect(scrollViewRect.height).toBe(VIEWPORT_HEIGHT);
  expect(feedContentRect.height).toBe(FEED_CONTENT_HEIGHT);
});

test('updates flex-basis and intrinsic height in ScrollView content', () => {
  const root = Fantom.createRoot();
  const candidateRef = createRef<HostInstance>();

  const render = (flexBasis: number, intrinsicHeight: number) => {
    Fantom.runTask(() => {
      root.render(
        <ScrollView>
          <View ref={candidateRef} style={{flexBasis}}>
            <View style={{height: intrinsicHeight}} />
          </View>
        </ScrollView>,
      );
    });
    return nullthrows(candidateRef.current).getBoundingClientRect().height;
  };

  expect(render(40, 40)).toBe(40);

  expect(render(80, 20)).toBe(20);
});

test('auto-height wrapper gives remaining ScrollView space to a flex-growing body', () => {
  const viewportHeight = 200;
  const headerHeight = 50;
  const root = Fantom.createRoot({
    viewportHeight,
    viewportWidth: 100,
  });

  const wrapperRef = createRef<HostInstance>();
  const growingBodyRef = createRef<HostInstance>();

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        contentContainerStyle={{alignItems: 'flex-start', flexGrow: 1}}>
        <View collapsable={false} ref={wrapperRef}>
          <View collapsable={false} style={{height: headerHeight, width: 50}} />
          <View
            collapsable={false}
            ref={growingBodyRef}
            style={{flexGrow: 1, height: 40, width: 50}}
          />
        </View>
      </ScrollView>,
    );
  });

  const wrapperRect = nullthrows(wrapperRef.current).getBoundingClientRect();
  const growingBodyRect = nullthrows(
    growingBodyRef.current,
  ).getBoundingClientRect();

  const layout = {
    growingBodyHeight: growingBodyRect.height,
    wrapperHeight: wrapperRect.height,
  };

  expect(layout).toEqual({
    growingBodyHeight: viewportHeight - headerHeight,
    wrapperHeight: viewportHeight,
  });
});

test('positive flex-basis preserves content height in an unbounded ScrollView axis', () => {
  const root = Fantom.createRoot({
    viewportHeight: 200,
    viewportWidth: 100,
  });

  const wrapperRef = createRef<HostInstance>();
  const contentRef = createRef<HostInstance>();

  Fantom.runTask(() => {
    root.render(
      <ScrollView>
        <View collapsable={false} ref={wrapperRef} style={{flexBasis: 50}}>
          <View collapsable={false} ref={contentRef} style={{height: 100}} />
        </View>
      </ScrollView>,
    );
  });

  expect({
    contentHeight: nullthrows(contentRef.current).getBoundingClientRect()
      .height,
    wrapperHeight: nullthrows(wrapperRef.current).getBoundingClientRect()
      .height,
  }).toEqual({
    contentHeight: 100,
    wrapperHeight: 100,
  });
});

test('positive flex-basis larger than content preserves content height in an unbounded ScrollView axis', () => {
  const root = Fantom.createRoot({
    viewportHeight: 200,
    viewportWidth: 100,
  });

  const wrapperRef = createRef<HostInstance>();
  const contentRef = createRef<HostInstance>();

  Fantom.runTask(() => {
    root.render(
      <ScrollView>
        <View collapsable={false} ref={wrapperRef} style={{flexBasis: 100}}>
          <View collapsable={false} ref={contentRef} style={{height: 40}} />
        </View>
      </ScrollView>,
    );
  });

  const layout = {
    contentHeight: nullthrows(contentRef.current).getBoundingClientRect()
      .height,
    wrapperHeight: nullthrows(wrapperRef.current).getBoundingClientRect()
      .height,
  };

  expect(layout).toEqual({
    contentHeight: 40,
    wrapperHeight: 40,
  });
});

test('nested padding respects an exhausted ScrollView height constraint', () => {
  const viewportHeight = 100;
  const root = Fantom.createRoot({
    viewportHeight,
    viewportWidth: 100,
  });

  const wrapperRef = createRef<HostInstance>();
  const nestedRef = createRef<HostInstance>();
  const paddedRef = createRef<HostInstance>();

  Fantom.runTask(() => {
    root.render(
      <ScrollView contentContainerStyle={{height: viewportHeight}}>
        <View
          collapsable={false}
          ref={wrapperRef}
          style={{paddingBottom: 50, paddingTop: 50}}>
          <View collapsable={false} ref={nestedRef}>
            <View
              collapsable={false}
              ref={paddedRef}
              style={{paddingBottom: 10, paddingTop: 10}}
            />
          </View>
        </View>
      </ScrollView>,
    );
  });

  expect({
    nestedHeight: nullthrows(nestedRef.current).getBoundingClientRect().height,
    paddedHeight: nullthrows(paddedRef.current).getBoundingClientRect().height,
    wrapperHeight: nullthrows(wrapperRef.current).getBoundingClientRect()
      .height,
  }).toEqual({
    nestedHeight: 0,
    paddedHeight: 20,
    wrapperHeight: viewportHeight,
  });
});

test('clipped ScrollView inside a horizontal pager stays scrollable', () => {
  const root = Fantom.createRoot({
    viewportHeight: 150,
    viewportWidth: 320,
  });

  const outerScrollRef = createRef<HostInstance>();
  const boundedContainerRef = createRef<HostInstance>();
  const autoHeightWrapperRef = createRef<HostInstance>();
  const innerScrollRef = createRef<HostInstance>();

  Fantom.runTask(() => {
    root.render(
      <ScrollView horizontal pagingEnabled ref={outerScrollRef}>
        <View
          collapsable={false}
          ref={boundedContainerRef}
          style={{height: 150, overflow: 'hidden', width: 320}}>
          <View collapsable={false} ref={autoHeightWrapperRef}>
            <ScrollView ref={innerScrollRef}>
              <View style={{height: 240}} />
            </ScrollView>
          </View>
        </View>
        <View style={{height: 150, width: 320}} />
      </ScrollView>,
    );
  });

  const outerScroll = nullthrows(outerScrollRef.current);
  const innerScroll = nullthrows(innerScrollRef.current);
  const layout = {
    autoHeightWrapperHeight: nullthrows(
      autoHeightWrapperRef.current,
    ).getBoundingClientRect().height,
    boundedContainerHeight: nullthrows(
      boundedContainerRef.current,
    ).getBoundingClientRect().height,
    innerContentHeight: innerScroll.scrollHeight,
    innerHeight: innerScroll.getBoundingClientRect().height,
    innerScrollRange: innerScroll.scrollHeight - innerScroll.clientHeight,
    outerHorizontalScrollRange:
      outerScroll.scrollWidth - outerScroll.clientWidth,
    outerVerticalScrollRange:
      outerScroll.scrollHeight - outerScroll.clientHeight,
  };

  expect(layout).toEqual({
    autoHeightWrapperHeight: 150,
    boundedContainerHeight: 150,
    innerContentHeight: 240,
    innerHeight: 150,
    innerScrollRange: 90,
    outerHorizontalScrollRange: 320,
    outerVerticalScrollRange: 0,
  });
});

test('percentage padding tracks an updated owner width', () => {
  const root = Fantom.createRoot({
    viewportHeight: 300,
    viewportWidth: 300,
  });

  function render(updated: boolean) {
    Fantom.runTask(() => {
      root.render(
        <View
          collapsable={false}
          style={{
            height: 200,
            overflow: 'scroll',
            width: updated ? 200 : 100,
          }}>
          <View collapsable={false} style={updated ? {height: 150} : undefined}>
            <View
              collapsable={false}
              nativeID="candidate"
              style={{maxWidth: 50, paddingLeft: '25%'}}
            />
          </View>
        </View>,
      );
    });
  }

  render(false);
  render(true);

  expect(
    root
      .getRenderedOutput({
        includeLayoutMetrics: true,
        props: ['layoutMetrics-contentInsets', 'nativeID'],
      })
      .toJSX(),
  ).toEqual(
    <rn-view layoutMetrics-contentInsets="{top:0,right:0,bottom:0,left:0}">
      <rn-view layoutMetrics-contentInsets="{top:0,right:0,bottom:0,left:0}">
        <rn-view
          layoutMetrics-contentInsets="{top:0,right:0,bottom:0,left:50}"
          nativeID="candidate"
        />
      </rn-view>
    </rn-view>,
  );
});

test('gates native box sizing cache invalidation', () => {
  const root = Fantom.createRoot({
    viewportHeight: 280,
    viewportWidth: 240,
  });
  const scrollRef = createRef<HostInstance>();
  const leafRef = createRef<HostInstance>();

  const render = (siblingHeight: number) => {
    Fantom.runTask(() => {
      root.render(
        <View
          collapsable={false}
          style={{
            alignItems: 'flex-start',
            flexDirection: 'row',
            height: 240,
            width: 181,
          }}>
          <View
            collapsable={false}
            style={{alignItems: 'flex-start', alignSelf: 'flex-start'}}>
            <ScrollView ref={scrollRef} style={{height: 200}}>
              <View collapsable={false} style={{height: 100}}>
                <View
                  collapsable={false}
                  style={{flexBasis: 100, flexShrink: 1}}>
                  <View collapsable={false}>
                    <View
                      collapsable={false}
                      ref={leafRef}
                      style={{
                        borderLeftWidth: 1,
                        borderRightWidth: 2,
                        paddingHorizontal: 3,
                        width: 83,
                      }}
                    />
                  </View>
                </View>
                <View style={{height: siblingHeight, width: 17}} />
              </View>
            </ScrollView>
          </View>
        </View>,
      );
    });
  };

  render(27);
  Fantom.runTask(() => {
    nullthrows(leafRef.current).setNativeProps({
      style: {boxSizing: 'content-box'},
    });
  });
  render(40);

  const layoutAfterFirstRerender = {
    leafWidth: nullthrows(leafRef.current).getBoundingClientRect().width,
    scrollWidth: nullthrows(scrollRef.current).getBoundingClientRect().width,
  };
  expect(layoutAfterFirstRerender).toEqual({
    leafWidth: 83,
    scrollWidth: 83,
  });

  render(53);

  expect({
    leafWidth: nullthrows(leafRef.current).getBoundingClientRect().width,
    scrollWidth: nullthrows(scrollRef.current).getBoundingClientRect().width,
  }).toEqual({
    leafWidth: 92,
    scrollWidth: 92,
  });
});

const styles = StyleSheet.create({
  feed: {
    width: VIEWPORT_WIDTH,
  },
  feedContent: {
    height: FEED_CONTENT_HEIGHT,
    width: VIEWPORT_WIDTH,
  },
  feedWrapper: {
    flexGrow: 1,
  },
  screen: {
    height: VIEWPORT_HEIGHT,
    width: VIEWPORT_WIDTH,
  },
});

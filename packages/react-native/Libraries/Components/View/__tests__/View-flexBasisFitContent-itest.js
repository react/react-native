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

import ensureInstance from '../../../../src/private/__tests__/utilities/ensureInstance';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {createRef} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

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

  const wrapper = ensureInstance(wrapperRef.current, ReactNativeElement);
  const scrollView = ensureInstance(scrollViewRef.current, ReactNativeElement);
  const feedContent = ensureInstance(
    feedContentRef.current,
    ReactNativeElement,
  );

  const wrapperRect = wrapper.getBoundingClientRect();
  const scrollViewRect = scrollView.getBoundingClientRect();
  const feedContentRect = feedContent.getBoundingClientRect();

  expect(wrapperRect.height).toBe(VIEWPORT_HEIGHT);
  expect(scrollViewRect.height).toBe(VIEWPORT_HEIGHT);
  expect(feedContentRect.height).toBe(FEED_CONTENT_HEIGHT);
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

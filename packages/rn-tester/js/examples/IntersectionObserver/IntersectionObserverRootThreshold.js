/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';
import type IntersectionObserverType from 'react-native/src/private/webapis/intersectionobserver/IntersectionObserver';

import {RNTesterThemeContext} from '../../components/RNTesterTheme';
import * as React from 'react';
import {
  type ElementRef,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {Button, ScrollView, StyleSheet, Text, View} from 'react-native';

declare const IntersectionObserver: Class<IntersectionObserverType>;

export const name = 'IntersectionObserver Root Threshold';
export const title = name;
export const description =
  'Examples of setting threshold and rnRootThreshold. Views will change background color if they meet their threshold.';

export function render(): React.Node {
  return <IntersectionObserverRootThreshold />;
}

/**
 * Similar to the example in MDN: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
 */
component IntersectionObserverRootThreshold() {
  const theme = useContext(RNTesterThemeContext);
  const [showMargin, setShowMargin] = useState(true);

  return (
    <ScrollView>
      <Button
        title={`Click to ${showMargin ? 'remove' : 'add'} margin`}
        onPress={() => {
          setShowMargin(show => !show);
        }}
      />
      <Text style={[styles.scrollDownText, {color: theme.LabelColor}]}>
        ↓↓ Scroll down ↓↓
      </Text>
      {showMargin ? <View style={styles.margin} /> : null}

      <ListItem
        position={1}
        rootThreshold={0.5}
        threshold={0.5}
        description="Should intersect when item half visible and when item takes up half the viewport"
      />
      <ListItem
        position={2}
        rootThreshold={0.5}
        threshold={1}
        description="Should intersect when view takes up half of viewport and when item is fully visible"
      />
      <ListItem
        position={3}
        threshold={1}
        rootThreshold={0}
        description="This should intersect when any part is visible, even though `thresholds` is 1"
      />
      <ListItem
        position={4}
        rootThreshold={1}
        threshold={1}
        description="Since this item is smaller than viewport, should only intersect when view is fully visible"
      />
      <ListItem
        position={1}
        rootThreshold={1}
        threshold={1}
        style={{height: 1000}}
        description="This list item is larger than viewport and should intersect when it takes up all of viewport. However, this is impossible because of clipping of the scrollview. However, if we set `root` to the scrollview, we can."
      />
    </ScrollView>
  );
}

function ListItem(props: {
  position: number,
  rootThreshold: number,
  threshold: number,
  initialValue?: number,
  description: string,
  style?: ?ViewStyleProp,
}): React.Node {
  const itemRef = useRef<?ElementRef<typeof View>>(null);
  const [intersectionRatio, setIntersectionRatio] = useState(
    props.initialValue ?? 0,
  );
  const [intersectionRootRatio, setIntersectionRootRatio] = useState(
    props.initialValue ?? 0,
  );

  useLayoutEffect(() => {
    const itemNode = itemRef.current;
    if (itemNode == null) {
      return;
    }

    const intersectionObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          setIntersectionRatio(entry.intersectionRatio);
          // $FlowFixMe[prop-missing] - React Native specific entry property
          setIntersectionRootRatio(entry.rnRootIntersectionRatio);
        });
      },
      {threshold: props.threshold, rnRootThreshold: props.rootThreshold},
    );

    // $FlowFixMe[incompatible-type]
    intersectionObserver.observe(itemNode);

    return () => {
      intersectionObserver.disconnect();
    };
  }, [props.position, props.threshold, props.rootThreshold]);

  return (
    <View
      style={[
        styles.item,
        intersectionRatio >= props.threshold ? styles.intersecting : null,
        intersectionRootRatio >= props.rootThreshold
          ? styles.rootIntersecting
          : null,
        props.style,
      ]}
      ref={itemRef}>
      <Text style={styles.description}>{props.description}</Text>
      <Text>rnRootThreshold: {props.rootThreshold}</Text>
      <Text>threshold: {props.threshold}</Text>

      <IntersectionRatioIndicator
        intersectionRatio={intersectionRatio}
        intersectionRootRatio={intersectionRootRatio}
        style={{left: 0, top: 0}}
      />
      <IntersectionRatioIndicator
        intersectionRatio={intersectionRatio}
        intersectionRootRatio={intersectionRootRatio}
        style={{right: 0, top: 0}}
      />
      <IntersectionRatioIndicator
        intersectionRatio={intersectionRatio}
        intersectionRootRatio={intersectionRootRatio}
        style={{left: 0, bottom: 0}}
      />
      <IntersectionRatioIndicator
        intersectionRatio={intersectionRatio}
        intersectionRootRatio={intersectionRootRatio}
        style={{right: 0, bottom: 0}}
      />
    </View>
  );
}

function IntersectionRatioIndicator(props: {
  intersectionRatio: number,
  intersectionRootRatio: number,
  style: {top?: number, bottom?: number, left?: number, right?: number},
}): React.Node {
  return (
    <View style={[styles.intersectionRatioIndicator, props.style]}>
      <Text>
        target ratio: {`${Math.floor(props.intersectionRatio * 100)}%`}
      </Text>
      <Text>
        root ratio: {`${Math.floor(props.intersectionRootRatio * 100)}%`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollDownText: {
    textAlign: 'center',
    fontSize: 20,
    marginTop: 20,
  },
  intersecting: {
    backgroundColor: 'rgb(226, 237, 166)',
  },
  rootIntersecting: {
    backgroundColor: 'rgb(237, 90, 45)',
  },
  margin: {
    marginBottom: 700,
  },
  item: {
    backgroundColor: 'rgb(186, 186, 186)',
    borderColor: 'rgb(201, 126, 17)',
    borderWidth: 2,
    height: 500,
    margin: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intersectionRatioIndicator: {
    position: 'absolute',
    padding: 5,
    backgroundColor: 'white',
    opacity: 0.7,
    borderWidth: 1,
    borderColor: 'black',
  },
  description: {
    margin: 20,
    fontSize: 16,
  },
});

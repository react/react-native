/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {HostInstance, ScrollViewInstance} from 'react-native';
import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';
import type IntersectionObserverType from 'react-native/src/private/webapis/intersectionobserver/IntersectionObserver';

import {RNTesterThemeContext} from '../../components/RNTesterTheme';
import * as React from 'react';
import {
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {Button, ScrollView, StyleSheet, Text, View} from 'react-native';

declare var IntersectionObserver: Class<IntersectionObserverType>;

export const name = 'IntersectionObserver Explicit Root MDN Example';
export const title = name;
export const description = 'MDN example with an explicit root';

export function render(): React.Node {
  return <IntersectionObserverExplicitRootScrollExample />;
}

/**
 * Showcase threshold of two overlapping elements
 */
component IntersectionObserverExplicitRootScrollExample() {
  const theme = useContext(RNTesterThemeContext);
  const [observationRoot, setObservationRoot] = useState<?HostInstance>(null);

  const [showMargin, setShowMargin] = useState(true);
  const roofRef: React.RefSetter<ScrollViewInstance> = useCallback(
    (rootNode: ?ScrollViewInstance) => {
      if (rootNode != null) {
        setObservationRoot(rootNode);
      }

      return () => {
        setObservationRoot(null);
      };
    },
    [],
  );

  return (
    <ScrollView
      style={{
        width: '60%',
        height: '60%',
        overflow: 'hidden',
        backgroundColor: theme.BackgroundColor,
      }}
      ref={roofRef}>
      <Button
        testID="toggle_margin"
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
        rootNode={observationRoot}
        threshold={0.5}
        rootThreshold={0.5}
        description="Should intersect when item half visible and when item takes up half the viewport"
      />
    </ScrollView>
  );
}

function ListItem(props: {
  position: number,
  rootThreshold?: number,
  rootNode: ?HostInstance,
  threshold: number,
  initialValue?: number,
  description: string,
  style?: ?ViewStyleProp,
}): React.Node {
  const itemRef = useRef<?HostInstance>(null);
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

    if (props.rootNode == null) {
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
      {
        threshold: props.threshold,
        rnRootThreshold: props.rootThreshold,
        // $FlowFixMe[incompatible-type]
        root: props.rootNode,
      },
    );

    // $FlowFixMe[incompatible-type]
    intersectionObserver.observe(itemNode);

    return () => {
      intersectionObserver.disconnect();
    };
  }, [props.position, props.threshold, props.rootThreshold, props.rootNode]);

  return (
    <View
      style={[
        styles.item,
        intersectionRatio >= props.threshold ? styles.intersecting : null,
        intersectionRootRatio >= (props.rootThreshold ?? 1)
          ? styles.rootIntersecting
          : null,
        props.style,
      ]}
      ref={itemRef}>
      {intersectionRatio >= props.threshold ? (
        <Text>Intersecting by threshold</Text>
      ) : null}
      {intersectionRootRatio >= (props.rootThreshold ?? 1) ? (
        <Text>Intersecting by rootThreshold</Text>
      ) : null}
      <Text style={styles.description}>{props.description}</Text>
      {props.rootThreshold != null && (
        <Text>rootThreshold: {props.rootThreshold}</Text>
      )}
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

  container: {},
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  root: {
    width: '60%',
    height: '50%',
  },
  target: {padding: 10, position: 'absolute'},
});

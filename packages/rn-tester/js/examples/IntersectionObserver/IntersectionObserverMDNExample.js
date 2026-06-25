/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

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

export const name = 'IntersectionObserver MDN Example';
export const title = name;
export const description =
  'Copy of the example in MDN about IntersectionObserver with different thresholds.';

export function render(): React.Node {
  return <IntersectionObserverMDNExample />;
}

/**
 * Similar to the example in MDN: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
 */
component IntersectionObserverMDNExample() {
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
      <ListItem position={1} thresholds={buildThresholdList(100)} />
      <ListItem position={2} thresholds={[0.5]} initialValue={0.49} />
      <ListItem position={3} thresholds={buildThresholdList(10)} />
      <ListItem position={4} thresholds={buildThresholdList(4)} />
    </ScrollView>
  );
}

function ListItem(props: {
  position: number,
  thresholds: Array<number>,
  initialValue?: number,
}): React.Node {
  const itemRef = useRef<?ElementRef<typeof View>>(null);
  const intersectionRatioRef = useRef(0);
  const [intersectionRatio, setIntersectionRatio] = useState(
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
          if (
            intersectionRatioRef.current === 0 &&
            entry.intersectionRatio > 0
          ) {
            console.log(
              `Card #${props.position} switched to intersecting (according to thresholds)`,
            );
          } else if (
            intersectionRatioRef.current !== 0 &&
            entry.intersectionRatio === 0
          ) {
            console.log(
              `Card #${props.position} switched to NOT intersecting (according to thresholds)`,
            );
          }
          intersectionRatioRef.current = entry.intersectionRatio;
          setIntersectionRatio(entry.intersectionRatio);
        });
      },
      {threshold: props.thresholds},
    );

    // $FlowFixMe[incompatible-type]
    intersectionObserver.observe(itemNode);

    return () => {
      intersectionObserver.disconnect();
    };
  }, [props.position, props.thresholds]);

  return (
    <View style={styles.item} ref={itemRef}>
      <IntersectionRatioIndicator
        value={intersectionRatio}
        style={{left: 0, top: 0}}
      />
      <IntersectionRatioIndicator
        value={intersectionRatio}
        style={{right: 0, top: 0}}
      />
      <IntersectionRatioIndicator
        value={intersectionRatio}
        style={{left: 0, bottom: 0}}
      />
      <IntersectionRatioIndicator
        value={intersectionRatio}
        style={{right: 0, bottom: 0}}
      />
    </View>
  );
}

function IntersectionRatioIndicator(props: {
  value: number,
  style: {top?: number, bottom?: number, left?: number, right?: number},
}): React.Node {
  return (
    <View style={[styles.intersectionRatioIndicator, props.style]}>
      <Text>{`${Math.floor(props.value * 100)}%`}</Text>
    </View>
  );
}

function buildThresholdList(numSteps: number): Array<number> {
  const thresholds = [];

  for (let i = 1.0; i <= numSteps; i++) {
    const ratio = i / numSteps;
    thresholds.push(ratio);
  }

  thresholds.push(0);
  return thresholds;
}

const styles = StyleSheet.create({
  scrollDownText: {
    textAlign: 'center',
    fontSize: 20,
    marginTop: 20,
  },
  margin: {
    marginBottom: 700,
  },
  item: {
    backgroundColor: 'rgb(245, 170, 140)',
    borderColor: 'rgb(201, 126, 17)',
    borderWidth: 2,
    height: 500,
    margin: 6,
  },
  intersectionRatioIndicator: {
    position: 'absolute',
    padding: 5,
    backgroundColor: 'white',
    opacity: 0.7,
    borderWidth: 1,
    borderColor: 'black',
  },
});

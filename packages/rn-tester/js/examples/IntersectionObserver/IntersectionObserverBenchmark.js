/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

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

declare var IntersectionObserver: Class<IntersectionObserverType>;

export const name = 'IntersectionObserver Benchmark';
export const title = name;
export const description =
  'Example of using IntersectionObserver to observe a large amount of UI elements';

export function render(): React.Node {
  return <IntersectionObserverBenchark />;
}

const ROWS = 100;
const COLUMNS = 5;

component IntersectionObserverBenchark() {
  const [isObserving, setObserving] = useState(false);

  return (
    <>
      <View style={styles.buttonContainer}>
        <Button
          title={isObserving ? 'Stop observing' : 'Start observing'}
          onPress={() => setObserving(observing => !observing)}
        />
      </View>
      <ScrollView>
        {Array(ROWS)
          .fill(null)
          .map((_, row) => (
            <View style={styles.row} key={row}>
              {Array(COLUMNS)
                .fill(null)
                .map((_2, column) => (
                  <Item
                    index={COLUMNS * row + column}
                    observe={isObserving}
                    key={column}
                  />
                ))}
            </View>
          ))}
      </ScrollView>
    </>
  );
}

function Item({index, observe}: {index: number, observe: boolean}): React.Node {
  const theme = useContext(RNTesterThemeContext);
  const ref = useRef<?ElementRef<typeof View>>();

  useLayoutEffect(() => {
    const element = ref.current;

    if (!observe || !element) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        // You can inspect the actual entries here.
        // We don't log them by default to avoid the logs themselves to degrade
        // performance.
      },
      {
        threshold: [0, 1],
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [observe]);

  return (
    <View
      ref={ref}
      style={[
        styles.item,
        {backgroundColor: theme.SecondarySystemBackgroundColor},
      ]}>
      <Text style={[styles.itemText, {color: theme.LabelColor}]}>
        {index + 1}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    padding: 10,
  },
  row: {
    flexDirection: 'row',
  },
  item: {
    flex: 1,
    padding: 12,
    margin: 5,
  },
  itemText: {
    fontSize: 22,
    textAlign: 'center',
  },
});

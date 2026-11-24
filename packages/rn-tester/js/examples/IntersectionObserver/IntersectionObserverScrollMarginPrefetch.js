/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {HostInstance} from 'react-native';

import RNTesterText from '../../components/RNTesterText';
import {RNTesterThemeContext} from '../../components/RNTesterTheme';
import RNTOption from '../../components/RNTOption';
import * as React from 'react';
import {useContext, useLayoutEffect, useRef, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';

export const name = 'IntersectionObserver scrollMargin Prefetch Example';
export const title = name;
export const description =
  'Detect list items 500px before they scroll into view (e.g. to prefetch data or images). Compares rootMargin, which cannot see past the ScrollView clipping the items, with scrollMargin, which can.';

export function render(): React.Node {
  return <IntersectionObserverScrollMarginPrefetchExample />;
}

type MarginMode = 'rootMargin' | 'scrollMargin';

const PREFETCH_DISTANCE = '500px';
const ITEM_COUNT = 50;
const MAX_MESSAGES = 50;

const MODE_EXPLANATIONS: {[mode: MarginMode]: string} = {
  rootMargin: `rootMargin: '${PREFETCH_DISTANCE} 0px' expands the viewport, but the items are still clipped by the ScrollView, so each one is only reported once it is actually visible. Too late to prefetch.`,
  scrollMargin: `scrollMargin: '${PREFETCH_DISTANCE} 0px' expands the clipping area of the ScrollView, so each item is reported ${PREFETCH_DISTANCE} before it scrolls into view.`,
};

component IntersectionObserverScrollMarginPrefetchExample() {
  const theme = useContext(RNTesterThemeContext);
  const [mode, setMode] = useState<MarginMode>('scrollMargin');
  const [messages, setMessages] = useState<ReadonlyArray<string>>([]);
  const [itemsInRange, setItemsInRange] = useState<ReadonlySet<number>>(
    new Set(),
  );
  const itemNodesRef = useRef<Map<number, HostInstance>>(new Map());

  useLayoutEffect(() => {
    setMessages([]);
    setItemsInRange(new Set());

    const itemNumberByNode = new Map<unknown, number>();
    for (const [itemNumber, node] of itemNodesRef.current) {
      itemNumberByNode.set(node, itemNumber);
    }

    const observer = new IntersectionObserver(
      entries => {
        const latestIntersections = new Map<number, boolean>();
        for (const entry of entries) {
          const itemNumber = itemNumberByNode.get(entry.target);
          if (itemNumber == null) {
            continue;
          }
          latestIntersections.set(itemNumber, entry.isIntersecting);
        }

        const entered: Array<number> = [];
        for (const [itemNumber, isIntersecting] of latestIntersections) {
          if (isIntersecting) {
            entered.push(itemNumber);
          }
        }

        if (entered.length > 0) {
          entered.sort((a, b) => a - b);
          setMessages(prev =>
            [
              ...entered
                .map(
                  itemNumber =>
                    `#${itemNumber} is within ${PREFETCH_DISTANCE}: prefetch it`,
                )
                .reverse(),
              ...prev,
            ].slice(0, MAX_MESSAGES),
          );
        }

        setItemsInRange(prev => {
          const next = new Set(prev);
          for (const [itemNumber, isIntersecting] of latestIntersections) {
            if (isIntersecting) {
              next.add(itemNumber);
            } else {
              next.delete(itemNumber);
            }
          }
          return next;
        });
      },
      mode === 'rootMargin'
        ? {rootMargin: `${PREFETCH_DISTANCE} 0px`}
        : {scrollMargin: `${PREFETCH_DISTANCE} 0px`},
    );

    for (const node of itemNodesRef.current.values()) {
      // $FlowFixMe[incompatible-type] React Native host instances implement the global Element interface.
      observer.observe(node);
    }

    return () => {
      observer.disconnect();
    };
  }, [mode]);

  return (
    <View style={styles.container}>
      <View style={styles.toggle}>
        <RNTOption
          label="rootMargin"
          selected={mode === 'rootMargin'}
          onPress={() => setMode('rootMargin')}
        />
        <RNTOption
          label="scrollMargin"
          selected={mode === 'scrollMargin'}
          onPress={() => setMode('scrollMargin')}
        />
      </View>
      <RNTesterText style={styles.explanation}>
        {MODE_EXPLANATIONS[mode]}
      </RNTesterText>
      <View
        style={[
          styles.messageArea,
          {
            backgroundColor: theme.SecondaryGroupedBackgroundColor,
            borderColor: theme.BorderColor,
          },
        ]}>
        <RNTesterText style={styles.messageAreaTitle}>
          {`Within ${PREFETCH_DISTANCE} of the viewport: ${formatItemList(itemsInRange)}`}
        </RNTesterText>
        <ScrollView nestedScrollEnabled={true}>
          {messages.length === 0 ? (
            <RNTesterText style={styles.message}>
              Nothing reported yet
            </RNTesterText>
          ) : (
            messages.map((message, index) => (
              <RNTesterText
                key={messages.length - index}
                style={styles.message}>
                {message}
              </RNTesterText>
            ))
          )}
        </ScrollView>
      </View>
      <ScrollView
        style={[styles.list, {borderColor: theme.BorderColor}]}
        nestedScrollEnabled={true}>
        {Array.from({length: ITEM_COUNT}, (_, index) => {
          const itemNumber = index + 1;
          const isInRange = itemsInRange.has(itemNumber);
          return (
            <View
              key={itemNumber}
              ref={(node: HostInstance | null) => {
                if (node == null) {
                  itemNodesRef.current.delete(itemNumber);
                } else {
                  itemNodesRef.current.set(itemNumber, node);
                }
              }}
              style={[
                styles.item,
                {backgroundColor: theme.TertiarySystemFillColor},
                isInRange && styles.itemInRange,
              ]}>
              <RNTesterText style={styles.itemNumber}>
                {`#${itemNumber}`}
              </RNTesterText>
              <RNTesterText>
                {isInRange ? `Within ${PREFETCH_DISTANCE}` : 'Out of range'}
              </RNTesterText>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function formatItemList(items: ReadonlySet<number>): string {
  if (items.size === 0) {
    return 'none';
  }
  return [...items]
    .sort((a, b) => a - b)
    .map(itemNumber => `#${itemNumber}`)
    .join(', ');
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    gap: 10,
  },
  toggle: {
    flexDirection: 'row',
    gap: 10,
  },
  explanation: {
    fontSize: 13,
  },
  messageArea: {
    height: 150,
    borderWidth: 1,
    borderRadius: 5,
    padding: 8,
  },
  messageAreaTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  message: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  list: {
    height: 300,
    flexGrow: 0,
    borderWidth: 1,
  },
  item: {
    height: 100,
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInRange: {
    backgroundColor: 'rgba(52, 199, 89, 0.35)',
  },
  itemNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

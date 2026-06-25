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
import type IntersectionObserverType from 'react-native/src/private/webapis/intersectionobserver/IntersectionObserver';
import type IntersectionObserverEntry from 'react-native/src/private/webapis/intersectionobserver/IntersectionObserverEntry';

import * as React from 'react';
import {useCallback, useLayoutEffect, useRef, useState} from 'react';
import {Button, StyleSheet, Text, TextInput, View} from 'react-native';

export const name = 'IntersectionObserver Root Clipping Example';
export const title = name;
export const description = 'A root that clips its target';

declare var IntersectionObserver: Class<IntersectionObserverType>;

export function render(): React.Node {
  return <IntersectionObserverClippingRootExample />;
}

function roundRect(rect: unknown): ?{
  x: number,
  y: number,
  width: number,
  height: number,
} {
  if (rect == null || typeof rect !== 'object') {
    return null;
  }
  // $FlowFixMe[prop-missing]
  const x = rect.x;
  // $FlowFixMe[prop-missing]
  const y = rect.y;
  // $FlowFixMe[prop-missing]
  const width = rect.width;
  // $FlowFixMe[prop-missing]
  const height = rect.height;

  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    typeof width !== 'number' ||
    typeof height !== 'number'
  ) {
    return null;
  }
  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
  };
}

/**
 * Showcase clipping when the root has overflow: hidden
 */
component IntersectionObserverClippingRootExample() {
  const rootRef = useRef<?HostInstance>(null);
  const targetRef = useRef<?HostInstance>(null);
  const [intersectionEntry, setIntersectionEntry] =
    useState<?IntersectionObserverEntry>(null);
  const [rootMarginInput, setRootMarginInput] = useState<string>('0');
  const [rootMarginValue, setRootMarginValue] = useState<string>('0px');

  const handleSubmit = useCallback(() => {
    const marginValue = `${rootMarginInput}px`;
    setRootMarginValue(marginValue);
  }, [rootMarginInput]);

  const onObserve = useCallback(
    (entries: ReadonlyArray<IntersectionObserverEntry>) => {
      entries.forEach(entry => {
        setIntersectionEntry(entry);
      });
    },
    [],
  );

  const observer = useRef<?IntersectionObserver>(null);
  useLayoutEffect(() => {
    const rootNode = rootRef.current;
    const targetNode = targetRef.current;

    if (rootNode == null || targetNode == null) {
      return;
    }

    observer.current = new IntersectionObserver(onObserve, {
      // $FlowFixMe[incompatible-type]
      root: rootNode,
      // $FlowExpectedError[prop-missing] rootMargin is not even defined in Flow.
      rootMargin: rootMarginValue,
    });
    // $FlowFixMe[incompatible-type]
    observer.current.observe(targetNode);
    return () => {
      if (rootNode == null || targetNode == null) {
        observer.current?.disconnect();
      }

      // $FlowFixMe[incompatible-type]
      observer.current?.unobserve(targetNode);
    };
  }, [onObserve, rootMarginValue]);

  const CONCEPTUAL_ROOT_SIZE = 200;
  const TARGET_SIZE = 100;
  const rootMarginNumeric = parseFloat(rootMarginInput) || 0;

  // Calculate rootMargin bounds based on conceptual root size
  const rootMarginSize = CONCEPTUAL_ROOT_SIZE + 2 * rootMarginNumeric;
  const rootMarginOffset = -rootMarginNumeric;

  return (
    <>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Root Margin (px):</Text>
        <TextInput
          style={styles.input}
          value={rootMarginInput}
          onChangeText={setRootMarginInput}
          keyboardType="numeric"
          placeholder="0"
        />
        <Button title="Submit" onPress={handleSubmit} />
      </View>
      <Text style={styles.currentMargin}>
        Current Root Margin: {rootMarginValue}
      </Text>
      <Text style={styles.description}>
        This example shows an explicit root (yellow) that clips its target
        (red). The solid background colors show what is visible. The dashed
        borders show the size of root and target before clipping. The purple
        dashed border shows the rootMargin applied. We expect the
        intersectionRect to be unaffected by rootMargin.
      </Text>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.legendClipping]} />
          <Text style={styles.legendText}>Clipped (100x100)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.legendRoot]} />
          <Text style={styles.legendText}>Unclipped Root (200x200)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.legendTarget]} />
          <Text style={styles.legendText}>Target (100x100)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.legendRootMargin]} />
          <Text style={styles.legendText}>Root + Margin (purple)</Text>
        </View>
      </View>
      <View style={styles.visualizationContainer}>
        {/* Show conceptual root size (before clipping) */}
        <View style={styles.conceptualRoot}>
          <View ref={rootRef} style={styles.clipping}>
            <View ref={targetRef} style={styles.target} />
          </View>
        </View>
        {/* Visual indicators showing full extent */}
        <View style={styles.indicatorContainer} pointerEvents="none">
          <View style={styles.rootIndicator}>
            <Text style={[styles.indicatorLabel, styles.rootLabel]}>
              Root ({CONCEPTUAL_ROOT_SIZE}x{CONCEPTUAL_ROOT_SIZE})
            </Text>
          </View>
          <View style={styles.targetIndicator}>
            <Text style={[styles.indicatorLabel, styles.targetLabel]}>
              Target ({TARGET_SIZE}x{TARGET_SIZE})
            </Text>
          </View>
          {/* Root margin indicator */}
          <View
            style={[
              styles.rootMarginIndicator,
              {
                top: rootMarginOffset,
                left: rootMarginOffset,
                width: rootMarginSize,
                height: rootMarginSize,
              },
            ]}>
            <Text style={[styles.indicatorLabel, styles.rootMarginLabel]}>
              Root + Margin ({rootMarginSize}x{rootMarginSize})
            </Text>
          </View>
        </View>
      </View>
      {intersectionEntry != null && (
        <View style={styles.metricsContainer}>
          <Text style={styles.metricsTitle}>
            Intersection Observer Metrics:
          </Text>
          <Text style={styles.metric}>
            Intersecting: {intersectionEntry.isIntersecting.toString()}
          </Text>
          <Text style={styles.metric}>
            Intersection Ratio:{' '}
            {(intersectionEntry.intersectionRatio * 100).toFixed(1)}%
          </Text>
          <Text style={styles.metric}>
            Intersection Rect:{' '}
            {JSON.stringify(roundRect(intersectionEntry.intersectionRect))}
          </Text>
          <Text style={styles.metric}>
            Bounding Client Rect:{' '}
            {JSON.stringify(roundRect(intersectionEntry.boundingClientRect))}
          </Text>
          <Text style={styles.metric}>
            Root Bounds:{' '}
            {JSON.stringify(roundRect(intersectionEntry.rootBounds))}
          </Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 5,
    width: 80,
    fontSize: 14,
  },
  currentMargin: {
    fontSize: 14,
    marginBottom: 5,
    paddingHorizontal: 10,
    fontStyle: 'italic',
  },
  description: {
    fontSize: 13,
    marginBottom: 15,
    paddingHorizontal: 10,
    color: '#555',
  },
  visualizationContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 20,
  },
  conceptualRoot: {
    width: 200,
    height: 200,
    backgroundColor: 'transparent',
  },
  clipping: {
    height: 100,
    width: 100,
    overflow: 'hidden',
    backgroundColor: 'orange',
    borderWidth: 2,
    borderColor: '#999',
  },
  target: {
    backgroundColor: 'rgba(255, 0, 0, 0.5)',
    height: 100,
    width: 100,
    marginTop: 50,
  },
  indicatorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 200,
    height: 200,
  },
  rootIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: 'orange',
    borderStyle: 'dashed',
  },
  targetIndicator: {
    position: 'absolute',
    top: 50,
    left: 0,
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: 'red',
    borderStyle: 'dashed',
  },
  rootMarginIndicator: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: 'rgba(128, 0, 128, 0.6)',
    borderStyle: 'dashed',
  },
  indicatorLabel: {
    fontSize: 10,
    color: '#333',
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 2,
    position: 'absolute',
  },
  rootLabel: {
    top: 5,
    left: 5,
  },
  targetLabel: {
    top: 40,
    left: 5,
  },
  rootMarginLabel: {
    bottom: 5,
    right: 5,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    marginBottom: 15,
    gap: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendBox: {
    width: 20,
    height: 20,
    borderWidth: 1,
  },
  legendClipping: {
    backgroundColor: 'orange',
    borderColor: '#999',
  },
  legendRoot: {
    backgroundColor: 'transparent',
    borderColor: 'orange',
    borderStyle: 'dashed',
    borderWidth: 2,
  },
  legendTarget: {
    backgroundColor: 'rgba(255, 0, 0, 0.5)',
    borderColor: 'red',
  },
  legendIndicator: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    borderColor: '#333',
  },
  legendRootMargin: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    borderColor: 'rgba(128, 0, 128, 0.6)',
    borderWidth: 2,
  },
  legendText: {
    fontSize: 12,
  },
  metricsContainer: {
    paddingHorizontal: 10,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 10,
  },
  metricsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  metric: {
    fontSize: 12,
    marginBottom: 3,
    fontFamily: 'monospace',
  },
});

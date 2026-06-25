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
import DOMRectReadOnly from 'react-native/src/private/webapis/geometry/DOMRectReadOnly';

export const name = 'IntersectionObserver Parent Clipping Example';
export const title = name;
export const description = 'A clipping parent clips both the root and target';

declare var IntersectionObserver: Class<IntersectionObserverType>;

export function render(options?: {e2eTest?: boolean}): React.Node {
  return (
    <IntersectionObserverCustomClippingRootExample
      e2eTest={options?.e2eTest ?? false}
    />
  );
}

/**
 * Formats a DOMRectReadOnly for display with a label.
 */
function formatRect(label: string, rect: ?DOMRectReadOnly): ?string {
  if (rect == null || typeof rect !== 'object') {
    return null;
  }
  const width = rect.width;
  const height = rect.height;

  if (typeof width !== 'number' || typeof height !== 'number') {
    return null;
  }
  return `${label}: width:${Math.round(width)}, height:${Math.round(height)}`;
}

component IntersectionObserverCustomClippingRootExample(
  e2eTest: boolean = false,
) {
  const rootRef = useRef<?HostInstance>(null);
  const targetRef = useRef<?HostInstance>(null);
  const [intersectionEntry, setIntersectionEntry] =
    useState<?IntersectionObserverEntry>(null);
  const [rootMarginInput, setRootMarginInput] = useState<string>('0');
  const [rootMarginValue, setRootMarginValue] = useState<string>('0px');

  const onObserve = useCallback(
    (entries: ReadonlyArray<IntersectionObserverEntry>) => {
      entries.forEach(entry => {
        setIntersectionEntry(entry);
      });
    },
    [],
  );

  const handleSubmit = useCallback(() => {
    const marginValue = `${rootMarginInput}px`;
    setRootMarginValue(marginValue);
  }, [rootMarginInput]);

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

  const ROOT_SIZE = 300;
  const rootMarginNumeric = parseFloat(rootMarginInput) || 0;

  // Calculate rootMargin bounds
  // For positive margins: expands beyond root
  // For negative margins: contracts inside root
  const rootMarginSize = ROOT_SIZE + 2 * rootMarginNumeric;
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
      {!e2eTest && (
        <Text style={styles.description}>
          This example highlights a clipping parent to both the explicit root
          (blue) and target (yellow). The dashed borders show the full extent of
          the root and target, while the solid colors show what's actually
          visible after clipping. The purple dashed border shows the root bounds
          after applying rootMargin.
        </Text>
      )}
      {!e2eTest && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.legendClipping]} />
            <Text style={styles.legendText}>Clipping Area (100x100)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.legendRoot]} />
            <Text style={styles.legendText}>Root (visible)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.legendTarget]} />
            <Text style={styles.legendText}>Target (visible)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.legendIndicator]} />
            <Text style={styles.legendText}>Full extent (dashed)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.legendRootMargin]} />
            <Text style={styles.legendText}>Root + Margin (purple)</Text>
          </View>
        </View>
      )}
      <View style={styles.visualizationContainer}>
        <View style={styles.clippingParent}>
          <View ref={rootRef} style={styles.root}>
            <View ref={targetRef} style={styles.target} />
          </View>
        </View>
        {/* Visual indicators showing full extent of root and target */}
        <View style={styles.indicatorContainer} pointerEvents="none">
          <View style={styles.rootIndicator}>
            <Text style={[styles.indicatorLabel, styles.rootLabel]}>
              Root (300x300)
            </Text>
          </View>
          <View style={styles.targetIndicator}>
            <Text style={[styles.indicatorLabel, styles.targetLabel]}>
              Target (100x100)
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
            {formatRect(
              'Intersection Rect',
              intersectionEntry.intersectionRect,
            )}
          </Text>
          <Text style={styles.metric}>
            {formatRect(
              'Bounding Client Rect',
              intersectionEntry.boundingClientRect,
            )}
          </Text>
          <Text style={styles.metric}>
            {formatRect('Root Bounds', intersectionEntry.rootBounds)}
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
  clippingParent: {
    height: 100,
    width: 100,
    overflow: 'hidden',
    backgroundColor: '#e0e0e0',
    borderWidth: 2,
    borderColor: '#999',
  },
  root: {
    backgroundColor: 'rgba(0, 0, 255, 0.2)',
    height: 300,
    width: 300,
  },
  target: {
    backgroundColor: 'rgba(255, 255, 0, 0.2)',
    marginLeft: -50,
    height: 100,
    width: 100,
  },
  indicatorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 300,
    height: 300,
  },
  rootIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 300,
    height: 300,
    borderWidth: 2,
    borderColor: 'blue',
    borderStyle: 'dashed',
  },
  targetIndicator: {
    position: 'absolute',
    top: 0,
    left: -51,
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: 'orange',
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
    backgroundColor: 'white',
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    marginBottom: 15,
    gap: 15,
  },
  legendItem: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 5,
  },
  legendBox: {
    width: 20,
    height: 20,
    borderWidth: 1,
  },
  legendClipping: {
    backgroundColor: '#e0e0e0',
    borderColor: '#999',
  },
  legendRoot: {
    backgroundColor: 'rgba(0, 0, 255, 0.3)',
    borderColor: 'blue',
  },
  legendTarget: {
    backgroundColor: 'rgba(255, 255, 0, 0.5)',
    borderColor: 'orange',
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

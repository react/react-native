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

import {RNTesterThemeContext} from '../../components/RNTesterTheme';
import * as React from 'react';
import {
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Button,
  PanResponder,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

declare var IntersectionObserver: Class<IntersectionObserverType>;

export const name = 'IntersectionObserver Explicit Root Example';
export const title = name;
export const description =
  'Move target to see intersection ratio with explicit observation root change';

export function render(): React.Node {
  return <IntersectionObserverExplicitRootExample />;
}

/**
 * Showcase threshold of two overlapping elements
 */
component IntersectionObserverExplicitRootExample() {
  const theme = useContext(RNTesterThemeContext);
  const rootRef = useRef<?HostInstance>(null);
  const targetRef = useRef<?HostInstance>(null);
  const [position, setPosition] = useState({left: 20, top: 20});
  const [intersectionRatio, setIntersectionRatio] = useState(0);
  const [rootMarginInput, setRootMarginInput] = useState<string>('0');
  const [rootMarginUnit, setRootMarginUnit] = useState<'px' | '%'>('px');
  const [rootMarginValue, setRootMarginValue] = useState<string>('0px');

  const handleSubmit = useCallback(() => {
    const marginValue = `${rootMarginInput}${rootMarginUnit}`;
    setRootMarginValue(marginValue);
  }, [rootMarginInput, rootMarginUnit]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (evt, gestureState) => {
          setPosition({
            left: position.left + gestureState.dx,
            top: position.top + gestureState.dy,
          });
        },
      }),
    [position],
  );
  const onObserve = useCallback(
    (entries: ReadonlyArray<IntersectionObserverEntry>) => {
      entries.forEach(entry => {
        setIntersectionRatio(entry.intersectionRatio);
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
  }, [position, onObserve, rootMarginValue]);

  const textStyle = useMemo(() => {
    return {color: theme.LabelColor};
  }, [theme]);

  const ROOT_SIZE = 300;
  const rootMarginNumeric = parseFloat(rootMarginInput) || 0;
  const rootMarginInPixels =
    rootMarginUnit === '%'
      ? (rootMarginNumeric / 100) * ROOT_SIZE
      : rootMarginNumeric;

  // Calculate margin indicator dimensions and position
  // For positive margins: indicator is larger and positioned outside
  // For negative margins: indicator is smaller and positioned inside
  const marginIndicatorSize = ROOT_SIZE + 2 * rootMarginInPixels;
  const marginIndicatorOffset = -rootMarginInPixels;

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: theme.SystemBackgroundColor},
      ]}>
      <Text style={[textStyle, styles.instruction]}>
        Change rootMargin and then hit 'Apply' to update IntersectionObserver
      </Text>
      <View style={styles.controls}>
        <Text style={[textStyle, styles.controlLabel]}>Root Margin:</Text>
        <TextInput
          style={[styles.input, {color: theme.LabelColor}]}
          value={rootMarginInput}
          onChangeText={setRootMarginInput}
          keyboardType="numeric"
          placeholder="0"
        />
        <View style={styles.radioGroup}>
          <View style={styles.radioOption}>
            <Button
              title="px"
              onPress={() => setRootMarginUnit('px')}
              color={rootMarginUnit === 'px' ? '#007AFF' : '#999'}
            />
          </View>
          <View style={styles.radioOption}>
            <Button
              title="%"
              onPress={() => setRootMarginUnit('%')}
              color={rootMarginUnit === '%' ? '#007AFF' : '#999'}
            />
          </View>
        </View>
        <Button title="Apply" onPress={handleSubmit} />
      </View>
      <Text style={[textStyle, styles.currentMargin]}>
        Current Root Margin: {rootMarginValue}
      </Text>
      <View style={[styles.visualizationContainer, styles.center]}>
        <View style={styles.visualizationWrapper}>
          <View
            ref={rootRef}
            style={[
              styles.root,
              styles.center,
              {backgroundColor: theme.SystemFillColor},
            ]}>
            <Text style={textStyle}>Root</Text>
            <View
              {...panResponder.panHandlers}
              ref={targetRef}
              style={[
                styles.target,
                styles.center,
                {
                  backgroundColor: theme.SecondarySystemFillColor,
                  transform: [
                    {translateX: position.left},
                    {translateY: position.top},
                  ],
                },
              ]}>
              <Text style={textStyle}>Target: Drag Me Around</Text>
              <Text style={textStyle}>
                Intersection Ratio: {`${Math.floor(intersectionRatio * 100)}%`}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.marginIndicator,
              {
                position: 'absolute',
                top: marginIndicatorOffset,
                left: marginIndicatorOffset,
                width: marginIndicatorSize,
                height: marginIndicatorSize,
                borderColor: 'rgba(255, 0, 0, 0.5)',
                borderWidth: 2,
                borderStyle: 'dashed',
                pointerEvents: 'none',
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  instruction: {
    padding: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 5,
    width: 80,
    fontSize: 14,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 5,
  },
  radioOption: {
    marginHorizontal: 5,
  },
  currentMargin: {
    fontSize: 14,
    paddingHorizontal: 10,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  visualizationContainer: {
    flex: 1,
  },
  visualizationWrapper: {
    position: 'relative',
    width: 300,
    height: 300,
  },
  marginIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  root: {
    width: 300,
    height: 300,
  },
  target: {padding: 10, position: 'absolute'},
});

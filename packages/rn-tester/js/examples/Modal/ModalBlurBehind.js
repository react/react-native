/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {useRef, useState} from 'react';
import {
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const MAX_RADIUS = 80;
const ANIMATION_TYPES = ['none', 'fade', 'slide'] as const;
const SWATCHES = [
  '#e63946',
  '#f4a261',
  '#2a9d8f',
  '#264653',
  '#8338ec',
  '#ffbe0b',
  '#3a86ff',
  '#06d6a0',
];

function RadiusSlider({
  value,
  onChange,
}: {
  value: number,
  onChange: (value: number) => void,
}): React.Node {
  const width = useRef(0);
  const update = (x: number) => {
    if (width.current > 0) {
      const ratio = Math.min(1, Math.max(0, x / width.current));
      onChange(Math.round(ratio * MAX_RADIUS));
    }
  };
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: event => update(event.nativeEvent.locationX),
      onPanResponderMove: event => update(event.nativeEvent.locationX),
    }),
  ).current;

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel="Blur radius"
      accessibilityValue={{min: 0, max: MAX_RADIUS, now: value}}
      accessibilityActions={[{name: 'increment'}, {name: 'decrement'}]}
      onAccessibilityAction={event =>
        onChange(
          Math.min(
            MAX_RADIUS,
            Math.max(
              0,
              value + (event.nativeEvent.actionName === 'increment' ? 5 : -5),
            ),
          ),
        )
      }
      style={styles.sliderHitArea}
      onLayout={event => {
        width.current = event.nativeEvent.layout.width;
      }}
      {...responder.panHandlers}>
      <View pointerEvents="none" style={styles.sliderTrack}>
        <View
          style={[styles.sliderFill, {width: `${(value / MAX_RADIUS) * 100}%`}]}
        />
      </View>
      <View
        pointerEvents="none"
        style={[styles.sliderThumb, {left: `${(value / MAX_RADIUS) * 100}%`}]}
      />
    </View>
  );
}

function ModalBlurBehindExample(): React.Node {
  const [visible, setVisible] = useState(false);
  const [radius, setRadius] = useState(24);
  const [animationType, setAnimationType] =
    useState<(typeof ANIMATION_TYPES)[number]>('fade');

  return (
    <View>
      <View style={styles.swatches}>
        {SWATCHES.map(color => (
          <View key={color} style={[styles.swatch, {backgroundColor: color}]}>
            <Text style={styles.swatchText}>Aa</Text>
          </View>
        ))}
      </View>
      <RNTesterText>blurBehindRadius: {radius} dp</RNTesterText>
      <RadiusSlider value={radius} onChange={setRadius} />
      <View style={styles.row}>
        {ANIMATION_TYPES.map(type => (
          <Pressable
            key={type}
            onPress={() => setAnimationType(type)}
            style={[
              styles.chip,
              animationType === type && styles.chipSelected,
            ]}>
            <Text
              style={
                animationType === type
                  ? styles.chipTextSelected
                  : styles.chipText
              }>
              {type}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        testID="show-blur-modal"
        style={styles.button}
        onPress={() => setVisible(true)}>
        <Text style={styles.buttonText}>Show modal</Text>
      </Pressable>
      <Modal
        transparent={true}
        visible={visible}
        animationType={animationType}
        blurBehindRadius={radius}
        statusBarTranslucent={true}
        navigationBarTranslucent={true}
        onRequestClose={() => setVisible(false)}>
        <View style={styles.centered}>
          <View style={styles.card}>
            <Text style={[styles.cardText, styles.title]}>
              Blur behind: {radius} dp
            </Text>
            <Text style={[styles.cardText, styles.note]}>
              Drag to change the radius while the modal is open. With cross
              window blur turned off (battery saver, "Allow window-level
              blurs"), the content behind is dimmed instead. Android 12+.
            </Text>
            <RadiusSlider value={radius} onChange={setRadius} />
            <Pressable
              testID="hide-blur-modal"
              style={styles.button}
              onPress={() => setVisible(false)}>
              <Text style={styles.buttonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 20,
    marginTop: 12,
    padding: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '85%',
  },
  cardText: {
    color: '#212121',
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  chip: {
    borderColor: '#2196F3',
    borderRadius: 16,
    borderWidth: 1,
    marginEnd: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    color: '#2196F3',
  },
  chipSelected: {
    backgroundColor: '#2196F3',
  },
  chipTextSelected: {
    color: 'white',
  },
  note: {
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    marginTop: 12,
  },
  sliderFill: {
    backgroundColor: '#2196F3',
    borderRadius: 2,
    height: 4,
  },
  sliderHitArea: {
    height: 44,
    justifyContent: 'center',
    marginTop: 8,
  },
  sliderThumb: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    height: 24,
    marginStart: -12,
    position: 'absolute',
    width: 24,
  },
  sliderTrack: {
    backgroundColor: '#cfd8dc',
    borderRadius: 2,
    height: 4,
  },
  swatch: {
    alignItems: 'center',
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    margin: 4,
    width: 56,
  },
  swatchText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default {
  title: 'Modal blur behind',
  name: 'blurBehind',
  description:
    'Blurs the app behind a transparent Modal with the system window blur (Android 12+).',
  platform: 'android',
  render: (): React.Node => <ModalBlurBehindExample />,
} as RNTesterModuleExample;

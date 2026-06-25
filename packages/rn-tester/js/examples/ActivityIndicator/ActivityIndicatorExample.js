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
import type {Node} from 'react';

import * as React from 'react';
import {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';

function ToggleAnimatingActivityIndicator() {
  const timer = useRef<void | TimeoutID>();

  const [animating, setAnimating] = useState(true);

  const setToggleTimeout: () => void = useCallback(() => {
    timer.current = setTimeout(() => {
      setAnimating(currentState => !currentState);
      setToggleTimeout();
    }, 2000);
  }, []);

  useEffect(() => {
    setToggleTimeout();

    return () => {
      clearTimeout(timer.current);
    };
  }, [timer, setToggleTimeout]);

  return (
    <ActivityIndicator
      animating={animating}
      style={[styles.centering, {height: 80}]}
      size="large"
    />
  );
}

const styles = StyleSheet.create({
  centering: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  gray: {
    backgroundColor: '#cccccc',
  },
  horizontal: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 8,
  },
});

exports.displayName = undefined as ?string;
exports.category = 'UI';
exports.framework = 'React';
exports.title = 'ActivityIndicator';
exports.documentationURL = 'https://reactnative.dev/docs/activityindicator';
exports.description = 'Animated loading indicators.';

exports.examples = [
  {
    title: 'Default (small, white)',
    name: 'default',
    render(): Node {
      return (
        <ActivityIndicator
          style={[styles.centering, styles.gray]}
          color="white"
          testID="default_activity_indicator"
          accessibilityLabel="Wait for content to load!"
        />
      );
    },
  },
  {
    title: 'Gray',
    render(): Node {
      return (
        <View>
          <ActivityIndicator style={[styles.centering]} />
          <ActivityIndicator style={[styles.centering, styles.gray]} />
        </View>
      );
    },
  },
  {
    title: 'Custom colors',
    name: 'custom-colors',
    render(): Node {
      return (
        <View style={styles.horizontal}>
          <ActivityIndicator color="#0000ff" />
          <ActivityIndicator color="#aa00aa" />
          <ActivityIndicator color="#aa3300" />
          <ActivityIndicator color="#00aa00" />
        </View>
      );
    },
  },
  {
    title: 'Large',
    render(): Node {
      return (
        <ActivityIndicator
          style={[styles.centering, styles.gray]}
          size="large"
          color="white"
        />
      );
    },
  },
  {
    title: 'Large, custom colors',
    render(): Node {
      return (
        <View style={styles.horizontal}>
          <ActivityIndicator size="large" color="#0000ff" />
          <ActivityIndicator size="large" color="#aa00aa" />
          <ActivityIndicator size="large" color="#aa3300" />
          <ActivityIndicator size="large" color="#00aa00" />
        </View>
      );
    },
  },
  {
    title: 'Start/stop',
    render(): Node {
      return <ToggleAnimatingActivityIndicator />;
    },
  },
  {
    title: 'Custom size',
    render(): Node {
      return (
        <ActivityIndicator
          style={[styles.centering, {transform: [{scale: 1.5}]}]}
          size="large"
        />
      );
    },
  },
  {
    platform: 'android',
    title: 'Custom size (size: 75)',
    render(): Node {
      return <ActivityIndicator style={styles.centering} size={75} />;
    },
  },
] as Array<RNTesterModuleExample>;

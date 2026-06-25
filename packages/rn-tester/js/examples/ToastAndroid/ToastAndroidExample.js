/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {Pressable, StyleSheet, ToastAndroid} from 'react-native';

const ToastWithShortDuration = () => {
  return (
    <Pressable
      onPress={() =>
        ToastAndroid.show('Copied to clipboard!', ToastAndroid.SHORT)
      }>
      <RNTesterText style={styles.text}>Tap to view toast</RNTesterText>
    </Pressable>
  );
};

const ToastWithLongDuration = () => {
  return (
    <Pressable
      onPress={() => ToastAndroid.show('Sending message..', ToastAndroid.LONG)}>
      <RNTesterText style={styles.text}>Tap to view toast</RNTesterText>
    </Pressable>
  );
};

const ToastWithTopGravity = () => {
  return (
    <Pressable
      onPress={() =>
        ToastAndroid.showWithGravity(
          'Download Started..',
          ToastAndroid.SHORT,
          ToastAndroid.TOP,
        )
      }>
      <RNTesterText style={styles.text}>Tap to view toast</RNTesterText>
    </Pressable>
  );
};

const ToastWithCenterGravity = () => {
  return (
    <Pressable
      onPress={() =>
        ToastAndroid.showWithGravity(
          'A problem has been occurred while submitting your data.',
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
        )
      }>
      <RNTesterText style={styles.text}>Tap to view toast</RNTesterText>
    </Pressable>
  );
};

const ToastWithBottomGravity = () => {
  return (
    <Pressable
      onPress={() =>
        ToastAndroid.showWithGravity(
          'Please read the contents carefully.',
          ToastAndroid.SHORT,
          ToastAndroid.BOTTOM,
        )
      }>
      <RNTesterText style={styles.text}>Tap to view toast</RNTesterText>
    </Pressable>
  );
};

const ToastWithXOffset = () => {
  return (
    <Pressable
      onPress={() =>
        ToastAndroid.showWithGravityAndOffset(
          'Alex sent you a friend request',
          ToastAndroid.SHORT,
          ToastAndroid.TOP,
          250,
          0,
        )
      }>
      <RNTesterText style={styles.text}>Tap to view toast</RNTesterText>
    </Pressable>
  );
};

const ToastWithYOffset = () => {
  return (
    <Pressable
      onPress={() =>
        ToastAndroid.showWithGravityAndOffset(
          'There was a problem with your internet connection',
          ToastAndroid.SHORT,
          ToastAndroid.BOTTOM,
          0,
          100,
        )
      }>
      <RNTesterText style={styles.text}>Tap to view toast</RNTesterText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  text: {
    color: 'blue',
  },
});

exports.title = 'Toast Example';
exports.category = 'Android';
exports.description =
  'Example that demonstrates the use of an Android Toast to provide feedback.';
exports.examples = [
  {
    title: 'Toast with Short Duration',
    render(): React.Node {
      return <ToastWithShortDuration />;
    },
  },
  {
    title: 'Toast with Long Duration',
    render(): React.Node {
      return <ToastWithLongDuration />;
    },
  },
  {
    title: 'Toast with Top Gravity',
    render(): React.Node {
      return <ToastWithTopGravity />;
    },
  },
  {
    title: 'Toast with Center Gravity',
    render(): React.Node {
      return <ToastWithCenterGravity />;
    },
  },
  {
    title: 'Toast with Bottom Gravity',
    render(): React.Node {
      return <ToastWithBottomGravity />;
    },
  },
  {
    title: 'Toast with X Offset',
    render(): React.Node {
      return <ToastWithXOffset />;
    },
  },
  {
    title: 'Toast with Y Offset',
    render(): React.Node {
      return <ToastWithYOffset />;
    },
  },
] as Array<RNTesterModuleExample>;

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
import {
  Appearance,
  Button,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';

function ColorSchemeControls(): React.Node {
  const colorScheme = useColorScheme();
  return (
    <View style={styles.controls}>
      <RNTesterText>Color scheme: {colorScheme ?? 'unknown'}</RNTesterText>
      <View style={styles.buttons}>
        <Button
          title="Light"
          onPress={() => Appearance.setColorScheme('light')}
        />
        <Button
          title="Dark"
          onPress={() => Appearance.setColorScheme('dark')}
        />
        <Button
          title="System"
          onPress={() => Appearance.setColorScheme('unspecified')}
        />
      </View>
    </View>
  );
}

// These components do not read the color scheme, so they do not render again
// when it changes. Native code updates their views.
const Card = React.memo(function Card(): React.Node {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Media queries</Text>
      <Text style={styles.cardBody}>
        The colors of this card depend on the color scheme.
      </Text>
    </View>
  );
});

const Bar = React.memo(function Bar(): React.Node {
  return (
    <View style={styles.track}>
      <View style={styles.bar} />
    </View>
  );
});

function ColorSchemeExample(): React.Node {
  return (
    <View>
      <ColorSchemeControls />
      <Card />
    </View>
  );
}

function LayoutExample(): React.Node {
  return (
    <View>
      <ColorSchemeControls />
      <RNTesterText>The bar is wider in the dark color scheme.</RNTesterText>
      <Bar />
    </View>
  );
}

const styles = StyleSheet.create({
  controls: {
    gap: 8,
    marginBottom: 12,
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: {
      default: '#ffffff',
      '@media (prefers-color-scheme: dark)': '#1c1c1e',
    },
    borderColor: {
      default: '#d1d1d6',
      '@media (prefers-color-scheme: dark)': '#48484a',
    },
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: {
      default: '#000000',
      '@media (prefers-color-scheme: dark)': '#ffffff',
    },
  },
  cardBody: {
    color: {
      default: '#3c3c43',
      '@media (prefers-color-scheme: dark)': '#ebebf5',
    },
  },
  track: {
    height: 24,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#8e8e9333',
  },
  bar: {
    height: 24,
    borderRadius: 12,
    width: {default: '40%', '@media (prefers-color-scheme: dark)': '80%'},
    backgroundColor: {
      default: '#007aff',
      '@media (prefers-color-scheme: dark)': '#0a84ff',
    },
  },
});

exports.title = 'Media Queries';
exports.category = 'UI';
exports.description =
  'Style values that depend on media queries, such as the color scheme.';
exports.examples = [
  {
    title: 'Color scheme',
    description:
      'Colors with `@media (prefers-color-scheme: dark)` values. The card does not render again when the color scheme changes.',
    render(): React.MixedElement {
      return <ColorSchemeExample />;
    },
  },
  {
    title: 'Layout',
    description: 'A conditional `width`, which changes the layout.',
    render(): React.MixedElement {
      return <LayoutExample />;
    },
  },
] as Array<RNTesterModuleExample>;

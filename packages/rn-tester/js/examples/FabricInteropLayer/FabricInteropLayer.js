/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';
import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import type {ViewProps} from 'react-native';

import * as React from 'react';
import {useState} from 'react';
import {
  Button,
  StyleSheet,
  Text,
  View,
  requireNativeComponent,
  useColorScheme,
} from 'react-native';

type SectionProps = {
  title: string,
  testID?: string,
  children?: React.Node,
};

const WHITE = '#ffffff';
const BLACK = '#000000';

// ========== JS Definition of the Native RCTInteropTestView component ========
type InteropTestViewProps = {
  // Add custom props here if needed
  ...ViewProps,
};

const NativeInteropTestView =
  requireNativeComponent<InteropTestViewProps>('InteropTestView');

const InteropTestView = (props: InteropTestViewProps) => {
  return <NativeInteropTestView {...props} />;
};

// =============================================================================

function Section({children, title}: SectionProps): React.Node {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? WHITE : BLACK,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? WHITE : BLACK,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
}

function AddChildrenForInteropLayer() {
  const isDarkMode = useColorScheme() === 'dark';
  const [squares, setSquares] = useState<Array<number>>([0, 1, 2, 3, 4]);
  const addMarker = () => {
    setSquares(p => [...p, p.length + 1]);
  };
  return (
    <View
      style={{
        backgroundColor: isDarkMode ? BLACK : WHITE,
      }}>
      <Section title="Squares">
        <Button
          title="Add Marker"
          onPress={addMarker}
          testID="add-marker-btn"
        />
        <Text>{`Number of squares: ${squares.length}`}</Text>
      </Section>
      <Section title="Custom native view" testID="interop-view-content">
        <InteropTestView style={styles.customView}>
          {squares.map((_, index) => (
            <View
              key={index}
              style={styles.customViewChild}
              testID={`marker_${index}`}
            />
          ))}
        </InteropTestView>
      </Section>
      <Section title="Regular view">
        <View style={styles.customView}>
          {squares.map((_, index) => (
            <View key={index} style={styles.customViewChild} />
          ))}
        </View>
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
  customView: {
    width: 300,
    height: 200,
    backgroundColor: 'yellow',
    flexWrap: 'wrap',
    gap: 10,
  },
  customViewChild: {
    width: 50,
    height: 50,
    backgroundColor: 'blue',
  },
});

exports.title = 'FabricInteropLayer';
exports.category = 'UI';
exports.description = 'A set test cases for the Fabric Interop Layer.';
exports.examples = [
  {
    title: 'Add children to Interop Layer',
    description: 'Add children to Interop Layer',
    name: 'add-children',
    render(): React.Node {
      return <AddChildrenForInteropLayer testID="add-children" />;
    },
  },
] as Array<RNTesterModuleExample>;

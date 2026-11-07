/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ViewStyle} from 'react-native';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {Image, StyleSheet, View} from 'react-native';

type Example = {
  label: string,
  corners: Pick<
    ViewStyle,
    | 'borderRadius'
    | 'borderTopLeftRadius'
    | 'borderTopRightRadius'
    | 'borderBottomLeftRadius'
    | 'borderBottomRightRadius',
  >,
  clip: boolean,
  size?: ViewStyle,
  image?: boolean,
  asymmetricBorder?: boolean,
};

export default function ViewBorderCurveExample({
  boundaryCases = false,
  continuous = true,
}: {
  boundaryCases?: boolean,
  continuous?: boolean,
}): React.Node {
  const [loadedImages, setLoadedImages] = React.useState<Set<string>>(
    () => new Set(),
  );
  const curve: 'continuous' | 'circular' = continuous
    ? 'continuous'
    : 'circular';
  const examples: ReadonlyArray<Example> = boundaryCases
    ? [
        {label: 'One corner', corners: styles.single, clip: true},
        {label: 'Diagonal corners', corners: styles.diagonal, clip: true},
        {label: 'Unequal radii', corners: styles.unequal, clip: true},
        {label: 'Large radius', corners: styles.large, clip: true},
        {
          label: 'Narrow box',
          corners: styles.single,
          clip: true,
          size: styles.narrow,
        },
        {
          label: 'Image with border',
          corners: styles.imageCorners,
          clip: true,
          image: true,
        },
        {
          label: 'Unequal image insets',
          corners: styles.imageCorners,
          clip: true,
          image: true,
          asymmetricBorder: true,
        },
      ]
    : [
        {label: 'All corners: background', corners: styles.all, clip: false},
        {
          label: 'Bottom corners: background',
          corners: styles.bottom,
          clip: false,
        },
        {
          label: 'Bottom corners: clipped child',
          corners: styles.bottom,
          clip: true,
        },
        {label: 'Top corners: clipped child', corners: styles.top, clip: true},
      ];

  return (
    <View testID="view-border-curve-example" style={styles.container}>
      <RNTesterText style={styles.label}>Curve: {curve}</RNTesterText>
      <RNTesterText style={styles.label}>
        Red marks the circular reference underneath.
      </RNTesterText>
      <View style={boundaryCases ? styles.grid : styles.list}>
        {examples.map(
          ({label, corners, clip, size, image, asymmetricBorder}) => {
            const foregroundStyle = [
              styles.foreground,
              corners,
              {borderCurve: curve},
              clip && styles.clipped,
            ];
            return (
              <View key={label} style={boundaryCases && styles.cell}>
                <RNTesterText style={styles.label}>{label}</RNTesterText>
                <View
                  style={[
                    styles.reference,
                    boundaryCases && styles.compact,
                    size,
                    corners,
                  ]}>
                  {image === true ? (
                    <Image
                      source={require('../../assets/trees.jpg')}
                      onLoad={() =>
                        setLoadedImages(loaded => new Set(loaded).add(label))
                      }
                      style={[
                        foregroundStyle,
                        styles.image,
                        asymmetricBorder === true && styles.asymmetricBorder,
                      ]}
                    />
                  ) : (
                    <View style={[foregroundStyle, !clip && styles.background]}>
                      {clip && (
                        <View
                          style={[StyleSheet.absoluteFill, styles.background]}
                        />
                      )}
                    </View>
                  )}
                </View>
              </View>
            );
          },
        )}
      </View>
      {boundaryCases && loadedImages.size === 2 && (
        <RNTesterText testID="border-curve-image-loaded" style={styles.label}>
          Images loaded
        </RNTesterText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {padding: 12, gap: 8, backgroundColor: 'white'},
  label: {color: 'black', fontSize: 12},
  list: {gap: 8},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  cell: {width: 150},
  reference: {width: 240, height: 110, backgroundColor: 'red'},
  compact: {width: 150, height: 76},
  narrow: {width: 36},
  foreground: {...StyleSheet.absoluteFill},
  all: {borderRadius: 36},
  bottom: {borderBottomLeftRadius: 36, borderBottomRightRadius: 36},
  top: {borderTopLeftRadius: 36, borderTopRightRadius: 36},
  single: {borderBottomLeftRadius: 24},
  diagonal: {borderTopLeftRadius: 24, borderBottomRightRadius: 24},
  unequal: {borderBottomLeftRadius: 12, borderBottomRightRadius: 24},
  large: {borderBottomLeftRadius: 60, borderBottomRightRadius: 60},
  imageCorners: {borderRadius: 24},
  clipped: {overflow: 'hidden'},
  background: {backgroundColor: '#527FE4'},
  image: {
    width: '100%',
    height: '100%',
    tintColor: '#527FE4',
    borderWidth: 4,
    borderColor: '#222',
  },
  asymmetricBorder: {borderLeftWidth: 10},
});

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

import type {RNTesterModule} from '../../types/RNTesterTypes';

import hotdog from '../../assets/hotdog.jpg';
import * as React from 'react';
import {
  DynamicColorIOS,
  Image,
  Platform,
  PlatformColor,
  StyleSheet,
  View,
} from 'react-native';

const styles = StyleSheet.create({
  box: {
    width: 100,
    height: 100,
  },
  smallBox: {
    width: 50,
    height: 50,
  },
  wrapper: {
    flexDirection: 'row',
  },
  border1: {
    borderWidth: 10,
    borderColor: 'brown',
    borderStyle: 'dotted',
  },
  borderRadius: {
    borderWidth: 10,
    borderRadius: 10,
    borderColor: 'cyan',
  },
  border2: {
    borderWidth: 10,
    borderTopColor: 'red',
    borderRightColor: 'yellow',
    borderBottomColor: 'green',
    borderLeftColor: 'blue',
  },
  border3: {
    borderColor: 'purple',
    borderTopWidth: 7,
    borderRightWidth: 20,
    borderBottomWidth: 10,
    borderLeftWidth: 5,
  },
  border4: {
    borderTopWidth: 10,
    borderTopColor: 'red',
    borderRightWidth: 20,
    borderRightColor: 'yellow',
    borderBottomWidth: 30,
    borderBottomColor: 'green',
    borderLeftWidth: 40,
    borderLeftColor: 'blue',
  },
  border5: {
    borderRadius: 50,
    borderTopWidth: 10,
    borderTopColor: 'red',
    borderRightWidth: 20,
    borderRightColor: 'yellow',
    borderBottomWidth: 30,
    borderBottomColor: 'green',
    borderLeftWidth: 40,
    borderLeftColor: 'blue',
  },
  border6: {
    borderTopWidth: 10,
    borderTopColor: 'red',
    borderRightWidth: 20,
    borderRightColor: 'yellow',
    borderBottomWidth: 30,
    borderBottomColor: 'green',
    borderLeftWidth: 40,
    borderLeftColor: 'blue',

    borderTopLeftRadius: 100,
  },
  border7: {
    borderWidth: 10,
    borderColor: '#f007',
    borderRadius: 30,
    overflow: 'hidden',
  },
  border7_inner: {
    backgroundColor: 'blue',
    width: 100,
    height: 100,
  },
  border8: {
    width: 60,
    height: 60,
    borderColor: 'black',
    marginRight: 10,
    backgroundColor: 'lightgrey',
  },
  border8Top: {
    borderTopWidth: 5,
  },
  border8Left: {
    borderLeftWidth: 5,
    borderStyle: 'dotted',
  },
  border8Bottom: {
    borderBottomWidth: 5,
  },
  border8Right: {
    borderRightWidth: 5,
    borderStyle: 'dashed',
  },
  border9: {
    borderWidth: 10,
    borderTopLeftRadius: 10,
    borderBottomRightRadius: 20,
    borderColor: 'black',
  },
  border9Percentages: {
    borderWidth: 10,
    borderTopLeftRadius: '20%',
    borderBottomRightRadius: '10%',
    borderColor: 'red',
  },
  border10: {
    borderWidth: 10,
    backgroundColor: 'white',
    borderTopLeftRadius: 10,
    borderBottomRightRadius: 20,
    borderColor: 'black',
    elevation: 10,
  },
  border10Percentages: {
    borderWidth: 10,
    backgroundColor: 'white',
    borderTopLeftRadius: '20%',
    borderBottomRightRadius: '10%',
    borderColor: 'red',
    elevation: 10,
  },
  border11: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    overflow: 'hidden',
    borderTopWidth: 50,
    borderRightWidth: 0,
    borderBottomWidth: 50,
    borderLeftWidth: 100,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'red',
  },
  border12: {
    borderStyle: 'solid',
    overflow: 'hidden',
    borderTopWidth: 10,
    borderRightWidth: 20,
    borderBottomWidth: 30,
    borderLeftWidth: 40,
    borderRadius: 20,
  },
  border13: {
    borderStyle: 'solid',
    overflow: 'hidden',
    borderTopWidth: 10,
    borderRightWidth: 20,
    borderBottomWidth: 30,
    borderLeftWidth: 40,
    borderTopColor: 'red',
    borderRightColor: 'green',
    borderBottomColor: 'blue',
    borderLeftColor: 'magenta',
    borderRadius: 20,
  },
  border14: {
    borderStyle: 'solid',
    overflow: 'hidden',
    borderTopWidth: 10,
    borderRightWidth: 20,
    borderBottomWidth: 30,
    borderLeftWidth: 40,
    borderTopColor: 'red',
    borderRightColor: 'green',
    borderBottomColor: 'blue',
    borderLeftColor: 'magenta',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 40,
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 40,
  },
  border15: {
    borderWidth: 10,
    borderColor: Platform.select({
      ios: PlatformColor('systemGray4'),
      android: PlatformColor('@android:color/holo_orange_dark'),
      windows: PlatformColor('SystemAccentColorDark1'),
      default: 'black',
    }),
  },
  border16: {
    borderWidth: 10,
    borderColor:
      Platform.OS === 'ios'
        ? DynamicColorIOS({light: 'magenta', dark: 'cyan'})
        : 'black',
  },
  borderWithoutClipping: {
    borderWidth: 10,
    overflow: 'visible',
  },
  borderWithClipping: {
    borderWidth: 10,
    overflow: 'hidden',
  },
  borderWithClippingAndRadius: {
    borderWidth: 10,
    borderRadius: 30,
    overflow: 'hidden',
  },
  hotdog: {
    width: 100,
    height: 100,
  },
  borderWithChildren: {
    backgroundColor: 'red',
    borderWidth: 10,
    borderRadius: 10,
    borderColor: 'rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
  },
  borderWithChildren2: {
    backgroundColor: 'red',
    borderWidth: 10,
    borderTopLeftRadius: 20,
    borderColor: 'rgba(0, 0, 0, 0.5)',
  },
  childOfBorder: {
    width: 20,
    height: 20,
    left: -10,
    top: -10,
    backgroundColor: 'blue',
  },
});

export default {
  title: 'Border',
  category: 'UI',
  description: 'Demonstrates some of the border styles available to Views.',
  examples: [
    {
      title: 'Equal-Width / Same-Color',
      name: 'equal-width-same-color',
      description: 'borderWidth & borderColor',
      render: function (): React.Node {
        return (
          <View
            testID="border-test-equal-width-same-color"
            style={[styles.box, styles.border1]}
          />
        );
      },
    },
    {
      title: 'Equal-Width / Same-Color',
      name: 'equal-width-same-color-border-radius',
      description: 'borderWidth & borderColor & borderRadius',
      render: function (): React.Node {
        return (
          <View
            testID="border-test-equal-width-same-color-border-radius"
            style={[styles.box, styles.borderRadius]}
          />
        );
      },
    },
    {
      title: 'Equal-Width Borders',
      name: 'equal-width-borders',
      description: 'borderWidth & border*Color',
      render: function (): React.Node {
        return (
          <View
            testID="border-test-equal-width-borders"
            style={[styles.box, styles.border2]}
          />
        );
      },
    },
    {
      title: 'Same-Color Borders',
      name: 'same-color-borders',
      description: 'border*Width & borderColor',
      render: function (): React.Node {
        return (
          <View
            testID="border-test-same-color-borders"
            style={[styles.box, styles.border3]}
          />
        );
      },
    },
    {
      title: 'Custom Borders',
      name: 'custom-borders',
      description: 'border*Width & border*Color',
      render: function (): React.Node {
        return (
          <View
            testID="border-test-custom-borders"
            style={[styles.box, styles.border4]}
          />
        );
      },
    },
    {
      title: 'Custom Borders',
      name: 'custom-borders-ios-1',
      description: 'border*Width & border*Color',
      platform: 'ios',
      render: function (): React.Node {
        return (
          <View
            testID="border-test-custom-borders-ios-1"
            style={[styles.box, styles.border5]}
          />
        );
      },
    },
    {
      title: 'Custom Borders',
      name: 'custom-borders-ios-2',
      description: 'border*Width & border*Color',
      platform: 'ios',
      render: function (): React.Node {
        return (
          <View
            testID="border-test-custom-borders-ios-2"
            style={[styles.box, styles.border6]}
          />
        );
      },
    },
    {
      title: 'Custom Borders',
      name: 'custom-borders-ios-clipping',
      description: 'borderRadius & clipping',
      platform: 'ios',
      render: function (): React.Node {
        return (
          <View
            testID="border-test-custom-borders-ios-clipping"
            style={[styles.box, styles.border7]}>
            <View style={styles.border7_inner} />
          </View>
        );
      },
    },
    {
      title: 'Single Borders',
      name: 'single-borders',
      description: 'top, left, bottom right',
      render: function (): React.Node {
        return (
          <View testID="border-test-single-borders" style={styles.wrapper}>
            <View style={[styles.box, styles.border8, styles.border8Top]} />
            <View style={[styles.box, styles.border8, styles.border8Left]} />
            <View style={[styles.box, styles.border8, styles.border8Bottom]} />
            <View style={[styles.box, styles.border8, styles.border8Right]} />
          </View>
        );
      },
    },
    {
      title: 'Corner Radii',
      name: 'corner-radii',
      description: 'borderTopLeftRadius & borderBottomRightRadius',
      render: function (): React.Node {
        return (
          <View
            testID="border-test-corner-radii"
            style={[styles.box, styles.border9]}
          />
        );
      },
    },
    {
      title: 'Corner Radii (Percentages)',
      name: 'corner-radii-percentages',
      description: 'borderTopLeftRadius & borderBottomRightRadius',
      render: function (): React.Node {
        return (
          <View
            testID="border-test-corner-radii-percentages"
            style={[styles.box, styles.border9Percentages]}
          />
        );
      },
    },
    {
      title: 'Corner Radii / Elevation',
      name: 'corner-radii-elevation',
      description: 'borderTopLeftRadius & borderBottomRightRadius & elevation',
      platform: 'android',
      render: function (): React.Node {
        return (
          <View
            testID="border-test-corner-radii-elevation"
            style={[styles.box, styles.border10]}
          />
        );
      },
    },
    {
      title: 'Corner Radii / Elevation (Percentages)',
      name: 'corner-radii-elevation-percentages',
      description: 'borderTopLeftRadius & borderBottomRightRadius & elevation',
      platform: 'android',
      render: function (): React.Node {
        return (
          <View
            testID="border-test-corner-radii-elevation-percentages"
            style={[styles.box, styles.border10Percentages]}
          />
        );
      },
    },
    {
      title: 'CSS Trick - Triangle',
      name: 'css-trick-triangle',
      description: 'create a triangle by manipulating border colors and widths',
      render: function (): React.Node {
        return (
          <View
            testID="border-test-css-trick-triangle"
            style={[styles.border11]}
          />
        );
      },
    },
    {
      title: 'Curved border(Left|Right|Bottom|Top)Width',
      name: 'curved-border-lrbt-width',
      description: 'Make a non-uniform width curved border',
      render: function (): React.Node {
        return (
          <View
            testID="border-test-curved-border-lrbt-width"
            style={[styles.box, styles.border12]}
          />
        );
      },
    },
    {
      title: 'Curved border(Left|Right|Bottom|Top)Color',
      name: 'curved-border-lrbt-color',
      description: 'Make a non-uniform color curved border',
      render: function (): React.Node {
        return (
          <View
            testID="border-test-curved-border-lrbt-color"
            style={[styles.box, styles.border13]}
          />
        );
      },
    },
    {
      title: 'Curved border(Top|Bottom)(Left|Right)Radius',
      name: 'curved-border-tb-lr-radius',
      description: 'Make a non-uniform radius curved border',
      render: function (): React.Node {
        return (
          <View
            testID="border-test-curved-border-tb-lr-radius"
            style={[styles.box, styles.border14]}
          />
        );
      },
    },
    {
      title: 'System color',
      name: 'system-color',
      description: 'Using a platform color',
      render: function (): React.Node {
        return (
          <View
            testID="border-test-system-color"
            style={[styles.box, styles.border15]}
          />
        );
      },
    },
    {
      title: 'Dynamic color',
      name: 'dynamic-color-ios',
      description: 'Using a custom dynamic color',
      platform: 'ios',
      render: function (): React.Node {
        return (
          <View
            testID="border-test-dynamic-color-ios"
            style={[styles.box, styles.border16]}
          />
        );
      },
    },
    {
      title: 'Child without clipping',
      name: 'child-no-clipping',
      description:
        '"overflow: visible" will cause child content to show above borders',
      render: function (): React.Node {
        return (
          <View
            testID="border-test-child-no-clipping"
            style={[styles.box, styles.borderWithoutClipping]}>
            <Image source={hotdog} style={styles.hotdog} />
          </View>
        );
      },
    },
    {
      title: 'Child clipping',
      name: 'child-clipping',
      description:
        '"overflow: hidden" will cause child content to be clipped to borders',
      render: function (): React.Node {
        return (
          <View
            testID="border-test-child-clipping"
            style={[styles.box, styles.borderWithClipping]}>
            <Image source={hotdog} style={styles.hotdog} />
          </View>
        );
      },
    },
    {
      title: 'Child clipping with radius',
      name: 'child-clipping-radius',
      description:
        '"overflow: hidden" will cause child content to be clipped to rounded corners',
      render: function (): React.Node {
        return (
          <View
            testID="border-test-child-clipping-radius"
            style={[styles.box, styles.borderWithClippingAndRadius]}>
            <Image source={hotdog} style={styles.hotdog} />
          </View>
        );
      },
    },
    {
      title: 'Borders and children compliance',
      name: 'border-clipping-compliance',
      description: 'Some edge cases of Views with borders and children.',
      render: function (): React.Node {
        return (
          <View
            testID="border-test-border-clipping-compliance"
            style={{flexDirection: 'row', gap: '10'}}>
            <View style={[styles.smallBox, styles.borderWithChildren]}>
              <View style={styles.childOfBorder} />
            </View>
            <View
              style={[
                styles.smallBox,
                styles.borderWithChildren2,
                {overflow: 'hidden'},
              ]}>
              <View style={styles.childOfBorder} />
            </View>
            <View style={[styles.smallBox, styles.borderWithChildren2]}>
              <View style={[styles.childOfBorder, {left: -15, top: 0}]} />
            </View>
            <View
              style={[
                styles.smallBox,
                styles.borderWithChildren2,
                {borderStyle: 'dashed', overflow: 'hidden'},
              ]}>
              <View style={[styles.childOfBorder, {left: -15, top: 0}]} />
            </View>
          </View>
        );
      },
    },
    {
      title: 'Borders and scaling transforms',
      name: 'scaling-transforms',
      description: 'Ensure borders can render properly with scaling transforms',
      render: function (): React.Node {
        return (
          <View testID="border-test-scaling-transforms" style={{padding: 10}}>
            <View
              style={[
                styles.smallBox,
                {
                  backgroundColor: 'red',
                  borderLeftWidth: 10,
                  borderRadius: 10,
                  transform: [{scale: 1.2}],
                },
              ]}
            />
          </View>
        );
      },
    },
  ],
} as RNTesterModule;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import type {ColorValue} from 'react-native';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {
  Appearance,
  Button,
  DynamicColorIOS,
  Platform,
  PlatformColor,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';

function PlatformColorsExample() {
  function createTable() {
    let colors: Array<{
      color: ReturnType<typeof PlatformColor>,
      label: string,
    }> = [];
    if (Platform.OS === 'ios') {
      colors = [
        // https://developer.apple.com/documentation/uikit/uicolor/ui_element_colors
        // Label Colors
        {label: 'label', color: PlatformColor('label')},
        {
          label: 'secondaryLabel',
          color: PlatformColor('secondaryLabel'),
        },
        {
          label: 'tertiaryLabel',
          color: PlatformColor('tertiaryLabel'),
        },
        {
          label: 'quaternaryLabel',
          color: PlatformColor('quaternaryLabel'),
        },
        // Fill Colors
        {label: 'systemFill', color: PlatformColor('systemFill')},
        {
          label: 'secondarySystemFill',
          color: PlatformColor('secondarySystemFill'),
        },
        {
          label: 'tertiarySystemFill',
          color: PlatformColor('tertiarySystemFill'),
        },
        {
          label: 'quaternarySystemFill',
          color: PlatformColor('quaternarySystemFill'),
        },
        // Text Colors
        {
          label: 'placeholderText',
          color: PlatformColor('placeholderText'),
        },
        // Standard Content Background Colors
        {
          label: 'systemBackground',
          color: PlatformColor('systemBackground'),
        },
        {
          label: 'secondarySystemBackground',
          color: PlatformColor('secondarySystemBackground'),
        },
        {
          label: 'tertiarySystemBackground',
          color: PlatformColor('tertiarySystemBackground'),
        },
        // Grouped Content Background Colors
        {
          label: 'systemGroupedBackground',
          color: PlatformColor('systemGroupedBackground'),
        },
        {
          label: 'secondarySystemGroupedBackground',
          color: PlatformColor('secondarySystemGroupedBackground'),
        },
        {
          label: 'tertiarySystemGroupedBackground',
          color: PlatformColor('tertiarySystemGroupedBackground'),
        },
        // Separator Colors
        {label: 'separator', color: PlatformColor('separator')},
        {
          label: 'opaqueSeparator',
          color: PlatformColor('opaqueSeparator'),
        },
        // Link Color
        {label: 'link', color: PlatformColor('link')},
        // Nonadaptable Colors
        {label: 'darkText', color: PlatformColor('darkText')},
        {label: 'lightText', color: PlatformColor('lightText')},
        // https://developer.apple.com/documentation/uikit/uicolor/standard_colors
        // Adaptable Colors
        {label: 'systemBlue', color: PlatformColor('systemBlue')},
        {label: 'systemBrown', color: PlatformColor('systemBrown')},
        {label: 'systemGreen', color: PlatformColor('systemGreen')},
        {label: 'systemIndigo', color: PlatformColor('systemIndigo')},
        {label: 'systemOrange', color: PlatformColor('systemOrange')},
        {label: 'systemPink', color: PlatformColor('systemPink')},
        {label: 'systemPurple', color: PlatformColor('systemPurple')},
        {label: 'systemRed', color: PlatformColor('systemRed')},
        {label: 'systemTeal', color: PlatformColor('systemTeal')},
        {label: 'systemYellow', color: PlatformColor('systemYellow')},
        // Adaptable Gray Colors
        {label: 'systemGray', color: PlatformColor('systemGray')},
        {label: 'systemGray2', color: PlatformColor('systemGray2')},
        {label: 'systemGray3', color: PlatformColor('systemGray3')},
        {label: 'systemGray4', color: PlatformColor('systemGray4')},
        {label: 'systemGray5', color: PlatformColor('systemGray5')},
        {label: 'systemGray6', color: PlatformColor('systemGray6')},
        // Transparent Color
        {label: 'clear', color: PlatformColor('clear')},
        {label: 'customColor', color: PlatformColor('customColor')},
      ];
    } else if (Platform.OS === 'android') {
      colors = [
        {label: '?attr/colorAccent', color: PlatformColor('?attr/colorAccent')},
        {
          label: '?attr/colorBackgroundFloating',
          color: PlatformColor('?attr/colorBackgroundFloating'),
        },
        {
          label: '?attr/colorButtonNormal',
          color: PlatformColor('?attr/colorButtonNormal'),
        },
        {
          label: '?attr/colorControlActivated',
          color: PlatformColor('?attr/colorControlActivated'),
        },
        {
          label: '?attr/colorControlHighlight',
          color: PlatformColor('?attr/colorControlHighlight'),
        },
        {
          label: '?attr/colorControlNormal',
          color: PlatformColor('?attr/colorControlNormal'),
        },
        {
          label: '?android:colorError',
          color: PlatformColor('?android:colorError'),
        },
        {
          label: '?android:attr/colorError',
          color: PlatformColor('?android:attr/colorError'),
        },
        {
          label: '?attr/colorPrimary',
          color: PlatformColor('?attr/colorPrimary'),
        },
        {label: '?colorPrimaryDark', color: PlatformColor('?colorPrimaryDark')},
        {
          label: '@android:color/holo_purple',
          color: PlatformColor('@android:color/holo_purple'),
        },
        {
          label: '@android:color/holo_green_light',
          color: PlatformColor('@android:color/holo_green_light'),
        },
        {
          label: '@color/catalyst_redbox_background',
          color: PlatformColor('@color/catalyst_redbox_background'),
        },
        {
          label: '@color/catalyst_logbox_background',
          color: PlatformColor('@color/catalyst_logbox_background'),
        },
      ];
    }

    let table = [];
    for (let color of colors) {
      table.push(
        <View style={styles.row} key={color.label}>
          <RNTesterText style={styles.labelCell}>{color.label}</RNTesterText>
          <View
            style={{
              ...styles.colorCell,
              backgroundColor: color.color,
            }}
          />
        </View>,
      );
    }
    return table;
  }

  return <View style={styles.column}>{createTable()}</View>;
}

function FallbackColorsExample() {
  let color: {label?: string, color?: ColorValue} = {};
  if (Platform.OS === 'ios') {
    color = {
      label: "PlatformColor('bogus', 'systemGreenColor')",
      color: PlatformColor('bogus', 'systemGreenColor'),
    };
  } else if (Platform.OS === 'android') {
    color = {
      label: "PlatformColor('bogus', '@color/catalyst_redbox_background')",
      color: PlatformColor('bogus', '@color/catalyst_redbox_background'),
    };
  } else {
    color = {
      label: 'Unexpected Platform.OS: ' + Platform.OS,
      color: 'red',
    };
  }

  return (
    <View style={styles.column}>
      <View style={styles.row}>
        <RNTesterText style={styles.labelCell}>{color.label}</RNTesterText>
        <View
          style={{
            ...styles.colorCell,
            backgroundColor: color.color,
            borderColor: color.color,
          }}
        />
      </View>
    </View>
  );
}

function DynamicColorsExample() {
  return Platform.OS === 'ios' ? (
    <View style={styles.column}>
      <View style={styles.row}>
        <RNTesterText style={styles.labelCell}>
          DynamicColorIOS({'{\n'}
          {'  '}light: 'red', dark: 'blue'{'\n'}
          {'}'})
        </RNTesterText>
        <View
          style={{
            ...styles.colorCell,
            backgroundColor: DynamicColorIOS({light: 'red', dark: 'blue'}),
          }}
        />
      </View>
      <View style={styles.row}>
        <RNTesterText style={styles.labelCell}>
          DynamicColorIOS({'{\n'}
          {'  '}light: 'red', dark: 'blue'{'\n'}
          {'}'})
        </RNTesterText>
        <View
          style={{
            ...styles.colorCell,
            borderColor: DynamicColorIOS({light: 'red', dark: 'blue'}),
            borderWidth: 1,
          }}
        />
      </View>
      <View style={styles.row}>
        <RNTesterText style={styles.labelCell}>
          DynamicColorIOS({'{\n'}
          {'  '}light: PlatformColor('systemBlueColor'),{'\n'}
          {'  '}dark: PlatformColor('systemRedColor'),{'\n'}
          {'}'})
        </RNTesterText>
        <View
          style={{
            ...styles.colorCell,
            backgroundColor: DynamicColorIOS({
              light: PlatformColor('systemBlueColor'),
              dark: PlatformColor('systemRedColor'),
            }),
          }}
        />
      </View>
    </View>
  ) : (
    <RNTesterText style={styles.labelCell}>
      Not applicable on this platform
    </RNTesterText>
  );
}

function VariantColorsExample() {
  return (
    <View style={styles.column}>
      <View style={styles.row}>
        <RNTesterText style={styles.labelCell}>
          {Platform.select({
            ios: "DynamicColorIOS({light: 'red', dark: 'blue'})",
            android: "PlatformColor('?attr/colorAccent')",
            default: 'Unexpected Platform.OS: ' + Platform.OS,
          })}
        </RNTesterText>
        <View
          style={{
            ...styles.colorCell,
            backgroundColor:
              Platform.OS === 'ios'
                ? DynamicColorIOS({light: 'red', dark: 'blue'})
                : Platform.OS === 'android'
                  ? PlatformColor('?attr/colorAccent')
                  : 'red',
          }}
        />
      </View>
    </View>
  );
}

function ReactsToAppearanceChangesExample() {
  const theme = useColorScheme();
  const key = Platform.select({
    android: theme ?? '',
    default: undefined,
  });

  return (
    // using a key here forces the component to unmount and remount
    // which is necessary to trigger the appearance change
    <View style={styles.column} key={key}>
      <View style={styles.row}>
        <RNTesterText style={styles.labelCell}>
          {Platform.select({
            ios: "DynamicColorIOS({light: 'red', dark: 'blue'})",
            android: "PlatformColor('?attr/colorAccent')",
            default: 'Unexpected Platform.OS: ' + Platform.OS,
          })}
        </RNTesterText>
        <View
          style={{
            ...styles.colorCell,
            backgroundColor:
              Platform.OS === 'ios'
                ? DynamicColorIOS({light: 'red', dark: 'blue'})
                : Platform.OS === 'android'
                  ? PlatformColor('?attr/colorAccent')
                  : 'red',
          }}
        />
      </View>
      <View style={styles.separator} />
      <Button
        title="Change Appearance"
        onPress={() => {
          Appearance.setColorScheme(theme === 'dark' ? 'light' : 'dark');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  column: {flex: 1, flexDirection: 'column'},
  row: {flex: 0.75, flexDirection: 'row'},
  labelCell: {
    flex: 1,
    alignItems: 'stretch',
    ...Platform.select({
      ios: {color: PlatformColor('labelColor')},
    }),
  },
  colorCell: {flex: 0.25, alignItems: 'stretch'},
  separator: {height: 8},
});

exports.title = 'PlatformColor';
exports.category = 'Basic';
exports.documentationURL = 'https://reactnative.dev/docs/platformcolor';
exports.description =
  'Examples that show how PlatformColors may be used in an app.';
exports.examples = [
  {
    title: 'Platform Colors',
    render(): React.MixedElement {
      return <PlatformColorsExample />;
    },
  },
  {
    title: 'Fallback Colors',
    render(): React.MixedElement {
      return <FallbackColorsExample />;
    },
  },
  {
    title: 'iOS Dynamic Colors',
    render(): React.MixedElement {
      return <DynamicColorsExample />;
    },
  },
  {
    title: 'Variant Colors',
    render(): React.MixedElement {
      return <VariantColorsExample />;
    },
  },
  {
    title: 'Reacts to Appearance Changes',
    render(): React.MixedElement {
      return <ReactsToAppearanceChangesExample />;
    },
  },
] as Array<RNTesterModuleExample>;

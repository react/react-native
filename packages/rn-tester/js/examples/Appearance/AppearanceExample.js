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
import type {ColorSchemeName} from 'react-native';

import RNTesterText from '../../components/RNTesterText';
import {RNTesterThemeContext, themes} from '../../components/RNTesterTheme';
import * as React from 'react';
import {useEffect, useState} from 'react';
import {Appearance, Button, Text, View, useColorScheme} from 'react-native';

function ColorSchemeSubscription() {
  const [colorScheme, setColorScheme] = useState<?ColorSchemeName>(
    Appearance.getColorScheme(),
  );

  useEffect(() => {
    const subscription = Appearance.addChangeListener(
      ({colorScheme: newColorScheme}) => {
        setColorScheme(newColorScheme);
      },
    );
    return () => subscription.remove();
  }, [setColorScheme]);

  return (
    <RNTesterThemeContext.Consumer>
      {theme => {
        return (
          <ThemedContainer>
            <ThemedText>{colorScheme}</ThemedText>
          </ThemedContainer>
        );
      }}
    </RNTesterThemeContext.Consumer>
  );
}

const ThemedContainer = (props: {children: React.Node}) => (
  <RNTesterThemeContext.Consumer>
    {theme => {
      return (
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 16,
            backgroundColor: theme.SystemBackgroundColor,
          }}>
          {props.children}
        </View>
      );
    }}
  </RNTesterThemeContext.Consumer>
);

const ThemedText = (props: {children: React.Node | string}) => (
  <RNTesterThemeContext.Consumer>
    {theme => {
      return <Text style={{color: theme.LabelColor}}>{props.children}</Text>;
    }}
  </RNTesterThemeContext.Consumer>
);

const AppearanceViaHook = () => {
  const colorScheme = useColorScheme();
  return (
    <RNTesterThemeContext.Provider
      value={colorScheme === 'dark' ? themes.dark : themes.light}>
      <ThemedContainer>
        <ThemedText>useColorScheme(): {colorScheme}</ThemedText>
      </ThemedContainer>
    </RNTesterThemeContext.Provider>
  );
};

const ColorShowcase = (props: {themeName: string}) => (
  <RNTesterThemeContext.Consumer>
    {theme => {
      return (
        <View
          style={{
            marginVertical: 20,
            backgroundColor: theme.SystemBackgroundColor,
          }}>
          <Text style={{fontWeight: '700', color: theme.LabelColor}}>
            {props.themeName}
          </Text>
          {Object.keys(theme).map(
            key =>
              typeof theme[key] === 'string' && (
                <View style={{flexDirection: 'row'}} key={key}>
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      backgroundColor: theme[key],
                    }}
                  />
                  <View>
                    <Text
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 2,
                        color: theme.LabelColor,
                        fontWeight: '600',
                      }}>
                      {key}
                    </Text>
                    <Text
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 2,
                        color: theme.LabelColor,
                      }}>
                      {theme[key]}
                    </Text>
                  </View>
                </View>
              ),
          )}
        </View>
      );
    }}
  </RNTesterThemeContext.Consumer>
);

const ToggleNativeAppearance = () => {
  const [nativeColorScheme, setNativeColorScheme] = useState<
    ColorSchemeName | 'auto',
  >('auto');
  const colorScheme = useColorScheme();

  useEffect(() => {
    Appearance.setColorScheme(nativeColorScheme);
  }, [nativeColorScheme]);

  return (
    <View>
      <RNTesterText>Native colorScheme: {nativeColorScheme}</RNTesterText>
      <RNTesterText>Current colorScheme: {colorScheme}</RNTesterText>
      <Button
        title="Set to light"
        onPress={() => setNativeColorScheme('light')}
      />
      <Button
        title="Set to dark"
        onPress={() => setNativeColorScheme('dark')}
      />
      <Button title="Auto" onPress={() => setNativeColorScheme('auto')} />
    </View>
  );
};

exports.title = 'Appearance';
exports.category = 'UI';
exports.documentationURL = 'https://reactnative.dev/docs/appearance';
exports.description = 'Light and dark user interface examples.';
exports.examples = [
  {
    title: 'useColorScheme hook',
    render(): React.Node {
      return <AppearanceViaHook />;
    },
  },
  {
    title: 'Non-component `getColorScheme` API',
    render(): React.MixedElement {
      return <ColorSchemeSubscription />;
    },
  },
  {
    title: 'Consuming Context',
    render(): React.MixedElement {
      return (
        <RNTesterThemeContext.Consumer>
          {theme => {
            return (
              <ThemedContainer>
                <ThemedText>
                  This block of text inherits its theme via Context.
                </ThemedText>
              </ThemedContainer>
            );
          }}
        </RNTesterThemeContext.Consumer>
      );
    },
  },
  {
    title: 'Context forced to light theme',
    name: 'forced-light',
    render(): React.MixedElement {
      return (
        <RNTesterThemeContext.Provider value={themes.light}>
          <ThemedContainer>
            <ThemedText>
              This block of text will always render with a light theme.
            </ThemedText>
          </ThemedContainer>
        </RNTesterThemeContext.Provider>
      );
    },
  },
  {
    title: 'Context forced to dark theme',
    name: 'forced-dark',
    render(): React.MixedElement {
      return (
        <RNTesterThemeContext.Provider value={themes.dark}>
          <ThemedContainer>
            <ThemedText>
              This block of text will always render with a dark theme.
            </ThemedText>
          </ThemedContainer>
        </RNTesterThemeContext.Provider>
      );
    },
  },
  {
    title: 'RNTester App Colors',
    description: 'A light and a dark theme based on standard iOS 13 colors.',
    render(): React.MixedElement {
      return (
        <View>
          <RNTesterThemeContext.Provider value={themes.light}>
            <ColorShowcase themeName="Light Mode" />
          </RNTesterThemeContext.Provider>
          <RNTesterThemeContext.Provider value={themes.dark}>
            <ColorShowcase themeName="Dark Mode" />
          </RNTesterThemeContext.Provider>
        </View>
      );
    },
  },
  {
    title: 'Toggle native appearance',
    description: 'Overwrite application-level appearance mode',
    render(): React.MixedElement {
      return <ToggleNativeAppearance />;
    },
  },
] as Array<RNTesterModuleExample>;

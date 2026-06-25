/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ColorValue, ImageSource} from 'react-native';

import * as React from 'react';
import {createContext} from 'react';
import {use} from 'react';
import {Appearance} from 'react-native';

export type RNTesterTheme = Readonly<{
  LabelColor: ColorValue,
  SecondaryLabelColor: ColorValue,
  TertiaryLabelColor: ColorValue,
  QuaternaryLabelColor: ColorValue,

  PlaceholderTextColor: ColorValue,

  SystemBackgroundColor: ColorValue,
  SecondarySystemBackgroundColor: ColorValue,
  TertiarySystemBackgroundColor: ColorValue,

  GroupedBackgroundColor: ColorValue,
  SecondaryGroupedBackgroundColor: ColorValue,
  TertiaryGroupedBackgroundColor: ColorValue,

  SystemFillColor: ColorValue,
  SecondarySystemFillColor: ColorValue,
  TertiarySystemFillColor: ColorValue,
  QuaternarySystemFillColor: ColorValue,

  SeparatorColor: ColorValue,
  OpaqueSeparatorColor: ColorValue,
  LinkColor: ColorValue,
  SystemRedColor: ColorValue,
  SystemGreenColor: ColorValue,
  ToolbarColor: ColorValue,
  BackgroundColor: ColorValue,
  BorderColor: ColorValue,

  NavBarLabelActiveColor: ColorValue,
  NavBarLabelInactiveColor: ColorValue,
  NavBarComponentsActiveIcon: ImageSource,
  NavBarComponentsInactiveIcon: ImageSource,
  NavBarAPIsActiveIcon: ImageSource,
  NavBarAPIsInactiveIcon: ImageSource,
  NavBarPlaygroundActiveIcon: ImageSource,
  NavBarPlaygroundInactiveIcon: ImageSource,
  ...
}>;

export const RNTesterLightTheme = {
  LabelColor: '#000000ff',
  SecondaryLabelColor: '#3c3c4399',
  TertiaryLabelColor: '#3c3c434c',
  QuaternaryLabelColor: '#3c3c432d',

  PlaceholderTextColor: '#3c3c434c',

  SystemBackgroundColor: '#ffffffff',
  SecondarySystemBackgroundColor: '#f2f2f7ff',
  TertiarySystemBackgroundColor: '#ffffffff',

  GroupedBackgroundColor: '#f2f2f7ff',
  SecondaryGroupedBackgroundColor: '#ffffffff',
  TertiaryGroupedBackgroundColor: '#f2f2f7ff',

  SystemFillColor: '#78788033',
  SecondarySystemFillColor: '#78788028',
  TertiarySystemFillColor: '#7676801e',
  QuaternarySystemFillColor: '#74748014',

  SeparatorColor: '#3c3c4349',
  OpaqueSeparatorColor: '#c6c6c8ff',

  LinkColor: '#007affff',
  SystemRedColor: '#ff3b30ff',
  SystemGreenColor: '#34c759ff',
  ToolbarColor: '#e9eaedff',
  BackgroundColor: '#f3f8ffff',
  BorderColor: '#005dffff',

  NavBarLabelActiveColor: '#5e5f62ff',
  NavBarLabelInactiveColor: '#b1b4baff',
  NavBarComponentsActiveIcon: require('./../assets/bottom-nav-components-icon-dark.png'),
  NavBarComponentsInactiveIcon: require('./../assets/bottom-nav-components-icon-light.png'),
  NavBarAPIsActiveIcon: require('./../assets/bottom-nav-apis-icon-dark.png'),
  NavBarAPIsInactiveIcon: require('./../assets/bottom-nav-apis-icon-light.png'),
  NavBarPlaygroundActiveIcon: require('./../assets/bottom-nav-playgrounds-icon-dark.png'),
  NavBarPlaygroundInactiveIcon: require('./../assets/bottom-nav-playgrounds-icon-light.png'),
};

export const RNTesterDarkTheme = {
  LabelColor: '#ffffffff',
  SecondaryLabelColor: '#ebebf599',
  TertiaryLabelColor: '#ebebf54c',
  QuaternaryLabelColor: '#ebebf528',

  PlaceholderTextColor: '#ebebf54c',

  SystemBackgroundColor: '#000000ff',
  SecondarySystemBackgroundColor: '#1c1c1eff',
  TertiarySystemBackgroundColor: '#2c2c2eff',

  GroupedBackgroundColor: '#000000ff',
  SecondaryGroupedBackgroundColor: '#1c1c1eff',
  TertiaryGroupedBackgroundColor: '#2c2c2eff',

  SystemFillColor: '#7878805b',
  SecondarySystemFillColor: '#78788051',
  TertiarySystemFillColor: '#7676803d',
  QuaternarySystemFillColor: '#7676802d',

  SeparatorColor: '#54545899',
  OpaqueSeparatorColor: '#38383aff',

  LinkColor: '#0984ffff',
  SystemRedColor: '#ff375fff',
  SystemGreenColor: '#30d158ff',
  ToolbarColor: '#3c3c43ff',
  BackgroundColor: '#0c0700ff',
  BorderColor: '#005dffff',

  NavBarLabelActiveColor: '#b1b4baff',
  NavBarLabelInactiveColor: '#5e5f62ff',
  NavBarComponentsActiveIcon: require('./../assets/bottom-nav-components-icon-light.png'),
  NavBarComponentsInactiveIcon: require('./../assets/bottom-nav-components-icon-dark.png'),
  NavBarAPIsActiveIcon: require('./../assets/bottom-nav-apis-icon-light.png'),
  NavBarAPIsInactiveIcon: require('./../assets/bottom-nav-apis-icon-dark.png'),
  NavBarPlaygroundActiveIcon: require('./../assets/bottom-nav-playgrounds-icon-light.png'),
  NavBarPlaygroundInactiveIcon: require('./../assets/bottom-nav-playgrounds-icon-dark.png'),
};

export const themes = {light: RNTesterLightTheme, dark: RNTesterDarkTheme};
export const RNTesterThemeContext: React.Context<RNTesterTheme> = createContext(
  Appearance.getColorScheme() === 'dark' ? themes.dark : themes.light,
);
export function useTheme(): RNTesterTheme {
  return use(RNTesterThemeContext);
}

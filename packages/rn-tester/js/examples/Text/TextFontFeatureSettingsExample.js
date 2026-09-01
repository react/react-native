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

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {TextInput, View} from 'react-native';

export const fontExampleStyles: {
  row: {marginBottom: number},
  label: {fontSize: number, opacity: number},
} = {
  row: {marginBottom: 6},
  label: {fontSize: 11, opacity: 0.6},
};

export function FontExampleRow(props: {
  label: string,
  children: React.Node,
}): React.Node {
  return (
    <View style={fontExampleStyles.row}>
      <RNTesterText style={fontExampleStyles.label}>{props.label}</RNTesterText>
      {props.children}
    </View>
  );
}

// Shared by TextExample.ios.js and TextExample.android.js so the two platforms photograph the same
// rows in the same font. EB Garamond is bundled on iOS and registered under the same family name on
// Android, and it declares every tag these rows switch: 'smcp', 'onum', 'liga', 'dlig' and 'kern'.
// Neither platform's system faces can stand in: on iOS, Hoefler Text keeps its small caps in a
// separate face rather than a feature, so CoreText finds no 'smcp' to apply.
//
// There is no 'lnum' row on purpose. This font's default figures are already lining and its 'lnum'
// lookup covers neither them nor the oldstyle glyphs 'onum' produces, so the tag can never change
// anything here and the row would only look like a demonstration.
//
// The size is 24 rather than the 16 the other cards use. The 'liga' and 'dlig' rows turn on a
// ligature break that moves glyphs by about a pixel at 16pt: the ink genuinely changes, but nobody
// reading the screenshot can see it, which makes the row read as a no-op. Do not lower this.
const baseStyle = {fontFamily: 'EB Garamond', fontSize: 24};

const TextFontFeatureSettingsExample: RNTesterModuleExample = {
  title: 'Font feature settings',
  name: 'fontFeatureSettings',
  render: function (): React.Node {
    return (
      <View testID="text-font-feature-settings">
        <FontExampleRow label="no features">
          <RNTesterText style={baseStyle}>Waffle 0123 AV To</RNTesterText>
        </FontExampleRow>
        <FontExampleRow label="'smcp': small caps">
          <RNTesterText
            style={{...baseStyle, fontFeatureSettings: "'smcp', 'swsh' 2"}}>
            Waffle
          </RNTesterText>
        </FontExampleRow>
        <FontExampleRow label="'onum': oldstyle figures">
          <RNTesterText style={{...baseStyle, fontFeatureSettings: "'onum'"}}>
            0123456789
          </RNTesterText>
        </FontExampleRow>
        <FontExampleRow label="'dlig' on: discretionary ligatures">
          <RNTesterText
            style={{...baseStyle, fontFeatureSettings: "'dlig' on"}}>
            Waffle st ct
          </RNTesterText>
        </FontExampleRow>
        <FontExampleRow label="'liga' off: common ligatures off">
          <RNTesterText
            style={{...baseStyle, fontFeatureSettings: "'liga' off"}}>
            Waffle fi fl
          </RNTesterText>
        </FontExampleRow>
        <FontExampleRow label="'liga' on: common ligatures on">
          <RNTesterText
            style={{...baseStyle, fontFeatureSettings: "'liga' on"}}>
            Waffle fi fl
          </RNTesterText>
        </FontExampleRow>
        <FontExampleRow label="'kern' off: kerning off">
          <RNTesterText
            style={{...baseStyle, fontFeatureSettings: "'kern' off"}}>
            AV To Wa
          </RNTesterText>
        </FontExampleRow>
        <FontExampleRow label="'kern' on: kerning on">
          <RNTesterText
            style={{...baseStyle, fontFeatureSettings: "'kern' on"}}>
            AV To Wa
          </RNTesterText>
        </FontExampleRow>
        <FontExampleRow label="fontVariant and fontFeatureSettings compose: small caps from one, oldstyle figures from the other">
          <RNTesterText
            style={{
              ...baseStyle,
              fontVariant: ['small-caps'],
              fontFeatureSettings: "'onum'",
            }}>
            Waffle 0123
          </RNTesterText>
        </FontExampleRow>
        <FontExampleRow label="'smcp' 0 against the fontVariant array">
          <RNTesterText
            style={{
              ...baseStyle,
              fontVariant: ['small-caps'],
              fontFeatureSettings: "'smcp' 0",
            }}>
            Waffle 0123
          </RNTesterText>
        </FontExampleRow>
        <FontExampleRow label="'normal': adds no features">
          <RNTesterText style={{...baseStyle, fontFeatureSettings: 'normal'}}>
            Waffle 0123
          </RNTesterText>
        </FontExampleRow>
        <FontExampleRow label="TextInput with 'smcp'">
          <TextInput
            defaultValue="Waffle"
            style={{...baseStyle, fontFeatureSettings: "'smcp'"}}
          />
        </FontExampleRow>
      </View>
    );
  },
};

export default TextFontFeatureSettingsExample;

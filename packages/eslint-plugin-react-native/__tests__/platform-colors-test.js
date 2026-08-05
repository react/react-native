/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

const rule = require('../platform-colors.js');
const ESLintTester = require('./eslint-tester.js');

const eslintTester = new ESLintTester();

eslintTester.run('../platform-colors', rule, {
  valid: [
    "const color = PlatformColor('labelColor');",
    "const color = PlatformColor('controlAccentColor', 'controlColor');",
    "const color = PlatformColor('labelColor', {fallback: '#FF0000'});",
    "const color = PlatformColor('controlAccentColor', 'controlColor', {fallback: 'red'});",
    "const color = DynamicColorIOS({light: 'black', dark: 'white'});",
    "const color = DynamicColorIOS({light: PlatformColor('black'), dark: PlatformColor('white')});",
    "const color = DynamicColorIOS({light: PlatformColor('black'), dark: PlatformColor('white'), highContrastLight: PlatformColor('black'), highContrastDark: PlatformColor('white')});",
  ],
  invalid: [
    {
      code: 'const color = PlatformColor();',
      errors: [{message: rule.meta.messages.platformColorArgsLength}],
    },
    {
      code: "const labelColor = 'labelColor'; const color = PlatformColor(labelColor);",
      errors: [{message: rule.meta.messages.platformColorArgTypes}],
    },
    {
      code: "const raw = '#FF0000'; const color = PlatformColor('labelColor', {fallback: raw});",
      errors: [{message: rule.meta.messages.platformColorArgTypes}],
    },
    {
      code: "const color = PlatformColor({fallback: '#FF0000'}, 'labelColor');",
      errors: [{message: rule.meta.messages.platformColorArgTypes}],
    },
    {
      code: "const color = PlatformColor('labelColor', {fallback: '#FF0000', fallback: '#00FF00'});",
      errors: [{message: rule.meta.messages.platformColorArgTypes}],
    },
    {
      code: "const color = PlatformColor('labelColor', {fallback: '#FF0000', extra: 'red'});",
      errors: [{message: rule.meta.messages.platformColorArgTypes}],
    },
    {
      code: "const color = PlatformColor('labelColor', {['fallback']: '#FF0000'});",
      errors: [{message: rule.meta.messages.platformColorArgTypes}],
    },
    {
      code: "const tuple = {light: 'black', dark: 'white'}; const color = DynamicColorIOS(tuple);",
      errors: [{message: rule.meta.messages.dynamicColorIOSArg}],
    },
    {
      code: "const black = 'black'; const color = DynamicColorIOS({light: black, dark: 'white'});",
      errors: [{message: rule.meta.messages.dynamicColorIOSValue}],
    },
    {
      code: "const white = 'white'; const color = DynamicColorIOS({light: 'black', dark: white});",
      errors: [{message: rule.meta.messages.dynamicColorIOSValue}],
    },
  ],
});

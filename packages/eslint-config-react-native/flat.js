/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

const sharedConfig = require('./shared.js');
const eslintCommentsPlugin = require('@eslint-community/eslint-plugin-eslint-comments');
const {fixupPluginRules} = require('@eslint/compat');
const reactNativePlugin = require('@react-native/eslint-plugin');
const typescriptPlugin = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const prettierConfig = require('eslint-config-prettier');
const ftFlowPlugin = require('eslint-plugin-ft-flow');
const jestPlugin = require('eslint-plugin-jest');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const reactNativeExternalPlugin = require('eslint-plugin-react-native');
const flowParser = require('flow-eslint');

// Convert globals from legacy format (true/false) to flat config format ('readonly'/'writable')
const convertGlobals = globals => {
  const converted = {};
  for (const [key, value] of Object.entries(globals)) {
    converted[key] = value ? 'writable' : 'readonly';
  }
  return converted;
};

// Flat Config for ESLint 9+
//
// `fixupPluginRules` adapts plugins that still call rule context methods
// removed in ESLint 10 (e.g. `context.getSourceCode()`).
module.exports = [
  // Apply prettier config first (to disable conflicting rules)
  prettierConfig,

  // Base configuration for all files
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: sharedConfig.parserOptions,
      globals: convertGlobals(sharedConfig.globals),
    },
    plugins: {
      'eslint-comments': eslintCommentsPlugin,
      react: fixupPluginRules(reactPlugin),
      'react-hooks': reactHooksPlugin,
      'react-native': fixupPluginRules(reactNativeExternalPlugin),
      '@react-native': reactNativePlugin,
      jest: jestPlugin,
    },
    settings: sharedConfig.settings,
    rules: sharedConfig.rules,
  },

  // JavaScript files, parsed as Flow
  {
    ...sharedConfig.overrides.flow,
    files: ['**/*.js'],
    languageOptions: {
      parser: flowParser,
    },
    plugins: {
      'ft-flow': fixupPluginRules(ftFlowPlugin),
    },
  },

  // JSX files, parsed as Flow
  {
    files: ['**/*.jsx'],
    languageOptions: {
      parser: flowParser,
    },
  },

  // All JS/TS files - React Native specific rules
  {
    ...sharedConfig.overrides.reactNative,
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
  },

  // TypeScript files
  {
    ...sharedConfig.overrides.typescript,
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
    },
  },

  // Test files
  {
    ...sharedConfig.overrides.jest,
    files: [
      '**/*.{spec,test}.{js,ts,tsx}',
      '**/__{mocks,tests}__/**/*.{js,ts,tsx}',
    ],
    languageOptions: {
      globals: {
        ...jestPlugin.environments.globals.globals,
      },
    },
  },
];

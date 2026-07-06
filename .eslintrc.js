/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @format
 */

'use strict';

module.exports = {
  root: true,

  extends: ['@react-native'],

  plugins: ['@react-native/monorepo', '@react-native/specs'],

  overrides: [
    // overriding the JS config from @react-native/eslint-config to ensure
    // that we use hermes-eslint for all js files
    {
      files: ['*.js', '*.js.flow', '*.jsx'],
      parser: 'hermes-eslint',
      rules: {
        '@react-native/monorepo/sort-imports': 'warn',
        'eslint-comments/no-unlimited-disable': 'off',
        'ft-flow/require-valid-file-annotation': ['error', 'always'],
        'no-extra-boolean-cast': 'off',
        'no-void': 'off',
        // These rules are not required with hermes-eslint
        'ft-flow/define-flow-type': 'off',
        'ft-flow/use-flow-type': 'off',
        // Flow handles these checks for us, so they aren't required
        'no-undef': 'off',
        'no-unreachable': 'off',
        // Throwing from function or rejecting promises with non-error values could result in unclear error stack traces and lead to harder debugging
        'prefer-promise-reject-errors': 'error',
        'no-throw-literal': 'error',
      },
    },
    {
      files: ['*.js', '*.jsx', '*.ts', '*.tsx'],
      rules: {
        '@react-native/no-deep-imports': 'off',
      },
    },
    {
      files: [
        './packages/react-native/Libraries/**/*.{js,flow}',
        './packages/react-native/src/**/*.{js,flow}',
      ],
      parser: 'hermes-eslint',
      rules: {
        '@react-native/monorepo/no-commonjs-exports': 'warn',
      },
    },
    {
      files: ['package.json'],
      parser: 'jsonc-eslint-parser',
    },
    {
      files: ['package.json'],
      rules: {
        '@react-native/monorepo/react-native-manifest': 'error',
      },
    },
    {
      files: ['flow-typed/**/*.js', 'packages/react-native/flow/**/*'],
      rules: {
        '@react-native/monorepo/valid-flow-typed-signature': 'error',
        'ft-flow/require-valid-file-annotation': 'off',
        'no-shadow': 'off',
        'no-unused-vars': 'off',
        quotes: 'off',
      },
    },
    {
      files: [
        'packages/react-native/Libraries/**/*.js',
        'packages/react-native/src/**/*.js',
      ],
      rules: {
        '@react-native/monorepo/no-haste-imports': 'error',
        '@react-native/monorepo/no-react-default-imports': 'error',
        '@react-native/monorepo/no-react-named-type-imports': 'error',
        '@react-native/monorepo/no-react-native-imports': 'error',
        '@react-native/monorepo/no-react-node-imports': 'error',
        '@react-native/monorepo/require-extends-error': 'error',
        '@react-native/platform-colors': 'error',
        '@react-native/specs/react-native-modules': 'error',
      },
    },
    {
      files: [
        '**/__fixtures__/**/*.js',
        '**/__mocks__/**/*.js',
        '**/__tests__/**/*.js',
        'packages/jest-preset/jest/**/*.js',
        'packages/rn-tester/**/*.js',
      ],
      globals: {
        // Expose some Jest globals for test helpers
        afterAll: true,
        afterEach: true,
        beforeAll: true,
        beforeEach: true,
        expect: true,
        jest: true,
      },
    },
    {
      files: ['**/__tests__/**/*-test.js'],
      env: {
        jasmine: true,
        jest: true,
      },
    },
    {
      files: ['**/*.{ts,tsx}'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint/eslint-plugin'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        'react-native/no-inline-styles': 'off',
        '@typescript-eslint/no-shadow': 'off',
        'no-self-compare': 'off',
        'react/self-closing-comp': 'off',
      },
    },
    {
      files: ['**/*.d.ts'],
      plugins: ['redundant-undefined'],
      rules: {
        'no-dupe-class-members': 'off',
        'redundant-undefined/redundant-undefined': [
          'error',
          {followExactOptionalPropertyTypes: true},
        ],
      },
    },
    {
      files: ['**/__tests__/**'],
      rules: {
        '@react-native/monorepo/no-react-native-imports': 'off',
      },
    },
  ],
};

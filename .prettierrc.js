/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

module.exports = {
  arrowParens: 'avoid',
  bracketSameLine: true,
  bracketSpacing: false,
  requirePragma: true,
  singleQuote: true,
  trailingComma: 'all',
  endOfLine: 'lf',
  overrides: [
    {
      files: ['*.code-workspace'],
      options: {
        parser: 'json',
      },
    },
    {
      files: ['*.js', '*.js.flow'],
      options: {
        parser: 'flow',
      },
    },
    {
      files: ['**/__docs__/*.md'],
      options: {
        parser: 'markdown',
        proseWrap: 'always',
        requirePragma: false,
      },
    },
    {
      files: ['*.yml', '*.yaml'],
      options: {
        requirePragma: false,
      },
    },
  ],
};

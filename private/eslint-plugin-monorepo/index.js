/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

exports.rules = {
  'no-commonjs-exports': require('./rules/no-commonjs-exports'),
  'no-haste-imports': require('./rules/no-haste-imports'),
  'no-react-default-imports': require('./rules/no-react-default-imports'),
  'no-react-named-type-imports': require('./rules/no-react-named-type-imports'),
  'no-react-native-imports': require('./rules/no-react-native-imports'),
  'no-react-node-imports': require('./rules/no-react-node-imports'),
  'require-extends-error': require('./rules/require-extends-error'),
  'sort-imports': require('./rules/sort-imports'),
  'valid-flow-typed-signature': require('./rules/valid-flow-typed-signature'),
};

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

// A project Babel config that names the preset with no options - the shape of
// the app template. The preset then only learns about Metro's transform
// options through the Babel caller.
module.exports = {
  presets: [require.resolve('@react-native/babel-preset')],
};

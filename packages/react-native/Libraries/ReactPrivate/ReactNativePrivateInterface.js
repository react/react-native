/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import typeof {createPublicTextInstance} from '../ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstance';

export type {PublicRootInstance} from '../ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstance';
export type PublicTextInstance = ReturnType<createPublicTextInstance>;

/**
 * @deprecated Since 0.88. Use 'react-native/react-private-interface' instead.
 */
// eslint-disable-next-line @react-native/monorepo/no-commonjs-exports
module.exports = require('../../src/react-private-interface');

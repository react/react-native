/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import setUpDefaultReactNativeEnvironment from '../../../packages/react-native/src/private/setup/setUpDefaultReactNativeEnvironment';

// Do NOT enable developer tools for Fantom.
setUpDefaultReactNativeEnvironment(false);

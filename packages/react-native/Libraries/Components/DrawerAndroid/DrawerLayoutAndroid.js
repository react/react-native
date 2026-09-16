/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// NOTE: This file supports backwards compatibility of subpath (deep) imports
// from 'react-native' with platform-specific extensions. It can be deleted
// once we remove the "./*" mapping from package.json "exports".

import DrawerLayoutAndroid from './DrawerLayoutAndroid';

export default DrawerLayoutAndroid;

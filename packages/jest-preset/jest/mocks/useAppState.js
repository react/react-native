/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {AppStateStatus} from 'react-native/Libraries/AppState/AppState';

const useAppState = jest.fn(() => 'active') as JestMockFn<
  [],
  AppStateStatus,
>;

export default useAppState;

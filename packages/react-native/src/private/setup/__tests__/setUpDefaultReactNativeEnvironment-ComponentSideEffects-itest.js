/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import setUpDefaultReactNativeEnvironment from '../setUpDefaultReactNativeEnvironment';

describe('setUpReactNativeEnvironment (components side-effects)', () => {
  it('should not load components as a side effect', () => {
    // We set up has not been done yet.
    expect(globalThis.self).toBeUndefined();

    setUpDefaultReactNativeEnvironment(false);

    // The set up worked.
    expect(globalThis.self).toBe(globalThis);

    // Verify that `View` and `Text` are not loaded as a side-effect

    // $FlowExpectedError[prop-missing]
    const viewModuleId = require.resolveWeak(
      '../../../../Libraries/Components/View/View',
    );
    // $FlowExpectedError[prop-missing]
    const textModuleId = require.resolveWeak('../../../../Libraries/Text/Text');
    // $FlowExpectedError[prop-missing]
    const metroModules = require.getModules();
    const viewModule = metroModules.get(viewModuleId);
    const textModule = metroModules.get(textModuleId);
    expect(viewModule).toBeInstanceOf(Object);
    expect(textModule).toBeInstanceOf(Object);

    expect(viewModule.isInitialized).toBe(false);
    expect(textModule.isInitialized).toBe(false);

    // But then we can detect when they're loaded (to verify the previous
    // detection works).

    require('react-native').View;

    expect(viewModule.isInitialized).toBe(true);
    expect(textModule.isInitialized).toBe(false);

    require('react-native').Text;

    expect(viewModule.isInitialized).toBe(true);
    expect(textModule.isInitialized).toBe(true);
  });
});

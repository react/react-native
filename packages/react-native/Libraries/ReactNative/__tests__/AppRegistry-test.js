/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const AppRegistry = require('../AppRegistryImpl');

describe('AppRegistry', () => {
  it('does not return inherited Object properties as registered apps', () => {
    expect(AppRegistry.getRunnable('constructor')).toBeUndefined();
  });

  it('registers app and section keys named __proto__', () => {
    const app = jest.fn();
    const section = () =>
      function Section() {
        return null;
      };

    AppRegistry.registerRunnable('__proto__', app);
    AppRegistry.registerSection('__proto__', section);

    expect(AppRegistry.getRunnable('__proto__')).toBeInstanceOf(Function);
    expect(AppRegistry.getAppKeys()).toContain('__proto__');
    expect(AppRegistry.getSectionKeys()).toContain('__proto__');
    expect(Object.keys(AppRegistry.getSections())).toContain('__proto__');
  });
});

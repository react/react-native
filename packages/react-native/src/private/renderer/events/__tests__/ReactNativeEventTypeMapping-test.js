/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {customDirectEventTypes} from '../../../../../Libraries/Renderer/shims/ReactNativeViewConfigRegistry';
import {getEventTypePropName} from '../ReactNativeEventTypeMapping';

describe('ReactNativeEventTypeMapping', () => {
  afterEach(() => {
    delete customDirectEventTypes.topConstructor;
  });

  it('resolves event types that shadow Object prototype properties', () => {
    customDirectEventTypes.topConstructor = {
      registrationName: 'onConstructor',
    };

    expect(getEventTypePropName('constructor', false)).toBe('onConstructor');
    expect(getEventTypePropName('constructor', true)).toBeNull();
  });
});

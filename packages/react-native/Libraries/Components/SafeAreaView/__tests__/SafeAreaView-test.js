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

import {create} from '@react-native/jest-preset/jest/renderer';
import * as React from 'react';

describe('SafeAreaView on iOS', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../../../Utilities/Platform', () => ({
      __esModule: true,
      default: {
        OS: 'ios',
        select: (spec: {[string]: unknown}) => spec.ios ?? spec.default,
      },
    }));
  });

  it('maps aria props to their accessibility counterparts', async () => {
    const SafeAreaView = require('../SafeAreaView').default;
    const component = await create(
      <SafeAreaView
        aria-hidden={true}
        aria-label="Label"
        aria-busy={true}
        aria-valuenow={3}
        id="safe"
      />,
    );
    const props = component.toJSON()?.props;

    expect(props?.accessibilityElementsHidden).toBe(true);
    expect(props?.accessibilityLabel).toBe('Label');
    expect(props?.accessibilityState).toEqual(
      expect.objectContaining({busy: true}),
    );
    expect(props?.accessibilityValue).toEqual(
      expect.objectContaining({now: 3}),
    );
    expect(props?.nativeID).toBe('safe');
    expect(props?.['aria-hidden']).toBeUndefined();
    expect(props?.['aria-label']).toBeUndefined();
  });
});

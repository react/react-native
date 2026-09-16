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

jest.mock('../UIManager', () => ({
  __esModule: true,
  default: {
    getConstants: () => ({ViewManagerNames: []}),
    getDefaultEventTypes: () => ({}),
    getViewManagerConfig: name =>
      name === 'TestView'
        ? {
            NativeProps: {fontVariationSettings: 'String'},
            bubblingEventTypes: {},
            directEventTypes: {},
          }
        : null,
  },
}));

const {
  fontVariationSettingsAttribute,
} = require('../../Components/View/ReactNativeStyleAttributes');
const getNativeComponentAttributes =
  require('../getNativeComponentAttributes').default;

describe('getNativeComponentAttributes', () => {
  it('processes object font variation settings from native view configs', () => {
    const viewConfig = getNativeComponentAttributes('TestView');

    expect(viewConfig.validAttributes.fontVariationSettings).toEqual(
      fontVariationSettingsAttribute,
    );
    expect(
      viewConfig.validAttributes.fontVariationSettings.process({
        wght: 552.5,
        opsz: 17.25,
      }),
    ).toBe("'opsz' 17.25, 'wght' 552.5");
  });
});

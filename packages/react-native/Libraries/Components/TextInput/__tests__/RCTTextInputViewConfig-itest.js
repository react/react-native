/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {__INTERNAL_VIEW_CONFIG as AndroidTextInputViewConfig} from '../AndroidTextInputNativeComponent';
import RCTTextInputViewConfig from '../RCTTextInputViewConfig';
import nullthrows from 'nullthrows';

const {
  create,
} = require('../../../ReactNative/ReactFabricPublicInstance/ReactNativeAttributePayload');

const androidValidAttributes = nullthrows(
  AndroidTextInputViewConfig.validAttributes,
);
const appleValidAttributes = nullthrows(RCTTextInputViewConfig.validAttributes);

describe('Android TextInput view config', () => {
  it('serializes object font variation settings', () => {
    expect(
      create(
        {fontVariationSettings: {wght: 552.5, opsz: 17.25}},
        androidValidAttributes,
      ),
    ).toEqual({fontVariationSettings: "'opsz' 17.25, 'wght' 552.5"});
  });

  it('serializes an empty object as an explicit clear', () => {
    expect(create({fontVariationSettings: {}}, androidValidAttributes)).toEqual(
      {fontVariationSettings: ''},
    );
  });
});

describe('Apple TextInput view config', () => {
  it('serializes object font variation settings', () => {
    expect(
      create(
        {fontVariationSettings: {wght: 552.5, opsz: 17.25}},
        appleValidAttributes,
      ),
    ).toEqual({fontVariationSettings: "'opsz' 17.25, 'wght' 552.5"});
  });

  it('serializes an empty object as an explicit clear', () => {
    expect(create({fontVariationSettings: {}}, appleValidAttributes)).toEqual({
      fontVariationSettings: '',
    });
  });
});

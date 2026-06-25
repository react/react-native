/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import type {Struct} from '../StructCollector';

const {serializeConstantsStruct} = require('./serializeConstantsStruct');
const {serializeRegularStruct} = require('./serializeRegularStruct');

export type StructSerilizationOutput = Readonly<{
  methods: string,
  declaration: string,
}>;

function serializeStruct(
  hasteModuleName: string,
  struct: Struct,
): StructSerilizationOutput {
  if (struct.context === 'REGULAR') {
    return serializeRegularStruct(hasteModuleName, struct);
  }
  return serializeConstantsStruct(hasteModuleName, struct);
}

module.exports = {
  serializeStruct,
};

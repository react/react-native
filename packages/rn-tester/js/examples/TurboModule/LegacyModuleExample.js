/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

const {
  default: SampleLegacyModuleExample,
} = require('./SampleLegacyModuleExample');
const React = require('react');

exports.displayName = undefined as ?string;
exports.title = 'Legacy Native Module';
exports.category = 'Basic';
exports.description = 'Usage of legacy Native Module';
exports.examples = [
  {
    title: 'SampleLegacyModule',
    name: 'SampleLegacyModule',
    render: function (): React.MixedElement {
      return <SampleLegacyModuleExample />;
    },
  },
] as Array<RNTesterModuleExample>;

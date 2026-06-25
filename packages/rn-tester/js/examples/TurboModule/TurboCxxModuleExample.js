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

const NativeCxxModuleExampleExample = require('./NativeCxxModuleExampleExample');
const React = require('react');

exports.displayName = undefined as ?string;
exports.title = 'Cxx TurboModule';
exports.category = 'Basic';
exports.description = 'Usage of Cxx TurboModule';
exports.examples = [
  {
    title: 'TurboCxxModuleExample',
    render: function (): React.MixedElement {
      return <NativeCxxModuleExampleExample />;
    },
  },
] as Array<RNTesterModuleExample>;

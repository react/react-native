/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import type {Node} from 'react';

import * as React from 'react';
import {Button} from 'react-native';

exports.displayName = undefined as ?string;
exports.framework = 'React';
exports.title = 'Crash';
exports.category = 'Basic';
exports.description = 'Crash examples.';

exports.examples = [
  {
    title: 'JS crash',
    render(): Node {
      return (
        <Button
          title="JS crash"
          onPress={() => {
            const a = {};
            // $FlowFixMe[prop-missing]
            // $FlowFixMe[incompatible-use]
            const b = a.w.q; // js crash here
            console.log(b);
          }}
        />
      );
    },
  },
] as Array<RNTesterModuleExample>;

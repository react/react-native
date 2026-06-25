/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {PluginObj} from '@babel/core';

import generate from '@babel/generator';
import * as t from '@babel/types';

const visitor: PluginObj<unknown> = {
  visitor: {
    TSUnionType(path) {
      path.node.types.sort((a, b) => {
        // push literal types to the end of the union
        if (t.isTSTypeLiteral(a) && !t.isTSTypeLiteral(b)) {
          return 1;
        } else if (!t.isTSTypeLiteral(a) && t.isTSTypeLiteral(b)) {
          return -1;
        }

        // get string representation of the types to correctly handle literals
        const aString = generate(a).code;
        const bString = generate(b).code;

        return aString.localeCompare(bString);
      });
    },
  },
};

module.exports = visitor;

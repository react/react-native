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

import * as t from '@babel/types';

const visitor: PluginObj<unknown> = {
  visitor: {
    TSPropertySignature(path) {
      if (path.node.optional !== true) {
        return;
      }

      const typeAnnotation = path.node.typeAnnotation;
      if (!typeAnnotation || !t.isTSTypeAnnotation(typeAnnotation)) {
        return;
      }

      const actualTypeAnnotation = typeAnnotation.typeAnnotation;
      if (!t.isTSUnionType(actualTypeAnnotation)) {
        return;
      }

      const newTypeAnnotation = t.cloneDeep(actualTypeAnnotation);
      newTypeAnnotation.types = newTypeAnnotation.types.filter(
        type => t.isTSUndefinedKeyword(type) === false,
      );
      typeAnnotation.typeAnnotation = newTypeAnnotation;
    },
  },
};

module.exports = visitor;

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

      const remainingTypes = actualTypeAnnotation.types.filter(
        type => t.isTSUndefinedKeyword(type) === false,
      );
      if (remainingTypes.length === actualTypeAnnotation.types.length) {
        return;
      }

      // Unwrap to the bare type when a single constituent remains, otherwise a
      // wrapper node survives that prints identically but breaks downstream
      // transforms (e.g. `sortProperties`) that key on the node type. The lone
      // constituent may be parenthesized (a function type inside a union needs
      // parens, e.g. `(() => void) | undefined`); those parens are redundant
      // once it is no longer part of a union.
      if (remainingTypes.length === 1) {
        const [remaining] = remainingTypes;
        typeAnnotation.typeAnnotation = t.isTSParenthesizedType(remaining)
          ? remaining.typeAnnotation
          : remaining;
      } else {
        typeAnnotation.typeAnnotation = t.tsUnionType(remainingTypes);
      }
    },
  },
};

module.exports = visitor;

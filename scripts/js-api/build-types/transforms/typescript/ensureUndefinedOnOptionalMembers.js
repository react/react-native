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

/**
 * Ensures optional object members carry an explicit `| undefined`, e.g.
 * `foo?: number` becomes `foo?: number | undefined` (members that already
 * include `undefined` are left unchanged).
 *
 * This is the format required by TypeScript consumers building with
 * `exactOptionalPropertyTypes`, under which `foo?: T` and `foo?: T | undefined`
 * are distinct. It applies to the per-module generated types; the API snapshot
 * pipeline still strips it back via `removeUndefinedFromOptionalMembers`.
 *
 * This lives in React Native as a stopgap: flow-api-translator does not yet emit
 * this format, and the generated types cannot wait for its next release.
 *
 * The API snapshot resets this via `removeUndefinedFromOptionalMembers`, which
 * also unwraps the resulting single-constituent unions so function-valued
 * members remain bare function types for `sortProperties` to group.
 */
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

      if (t.isTSUndefinedKeyword(actualTypeAnnotation)) {
        return;
      }

      if (t.isTSUnionType(actualTypeAnnotation)) {
        if (
          actualTypeAnnotation.types.some(type => t.isTSUndefinedKeyword(type))
        ) {
          return;
        }
        typeAnnotation.typeAnnotation = t.tsUnionType([
          ...actualTypeAnnotation.types,
          t.tsUndefinedKeyword(),
        ]);
        return;
      }

      typeAnnotation.typeAnnotation = t.tsUnionType([
        actualTypeAnnotation,
        t.tsUndefinedKeyword(),
      ]);
    },
  },
};

module.exports = visitor;

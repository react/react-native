/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {PluginObj} from '@babel/core';

function isUnstableSymbol(name: ?string): boolean {
  return (
    name?.startsWith('unstable_') === true ||
    name?.startsWith('experimental_') === true
  );
}

const stripUnstableProperties: PluginObj<unknown> = {
  visitor: {
    TSPropertySignature(path) {
      if (isUnstableSymbol(path.node.key.name)) {
        path.remove();
      }
    },
    TSMethodSignature(path) {
      if (isUnstableSymbol(path.node.key.name)) {
        path.remove();
      }
    },
    TSDeclareMethod(path) {
      if (isUnstableSymbol(path.node.key.name)) {
        path.remove();
      }
    },
    TSDeclareFunction(path) {
      if (isUnstableSymbol(path.node.id?.name)) {
        path.remove();
      }
    },
    TSTypeAliasDeclaration(path) {
      if (isUnstableSymbol(path.node.id.name)) {
        path.remove();
      }
    },
    ClassProperty(path) {
      if (isUnstableSymbol(path.node.key.name)) {
        path.remove();
      }
    },
    ClassMethod(path) {
      if (isUnstableSymbol(path.node.key.name)) {
        path.remove();
      }
    },
    ClassDeclaration(path) {
      if (isUnstableSymbol(path.node.id?.name)) {
        path.remove();
      }
    },
    FunctionDeclaration(path) {
      if (isUnstableSymbol(path.node.id?.name)) {
        path.remove();
      }
    },
    VariableDeclarator(path) {
      if (isUnstableSymbol(path.node.id?.name)) {
        path.remove();
      }
    },
    ExportNamedDeclaration(path) {
      if (
        path.node.declaration &&
        isUnstableSymbol(path.node.declaration?.id?.name)
      ) {
        path.remove();
      } else if (path.node.specifiers) {
        path.node.specifiers = path.node.specifiers.filter(
          specifier => !isUnstableSymbol(specifier.exported.name),
        );
      }
    },
    ExportDefaultDeclaration(path) {
      if (isUnstableSymbol(path.node.declaration?.id?.name)) {
        path.remove();
      }
    },
  },
};

module.exports = stripUnstableProperties;

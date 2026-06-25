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

import type {NodePath, Visitor} from '@babel/traverse';

const t = require('@babel/types');

export type GatherTypeAliasesVisitorState = {
  readonly aliasToPathMap: Map<string, NodePath<t.TSTypeAliasDeclaration>>,
  readonly interfaceToPathMap?: Map<string, NodePath<t.TSInterfaceDeclaration>>,
};

/**
 * Gather all type aliases and interface declarations in the file into maps
 */
const gatherTypeAliasesVisitor: Visitor<GatherTypeAliasesVisitorState> = {
  TSTypeAliasDeclaration(path, state) {
    const alias = path.node.id.name;
    state.aliasToPathMap.set(alias, path);
  },
  TSInterfaceDeclaration(path, state) {
    state.interfaceToPathMap?.set(path.node.id.name, path);
  },
};

export default gatherTypeAliasesVisitor;

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

import type {StackLayer} from './contextStack';
import type {NodePath} from '@babel/traverse';

const t = require('@babel/types');

export type BaseVisitorState = {
  aliasToPathMap: Map<string, NodePath<t.TSTypeAliasDeclaration>>,
  interfaceToPathMap?: Map<string, NodePath<t.TSInterfaceDeclaration>>,
  parentTypeAliases?: Set<string>,
  nodeToAliasMap: Map<t.Node, string>,
  ...
};

export type InlineVisitorState = {
  ...BaseVisitorState,
  /**
   * Layers of operators that the current node is inside of.
   * Used to determine if we should inline a type.
   */
  stack: Array<StackLayer>,
  ...
};

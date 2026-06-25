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

import type {BaseVisitorState} from './visitorState';
import type {PluginObj} from '@babel/core';
import type {NodePath} from '@babel/traverse';

import gatherTypeAliasesVisitor from './gatherTypeAliasesVisitor';
import {canResolveBuiltinType, resolveBuiltinType} from './resolveBuiltinType';
import {resolveIntersection} from './resolveIntersection';
import {resolveTSType} from './resolveTSType';

const t = require('@babel/types');

const mergeObjects: PluginObj<BaseVisitorState> = {
  visitor: {
    Program: {
      enter(path, state): void {
        state.aliasToPathMap = new Map<
          string,
          NodePath<t.TSTypeAliasDeclaration>,
        >();
        state.interfaceToPathMap = new Map<
          string,
          NodePath<t.TSInterfaceDeclaration>,
        >();
        state.nodeToAliasMap = new Map<t.Node, string>();
        state.parentTypeAliases = new Set<string>();

        path.traverse(gatherTypeAliasesVisitor, {
          aliasToPathMap: state.aliasToPathMap,
          interfaceToPathMap: state.interfaceToPathMap,
        });
      },

      exit(path, state): void {},
    },
    TSIntersectionType: {
      enter() {
        // Do nothing
      },
      exit(path, state) {
        resolveIntersection(path, state);
      },
    },
    TSTypeReference: {
      enter(path, state): void {},
      // Builtin-type resolution is done bottom-up
      exit(path, state) {
        if (!t.isIdentifier(path.node.typeName)) {
          return;
        }

        const typeName = path.node.typeName.name;
        if (canResolveBuiltinType(typeName)) {
          resolveBuiltinType(path, state, resolveTSType);
          return;
        }
      },
    },
  },
};

// Visitor state is only used internally, so we can safely cast to PluginObj<mixed>.
module.exports = mergeObjects as $FlowFixMe as PluginObj<unknown>;

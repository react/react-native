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

import type {InlineVisitorState} from './visitorState';
import type {PluginObj} from '@babel/core';
import type {NodePath} from '@babel/traverse';

import {
  insideTypeAliasLayerWithTypeParam,
  isDefiningType,
  popLayer,
  pushLayer,
} from './contextStack';
import gatherTypeAliasesVisitor from './gatherTypeAliasesVisitor';
import inlineType from './inlineType';
import {canResolveBuiltinType, resolveBuiltinType} from './resolveBuiltinType';
import {resolveIntersection} from './resolveIntersection';
import {resolveTypeOperator} from './resolveTypeOperator';
import {onNodeExit, shouldSkipInliningType} from './utils';

const t = require('@babel/types');

const inlineTypes: PluginObj<InlineVisitorState> = {
  visitor: {
    Program: {
      enter(path, state): void {
        if (!state.aliasToPathMap) {
          state.aliasToPathMap = new Map<
            string,
            NodePath<t.TSTypeAliasDeclaration>,
          >();

          path.traverse(gatherTypeAliasesVisitor, {
            aliasToPathMap: state.aliasToPathMap,
          });
        }

        state.parentTypeAliases = new Set<string>();
        state.nodeToAliasMap = new Map<t.Node, string>();
        state.stack = [];
      },
      exit(path, state): void {
        // Do nothing
      },
    },
    TSTypeLiteral: {
      enter() {
        // Do nothing
      },
      exit(path, state) {
        onNodeExit(state, path.node);
      },
    },
    TSFunctionType: {
      enter() {
        // Do nothing
      },
      exit(path, state) {
        onNodeExit(state, path.node);
      },
    },
    TSTypeOperator: {
      enter(path, state) {
        if (path.node.operator === 'keyof') {
          pushLayer(state, {type: 'keyof'});
        }
      },
      exit(path, state) {
        if (path.node.operator === 'keyof') {
          popLayer(state, 'keyof');
        }
        resolveTypeOperator(path, state);
      },
    },
    TSTypeParameter: {
      enter(path, state) {
        if (path.node.constraint) {
          pushLayer(state, {type: 'extends'});
        }
      },
      exit(path, state) {
        if (path.node.constraint) {
          popLayer(state, 'extends');
        }
      },
    },
    TSTypeParameterInstantiation: {
      enter(path, state) {
        pushLayer(state, {type: 'typeParameterInstantiation'});
      },
      exit(path, state) {
        popLayer(state, 'typeParameterInstantiation');
      },
    },
    TSTypeAliasDeclaration: {
      enter(path, state): void {
        state.parentTypeAliases?.add(path.node.id.name);
        pushLayer(state, {
          type: 'typeAlias',
          typeParams: path.node.typeParameters?.params?.map(
            param => param.name,
          ),
        });
      },
      exit(path, state): void {
        state.parentTypeAliases?.delete(path.node.id.name);
        popLayer(state, 'typeAlias');
      },
    },
    TSUnionType: {
      enter(path, state): void {
        pushLayer(state, {type: 'union'});
      },
      exit(path, state): void {
        popLayer(state, 'union');
      },
    },
    TSIntersectionType: {
      enter() {
        // Do nothing
      },
      exit(path, state) {
        resolveIntersection(path, state);
      },
    },
    // Classes are a very special case, because they can extend a super class,
    // and that super class can be generic. We need to track that superclass
    // either as a resolvable or unresolvable type layer.
    ClassDeclaration: {
      enter(path, state): void {
        if (!path.node.superClass || !path.node.superTypeParameters) {
          // No generic superclass, don't care
          return;
        }

        if (
          t.isIdentifier(path.node.superClass) &&
          canResolveBuiltinType(path.node.superClass.name)
        ) {
          pushLayer(state, {type: 'resolvableType'});
        } else {
          pushLayer(state, {type: 'unresolvableType'});
        }
      },
      exit(path, state): void {
        if (!path.node.superClass || !path.node.superTypeParameters) {
          // No generic superclass, don't care
          return;
        }

        if (
          t.isIdentifier(path.node.superClass) &&
          canResolveBuiltinType(path.node.superClass.name)
        ) {
          popLayer(state, 'resolvableType');
        } else {
          popLayer(state, 'unresolvableType');
        }
      },
    },
    TSTypeReference: {
      // Reference inlining is done top-down
      enter(path, state): void {
        if (
          t.isTSQualifiedName(path.node.typeName) &&
          !!path.node.typeParameters
        ) {
          // A generic qualified name, we need to push an unresolvable layer
          pushLayer(state, {type: 'unresolvableType'});
          return;
        }

        if (path.node.typeName.type !== 'Identifier') {
          return;
        }

        const typeName = path.node.typeName.name;
        if (isDefiningType(state, typeName)) {
          // Skipping recursive type
          path.skip();
          return;
        }

        if (typeName === 'Array' || typeName === 'ReadonlyArray') {
          pushLayer(state, {type: 'array'});
          return;
        }

        if (canResolveBuiltinType(typeName)) {
          pushLayer(state, {type: 'resolvableType'});

          if (typeName === 'Omit') {
            pushLayer(state, {type: 'omit'});
          }
          // Builtin type, do nothing. Will be resolved on exit.
          return;
        }

        if (insideTypeAliasLayerWithTypeParam(state, typeName)) {
          return;
        }

        if (shouldSkipInliningType(state, typeName)) {
          return;
        }

        inlineType(state, path, typeName);
      },
      // Builtin-type resolution is done bottom-up
      exit(path, state) {
        if (
          t.isTSQualifiedName(path.node.typeName) &&
          !!path.node.typeParameters
        ) {
          // A generic qualified name, we need to pop the unresolvable layer
          popLayer(state, 'unresolvableType');
          return;
        }

        if (path.node.typeName.type !== 'Identifier') {
          return;
        }

        const typeName = path.node.typeName.name;

        if (typeName === 'Array' || typeName === 'ReadonlyArray') {
          popLayer(state, 'array');
          return;
        }

        if (canResolveBuiltinType(typeName)) {
          if (typeName === 'Omit') {
            popLayer(state, 'omit');
          }

          popLayer(state, 'resolvableType');
          resolveBuiltinType(path, state);
          return;
        }

        state.parentTypeAliases?.delete(typeName);
      },
    },
  },
};

// Visitor state is only used internally, so we can safely cast to PluginObj<mixed>.
module.exports = inlineTypes as $FlowFixMe as PluginObj<unknown>;

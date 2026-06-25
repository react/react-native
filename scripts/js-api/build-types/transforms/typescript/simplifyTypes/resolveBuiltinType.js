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

import type {TSTypeResolver} from './resolveTSType';
import type {BaseVisitorState} from './visitorState';
import type {NodePath} from '@babel/traverse';

import {replaceWithCleanup} from './utils';

const collectTypeKeys = require('./collectTypeKeys');
const t = require('@babel/types');
const debug = require('debug')('build-types:transforms:inlineTypes');

// TODO: Handle more builtin TS types
const builtinTypeResolvers: {
  readonly [K: string]: (
    path: NodePath<t.TSTypeReference>,
    state: BaseVisitorState,
    tsTypeResolver?: TSTypeResolver,
  ) => void,
} = {
  Omit: (path, state, tsTypeResolver) => {
    if (
      !path.node.typeParameters ||
      path.node.typeParameters.params.length !== 2
    ) {
      throw new Error(
        `Omit type must have exactly 2 type parameters. Got ${path.node.typeParameters?.params.length ?? 0}`,
      );
    }

    const [objectType, keys] = path.node.typeParameters.params;
    // Try to resolve the second type parameter to a literal or union of literals
    const resolvedKeys = tsTypeResolver?.(keys, state.aliasToPathMap) ?? keys;

    if (t.isTSNeverKeyword(resolvedKeys)) {
      // never is just an empty union, so we can just replace the Omit with
      // the object type
      replaceWithCleanup(state, path, objectType);
      path.skip(); // We don't want to traverse the new node
      return;
    }

    const stringLiteralElements = (() => {
      if (t.isTSLiteralType(keys) && t.isStringLiteral(keys.literal)) {
        return [keys.literal.value];
      }

      if (t.isTSUnionType(resolvedKeys)) {
        const unionElements = resolvedKeys.types;
        return unionElements
          .map(element =>
            t.isTSLiteralType(element) && t.isStringLiteral(element.literal)
              ? element.literal
              : null,
          )
          .filter(literal => literal !== null)
          .map(literal => literal.value);
      }

      debug(`Unsupported Omit second parameter: ${keys.type}`);
      return 'skip' as const;
    })();

    if (stringLiteralElements === 'skip') {
      return;
    }

    // At this point, we know that the keys are a union of string literals

    if (!t.isTSTypeLiteral(objectType)) {
      // The parameter is not a literal, we can try to resolve it to a literal
      const constBody = tsTypeResolver?.(objectType, state.aliasToPathMap);

      if (!constBody || !t.isTSTypeLiteral(constBody)) {
        const parentKeys = collectTypeKeys(
          objectType,
          state.aliasToPathMap,
          state.interfaceToPathMap,
        );

        if (parentKeys != null) {
          const overlappingKeys = stringLiteralElements.filter((key: string) =>
            parentKeys.has(key),
          );

          if (overlappingKeys.length === 0) {
            replaceWithCleanup(state, path, objectType);
            path.skip();
            return;
          }

          if (path.node.typeParameters) {
            path.node.typeParameters.params[1] =
              overlappingKeys.length === 1
                ? t.tsLiteralType(t.stringLiteral(overlappingKeys[0]))
                : t.tsUnionType(
                    overlappingKeys.map((key: string) =>
                      t.tsLiteralType(t.stringLiteral(key)),
                    ),
                  );
          }
          return;
        }

        // Resolving the parameter failed, so we cannot do anything but update
        // the second type parameter to the resolved keys.
        if (path.node.typeParameters) {
          path.node.typeParameters.params[1] = resolvedKeys;
        }
        return;
      }

      // Resolving the parameter succeeded, so we can compare the keys to the
      // members of the object type
      const members = constBody.members
        .map(member => {
          if (t.isIdentifier(member.key)) {
            return member.key.name;
          }

          if (t.isLiteral(member.key)) {
            return member.key.value;
          }
        })
        .filter(member => member);

      const overlappingKeys = stringLiteralElements.filter(key =>
        members.includes(key),
      );

      // If there are no overlapping keys, we can just replace the Omit with
      // the object type
      if (overlappingKeys.length === 0) {
        replaceWithCleanup(state, path, objectType);
        path.skip(); // We don't want to traverse the new node
        return;
      }

      // If there are overlapping keys, we can leave only the relevant ones
      if (path.node.typeParameters) {
        path.node.typeParameters.params[1] = t.tsUnionType(
          overlappingKeys.map(key => t.tsLiteralType(t.stringLiteral(key))),
        );
      }

      return;
    }

    // objectType is a TSTypeLiteral, so we can just remove the omitted members
    if (
      // Only performing the resolution on objects with non-computed string keys.
      !objectType.members.every(
        member =>
          (t.isTSPropertySignature(member) || t.isTSMethodSignature(member)) &&
          (t.isIdentifier(member.key) || t.isLiteral(member.key)),
      )
    ) {
      debug(`Unsupported Omit first parameter: ${objectType.type}`);
      return;
    }

    replaceWithCleanup(
      state,
      path,
      t.tsTypeLiteral(
        objectType.members.filter(member => {
          const propNode = (member as $FlowFixMe as t.TSPropertySignature)
            .key as $FlowFixMe as t.Identifier | t.Literal;
          const propName =
            propNode.type === 'Identifier' ? propNode.name : propNode.value;

          /* $FlowFixMe[incompatible-type] Error exposed after improved typing
           * of Array.{includes,indexOf,lastIndexOf} */
          return !stringLiteralElements.includes(propName);
        }),
      ),
    );

    path.skip(); // We don't want to traverse the new node
  },
  Readonly: (path, state) => {
    if (
      !path.node.typeParameters ||
      path.node.typeParameters.params.length !== 1
    ) {
      throw new Error(
        `Readonly type must have exactly 1 type parameter. Got ${path.node.typeParameters?.params.length ?? 0}`,
      );
    }

    const [objectType] = path.node.typeParameters.params;

    if (!t.isTSTypeLiteral(objectType)) {
      // The parameter was not inlined, so we cannot do anything.
      return;
    }

    replaceWithCleanup(
      state,
      path,
      t.tsTypeLiteral(
        (t.cloneDeep(objectType).members ?? []).map(member => {
          if (
            t.isTSMethodSignature(member) ||
            t.isTSCallSignatureDeclaration(member) ||
            t.isTSConstructSignatureDeclaration(member)
          ) {
            return member;
          }
          member.readonly = true;
          return member;
        }),
      ),
    );

    path.skip(); // We don't want to traverse the new node
  },
  Partial: (path, state) => {
    if (
      !path.node.typeParameters ||
      path.node.typeParameters.params.length !== 1
    ) {
      throw new Error(
        `Partial type must have exactly 1 type parameter. Got ${path.node.typeParameters?.params.length ?? 0}`,
      );
    }

    const [objectType] = path.node.typeParameters.params;

    if (!t.isTSTypeLiteral(objectType)) {
      // The parameter was not inlined, so we cannot do anything.
      return;
    }

    replaceWithCleanup(
      state,
      path,
      t.tsTypeLiteral(
        (t.cloneDeep(objectType).members ?? []).map(member => {
          if (
            t.isTSMethodSignature(member) ||
            t.isTSCallSignatureDeclaration(member) ||
            t.isTSConstructSignatureDeclaration(member) ||
            t.isTSIndexSignature(member)
          ) {
            return member;
          }
          member.optional = true;
          return member;
        }),
      ),
    );

    path.skip(); // We don't want to traverse the new node
  },
};

export function canResolveBuiltinType(name: string): boolean {
  return builtinTypeResolvers.hasOwnProperty(name);
}

export function resolveBuiltinType(
  path: NodePath<t.TSTypeReference>,
  state: BaseVisitorState,
  tsTypeResolver?: TSTypeResolver,
): void {
  const name = path.node.typeName.name;
  if (name != null && builtinTypeResolvers.hasOwnProperty(name)) {
    builtinTypeResolvers[name](path, state, tsTypeResolver);
  } else {
    debug(`Unsupported builtin type: ${name ?? 'undefined'}`);
  }
}

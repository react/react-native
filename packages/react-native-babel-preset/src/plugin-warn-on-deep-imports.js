/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

function getWarningMessage(importPath, loc, source) {
  const message = `Deep imports from the 'react-native' package are deprecated ('${importPath}').`;

  if (source !== undefined) {
    return `${message} Source: ${source} ${loc ? `${loc.start.line}:${loc.start.column}` : ''}`;
  }

  return message;
}

function createWarning(t, importPath, loc, source) {
  const warningMessage = getWarningMessage(importPath, loc, source);

  const warning = t.expressionStatement(
    t.callExpression(
      t.memberExpression(t.identifier('console'), t.identifier('warn')),
      [t.stringLiteral(warningMessage)],
    ),
  );

  return warning;
}

function isDeepReactNativeImport(source) {
  const parts = source.split('/');
  return parts.length > 1 && parts[0] === 'react-native';
}

function withLocation(node, loc) {
  if (!node.loc) {
    return {...node, loc};
  }
  return node;
}

module.exports = ({types: t}) => ({
  name: 'warn-on-deep-imports',
  visitor: {
    ImportDeclaration(path, state) {
      const source = path.node.source.value;

      if (isDeepReactNativeImport(source)) {
        const loc = path.node.loc;
        state.import.push({source, loc});
      }
    },
    CallExpression(path, state) {
      const callee = path.get('callee');
      const args = path.get('arguments');

      if (
        callee.isIdentifier({name: 'require'}) &&
        args.length === 1 &&
        args[0].isStringLiteral()
      ) {
        const source =
          args[0].node.type === 'StringLiteral' ? args[0].node.value : '';
        if (isDeepReactNativeImport(source)) {
          const loc = path.node.loc;
          state.require.push({source, loc});
        }
      }
    },
    ExportNamedDeclaration(path, state) {
      const source = path.node.source;

      if (source && isDeepReactNativeImport(source.value)) {
        const loc = path.node.loc;
        state.export.push({source: source.value, loc});
      }
    },
    Program: {
      enter(path, state) {
        state.require = [];
        state.import = [];
        state.export = [];
      },
      exit(path, state) {
        const {body} = path.node;

        const requireWarnings = state.require.map(value =>
          withLocation(
            createWarning(t, value.source, value.loc, state.filename),
            value.loc,
          ),
        );

        const importWarnings = state.import.map(value =>
          withLocation(
            createWarning(t, value.source, value.loc, state.filename),
            value.loc,
          ),
        );

        const exportWarnings = state.export.map(value =>
          withLocation(
            createWarning(t, value.source, value.loc, state.filename),
            value.loc,
          ),
        );

        const warnings = [
          ...requireWarnings,
          ...importWarnings,
          ...exportWarnings,
        ];

        body.push(...warnings);
      },
    },
  },
});

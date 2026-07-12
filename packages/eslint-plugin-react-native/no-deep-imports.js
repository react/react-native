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

const {publicAPIMapping} = require('./utils.js');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow deep imports from react native',
    },
    messages: {
      deepImport:
        "'{{importPath}}' React Native deep imports are deprecated. Please use the top level import instead.",
      useReplacementSource:
        "'{{importPath}}' is deprecated. Please import '{{replacementSource}}' instead.",
    },
    schema: [],
    fixable: 'code',
  },

  create: function (context) {
    return {
      ImportDeclaration(node) {
        if (
          !isDeepReactNativeImport(node.source) ||
          isSecondaryEntryPoint(node.source) ||
          isFbInternalImport(node.source)
        ) {
          return;
        }
        if (reportReplacementSource(node.source)) {
          return;
        }
        if (isDefaultImport(node)) {
          const reactNativeSource = node.source.value.slice(
            'react-native/'.length,
          );
          const publicAPIDefaultComponent = publicAPIMapping[reactNativeSource];
          if (publicAPIDefaultComponent && publicAPIDefaultComponent.default) {
            context.report({
              ...getStandardReport(node.source),
              fix(fixer) {
                return fixer.replaceText(
                  node,
                  `import {${publicAPIDefaultComponent.default}} from 'react-native';`,
                );
              },
            });
          } else {
            context.report(getStandardReport(node.source));
          }
        } else if (isTypeImport(node)) {
          const reactNativeSource = node.source.value.slice(
            'react-native/'.length,
          );
          const publicAPIDefaultComponent = publicAPIMapping[reactNativeSource];
          if (publicAPIDefaultComponent && publicAPIDefaultComponent.types) {
            const typeNames = [];
            for (const specifier of node.specifiers) {
              const importedName = specifier.imported.name;
              if (!publicAPIDefaultComponent.types.includes(importedName)) {
                context.report(getStandardReport(node.source));
                return;
              }
              typeNames.push(importedName);
            }

            context.report({
              ...getStandardReport(node.source),
              fix(fixer) {
                return fixer.replaceText(
                  node,
                  `import type {${typeNames.join(', ')}} from 'react-native';`,
                );
              },
            });
          }
        } else {
          context.report(getStandardReport(node.source));
        }
      },
      CallExpression(node) {
        if (
          !isDeepRequire(node) ||
          isSecondaryEntryPoint(node.arguments[0]) ||
          isFbInternalImport(node.arguments[0])
        ) {
          return;
        }

        if (reportReplacementSource(node.arguments[0])) {
          return;
        }

        const parent = node.parent;
        const importPath = node.arguments[0].value;

        if (
          parent.type === 'VariableDeclarator' &&
          parent.id.type === 'Identifier'
        ) {
          const reactNativeSource = importPath.slice('react-native/'.length);
          const publicAPIDefaultComponent = publicAPIMapping[reactNativeSource];
          if (publicAPIDefaultComponent && publicAPIDefaultComponent.default) {
            context.report({
              ...getStandardReport(node.arguments[0]),
              fix(fixer) {
                return fixer.replaceText(
                  parent,
                  `{${publicAPIDefaultComponent.default}} = require('react-native')`,
                );
              },
            });
          } else {
            context.report(getStandardReport(node.arguments[0]));
          }
        } else {
          context.report(getStandardReport(node.arguments[0]));
        }
      },
    };

    function reportReplacementSource(source) {
      const reactNativeSource = source.value.slice('react-native/'.length);
      const mapping = publicAPIMapping[reactNativeSource];
      if (!mapping || !mapping.replacementSource) {
        return false;
      }
      context.report({
        node: source,
        messageId: 'useReplacementSource',
        data: {
          importPath: source.value,
          replacementSource: mapping.replacementSource,
        },
        fix(fixer) {
          return fixer.replaceText(source, `'${mapping.replacementSource}'`);
        },
      });
      return true;
    }

    function getStandardReport(source) {
      return {
        node: source,
        messageId: 'deepImport',
        data: {
          importPath: source.value,
        },
      };
    }

    function isDefaultImport(node) {
      return (
        node.specifiers.length === 1 &&
        node.specifiers.some(
          specifier => specifier.type === 'ImportDefaultSpecifier',
        )
      );
    }

    function isTypeImport(node) {
      return node.type === 'ImportDeclaration' && node.importKind === 'type';
    }

    function isDeepRequire(node) {
      return (
        node.callee.type === 'Identifier' &&
        node.callee.name === 'require' &&
        node.arguments.length === 1 &&
        node.arguments[0].type === 'Literal' &&
        typeof node.arguments[0].value === 'string' &&
        isDeepReactNativeImport(node.arguments[0])
      );
    }

    function isDeepReactNativeImport(source) {
      if (source.type !== 'Literal' || typeof source.value !== 'string') {
        return false;
      }

      const importPath = source.value;
      const parts = importPath.split('/');
      return parts.length > 1 && parts[0] === 'react-native';
    }

    function isSecondaryEntryPoint(source) {
      if (source.type !== 'Literal' || typeof source.value !== 'string') {
        return false;
      }

      return (
        source.value === 'react-native/asset-registry' ||
        source.value === 'react-native/setup-env'
      );
    }

    function isFbInternalImport(source) {
      if (source.type !== 'Literal' || typeof source.value !== 'string') {
        return false;
      }

      return source.value.startsWith('react-native/src/fb_internal/');
    }
  },
};

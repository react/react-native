/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TransformVisitor} from 'flow-transform';
import type {ParseResult} from 'flow-transform/dist/transform/parse';
import type {TransformASTResult} from 'flow-transform/dist/transform/transformAST';

const {transformAST} = require('flow-transform/dist/transform/transformAST');

const visitors: TransformVisitor = context => ({
  VariableDeclaration(node): void {
    if (node.parent?.type !== 'Program') {
      // Ignore declarations that are not in the top-level scope
      return;
    }

    if (node.declarations.length !== 1) {
      // Ignore mutliple declarations for now, those can be implemented if it
      // turns out to be necessary.
      return;
    }

    // Handle simple cases where `require` call is the only expression on the RHS
    if (
      node.declarations[0].init?.type === 'CallExpression' &&
      node.declarations[0].init.callee.type === 'Identifier' &&
      node.declarations[0].init.callee.name === 'require'
    ) {
      const requiredModule = node.declarations[0].init.arguments[0];

      if (node.declarations[0].id.type === 'Identifier') {
        // $FlowExpectedError[incompatible-type] - we are replacing an expression with a statement but in the top-level scope
        context.replaceNode(node, {
          type: 'ImportDeclaration',
          source: requiredModule,
          specifiers: [
            {
              type: 'ImportNamespaceSpecifier',
              local: {
                type: 'Identifier',
                name: node.declarations[0].id.name,
                optional: false,
              },
            },
          ],
        });
      } else if (node.declarations[0].id.type === 'ObjectPattern') {
        // $FlowExpectedError[incompatible-type] - we are replacing an expression with a statement but in the top-level scope
        context.replaceNode(node, {
          type: 'ImportDeclaration',
          source: requiredModule,
          specifiers: node.declarations[0].id.properties.map(property => {
            if (property.type !== 'Property') {
              throw new Error('Unexpected property type: ' + property.type);
            }

            if (property.key.type !== 'Identifier') {
              throw new Error('Unexpected key type: ' + property.key.type);
            }

            if (property.value.type !== 'Identifier') {
              throw new Error('Unexpected value type: ' + property.value.type);
            }

            return {
              type: 'ImportSpecifier',
              local: {
                type: 'Identifier',
                name: property.value.name,
                optional: false,
              },
              imported: {
                type: 'Identifier',
                name: property.key.name,
                optional: false,
              },
            };
          }),
        });
      }
    }

    // Handle cases where `require` call is the first expression in a member expression
    if (
      node.declarations[0].init?.type === 'MemberExpression' &&
      node.declarations[0].init.object.type === 'CallExpression' &&
      node.declarations[0].init.object.callee.type === 'Identifier' &&
      node.declarations[0].init.object.callee.name === 'require' &&
      node.declarations[0].id.type === 'Identifier'
    ) {
      const requiredModule = node.declarations[0].init.object.arguments[0];
      const variableName = node.declarations[0].id.name;

      // Handle member access via dot operator
      if (node.declarations[0].init.property.type === 'Identifier') {
        // Special treatment for `require().default` case to transform it to
        // a default import
        if (node.declarations[0].init.property.name === 'default') {
          // $FlowExpectedError[incompatible-type] - we are replacing an expression with a statement but in the top-level scope
          context.replaceNode(node, {
            type: 'ImportDeclaration',
            source: requiredModule,
            specifiers: [
              {
                type: 'ImportDefaultSpecifier',
                local: {
                  type: 'Identifier',
                  name: variableName,
                  optional: false,
                },
              },
            ],
          });
        } else {
          // $FlowExpectedError[incompatible-type] - we are replacing an expression with a statement but in the top-level scope
          context.replaceNode(node, {
            type: 'ImportDeclaration',
            source: requiredModule,
            specifiers: [
              {
                type: 'ImportSpecifier',
                local: {
                  type: 'Identifier',
                  name: variableName,
                  optional: false,
                },
                imported: {
                  type: 'Identifier',
                  name: node.declarations[0].init.property.name,
                  optional: false,
                },
              },
            ],
          });
        }
      } else if (node.declarations[0].init.property.type === 'Literal') {
        // Handle member access via bracket notation
        // $FlowExpectedError[incompatible-type] - we are replacing an expression with a statement but in the top-level
        context.replaceNode(node, {
          type: 'ImportDeclaration',
          source: requiredModule,
          specifiers: [
            {
              type: 'ImportSpecifier',
              local: {
                type: 'Identifier',
                name: variableName,
                optional: false,
              },
              imported: {
                type: 'Identifier',
                name: node.declarations[0].init.property.value,
                optional: false,
              },
            },
          ],
        });
      }
    }
  },
});

/**
 * Replace `require` calls with `import` statements.
 *
 * In the type-land top-level requires can safely be replaced with import
 * statements without impacring the runtime. This allows the modern Flow toolkit
 * to be used in existing codebases without having to update each file still
 * relying on require syntax.
 *
 * It's expecially useful in more complex cases where a type comes from an import
 * but the implementation comes from a require, like so:
 *   import typeof FooClassT from './Foo';
 *   const FooClass: FooClassT = require('./Foo').default;
 *   const Foo: FooClass = new FooClass();
 *
 * Where the types would diverge in the resulting TS output generated by
 * flow-api-translator.
 */
async function replaceRequiresWithImports(
  source: ParseResult,
): Promise<TransformASTResult> {
  return transformAST(source, visitors);
}

module.exports = replaceRequiresWithImports;

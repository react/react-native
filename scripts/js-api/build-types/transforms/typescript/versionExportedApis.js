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

const generate = require('@babel/generator').default;
const {parse} = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');
const {createHash} = require('crypto');
const debug = require('debug')('build-types:transforms:versionExportedApis');

/**
 * A visitor that annotates all exported types in the API snapshot with a
 * version hash based on the shape of all input types.
 *
 * Any AST change to a given type or a dependency will trigger a rehash,
 * indicating that the annotated type has changed in some way in a given
 * commit.
 *
 * This transform is best-effort and we are okay with minor false positives.
 * The approach also allows this implementation to be updated in future
 * without causing structural changes elsewhere in the API snapshot.
 */
function createVersionExportedApis(
  outputDebugAnnotations: boolean = false,
): PluginObj<unknown> {
  return {
    visitor: {
      Program(path) {
        const declarations = new Map<string, BabelNode>();
        const dependencyGraph = new Map<string, Array<string>>();
        const exportedIdentifiers: Set<string> = new Set();
        const namespaceAliases = new Map<string, string>();
        const computedHashes = new Map<string, string>();

        // Collect all type declarations and build dependency graph
        for (const nodePath of path.get('body')) {
          const node = nodePath.node;
          // VariableDeclaration has name at declarations[0].id.name, others at node.id.name
          const typeName = t.isVariableDeclaration(node)
            ? node.declarations?.[0]?.id?.name
            : node.id?.name;
          if (
            (t.isTSDeclareFunction(node) ||
              t.isTSTypeAliasDeclaration(node) ||
              t.isTSInterfaceDeclaration(node) ||
              t.isTSEnumDeclaration(node) ||
              t.isClassDeclaration(node) ||
              t.isTSModuleDeclaration(node) ||
              t.isVariableDeclaration(node)) &&
            typeName != null
          ) {
            // Don't overwrite if declaration already exists
            // (e.g., prefer `declare const X: typeof X_default` over `declare type X = typeof X`)
            if (!declarations.has(typeName)) {
              declarations.set(typeName, node);
              dependencyGraph.set(
                typeName,
                Array.from(getTypeReferencesForNode(node)),
              );
            }
          }
        }

        // Collect all exported identifiers
        for (const nodePath of path.get('body')) {
          if (nodePath.isExportNamedDeclaration() && nodePath.node.specifiers) {
            nodePath.node.specifiers.forEach(specifier => {
              if (specifier.type === 'ExportSpecifier') {
                exportedIdentifiers.add(specifier.local.name);
              }
            });
          }
        }

        // Build mapping of namespace exports aliased to local types
        for (const nodePath of path.get('body')) {
          const node = nodePath.node;
          if (t.isTSModuleDeclaration(node) && node.body) {
            const namespaceName = node.id.name;

            // $FlowFixMe[incompatible-type]
            for (const item of node.body.body) {
              if (t.isExportNamedDeclaration(item) && item.specifiers) {
                for (const specifier of item.specifiers) {
                  if (
                    t.isExportSpecifier(specifier) &&
                    specifier.local &&
                    specifier.exported
                  ) {
                    const localName = specifier.local.name;
                    const exportedName = specifier.exported.name;
                    namespaceAliases.set(
                      // $FlowFixMe[incompatible-type]
                      `${namespaceName}.${exportedName}`,
                      localName,
                    );
                  }
                }
              }
            }
          }
        }

        // Helper to recursively collect all dependencies for a type
        const getAllDependencies = (
          typeName: string,
          visited: Set<string> = new Set(),
          depth: number = 0,
        ): Set<string> => {
          if (visited.has(typeName)) {
            return visited;
          }
          visited.add(typeName);
          const directDeps = dependencyGraph.get(typeName) || [];
          const indent = '  '.repeat(depth);

          for (let dep of directDeps) {
            dep = namespaceAliases.get(dep) ?? dep;
            if (declarations.has(dep) && !visited.has(dep)) {
              debug(`${indent}- Found dependency: ${dep}`);
              getAllDependencies(dep, visited, depth + 1);
            } else if (!declarations.has(dep)) {
              debug(`${indent}- External dependency: ${dep}`);
            }
          }

          return visited;
        };

        // Helper to get the stable hash input for a single AST node
        const getHashInputForNode = (node: BabelNode): string => {
          const code = generate(node).code;

          const ast = parse(code, {
            sourceType: 'module',
            plugins: ['typescript'],
            allowUndeclaredExports: true,
          });
          traverse(ast, {
            Identifier(nodePath) {
              if (
                declarations.has(nodePath.node.name) &&
                !exportedIdentifiers.has(nodePath.node.name)
              ) {
                // Replace local (unexported) identifiers with a constant name
                nodePath.node.name = '__INTERNAL';
              }
            },
          });
          return generate(ast).code;
        };

        // Helper to generate a stable hash for a type and all local dependencies
        const generateTypeHash = (typeName: string): string => {
          const cached = computedHashes.get(typeName);
          if (cached != null) {
            return cached;
          }

          debug(`\n[GENERATE HASH] Analyzing dependencies for ${typeName}`);
          const allDeps = getAllDependencies(typeName);
          allDeps.delete(typeName); // Remove self from dependencies

          const sortedDeps = Array.from(allDeps).sort();
          const hasher = createHash('sha256');

          // Add the type's own code to the hash
          const typeDecl = declarations.get(typeName);
          if (typeDecl) {
            const code = getHashInputForNode(typeDecl);
            hasher.update(code);
            debug(`\n[HASH INPUT] Type ${typeName}:\n${code}\n`);
          }

          // Add code for each dependency to the hash
          for (const dep of sortedDeps) {
            const depDecl = declarations.get(dep);
            if (depDecl) {
              const code = getHashInputForNode(depDecl);
              hasher.update(code);
              debug(
                `[HASH INPUT] Dependency ${dep} for ${typeName}:\n${code}\n`,
              );
            }
          }

          const hash = hasher.digest('hex').slice(0, 8);
          debug(`[HASH RESULT] ${typeName}: ${hash}`);
          computedHashes.set(typeName, hash);
          return hash;
        };

        // Helper to get a compact representation of the dependency tree
        const getCompactDependencyTree = (
          typeName: string,
          maxDepth: number = 2,
        ): string => {
          const result = [];
          const visited = new Set<string>();
          const traverseDeps = (name: string, depth: number = 0): void => {
            if (depth > maxDepth || visited.has(name)) {
              return;
            }
            visited.add(name);
            const deps = dependencyGraph.get(name) || [];
            const internalDeps = deps
              .map(dep => namespaceAliases.get(dep) ?? dep)
              .filter(dep => declarations.has(dep));
            if (internalDeps.length > 0) {
              result.push(`${name}→[${internalDeps.join(',')}]`);
              internalDeps.forEach(dep => traverseDeps(dep, depth + 1));
            }
          };
          traverseDeps(typeName);
          return result.join(';');
        };

        // Process export block and annotate with dependencies hash
        for (const nodePath of path.get('body')) {
          if (
            t.isExportNamedDeclaration(nodePath.node) &&
            !nodePath.node.declaration &&
            nodePath.node.specifiers != null
          ) {
            const specifiers = nodePath.node.specifiers.map(specifier => {
              // $FlowFixMe[incompatible-type] nodePath is refined above
              // $FlowFixMe[incompatible-use]
              const name: string = specifier.exported.name;
              if (declarations.has(name)) {
                const hash = generateTypeHash(name);
                let comment = ` ${hash}`;

                if (outputDebugAnnotations) {
                  const deps = getAllDependencies(name);
                  deps.delete(name);
                  const depTree = getCompactDependencyTree(name);
                  comment +=
                    `, Deps: [${Array.from(deps).join(', ')}]` +
                    `, Total: ${deps.size}` +
                    (depTree.length ? `, Tree: ${depTree}` : '');
                }

                return t.addComment(specifier, 'trailing', comment, true);
              }
              return specifier;
            });
            // $FlowFixMe[prop-missing]
            // $FlowFixMe[incompatible-type]
            nodePath.node.specifiers = specifiers;
          }
        }
      },
    },
  };

  /**
   * Collect all direct type references from a TypeScript AST node.
   */
  function getTypeReferencesForNode(
    node: BabelNode,
    refs: Set<string> = new Set(),
  ): Set<string> {
    if (!node) {
      return refs;
    }

    // Handle type references
    if (t.isTSTypeReference(node) && node.typeName) {
      refs.add(extractQualifiedName(node.typeName));
    }

    // Handle interface extends
    if (t.isTSInterfaceDeclaration(node) && node.extends) {
      for (const extend of node.extends) {
        if (extend.expression) {
          refs.add(extractQualifiedName(extend.expression));
        }
      }
    }

    // Handle class extends and implements
    if (t.isClassDeclaration(node)) {
      if (node.superClass && node.superClass.type === 'Identifier') {
        refs.add(node.superClass.name);
      }

      if (node.implements) {
        for (const impl of node.implements) {
          if (impl.expression) {
            refs.add(extractQualifiedName(impl.expression));
          }
        }
      }
    }

    // Handle type parameters
    if (node.typeParameters && node.typeParameters.params) {
      for (const param of node.typeParameters.params) {
        getTypeReferencesForNode(param, refs);
        if (param.constraint) {
          getTypeReferencesForNode(param.constraint, refs);
        }
        if (param.default) {
          getTypeReferencesForNode(param.default, refs);
        }
      }
    }

    // Handle export specifiers which can be present in namespaces
    if (t.isExportSpecifier(node)) {
      if (node.local && node.local.name) {
        refs.add(node.local.name);
      }
    }

    // Handle indexed access types (`T['key']`)
    if (t.isTSIndexedAccessType(node)) {
      getTypeReferencesForNode(node.objectType, refs);
      getTypeReferencesForNode(node.indexType, refs);
    }

    // Handle union types (`T | U`)
    if (t.isTSUnionType(node)) {
      for (const member of node.types) {
        getTypeReferencesForNode(member, refs);
      }
    }

    // Handle intersection types (`T & U`)
    if (t.isTSIntersectionType(node)) {
      for (const member of node.types) {
        getTypeReferencesForNode(member, refs);
      }
    }

    // Handle type operators (`keyof T`)
    if (t.isTSTypeOperator(node)) {
      getTypeReferencesForNode(node.typeAnnotation, refs);
    }

    // Handle typeof queries (`typeof X`)
    if (t.isTSTypeQuery(node) && node.exprName) {
      const exprName = node.exprName;
      if (t.isIdentifier(exprName) || t.isTSQualifiedName(exprName)) {
        refs.add(extractQualifiedName(exprName));
      }
    }

    // Handle conditional types (`T extends U ? X : Y`)
    if (t.isTSConditionalType(node)) {
      getTypeReferencesForNode(node.checkType, refs);
      getTypeReferencesForNode(node.extendsType, refs);
      getTypeReferencesForNode(node.trueType, refs);
      getTypeReferencesForNode(node.falseType, refs);
    }

    // Handle mapped types (`{ [K in keyof T]: X }`)
    if (t.isTSMappedType(node)) {
      if (node.typeParameter && node.typeParameter.constraint) {
        getTypeReferencesForNode(node.typeParameter.constraint, refs);
      }
      if (node.typeAnnotation) {
        getTypeReferencesForNode(node.typeAnnotation, refs);
      }
    }

    // Recursively traverse all properties
    for (const key in node) {
      // $FlowFixMe[invalid-computed-prop]
      const value = node[key];
      if (Array.isArray(value)) {
        value.forEach(item => getTypeReferencesForNode(item, refs));
        /* $FlowFixMe[invalid-compare] Error discovered during Constant Condition
         * roll out. See https://fburl.com/workplace/4oq3zi07. */
      } else if (typeof value === 'object' && value !== null) {
        getTypeReferencesForNode(value, refs);
      }
    }

    return refs;
  }

  function extractQualifiedName(
    node: BabelNodeIdentifier | BabelNodeTSQualifiedName,
  ): string {
    if (t.isIdentifier(node)) {
      return node.name;
    }

    if (t.isTSQualifiedName(node)) {
      let fullName = '';
      let current = node;

      while (t.isTSQualifiedName(current)) {
        if (current.right && current.right.name) {
          fullName = '.' + current.right.name + fullName;
        }
        // $FlowFixMe[prop-missing]
        // $FlowFixMe[incompatible-type]
        current = current.left;
      }

      if (t.isIdentifier(current) && current.name) {
        return current.name + fullName;
      }
    }

    throw new Error(
      `Failed to parse type name from node of type: ${node.type}. Expected Identifier or TSQualifiedName.`,
    );
  }
}

module.exports = createVersionExportedApis;

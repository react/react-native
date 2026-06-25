/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

const babel = require('@babel/core');
const t = require('@babel/types');

const Result = {
  BREAKING: 'BREAKING',
  POTENTIALLY_BREAKING: 'POTENTIALLY_BREAKING',
  POTENTIALLY_NON_BREAKING: 'POTENTIALLY_NON_BREAKING',
  NON_BREAKING: 'NON_BREAKING',
} as const;

type Output = {
  result: Values<typeof Result>,
  changedApis: Array<string>,
};

type Hash = string;
type APISpecifier = string;

function diffApiSnapshot(prevSnapshot: string, newSnapshot: string): Output {
  const prevSnapshotAST = babel.parseSync(prevSnapshot, {
    plugins: ['@babel/plugin-syntax-typescript'],
  });
  const newSnapshotAST = babel.parseSync(newSnapshot, {
    plugins: ['@babel/plugin-syntax-typescript'],
  });

  const prevSpecHashPair = getExportedSymbols(prevSnapshotAST);
  const newSpecHashPair = getExportedSymbols(newSnapshotAST);

  if (prevSpecHashPair == null || newSpecHashPair == null) {
    return {
      result: Result.BREAKING,
      changedApis: [],
    };
  }

  return analyzeSpecHashPairs(prevSpecHashPair, newSpecHashPair);
}

function analyzeSpecHashPairs(
  prevSpecHashPairs: Array<[APISpecifier, Hash]>,
  newSpecHashPairs: Array<[APISpecifier, Hash]>,
): Output {
  const output = {
    result: Result.NON_BREAKING,
    changedApis: [],
  } as Output;

  const newSpecHashMapping = Object.fromEntries(newSpecHashPairs);
  for (const [name, hash] of prevSpecHashPairs) {
    if (newSpecHashMapping[name]) {
      const newHash = newSpecHashMapping[name];
      if (hash !== newHash) {
        // The hash has changed which means that the statement has changed
        output.result = Result.POTENTIALLY_BREAKING;
        output.changedApis.push(name);
      }
      delete newSpecHashMapping[name];
    } else {
      // There is no statement of that name in the new rollup which means that:
      // 1. This statement was entirely removed
      // 2. This statement was renamed
      // 3. It is not public anymore
      output.result = Result.BREAKING;
      output.changedApis.push(name);
    }
  }

  if (
    output.result === Result.NON_BREAKING &&
    Object.keys(newSpecHashMapping).length > 0
  ) {
    output.result = Result.POTENTIALLY_NON_BREAKING;
    for (const name of Object.keys(newSpecHashMapping)) {
      // saving new APIs
      output.changedApis.push(name);
    }
  }

  return output;
}

function getExportedSymbols(
  ast: BabelNodeFile,
): Array<[APISpecifier, Hash]> | null {
  for (const nodePath of ast.program.body) {
    if (
      t.isExportNamedDeclaration(nodePath) &&
      !nodePath.declaration &&
      nodePath.specifiers != null
    ) {
      const specifiers = nodePath.specifiers;
      const result: Array<[APISpecifier, Hash]> = [];
      for (let i = 0; i < specifiers.length; i++) {
        const specifier = specifiers[i];
        const name = specifier.exported.name || '';
        const comment =
          specifier.leadingComments && specifier.leadingComments.length > 0
            ? specifier.leadingComments[0]?.value
            : '';

        if (i > 0) {
          result[i - 1][1] = comment;
        }
        result.push([name, comment]);
      }

      const lastSpec = specifiers[specifiers.length - 1];
      const comment =
        lastSpec.trailingComments && lastSpec.trailingComments.length > 0
          ? lastSpec.trailingComments[0]?.value
          : '';
      result[result.length - 1][1] = comment;
      return result;
    }
  }

  return null;
}

module.exports = {diffApiSnapshot, Result};

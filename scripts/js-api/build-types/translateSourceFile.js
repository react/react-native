/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {PluginObj} from '@babel/core';
import type {ParseResult} from 'hermes-transform/dist/transform/parse';
import type {TransformASTResult} from 'hermes-transform/dist/transform/transformAST';

const getDependencies = require('./resolution/getDependencies');
const applyBabelTransformsSeq = require('./utils/applyBabelTransformsSeq');
const translate = require('flow-api-translator');
const {parse, print} = require('hermes-transform');

type PreTransformFn = ParseResult => Promise<TransformASTResult>;

const preTransforms: Array<PreTransformFn> = [
  require('./transforms/flow/stripPrivateProperties'),
  require('./transforms/flow/replaceRequiresWithImports'),
  require('./transforms/flow/replaceEmptyWithNever'),
  require('./transforms/flow/replaceStringishWithString'),
  require('./transforms/flow/replaceNullablePropertiesWithUndefined'),
  require('./transforms/flow/reattachDocComments'),
  require('./transforms/flow/ensureNoUnprefixedProps'),
];
const postTransforms = (filePath: string): Array<PluginObj<unknown>> => [
  require('./transforms/typescript/convertTypeAliasesToInterfaces'),
  require('./transforms/typescript/replaceProtectedConstructors'),
  require('./transforms/typescript/replaceDefaultExportName')(filePath),
];
const prettierOptions = {parser: 'babel'};
const unsupportedFeatureRegex =
  /Unsupported feature: Translating ".*" is currently not supported/;

type TranslateSourceFileResult = {
  result: string,
  dependencies: Set<string>,
};

/**
 * Translate the public API of a Flow source file to TypeScript definition.
 *
 * This uses [flow-api-translator](https://www.npmjs.com/package/flow-api-translator),
 * and applies extra transformations such as stripping private properties.
 */
async function translateSourceFile(
  source: string,
  filePath: string,
): Promise<TranslateSourceFileResult> {
  // Parse Flow source
  const parsed = await parse(source);

  // Apply pre-transforms
  const preTransformResult = await applyPreTransforms(parsed);

  // Translate to Flow defs (prunes non-type imports)
  const flowDefResult = await translate.translateFlowToFlowDef(
    preTransformResult.code,
    prettierOptions,
  );

  // Resolve dependencies
  const dependencies = await getDependencies(
    await parse(flowDefResult),
    filePath,
  );

  // Translate to TypeScript defs
  const tsDefResult = await translate.translateFlowDefToTSDef(
    flowDefResult,
    prettierOptions,
  );

  const unsupportedFeatureMatch = tsDefResult.match(unsupportedFeatureRegex);
  if (unsupportedFeatureMatch != null) {
    throw new Error(`Error: ${unsupportedFeatureMatch[0]}`);
  }

  // Apply post-transforms
  const result = await applyBabelTransformsSeq(
    tsDefResult,
    postTransforms(filePath),
  );

  return {
    result,
    dependencies,
  };
}

async function applyPreTransforms(source: ParseResult): Promise<ParseResult> {
  return preTransforms.reduce((input, transform) => {
    return input.then(async result => {
      const transformed = await transform(result);
      const code = transformed.astWasMutated
        ? await print(transformed.ast, transformed.mutatedCode, prettierOptions)
        : transformed.mutatedCode;
      return parse(code);
    });
  }, Promise.resolve(source));
}

module.exports = translateSourceFile;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const {PACKAGES_DIR, REPO_ROOT} = require('../../shared/consts');
const {ENTRY_POINT, IGNORE_PATTERNS, TYPES_OUTPUT_DIR} = require('../config');
const getRequireStack = require('./resolution/getRequireStack');
const translatedModuleTemplate = require('./templates/translatedModule.d.ts-template');
const translateSourceFile = require('./translateSourceFile');
const {promises: fs, watch: fsWatch} = require('fs');
const micromatch = require('micromatch');
const path = require('path');
const {styleText} = require('util');

/**
 * Build generated TypeScript types for react-native.
 *
 * Bundles the react-native package and its type dependencies into an output
 * directory of TypeScript definition files which will be published to npm.
 *
 * We translate Flow source code to TypeScript using
 * [flow-api-translator](https://www.npmjs.com/package/flow-api-translator)
 * along with our own pre and post-processing.
 */
async function buildGeneratedTypes(): Promise<Set<string>> {
  const files = new Set<string>([path.join(REPO_ROOT, ENTRY_POINT)]);
  const translatedFiles = new Set<string>();
  const dependencyEdges: DependencyEdges = [];
  const allErrors: Array<ModuleTranslationError> = [];

  while (files.size > 0) {
    const {dependencies, errors} = await translateSourceFiles(
      dependencyEdges,
      files,
    );
    dependencyEdges.push(...dependencies);
    allErrors.push(...errors);

    files.forEach(file => translatedFiles.add(file));
    files.clear();

    for (const [, dep] of dependencies) {
      if (
        !translatedFiles.has(dep) &&
        !IGNORE_PATTERNS.some(pattern => micromatch.isMatch(dep, pattern))
      ) {
        files.add(dep);
      }
    }
  }

  await fs.copyFile(
    path.join(__dirname, 'templates', 'tsconfig.json'),
    path.join(PACKAGES_DIR, 'react-native', TYPES_OUTPUT_DIR, 'tsconfig.json'),
  );

  if (allErrors.length > 0) {
    console.error(
      '\n' +
        styleText(['bold', 'inverse', 'red'], ' FAIL ') +
        ' API translation encountered errors.\n',
    );
    process.exitCode = 1;
    return translatedFiles;
  }

  const touchedPackages = new Set<string>(
    Array.from(translatedFiles).map(
      file =>
        path.join(PACKAGES_DIR, getPackageName(file), TYPES_OUTPUT_DIR) + '/',
    ),
  );
  for (const packagePath of touchedPackages) {
    console.log(
      styleText('green', '  ✔') +
        ' Types built to ' +
        styleText('underline', packagePath),
    );
  }
  console.log('');
  return translatedFiles;
}

type DependencyEdges = Array<[string, string]>;
type TranslateFilesResult = {
  dependencies: DependencyEdges,
  errors: Array<ModuleTranslationError>,
};

async function translateSourceFiles(
  dependencyEdges: DependencyEdges,
  inputFiles: Iterable<string>,
): Promise<TranslateFilesResult> {
  const files = new Set<string>([...inputFiles]);
  const dependencies: DependencyEdges = [];
  const errors: Array<ModuleTranslationError> = [];

  await Promise.all(
    Array.from(files).map(async file => {
      const buildPath = getBuildPath(file);
      const source = await fs.readFile(file, 'utf-8');

      try {
        const {result: typescriptDef, dependencies: fileDeps} =
          await translateSourceFile(source, file);

        for (const dep of fileDeps) {
          dependencies.push([file, dep]);
        }

        await fs.mkdir(path.dirname(buildPath), {recursive: true});
        await fs.writeFile(
          buildPath,
          translatedModuleTemplate({
            originalFileName: path.relative(REPO_ROOT, file),
            source: stripDocblock(typescriptDef),
            tripleSlashDirectives: extractTripleSlashDirectives(source),
          }),
        );
      } catch (e) {
        const error = new ModuleTranslationError(file, e);
        error.requireStack = getRequireStack(dependencyEdges, file);
        errors.push(error);
        console.error(error.formatError());
      }
    }),
  );

  return {dependencies, errors};
}

function getPackageName(file: string): string {
  return path.relative(PACKAGES_DIR, file).split(path.sep)[0];
}

function getBuildPath(file: string): string {
  const packageDir = path.join(PACKAGES_DIR, getPackageName(file));

  return path.join(
    packageDir,
    file
      .replace(packageDir, TYPES_OUTPUT_DIR)
      .replace(/\.js\.flow$/, '.js')
      .replace(/\.js$/, '.d.ts'),
  );
}

function stripDocblock(source: string): string {
  return source.replace(/\/\*\*[\s\S]*?\*\/\n/, '');
}

function extractTripleSlashDirectives(source: string): Array<string> {
  const directives = source.match(/^\/\/\/.*$/gm);

  if (directives == null) {
    return [];
  }

  return directives.map(directive => directive.replace(/^\/\/\//g, '').trim());
}

class ModuleTranslationError extends Error {
  requireStack: Array<string> = [];
  originalError: Error;

  constructor(filePath: string, originalError: Error) {
    super(`Failed to build ${path.relative(REPO_ROOT, filePath)}`);
    this.name = 'ModuleTranslationError';
    this.originalError = originalError;
  }

  formatError(): string {
    let output = `${this.name}: ${this.message}`;

    if (this.originalError?.stack != null) {
      output += `\n  ${this.originalError.stack}`;
    }

    if (this.requireStack.length > 0) {
      output += '\n  Require stack:';
      for (const stackEntry of this.requireStack) {
        output += `\n  - ${stackEntry}`;
      }
    }

    return output;
  }
}

async function translateFile(file: string): Promise<void> {
  const buildPath = getBuildPath(file);
  const source = await fs.readFile(file, 'utf-8');
  const {result: typescriptDef} = await translateSourceFile(source, file);
  await fs.mkdir(path.dirname(buildPath), {recursive: true});
  await fs.writeFile(
    buildPath,
    translatedModuleTemplate({
      originalFileName: path.relative(REPO_ROOT, file),
      source: stripDocblock(typescriptDef),
      tripleSlashDirectives: extractTripleSlashDirectives(source),
    }),
  );
}

function watchGeneratedTypes(translatedFiles: Set<string>): void {
  console.log(
    styleText(['bold', 'inverse'], ' Watching for changes... ') + '\n',
  );

  const packageDirs = new Set(
    Array.from(translatedFiles).map(file =>
      path.join(
        PACKAGES_DIR,
        path.relative(PACKAGES_DIR, file).split(path.sep)[0],
      ),
    ),
  );

  for (const packageDir of packageDirs) {
    fsWatch(packageDir, {recursive: true}, (eventType, filename) => {
      if (filename == null) {
        return;
      }
      const filePath = path.join(packageDir, filename);
      if (!translatedFiles.has(filePath)) {
        return;
      }
      process.stdout.write(
        styleText('dim', 'File changed: ') +
          path.relative(REPO_ROOT, filePath) +
          '\n',
      );
      translateFile(filePath).then(
        () => {
          process.stdout.write(
            styleText('green', '  ✔') +
              ' Rebuilt ' +
              path.relative(REPO_ROOT, filePath) +
              '\n',
          );
        },
        (err: Error) => {
          process.stderr.write(
            styleText('red', '  ✖ Build error: ') + err.message + '\n',
          );
        },
      );
    });
  }
}

module.exports = {
  buildGeneratedTypes,
  watchGeneratedTypes,
};

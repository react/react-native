/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

require('../shared/babelRegister').registerForScript();

const {PACKAGES_DIR, REPO_ROOT} = require('../shared/consts');
const {
  buildConfig,
  getBabelConfig,
  getBuildOptions,
  getTypeScriptCompilerOptions,
} = require('./config');
const babel = require('@babel/core');
const {spawn} = require('child_process');
const translate = require('flow-api-translator');
const {promises: fs} = require('fs');
const micromatch = require('micromatch');
const path = require('path');
const prettier = require('prettier');
const {globSync} = require('tinyglobby');
const ts = require('typescript');
const {parseArgs, styleText} = require('util');

const SRC_DIR = 'src';
const BUILD_DIR = 'dist';
const JS_FILES_PATTERN = '**/*.js';
const IGNORE_PATTERN = '**/__{tests,mocks,fixtures}__/**';

const config = {
  allowPositionals: true,
  options: {
    prepack: {type: 'boolean'},
    help: {type: 'boolean'},
  },
};

async function build() {
  const {
    positionals: packageNames,
    values: {prepack, help},
    /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
     * https://fburl.com/workplace/6291gfvu */
  } = parseArgs(config);

  if (help) {
    console.log(`
  Usage: node ./scripts/build/build.js <packages>

  Build packages (shared monorepo build setup).

  By default, builds all packages defined in ./scripts/build/config.js. If a
  a package list is provided, builds only those specified.

  Options:
    --prepack         Run the ./prepack.js script after building, applying
                      package.json "publishConfig" changes to the working copy.
                      (This is usually run later in CI before npm publish).
    `);
    process.exitCode = 0;
    return;
  }

  console.log(
    '\n' + styleText(['bold', 'inverse'], 'Building packages') + '\n',
  );

  const packagesToBuild = packageNames.length
    ? packageNames.filter(packageName => packageName in buildConfig.packages)
    : Object.keys(buildConfig.packages);

  let ok = true;
  for (const packageName of packagesToBuild) {
    await buildPackage(packageName, prepack);
  }

  process.exitCode = ok ? 0 : 1;
}

async function buildPackage(packageName /*: string */, prepack /*: boolean */) {
  try {
    process.stdout.write(
      `${packageName} ${styleText('dim', '.').repeat(72 - packageName.length)} `,
    );

    const {emitTypeScriptDefs} = getBuildOptions(packageName);
    const entryPoints = await getEntryPoints(packageName);

    const files = globSync('**/*', {
      cwd: path.resolve(PACKAGES_DIR, packageName, SRC_DIR),
      onlyFiles: true,
      absolute: true,
    }).filter(
      file =>
        !entryPoints.has(file) &&
        !entryPoints.has(file.replace(/\.js$/, '.flow.js')),
    );

    // Build regular files
    for (const file of files) {
      await buildFile(path.normalize(file), {
        silent: true,
      });
    }

    // Build entry point files
    for (const entryPoint of entryPoints) {
      await buildFile(path.normalize(entryPoint), {
        silent: true,
      });
    }

    // Validate program for emitted .d.ts files
    if (emitTypeScriptDefs) {
      validateTypeScriptDefs(packageName);
    }

    // Run prepack script if configured
    if (prepack) {
      await new Promise((resolve, reject) => {
        const packagePath = path.resolve(PACKAGES_DIR, packageName);
        const child = spawn(
          process.execPath,
          [path.join(__dirname, 'prepack.js')],
          {
            cwd: packagePath,
            stdio: ['ignore', 'ignore', 'inherit'],
          },
        );
        child.on('close', code => {
          if (code !== 0) {
            reject(new Error(`prepack script exited with code ${code}`));
          } else {
            resolve();
          }
        });
        child.on('error', reject);
      });
    }

    process.stdout.write(
      styleText(['reset', 'inverse', 'bold', 'green'], ' DONE '),
    );
  } catch (e) {
    process.stdout.write(
      styleText(['reset', 'inverse', 'bold', 'red'], ' FAIL ') + '\n',
    );
    throw e;
  } finally {
    process.stdout.write('\n');
  }
}

async function buildFile(
  file /*: string */,
  options /*: {silent?: boolean, destPath?: string}*/ = {},
) {
  const {silent = false} = options;
  const packageName = getPackageName(file);
  const buildPath = getBuildPath(file);
  const {emitFlowDefs, emitTypeScriptDefs} = getBuildOptions(packageName);

  const logResult = ({copied, desc} /*: {copied: boolean, desc?: string} */) =>
    silent ||
    console.log(
      styleText('dim', '  - ') +
        path.relative(PACKAGES_DIR, file) +
        (copied ? ' -> ' + path.relative(PACKAGES_DIR, buildPath) : ' ') +
        (desc != null ? ' (' + desc + ')' : ''),
    );

  if (micromatch.isMatch(file, IGNORE_PATTERN)) {
    logResult({copied: false, desc: 'ignore'});
    return;
  }

  await fs.mkdir(path.dirname(buildPath), {recursive: true});

  if (!micromatch.isMatch(file, JS_FILES_PATTERN)) {
    await fs.copyFile(file, buildPath);
    logResult({copied: true, desc: 'copy'});
    return;
  }

  const source = await fs.readFile(file, 'utf-8');
  const prettierConfig = {parser: 'babel'};

  // Transform source file using Babel
  const transformed = await prettier.format(
    (await babel.transformFileAsync(file, getBabelConfig(packageName))).code,
    /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
     * https://fburl.com/workplace/6291gfvu */
    prettierConfig,
  );
  await fs.writeFile(buildPath, transformed);

  // Translate source Flow types for each type definition target
  if (/@flow/.test(source)) {
    try {
      await Promise.all([
        emitFlowDefs
          ? fs.writeFile(
              buildPath + '.flow',
              await translate.translateFlowToFlowDef(source, prettierConfig),
            )
          : null,
        emitTypeScriptDefs
          ? fs.writeFile(
              buildPath.replace(/\.js$/, '') + '.d.ts',
              await translate.translateFlowToTSDef(source, prettierConfig),
            )
          : null,
      ]);
    } catch (e) {
      e.message = `Error translating ${path.relative(PACKAGES_DIR, file)}:\n${e.message}`;
      throw e;
    }
  }

  logResult({copied: true});
}

/*::
type PackageJson = {
  name: string,
  exports?: {[subpath: string]: string | unknown},
};
*/

/**
 * Get the set of Flow entry points to build.
 *
 * As a convention, we use a .js/.flow.js file pair for each package entry
 * point, with the .js file being a Babel wrapper that can be used directly in
 * the monorepo. On build, we drop this wrapper and emit a single file from the
 * .flow.js contents.
 *
 * index.js ──────►(removed)
 *              ┌─►index.js
 * index.flow.js├─►index.d.ts
 *              └─►index.js.flow
 */
async function getEntryPoints(
  packageName /*: string */,
) /*: Promise<Set<string>> */ {
  const packagePath = path.resolve(PACKAGES_DIR, packageName, 'package.json');
  const pkg /*: PackageJson */ = JSON.parse(
    await fs.readFile(packagePath, 'utf8'),
  );
  const entryPoints /*: Set<string> */ = new Set();

  if (pkg.exports == null) {
    throw new Error(
      packageName +
        ' does not define an "exports" field in its package.json. As part ' +
        'of the build setup, this field must be used in order to rewrite ' +
        'paths to built files in production.',
    );
  }

  const exportsEntries = Object.entries(pkg.exports);

  for (const [subpath, targetOrConditionsObject] of exportsEntries) {
    const targets /*: string[] */ = [];
    if (
      typeof targetOrConditionsObject === 'object' &&
      targetOrConditionsObject != null
    ) {
      for (const [condition, target] of Object.entries(
        targetOrConditionsObject,
      )) {
        if (typeof target !== 'string') {
          throw new Error(
            `Invalid exports field in package.json for ${packageName}. ` +
              `exports["${subpath}"]["${condition}"] must be a string target.`,
          );
        }
        targets.push(target);
      }
    } else {
      if (typeof targetOrConditionsObject !== 'string') {
        throw new Error(
          `Invalid exports field in package.json for ${packageName}. ` +
            `exports["${subpath}"] must be a string target.`,
        );
      }
      targets.push(targetOrConditionsObject);
    }

    for (const target of targets) {
      // Skip non-JS files
      if (!target.endsWith('.js')) {
        continue;
      }

      if (target.startsWith('./' + BUILD_DIR + '/')) {
        throw new Error(
          `Found ./${BUILD_DIR}/* entry in package.json exports for ` +
            `${packageName}. This is either a misconfiguration, or the ` +
            `prepack script was previously run and the package.json state ` +
            `is dirty. Please re-run against a clean working copy.`,
        );
      }

      if (target.includes('*')) {
        console.warn(
          `${styleText('yellow', 'Warning')}: Encountered subpath pattern ${subpath}` +
            ` in package.json exports for ${packageName}. Matched entry points ` +
            'will not be validated.',
        );
        continue;
      }

      if (target.endsWith('.flow.js')) {
        throw new Error(
          `Package ${packageName} defines exports["${subpath}"] = "${target}". ` +
            'Expecting a .js wrapper file. See other monorepo packages for examples.',
        );
      }

      // Our special case for wrapper files that need to be stripped
      const resolvedTarget = path.resolve(PACKAGES_DIR, packageName, target);
      const resolvedFlowTarget = resolvedTarget.replace(/\.js$/, '.flow.js');

      try {
        await Promise.all([
          fs.access(resolvedTarget),
          fs.access(resolvedFlowTarget),
        ]);
      } catch {
        throw new Error(
          `${resolvedFlowTarget} does not exist when building ${packageName}.

From package.json exports["${subpath}"]:
  - found:   ${path.relative(REPO_ROOT, resolvedTarget)}
  - missing: ${path.relative(REPO_ROOT, resolvedFlowTarget)}

This is needed so users can directly import this entry point from the monorepo.`,
        );
      }

      entryPoints.add(resolvedFlowTarget);
    }
  }

  return entryPoints;
}

function getPackageName(file /*: string */) /*: string */ {
  return path.relative(PACKAGES_DIR, file).split(path.sep)[0];
}

function getBuildPath(file /*: string */) /*: string */ {
  const packageDir = path.join(PACKAGES_DIR, getPackageName(file));

  return path.join(
    packageDir,
    file
      .replace(path.join(packageDir, SRC_DIR), BUILD_DIR)
      .replace('.flow.js', '.js'),
  );
}

function validateTypeScriptDefs(packageName /*: string */) {
  const files = globSync('**/*.d.ts', {
    cwd: path.resolve(PACKAGES_DIR, packageName, BUILD_DIR),
    absolute: true,
    onlyFiles: true,
  });
  const compilerOptions = {
    ...getTypeScriptCompilerOptions(packageName),
    noEmit: true,
    skipLibCheck: false,
  };
  const program = ts.createProgram(
    files,
    ts.convertCompilerOptionsFromJson(
      compilerOptions,
      path.resolve(PACKAGES_DIR, packageName),
    ),
  );
  const emitResult = program.emit();

  if (emitResult.diagnostics.length) {
    for (const diagnostic of emitResult.diagnostics) {
      if (diagnostic.file != null) {
        let {line, character} = ts.getLineAndCharacterOfPosition(
          diagnostic.file,
          diagnostic.start,
        );
        let message = ts.flattenDiagnosticMessageText(
          diagnostic.messageText,
          '\n',
        );
        console.log(
          // $FlowFixMe[incompatible-use] Type refined above
          `${diagnostic.file.fileName} (${line + 1},${
            character + 1
          }): ${message}`,
        );
      } else {
        console.log(
          ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        );
      }
    }

    throw new Error(
      'Failing build because TypeScript errors were encountered for ' +
        'generated type definitions.',
    );
  }
}

module.exports = {
  buildFile,
  getBuildPath,
  BUILD_DIR,
  PACKAGES_DIR,
  SRC_DIR,
};

if (require.main === module) {
  build().catch(error => {
    if (error.name === 'ExpectedTranslationError') {
      console.error(error.message);
    } else {
      console.error(error.stack);
    }
    process.exitCode = 1;
  });
}

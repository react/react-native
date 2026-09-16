/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

/**
 * script to build (transpile) files.
 *
 * Based off of the build script from Metro, and tweaked to run in just one
 * package instead of in a monorepo. Just run `build.js` and the JS files in
 * `src/` will be built in `lib/`, and the original source files will be copied
 * over as `Example.js.flow`, so consumers of this module can still make use of
 * type checking.
 *
 * Call this script with the `--verbose` flag to show the full output of this
 * script.
 */

'use strict';

const babel = require('@babel/core');
const micromatch = require('micromatch');
const fs = require('node:fs');
const path = require('node:path');
const {styleText} = require('node:util');
const prettier = require('prettier');
const {globSync} = require('tinyglobby');

const prettierConfig = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '..', 'build.prettierrc'), 'utf8'),
);

const SRC_DIR = 'src';
const BUILD_DIR = 'lib';
const JS_FILES_PATTERN = '**/*.js';
const IGNORE_PATTERN = '**/(__tests__|__test_fixtures__)/**';
const PACKAGE_DIR = path.resolve(__dirname, '../');

const fixedWidth = str => {
  const WIDTH = 80;
  const strs = str.match(new RegExp(`(.{1,${WIDTH}})`, 'g')) || [str];
  let lastString = strs[strs.length - 1];
  if (lastString.length < WIDTH) {
    lastString += Array(WIDTH - lastString.length).join(styleText('dim', '.'));
  }
  return strs.slice(0, -1).concat(lastString).join('\n');
};

function getBuildPath(file, buildFolder) {
  const pkgSrcPath = path.resolve(PACKAGE_DIR, SRC_DIR);
  const pkgBuildPath = path.resolve(PACKAGE_DIR, BUILD_DIR);
  const relativeToSrcPath = path.relative(pkgSrcPath, file);
  return path.resolve(pkgBuildPath, relativeToSrcPath);
}

async function buildFile(file, silent) {
  const destPath = getBuildPath(file, BUILD_DIR);

  fs.mkdirSync(path.dirname(destPath), {recursive: true});

  if (micromatch.isMatch(file, IGNORE_PATTERN)) {
    silent ||
      process.stdout.write(
        styleText('dim', '  \u2022 ') +
          path.relative(PACKAGE_DIR, file) +
          ' (ignore)\n',
      );
  } else if (!micromatch.isMatch(file, JS_FILES_PATTERN)) {
    fs.createReadStream(file).pipe(fs.createWriteStream(destPath));
    silent ||
      process.stdout.write(
        styleText('red', '  \u2022 ') +
          path.relative(PACKAGE_DIR, file) +
          styleText('red', ' \u21D2 ') +
          path.relative(PACKAGE_DIR, destPath) +
          ' (copy)' +
          '\n',
      );
  } else {
    const transformed = await prettier.format(
      babel.transformFileSync(file, {}).code,
      {
        ...prettierConfig,
        parser: 'babel',
      },
    );
    fs.writeFileSync(destPath, transformed);
    const source = fs.readFileSync(file).toString('utf-8');
    if (/@flow/.test(source)) {
      fs.createReadStream(file).pipe(fs.createWriteStream(destPath + '.flow'));
    }
    silent ||
      process.stdout.write(
        styleText('green', '  \u2022 ') +
          path.relative(PACKAGE_DIR, file) +
          styleText('green', ' \u21D2 ') +
          path.relative(PACKAGE_DIR, destPath) +
          '\n',
      );
  }
}

const srcDir = path.resolve(__dirname, '..', SRC_DIR);
const files = globSync('**/*', {
  cwd: srcDir,
  absolute: true,
  onlyFiles: true,
});

process.stdout.write(fixedWidth(`${path.basename(PACKAGE_DIR)}\n`));

Promise.all(
  files.map(file => buildFile(file, !process.argv.includes('--verbose'))),
).then(() => {
  process.stdout.write(`[  ${styleText('green', 'OK')}  ]\n`);
});

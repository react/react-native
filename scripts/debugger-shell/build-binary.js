/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// NOTE: Meta-internal setup must happen before any other imports.
let isMetaInternal = true;
try {
  require.resolve('./metainternal/build-binary-setup');
} catch {
  isMetaInternal = false;
}

let additionalConfig /*: Readonly<{
  appVersionHash: ?string,
}> */ = {
  appVersionHash: null,
};

if (isMetaInternal) {
  // $FlowFixMe[cannot-resolve-module] - not resolvable in OSS
  ({additionalConfig} = require('./metainternal/build-binary-setup'));
}

const {packager} = require('@electron/packager');
const fs = require('fs');
const path = require('path');
const signedsource = require('signedsource');
const util = require('util');

const APP_NAME = 'React Native DevTools';
const COMPANY_NAME = 'Meta Platforms Technologies LLC';
const COPYRIGHT = `© ${new Date().getFullYear()} ${COMPANY_NAME}`;
const APP_BUNDLE_IDENTIFIER = 'dev.reactnative.devtools';

const PACKAGE_ROOT = path.join(
  __dirname,
  '..',
  '..',
  'packages',
  'debugger-shell',
);

async function main() {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'),
  );
  if (!pkg.main.startsWith('./dist/')) {
    throw new Error('Package not built yet. Run scripts/build/build.js first.');
  }

  const IGNORE_PREFIXES = [
    'src',
    'dist/node',
    'metainternal/build-mac',
    '__tests__',
  ].map(
    dirRelativeToPackageRoot =>
      path.join(PACKAGE_ROOT, dirRelativeToPackageRoot) + path.sep,
  );
  const IGNORE_FILES = [
    'BUCK',
    'README.md',
    'dist/electron/BuildInfo.js.tpl',
  ].map(fileRelativeToPackageRoot =>
    path.join(PACKAGE_ROOT, fileRelativeToPackageRoot),
  );

  await writeBuildInfo();

  await packager({
    dir: PACKAGE_ROOT,
    icon: path.join(PACKAGE_ROOT, 'src/electron/resources/icon'),
    platform: ['win32', 'darwin', 'linux'],
    arch: ['x64', 'arm64'],
    name: APP_NAME,
    appVersion: pkg.version,
    appCopyright: COPYRIGHT,
    appCategoryType: 'public.app-category.developer-tools',
    asar: true,
    appBundleId: APP_BUNDLE_IDENTIFIER,
    out: path.join(PACKAGE_ROOT, 'build'),
    win32metadata: {
      CompanyName: COMPANY_NAME,
      ProductName: APP_NAME,
      InternalName: APP_NAME,
      FileDescription: `${APP_NAME}.exe`,
      OriginalFilename: `${APP_NAME}.exe`,
    },
    overwrite: true,
    ignore: [
      ...IGNORE_PREFIXES.map(prefix => new RegExp('^' + escapeRegex(prefix))),
      ...IGNORE_FILES.map(file => new RegExp('^' + escapeRegex(file) + '$')),
    ],
  });
}

async function writeBuildInfo() {
  const template = await fs.promises.readFile(
    path.join(PACKAGE_ROOT, 'src/electron/BuildInfo.js.tpl'),
    'utf8',
  );
  const buildInfo = signedsource.signFile(
    util.format(
      template,
      signedsource.getSigningToken(),
      // revision
      JSON.stringify(additionalConfig.appVersionHash),
    ),
  );
  await fs.promises.writeFile(
    path.join(PACKAGE_ROOT, 'dist/electron/BuildInfo.js'),
    buildInfo,
  );
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exitCode = 1;
  });
}

function escapeRegex(str /*: string */) /*: string */ {
  return str.replace(/[-[\]\\/{}()*+?.^$|]/g, '\\$&');
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

/*:: import type {ProjectInfo} from '../shared/monorepoUtils'; */

const {PRIVATE_DIR, REPO_ROOT} = require('../shared/consts');
const {getPackages} = require('../shared/monorepoUtils');
const {retry} = require('./utils/retry');
const {
  VERDACCIO_SERVER_URL,
  VERDACCIO_STORAGE_PATH,
  setupVerdaccio,
} = require('./utils/verdaccio');
const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');
const {popd, pushd} = require('shelljs');
const {parseArgs, styleText} = require('util');

const config = {
  options: {
    projectName: {type: 'string'},
    directory: {type: 'string'},
    currentBranch: {type: 'string'},
    pathToLocalReactNative: {type: 'string'},
    verbose: {type: 'boolean', default: false},
    useHelloWorld: {type: 'boolean', default: false},
    help: {type: 'boolean'},
  },
};

async function main() {
  const {
    values: {help, ...options},
    /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
     * https://fburl.com/workplace/6291gfvu */
  } = parseArgs(config);

  if (help) {
    console.log(`
  Usage: node ./scripts/e2e/init-project-e2e.js [OPTIONS]

  Bootstraps a React Native project, using the currently checked out
  repository as the source of truth for the react-native package and
  dependencies.

  - Configures and starts a local npm proxy (Verdaccio).
  - Builds and publishes all in-repo dependencies to the local npm proxy.
  - Runs either \`react-native init\` or uses packages/hello-world/ with the local
    npm proxy configured.
  - Does NOT install CocoaPods dependencies.

  This script works with either "npx @react-native-community/cli init" or
  by preparing the packages/hello-world/ app to be built.

  Note: This script will mutate the contents of some package files, which
  should not be committed.

  Options:
    --projectName             The name of the new React Native project.
    --currentBranch           The current branch to checkout.
    --directory               The absolute path to the target project directory.
    --pathToLocalReactNative  The absolute path to the local react-native package.
    --verbose                 Print additional output. Default: false.
    --useHelloWorld           Use the hello-world package instead of the init command. Default: false
    `);
    return;
  }

  await initNewProjectFromSource(options);

  // TODO(T179377112): Fix memory leak from `spawn` in `setupVerdaccio` (above
  // kill command does not wait for kill success).
  process.exit(0);
}

async function initNewProjectFromSource(
  {
    projectName,
    directory,
    currentBranch,
    pathToLocalReactNative,
    verbose = false,
    useHelloWorld = false,
  } /*: {projectName: string, directory: string, currentBranch: string, pathToLocalReactNative: string, verbose?: boolean, useHelloWorld?: boolean} */,
) {
  console.log('Starting local npm proxy (Verdaccio)');
  const verdaccioPid = setupVerdaccio();
  console.log('Done ✅');

  try {
    execSync('node ./scripts/build/build.js', {
      cwd: REPO_ROOT,
      stdio: 'inherit',
    });
    console.log('\nDone ✅');

    const packages = await getPackages({
      includeReactNative: false,
      includePrivate: false,
    });

    // packages are updated in a lockstep, let's get the version of the first one
    const version = packages[Object.keys(packages)[0]].packageJson.version;

    console.log('Publishing packages to local npm proxy\n');
    for (const {path: packagePath, packageJson} of Object.values(packages)) {
      const desc = `${packageJson.name} (${path.relative(
        REPO_ROOT,
        packagePath,
      )})`;
      process.stdout.write(
        `${desc} ${styleText('dim', '.').repeat(Math.max(0, 72 - desc.length))} `,
      );
      execSync(
        `npm publish --registry ${VERDACCIO_SERVER_URL} --access public`,
        {
          cwd: packagePath,
          stdio: verbose ? 'inherit' : [process.stderr],
        },
      );
      process.stdout.write(
        styleText(['reset', 'inverse', 'bold', 'green'], ' DONE ') + '\n',
      );
    }
    console.log('\nDone ✅');

    if (useHelloWorld) {
      console.log('Preparing private/helloworld/ to be built');
      const localPackages = await getPackages({
        includeReactNative: false,
        includePrivate: true,
      });
      _prepareHelloWorld(version, pathToLocalReactNative, localPackages);
      directory = path.join(PRIVATE_DIR, 'helloworld');
    } else {
      const pathToTemplate = _prepareTemplate(
        version,
        pathToLocalReactNative,
        currentBranch,
      );

      console.log(
        'Running @react-native-community/cli@next init without install',
      );
      execSync(
        `npx @react-native-community/cli@next init ${projectName} \
          --directory ${directory} \
          --template file://${pathToTemplate} \
          --verbose \
          --pm npm \
          --skip-install`,
        {
          // Avoid loading packages/react-native/react-native.config.js
          cwd: REPO_ROOT,
          stdio: 'inherit',
        },
      );
    }
    console.log('\nDone ✅');

    console.log('Installing project dependencies');
    await installProjectUsingProxy(directory);
    console.log('Done ✅');
  } catch (e) {
    console.log('Failed ❌');
    throw e;
  } finally {
    console.log(`Cleanup: Killing Verdaccio process (PID: ${verdaccioPid})`);
    try {
      execSync(`kill ${verdaccioPid} || kill -9 ${verdaccioPid}`);
      execSync('killall verdaccio');
      console.log('Done ✅');
    } catch {
      console.warn('Failed to kill Verdaccio process');
    }
    console.log('Cleanup: Removing Verdaccio storage directory');
    execSync(`rm -rf ${VERDACCIO_STORAGE_PATH}`);
    console.log('Done ✅');
  }
}

async function installProjectUsingProxy(cwd /*: string */) {
  const execOptions = {
    cwd,
    stdio: 'inherit',
  };

  // TODO(huntie): Review pre-existing retry limit
  console.log(
    `Running 'npm install --registry ${VERDACCIO_SERVER_URL}' inside ${cwd}`,
  );
  const success = await retry('npm', execOptions, 3, 500, [
    'install',
    '--registry',
    VERDACCIO_SERVER_URL,
  ]);

  if (!success) {
    throw new Error('Failed to install project dependencies');
  }
}

function _prepareHelloWorld(
  version /*: string */,
  pathToLocalReactNative /*: ?string*/,
  packages /*: ProjectInfo */,
) {
  const helloworldDir = path.join(PRIVATE_DIR, 'helloworld');
  const helloworldPackageJson = path.join(helloworldDir, 'package.json');
  const packageJson = JSON.parse(
    fs.readFileSync(helloworldPackageJson, 'utf8'),
  );

  // Point each in-repo @react-native/* dependency at the version published to
  // the local proxy. Deps declared as `*` are unpublished reference packages
  // (e.g. @react-native/core-cli-utils, which lives in private/) and are absent
  // from the proxy, so resolve those to their local source via a `file:` path.
  const updateDependencies = (deps /*: Record<string, string> */) => {
    for (const key of Object.keys(deps)) {
      if (!key.startsWith('@react-native/')) {
        continue;
      }
      if (deps[key] === '*') {
        const localPackage = packages[key];
        if (localPackage != null) {
          deps[key] = `file:${path.relative(helloworldDir, localPackage.path)}`;
        }
      } else {
        deps[key] = version;
      }
    }
  };
  updateDependencies(packageJson.dependencies);
  updateDependencies(packageJson.devDependencies);

  if (pathToLocalReactNative != null) {
    packageJson.dependencies['react-native'] = `file:${pathToLocalReactNative}`;
  }

  // write the package.json to disk
  fs.writeFileSync(helloworldPackageJson, JSON.stringify(packageJson, null, 2));
}

function _prepareTemplate(
  version /*: string */,
  pathToLocalReactNative /*: ?string*/,
  currentBranch /*: string*/,
) {
  console.log('Prepare template locally');

  const templateCloneBaseFolder = '/tmp/react-native-tmp/template';
  execSync(`rm -rf ${templateCloneBaseFolder}`);

  execSync(
    `git clone https://github.com/react-native-community/template ${templateCloneBaseFolder}`,
  );

  pushd(templateCloneBaseFolder);

  execSync(`git checkout ${currentBranch}`);

  pushd('template');

  // read the package.json
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

  // and update the dependencies and devDependencies of packages scoped as @react-native
  // to the version passed as parameter
  for (const key of Object.keys(packageJson.dependencies)) {
    if (key.startsWith('@react-native/')) {
      packageJson.dependencies[key] = version;
    }
  }

  for (const key of Object.keys(packageJson.devDependencies)) {
    if (key.startsWith('@react-native/')) {
      packageJson.devDependencies[key] = version;
    }
  }

  if (pathToLocalReactNative != null) {
    packageJson.dependencies['react-native'] = `file:${pathToLocalReactNative}`;
  }

  // write the package.json to disk
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

  popd();
  const templateTgz = execSync('npm pack').toString().trim();

  popd();

  console.log('Done ✅');
  return path.join(templateCloneBaseFolder, templateTgz);
}

module.exports = {
  initNewProjectFromSource,
};

if (require.main === module) {
  void main();
}

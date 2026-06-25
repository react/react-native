/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

const {REACT_NATIVE_PACKAGE_DIR, REPO_ROOT} = require('./consts');
const {promises: fs} = require('fs');
const path = require('path');
const {globSync} = require('tinyglobby');

const WORKSPACES_CONFIG = '{packages,private}/*';

/*::
export type PackageJson = {
  name: string,
  version: string,
  private?: boolean,
  dependencies?: Record<string, string>,
  devDependencies?: Record<string, string>,
  peerDependencies?: Record<string, string>,
  main?: string,
  ...
};

type PackagesFilter = Readonly<{
  // Include the main react-native package
  includeReactNative: boolean,

  // Include packages marked with `private: true`
  includePrivate?: boolean,

  // Force include the rn-tester package. Special case of a private package
  // that we version and depend on in fbsource.
  forceIncludeRNTester?: boolean,
}>;

export type PackageInfo = {
  // The name of the package
  name: string,

  // The absolute path to the package
  path: string,

  // The package version
  version: string,

  // The parsed package.json contents
  packageJson: PackageJson,
};

export type ProjectInfo = {
  [packageName: string]: PackageInfo,
};
*/

/**
 * Locates monorepo packages and returns a mapping of package names to their
 * metadata. Considers Yarn workspaces under `packages/` and `private/`.
 */
async function getPackages(
  filter /*: PackagesFilter */,
) /*: Promise<ProjectInfo> */ {
  const {
    includeReactNative,
    includePrivate = false,
    forceIncludeRNTester = false,
  } = filter;

  const packagesEntries = await Promise.all(
    globSync(`${WORKSPACES_CONFIG}/package.json`, {
      cwd: REPO_ROOT,
      absolute: true,
      ignore: includeReactNative ? [] : ['packages/react-native/package.json'],
      expandDirectories: false,
    }).map(parsePackageInfo),
  );

  return Object.fromEntries(
    packagesEntries.filter(([_, {name, packageJson}]) => {
      if (name === '@react-native/tester') {
        return forceIncludeRNTester;
      }
      return packageJson.private !== true || includePrivate;
    }),
  );
}

/**
 * Get the parsed package metadata for the workspace root.
 */
async function getWorkspaceRoot() /*: Promise<PackageInfo> */ {
  const [, packageInfo] = await parsePackageInfo(
    path.join(REPO_ROOT, 'package.json'),
  );

  return packageInfo;
}

/**
 * Get the parsed package metadata for the main react-native package.
 */
async function getReactNativePackage() /*: Promise<PackageInfo> */ {
  const [, packageInfo] = await parsePackageInfo(
    path.join(REACT_NATIVE_PACKAGE_DIR, 'package.json'),
  );
  return packageInfo;
}

async function parsePackageInfo(
  packageJsonPath /*: string */,
) /*: Promise<[string, PackageInfo]> */ {
  const packagePath = path.dirname(packageJsonPath);
  const packageJson /*: PackageJson */ = JSON.parse(
    await fs.readFile(packageJsonPath, 'utf-8'),
  );

  return [
    packageJson.name,
    {
      name: packageJson.name,
      path: packagePath,
      version: packageJson.version,
      packageJson,
    },
  ];
}

/**
 * Update a given package with the package versions.
 */
async function updatePackageJson(
  {path: packagePath, packageJson} /*: PackageInfo */,
  newPackageVersions /*: Readonly<{[string]: string}> */,
) /*: Promise<void> */ {
  const packageName = packageJson.name;

  if (packageName in newPackageVersions) {
    packageJson.version = newPackageVersions[packageName];
  }

  for (const dependencyField of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
  ] /*:: as const */) {
    const deps = packageJson[dependencyField];

    if (deps == null) {
      continue;
    }

    for (const dependency in newPackageVersions) {
      if (dependency in deps) {
        deps[dependency] = newPackageVersions[dependency];
      }
    }
  }

  return writePackageJson(path.join(packagePath, 'package.json'), packageJson);
}

/**
 * Write a `package.json` file to disk.
 */
async function writePackageJson(
  packageJsonPath /*: string */,
  packageJson /*: PackageJson */,
) /*: Promise<void> */ {
  return fs.writeFile(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + '\n',
  );
}

module.exports = {
  getPackages,
  getWorkspaceRoot,
  updatePackageJson,
  getReactNativePackage,
};

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const fixtures = require('../__fixtures__/fixtures');
const {execute} = require('../generate-artifacts-executor');
const {
  extractSupportedApplePlatforms,
} = require('../generate-artifacts-executor/generateSchemaInfos');
const {
  cleanupEmptyFilesAndFolders,
  extractLibrariesFromJSON,
} = require('../generate-artifacts-executor/utils');
const fs = require('fs');
const path = require('path');

const rootPath = path.join(__dirname, '../../..');

const packageJson = JSON.stringify({
  name: 'react-native',
});

['test-app', 'test-app-legacy'].forEach(appName => {
  describe(`execute ${appName}`, () => {
    const appDir = path.join(__dirname, '../__fixtures__', appName);
    const outputDir = path.join(appDir, 'temp');

    beforeAll(() => {
      execute(appDir, 'ios', outputDir, 'app', false);
    });

    afterAll(() => {
      fs.rmdirSync(outputDir, {recursive: true});
    });

    [
      'ReactAppDependencyProvider/RCTAppDependencyProvider.h',
      'ReactAppDependencyProvider/RCTAppDependencyProvider.mm',
      'ReactCodegen/RCTModuleProviders.h',
      'ReactCodegen/RCTModuleProviders.mm',
      'ReactCodegen/RCTModulesConformingToProtocolsProvider.h',
      'ReactCodegen/RCTModulesConformingToProtocolsProvider.mm',
      'ReactCodegen/RCTThirdPartyComponentsProvider.h',
      'ReactCodegen/RCTThirdPartyComponentsProvider.mm',
      'ReactAppDependencyProvider/ReactAppDependencyProvider.podspec',
      'ReactCodegen/ReactCodegen.podspec',
      'ReactCodegen/RCTUnstableModulesRequiringMainQueueSetupProvider.h',
      'ReactCodegen/RCTUnstableModulesRequiringMainQueueSetupProvider.mm',
    ].forEach(file => {
      it(`"${file}" should match snapshot`, () => {
        const generatedFileDir = path.join(outputDir, 'build/generated/ios');
        const generatedFile = path.join(generatedFileDir, file);
        expect(fs.existsSync(generatedFile)).toBe(true);
        expect(fs.readFileSync(generatedFile, 'utf8')).toMatchSnapshot();
      });
    });
  });

  describe('extractLibrariesFromJSON', () => {
    it('extracts a single dependency when config has no libraries', () => {
      let configFile = fixtures.noLibrariesConfigFile;
      let libraries = extractLibrariesFromJSON(configFile, '.');
      expect(libraries.length).toBe(1);
      expect(libraries[0]).toEqual({
        config: {
          name: 'AppModules',
          type: 'all',
          jsSrcsDir: '.',
        },
        libraryPath: '.',
        name: undefined,
      });
    });

    it("doesn't extract libraries when they are present but empty", () => {
      const configFile = {codegenConfig: {libraries: []}};
      let libraries = extractLibrariesFromJSON(configFile, rootPath);
      expect(libraries.length).toBe(0);
    });

    it('extracts libraries when they are present and not empty', () => {
      const configFile = fixtures.singleLibraryCodegenConfig;
      let libraries = extractLibrariesFromJSON(configFile, rootPath);
      expect(libraries.length).toBe(1);
      expect(libraries[0]).toEqual({
        config: {
          name: 'react-native',
          type: 'all',
          jsSrcsDir: '.',
        },
        libraryPath: rootPath,
        name: 'react-native',
      });
    });

    it('extract codegenConfig with multiple dependencies', () => {
      const configFile = fixtures.multipleLibrariesCodegenConfig;
      const myDependency = 'my-dependency';
      const myDependencyPath = path.join(__dirname, myDependency);
      let libraries = extractLibrariesFromJSON(configFile, myDependencyPath);
      expect(libraries.length).toBe(3);
      expect(libraries[0]).toEqual({
        config: {
          name: 'react-native',
          type: 'all',
          jsSrcsDir: '.',
        },
        libraryPath: myDependencyPath,
        name: 'react-native',
      });
      expect(libraries[1]).toEqual({
        config: {
          name: 'my-component',
          type: 'components',
          jsSrcsDir: 'component/js',
        },
        libraryPath: myDependencyPath,
        name: 'my-component',
      });
      expect(libraries[2]).toEqual({
        config: {
          name: 'my-module',
          type: 'module',
          jsSrcsDir: 'module/js',
        },
        libraryPath: myDependencyPath,
        name: 'my-module',
      });
    });
  });
});

describe('extractSupportedApplePlatforms', () => {
  it('extracts platforms when podspec specifies object of platforms', () => {
    const myDependency = 'test-library';
    const myDependencyPath = path.join(
      __dirname,
      `../__fixtures__/${myDependency}`,
    );
    let platforms = extractSupportedApplePlatforms(
      myDependency,
      myDependencyPath,
    );
    expect(platforms).toEqual({
      ios: true,
      macos: true,
      tvos: false,
      visionos: true,
    });
  });

  it('extracts platforms when podspec specifies platforms separately', () => {
    const myDependency = 'test-library-2';
    const myDependencyPath = path.join(
      __dirname,
      `../__fixtures__/${myDependency}`,
    );
    let platforms = extractSupportedApplePlatforms(
      myDependency,
      myDependencyPath,
    );
    expect(platforms).toEqual({
      ios: true,
      macos: true,
      tvos: true,
      visionos: false,
    });
  });
});

describe('delete empty files and folders', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('when path is empty file, deletes it', () => {
    const targetFilepath = 'my-file.txt';
    let statSyncInvocationCount = 0;
    let rmSyncInvocationCount = 0;
    let rmdirSyncInvocationCount = 0;
    jest.mock('fs', () => ({
      statSync: filepath => {
        statSyncInvocationCount += 1;
        expect(filepath).toBe(targetFilepath);
        return {
          isFile: () => {
            return true;
          },
          size: 0,
        };
      },
      rmSync: filepath => {
        rmSyncInvocationCount += 1;
        expect(filepath).toBe(targetFilepath);
      },
      rmdirSync: filepath => {
        rmdirSyncInvocationCount += 1;
      },
      readFileSync: () => packageJson,
    }));

    cleanupEmptyFilesAndFolders(targetFilepath);
    expect(statSyncInvocationCount).toBe(1);
    expect(rmSyncInvocationCount).toBe(1);
    expect(rmdirSyncInvocationCount).toBe(0);
  });

  it('when path is not an empty file, does nothing', () => {
    const targetFilepath = 'my-file.txt';
    const size = 128;

    let statSyncInvocationCount = 0;
    let rmSyncInvocationCount = 0;
    let rmdirSyncInvocationCount = 0;

    jest.mock('fs', () => ({
      statSync: filepath => {
        statSyncInvocationCount += 1;
        expect(filepath).toBe(targetFilepath);
        return {
          isFile: () => {
            return true;
          },
          size: size,
        };
      },
      rmSync: filepath => {
        rmSyncInvocationCount += 1;
      },
      rmdirSync: filepath => {
        rmdirSyncInvocationCount += 1;
      },
      readFileSync: () => packageJson,
    }));

    cleanupEmptyFilesAndFolders(targetFilepath);
    expect(statSyncInvocationCount).toBe(1);
    expect(rmSyncInvocationCount).toBe(0);
    expect(rmdirSyncInvocationCount).toBe(0);
  });

  it("when path is folder and it's empty, removes it", () => {
    const targetFolder = 'build';
    const content = [] as Array<string>;

    let statSyncInvocationCount = 0;
    let readdirInvocationCount = 0;
    let rmSyncInvocationCount = 0;
    let rmdirSyncInvocationCount = 0;

    jest.mock('fs', () => ({
      statSync: filepath => {
        statSyncInvocationCount += 1;
        expect(filepath).toBe(targetFolder);
        return {
          isFile: () => {
            return false;
          },
        };
      },
      rmSync: filepath => {
        rmSyncInvocationCount += 1;
      },
      rmdirSync: filepath => {
        rmdirSyncInvocationCount += 1;
        expect(filepath).toBe(targetFolder);
      },
      readdirSync: filepath => {
        readdirInvocationCount += 1;
        return content;
      },
      readFileSync: () => packageJson,
    }));

    cleanupEmptyFilesAndFolders(targetFolder);
    expect(statSyncInvocationCount).toBe(1);
    expect(readdirInvocationCount).toBe(2);
    expect(rmSyncInvocationCount).toBe(0);
    expect(rmdirSyncInvocationCount).toBe(1);
  });

  it("when path is folder and it's not empty, removes only empty folders and files", () => {
    const targetFolder = 'build';
    const content = ['emptyFolder', 'emptyFile', 'notEmptyFile'];

    const files = [
      path.normalize('build/emptyFile'),
      path.normalize('build/notEmptyFile'),
    ];

    const emptyContent = [] as Array<string>;
    let fileSizes = {} as {[string]: number};
    fileSizes[path.normalize('build/emptyFile')] = 0;
    fileSizes[path.normalize('build/notEmptyFile')] = 32;

    let statSyncInvocation = [];
    let rmSyncInvocation = [];
    let rmdirSyncInvocation = [];
    let readdirInvocation = [];

    jest.mock('fs', () => ({
      statSync: filepath => {
        statSyncInvocation.push(filepath);

        return {
          isFile: () => {
            return files.includes(filepath);
          },
          size: fileSizes[filepath],
        };
      },
      rmSync: filepath => {
        rmSyncInvocation.push(filepath);
      },
      rmdirSync: filepath => {
        rmdirSyncInvocation.push(filepath);
      },
      readdirSync: filepath => {
        readdirInvocation.push(filepath);
        return filepath === targetFolder ? content : emptyContent;
      },
      readFileSync: () => packageJson,
    }));

    cleanupEmptyFilesAndFolders(targetFolder);
    expect(statSyncInvocation).toEqual([
      path.normalize('build'),
      path.normalize('build/emptyFolder'),
      path.normalize('build/emptyFile'),
      path.normalize('build/notEmptyFile'),
    ]);
    expect(readdirInvocation).toEqual([
      path.normalize('build'),
      path.normalize('build/emptyFolder'),
      path.normalize('build/emptyFolder'),
      path.normalize('build'),
    ]);
    expect(rmSyncInvocation).toEqual([path.normalize('build/emptyFile')]);
    expect(rmdirSyncInvocation).toEqual([path.normalize('build/emptyFolder')]);
  });

  it('when path is folder and it contains only empty folders, removes everything', () => {
    const targetFolder = 'build';
    const content = ['emptyFolder1', 'emptyFolder2'];
    const emptyContent = [] as Array<string>;

    let statSyncInvocation = [];
    let rmSyncInvocation = [];
    let rmdirSyncInvocation = [];
    let readdirInvocation = [];

    jest.mock('fs', () => ({
      statSync: filepath => {
        statSyncInvocation.push(filepath);

        return {
          isFile: () => {
            return false;
          },
        };
      },
      rmSync: filepath => {
        rmSyncInvocation.push(filepath);
      },
      rmdirSync: filepath => {
        rmdirSyncInvocation.push(filepath);
      },
      readdirSync: filepath => {
        readdirInvocation.push(filepath);
        return filepath === targetFolder
          ? content.filter(
              element =>
                !rmdirSyncInvocation.includes(path.join(targetFolder, element)),
            )
          : emptyContent;
      },
      readFileSync: () => packageJson,
    }));

    cleanupEmptyFilesAndFolders(targetFolder);
    expect(statSyncInvocation).toEqual([
      path.normalize('build'),
      path.normalize('build/emptyFolder1'),
      path.normalize('build/emptyFolder2'),
    ]);
    expect(readdirInvocation).toEqual([
      path.normalize('build'),
      path.normalize('build/emptyFolder1'),
      path.normalize('build/emptyFolder1'),
      path.normalize('build/emptyFolder2'),
      path.normalize('build/emptyFolder2'),
      path.normalize('build'),
    ]);
    expect(rmSyncInvocation).toEqual([]);
    expect(rmdirSyncInvocation).toEqual([
      path.normalize('build/emptyFolder1'),
      path.normalize('build/emptyFolder2'),
      path.normalize('build'),
    ]);
  });
});

describe('findFilesWithExtension', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('skips hidden files and folders', () => {
    const targetFolder = '/project/ios';

    jest.mock('fs', () => ({
      readdirSync: dirPath => {
        if (dirPath === targetFolder) {
          return ['.hidden', '.git', 'visible.mm'];
        }
        return [];
      },
      existsSync: () => true,
      statSync: () => ({
        isDirectory: () => false,
      }),
      readFileSync: () => packageJson,
    }));

    const {
      findFilesWithExtension: findFiles,
    } = require('../generate-artifacts-executor/generateRCTThirdPartyComponents');

    const result = findFiles(targetFolder, '.mm');
    expect(result).toEqual([path.join(targetFolder, 'visible.mm')]);
  });

  it('allows .pnpm folder', () => {
    const targetFolder = '/project/node_modules';
    const pnpmFolder = path.join(targetFolder, '.pnpm');
    const packageFolder = path.join(pnpmFolder, 'some-package');

    jest.mock('fs', () => ({
      readdirSync: dirPath => {
        if (dirPath === targetFolder) {
          return ['.pnpm', '.hidden'];
        }
        if (dirPath === pnpmFolder) {
          return ['some-package'];
        }
        if (dirPath === packageFolder) {
          return ['Component.mm'];
        }
        return [];
      },
      existsSync: () => true,
      statSync: filePath => ({
        isDirectory: () =>
          filePath === pnpmFolder ||
          filePath === packageFolder ||
          filePath === path.join(targetFolder, '.hidden'),
      }),
      readFileSync: () => packageJson,
    }));

    const {
      findFilesWithExtension: findFiles,
    } = require('../generate-artifacts-executor/generateRCTThirdPartyComponents');

    const result = findFiles(targetFolder, '.mm');
    expect(result).toEqual([path.join(packageFolder, 'Component.mm')]);
  });

  it('works when project is under a hidden folder', () => {
    // This test verifies the fix for projects under hidden folders
    // like ~/.jenkins/workspace/ or /.hidden-ci/builds/
    const targetFolder = '/.jenkins/workspace/my-project/ios';

    jest.mock('fs', () => ({
      readdirSync: dirPath => {
        if (dirPath === targetFolder) {
          return ['Components'];
        }
        if (dirPath === path.join(targetFolder, 'Components')) {
          return ['MyComponent.mm'];
        }
        return [];
      },
      existsSync: () => true,
      statSync: filePath => ({
        isDirectory: () => filePath === path.join(targetFolder, 'Components'),
      }),
      readFileSync: () => packageJson,
    }));

    const {
      findFilesWithExtension: findFiles,
    } = require('../generate-artifacts-executor/generateRCTThirdPartyComponents');

    const result = findFiles(targetFolder, '.mm');
    // Should find the file even though the absolute path contains /.jenkins/
    expect(result).toEqual([
      path.join(targetFolder, 'Components', 'MyComponent.mm'),
    ]);
  });
});

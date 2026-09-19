/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

/*:: import type {BuildFlavor} from './types'; */

const {
  generateFBReactNativeSpecIOS,
} = require('../codegen/generate-artifacts-executor/generateFBReactNativeSpecIOS');
const {prepareHermesArtifactsAsync} = require('./hermes');
const {
  prepareReactNativeDependenciesArtifactsAsync,
} = require('./reactNativeDependencies');
const {createFolderIfNotExists, createLogger} = require('./utils');
const {execSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

async function setup(
  root /*:string*/,
  buildFolder /*: string */,
  currentVersion /*: string */,
  buildType /*: BuildFlavor */,
) {
  // First of all, let's run codegen to make sure that we have the FBreactNativeSpec files in the prebuilds
  generateFBReactNativeSpecIOS('.');

  const prebuildLog = createLogger('prebuild');
  createFolderIfNotExists(buildFolder);

  // Create the hard links folder
  const linksFolder = path.resolve(buildFolder, 'headers');
  createFolderIfNotExists(linksFolder);

  const link = createHeaderLinker(root, linksFolder, prebuildLog);

  // HERMES ARTIFACTS
  await prepareHermesArtifactsAsync(currentVersion, buildType);

  await prepareReactNativeDependenciesArtifactsAsync(currentVersion, buildType);

  // CODEGEN
  const codegenPath = path.join(root, '.build/codegen');
  createFolderIfNotExists(codegenPath);

  const command = `node scripts/generate-codegen-artifacts -p "${root}" -o "${codegenPath}"  -t ios`;
  execSync(command, {stdio: 'inherit'});

  // LINKING
  prebuildLog('Linking header files...');
  link('Libraries/WebSocket/', 'React');
  link('React/Base', 'React');
  link('React/Base/Surface', 'React');
  link('React/CxxBridge', 'React');
  link('React/CxxModule', 'React');
  link('React/CxxUtils', 'React');
  link('React/DevSupport', 'React');
  link('React/Inspector', 'React');
  link('React/I18n', 'React');
  link('React/Views', 'React');
  link('React/CoreModules', 'React');
  link('React/Modules', 'React');
  link('React/Fabric', 'React');
  link('React/Profiler', 'React');
  link('React/CoreModules', 'React');
  link('React/Runtime', 'React');
  link('React/Views/ScrollView', 'React');
  link('React/Views/RefreshControl', 'React');
  link('Libraries/Text', 'React');
  link('Libraries/AppDelegate');
  link('ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported', 'React');
  link(
    'ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported',
    'RCTDeprecation',
  );
  link('Libraries/Required', 'RCTRequired');
  link('Libraries/TypeSafety', 'RCTTypeSafety');
  link('Libraries/Text', 'React');
  link('Libraries/Image', 'React');
  link('Libraries/Network', 'React');
  link('Libraries/Blob', 'React');
  link('Libraries/NativeAnimation', 'React');
  link('Libraries/LinkingIOS', 'React');
  link('Libraries/Settings', 'React');

  link('Libraries/PushNotificationIOS', 'React');
  link('Libraries/Settings', 'React');
  link('Libraries/Vibration', 'React');

  link('ReactCommon/hermes', 'reacthermes');
  link('ReactCommon/hermes', 'jsireact');

  link(
    'ReactCommon/react/renderer/imagemanager',
    'react/renderer/imagemanager',
  );
  link('ReactCommon/yoga/Yoga', 'ReactCommon/yoga/Yoga');
  link('ReactCommon/callinvoker', 'ReactCommon');
  link('ReactCommon/react/renderer/componentregistry');
  link('ReactCommon/react/renderer/core');
  link('ReactCommon/react/bridging');
  link('ReactCommon/react/timing');
  link('ReactCommon/react/utils');
  link('ReactCommon/react/debug');
  link('ReactCommon/react/renderer/debug');
  link('ReactCommon/react/featureflags');
  link('ReactCommon/react/renderer/graphics');
  link(
    'ReactCommon/react/renderer/graphics/platform/ios',
    'ReactCommon/react/renderer/graphics',
  );
  link('ReactCommon/react/nativemodule/core', 'ReactCommon');
  link('ReactCommon/react/nativemodule/core/platform/ios', 'ReactCommon');

  link('ReactCommon/react/utils/platform/ios', 'ReactCommon/react/utils');
  link('ReactCommon/react/runtime');
  link('ReactCommon/react/runtime/platform/ios', 'ReactCommon/react/runtime');
  link('ReactCommon/jsitooling/react/runtime', 'ReactCommon/react/runtime');
  link('ReactCommon/react/renderer/components/legacyviewmanagerinterop');
  link('ReactCommon/react/renderer/components/view');
  link(
    'ReactCommon/react/renderer/components/view/platform/cxx',
    'ReactCommon/react/renderer/components/view',
  );
  link('ReactCommon/react/renderer/mounting');
  link('ReactCommon/react/renderer/attributedstring');
  link('ReactCommon/runtimeexecutor/ReactCommon', 'ReactCommon');
  link('ReactCommon/jsinspector-modern');
  link('ReactCommon/cxxreact');

  link('.build/codegen/build/generated/ios', 'ReactCodegen');
}

function lstatSyncIfExists(filePath /*: string */) /*: ?fs.Stats */ {
  try {
    return fs.lstatSync(filePath);
  } catch (e) {
    if (e.code === 'ENOENT') {
      return null;
    }
    throw e;
  }
}

/**
 * Builds the staging function for one prebuild pass: it hard links the header
 * files of a source folder into the prebuild's flat include tree, recursing
 * into subfolders. A folder without any header file directly in it contributes
 * nothing but is still traversed.
 */
function createHeaderLinker(
  root /*: string */,
  linksFolder /*: string */,
  log /*: (message: string) => void */,
) /*: (fromPath: string, includePath?: ?string) => void */ {
  // Several call sites flatten distinct source folders onto one target folder,
  // and a few of those collide on a basename. The first source staged in a pass
  // owns the target; the compiler has been seeing that header all along.
  const claimed /*: Set<string> */ = new Set();

  const linkFolder = (
    fromPath /*: string */,
    includePath /*: ?string */,
  ) /*: void */ => {
    const source = path.resolve(root, fromPath);
    const target = path.resolve(linksFolder, includePath ?? fromPath);

    createFolderIfNotExists(target);

    let linkedFiles = 0;

    const entries = fs.readdirSync(source, {withFileTypes: true});
    if (
      entries.some(
        dirent => dirent.isFile() && /\.(h|hpp)$/.test(String(dirent.name)),
      )
    ) {
      entries.forEach(entry => {
        const entryName = String(entry.name);
        if (entry.isFile() && /\.(h|hpp)$/.test(entryName)) {
          const sourceFile = path.join(source, entryName);
          const targetFile = path.join(target, entryName);
          if (claimed.has(targetFile)) {
            return;
          }
          try {
            // `git checkout` replaces a header by renaming a new file over it,
            // so the source gets a new inode and a link staged earlier keeps
            // serving the old contents. Anything that is not the source inode
            // is stale.
            const staged = lstatSyncIfExists(targetFile);
            if (staged != null) {
              const sourceStat = fs.statSync(sourceFile);
              if (
                staged.dev === sourceStat.dev &&
                staged.ino === sourceStat.ino
              ) {
                claimed.add(targetFile);
                return;
              }
              fs.unlinkSync(targetFile);
            }
            fs.linkSync(sourceFile, targetFile);
            claimed.add(targetFile);
            linkedFiles++;
          } catch (e) {
            console.error(
              `Failed to create link for ${sourceFile} to ${targetFile}: ${e}`,
            );
          }
        }
      });
    }

    if (linkedFiles > 0) {
      log(
        `Linked ${path.relative(root, source)} → ${path.relative(root, target)}`,
      );
    }

    entries
      .filter(dirent => dirent.isDirectory())
      .filter(dirent => dirent.name !== '__tests__')
      .filter(dirent => dirent.name !== 'tests')
      .filter(dirent => dirent.name !== 'platform')
      .forEach(dirent => {
        linkFolder(path.join(fromPath, String(dirent.name)), includePath);
      });
  };

  return linkFolder;
}

module.exports = {
  createHeaderLinker,
  setup,
};

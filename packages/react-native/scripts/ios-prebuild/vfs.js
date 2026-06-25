/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

/*:: import type {HeaderMapping, VFSEntry, VFSOverlay} from './types'; */

const headers = require('./headers');

const {getHeaderFilesFromPodspecs} = headers;

const ROOT_PATH_PLACEHOLDER = '${ROOT_PATH}';

/**
 * Builds a hierarchical VFS directory structure from a list of header mappings.
 * Clang's VFS overlay requires a tree structure where directories contain their children.
 */
function buildVFSStructure(
  mappings /*: Array<HeaderMapping> */,
) /*: Array<VFSEntry> */ {
  // Group files by their directory structure
  const dirTree /*: Map<string, Map<string, string>> */ = new Map();

  for (const mapping of mappings) {
    const parts = mapping.key.split('/');
    const fileName = parts[parts.length - 1];
    const dirPath = parts.slice(0, -1).join('/');

    if (!dirTree.has(dirPath)) {
      dirTree.set(dirPath, new Map());
    }
    const filesMap = dirTree.get(dirPath);
    if (filesMap) {
      filesMap.set(fileName, mapping.path);
    }
  }

  // Build the root-level entries (files at root + top-level directories)
  const rootDirs /*: Set<string> */ = new Set();
  for (const dirPath of dirTree.keys()) {
    const topLevel = dirPath.split('/')[0];
    if (topLevel) {
      rootDirs.add(topLevel);
    }
  }

  const roots /*: Array<VFSEntry> */ = [];

  // Add files that live at the root (e.g. key === 'RCTAppDelegate.h')
  const rootFiles = dirTree.get('');
  if (rootFiles) {
    for (const [fileName, sourcePath] of Array.from(
      rootFiles.entries(),
    ).sort()) {
      roots.push({
        name: fileName,
        type: 'file',
        'external-contents': sourcePath,
      });
    }
  }

  for (const rootDir of Array.from(rootDirs).sort()) {
    const dirEntry = buildDirectoryEntry(rootDir, '', dirTree);
    roots.push(dirEntry);
  }

  return roots;
}

/**
 * Recursively builds a directory entry for the VFS
 */
function buildDirectoryEntry(
  dirName /*: string */,
  parentPath /*: string */,
  dirTree /*: Map<string, Map<string, string>> */,
) /*: VFSEntry */ {
  const currentPath = parentPath ? `${parentPath}/${dirName}` : dirName;
  const contents /*: Array<VFSEntry> */ = [];

  // Add files in this directory
  const filesInDir = dirTree.get(currentPath);
  if (filesInDir) {
    for (const [fileName, sourcePath] of Array.from(
      filesInDir.entries(),
    ).sort()) {
      contents.push({
        name: fileName,
        type: 'file',
        'external-contents': sourcePath,
      });
    }
  }

  // Add subdirectories
  const subdirs /*: Set<string> */ = new Set();
  for (const dirPath of dirTree.keys()) {
    if (dirPath.startsWith(currentPath + '/')) {
      const remainder = dirPath.slice(currentPath.length + 1);
      const nextDir = remainder.split('/')[0];
      if (nextDir) {
        subdirs.add(nextDir);
      }
    }
  }

  for (const subdir of Array.from(subdirs).sort()) {
    contents.push(buildDirectoryEntry(subdir, currentPath, dirTree));
  }

  return {
    name: dirName,
    type: 'directory',
    contents,
  };
}

/**
 * Simple YAML generator for VFS overlay structure (hierarchical format)
 */
function generateVFSOverlayYAML(overlay /*: VFSOverlay */) /*: string */ {
  let yaml = '';

  yaml += `version: ${String(overlay.version)}\n`;
  yaml += `case-sensitive: ${String(overlay['case-sensitive'])}\n`;
  yaml += `roots:\n`;

  for (const root of overlay.roots) {
    yaml += generateEntryYAML(root, 1);
  }

  return yaml;
}

/**
 * Recursively generates YAML for a VFS entry
 */
function generateEntryYAML(
  entry /*: VFSEntry */,
  indent /*: number */,
) /*: string */ {
  const spaces = '  '.repeat(indent);
  let yaml = '';

  yaml += `${spaces}- name: '${entry.name}'\n`;
  yaml += `${spaces}  type: '${entry.type}'\n`;

  if (entry['external-contents']) {
    yaml += `${spaces}  external-contents: '${entry['external-contents']}'\n`;
  }

  if (entry.contents && entry.contents.length > 0) {
    yaml += `${spaces}  contents:\n`;
    for (const child of entry.contents) {
      yaml += generateEntryYAML(child, indent + 2);
    }
  }

  return yaml;
}

/**
 * Creates a VFS overlay object from the header files in podspecs.
 * The source paths use ${ROOT_PATH} as a placeholder for later replacement
 * with the actual root path on the end user's machine.
 *
 * The VFS overlay wraps all header mappings under a single root at
 * ${ROOT_PATH}/Headers, which matches the HEADER_SEARCH_PATHS configured
 * in rncore.rb. This allows the compiler to find headers like
 * <yoga/style/Style.h> by looking up ${ROOT_PATH}/Headers/yoga/style/Style.h
 * which the VFS redirects to the flat location in the xcframework.
 *
 * @param rootFolder The root folder of the React Native package
 * @returns A VFS overlay object that can be serialized to YAML
 */
function createVFSOverlayContents(rootFolder /*: string */) /*: VFSOverlay */ {
  // Get header files from podspecs (disable testing since we just need the mappings)
  const podSpecsWithHeaderFiles = getHeaderFilesFromPodspecs(rootFolder);

  const mappings /*: Array<HeaderMapping> */ = [];

  // Process each podspec and its header files
  Object.keys(podSpecsWithHeaderFiles).forEach(podspecPath => {
    const headerMaps = podSpecsWithHeaderFiles[podspecPath];

    // Use the first podspec spec name as the podspec name (this is the root spec)
    const podSpecName = headerMaps[0].specName.replace('-', '_');

    headerMaps.forEach(headerMap => {
      headerMap.headers.forEach(header => {
        // The key is just the target path (the import path)
        // e.g., 'react/renderer/graphics/Size.h' for #import <react/renderer/graphics/Size.h>
        let key = header.target;

        // If the podspec doesn't specify a header_dir, CocoaPods exposes public headers under
        // <PodName/Header.h> (and umbrella headers typically use quoted imports resolved relative
        // to the pod's public headers directory). To mirror that layout and avoid collisions
        // between pods, prefix root-level header targets with the pod spec name.
        if (
          !key.includes('/') &&
          (!headerMap.headerDir || headerMap.headerDir === '')
        ) {
          key = `${podSpecName}/${key}`;
        }

        // The external-contents path is always podSpecName + header.target because
        // xcframework.js copies headers to: outputHeadersPath/podSpecName/headerFile.target
        // So the VFS must point to that same location.
        const sourcePath = `${ROOT_PATH_PLACEHOLDER}/Headers/${podSpecName}/${header.target}`;

        mappings.push({
          key,
          path: sourcePath,
        });
      });
    });
  });

  // Build the hierarchical VFS structure from mappings
  const innerRoots = buildVFSStructure(mappings);

  // Wrap all roots under a single ${ROOT_PATH}/Headers root.
  // This is required because Clang's VFS overlay needs absolute paths for root entries.
  // The compiler will have -I${ROOT_PATH}/Headers in its include paths, so when it
  // searches for <yoga/style/Style.h>, it looks for ${ROOT_PATH}/Headers/yoga/style/Style.h.
  // The VFS overlay intercepts this and maps it to the actual flat location.
  const wrappedRoot /*: VFSEntry */ = {
    name: `${ROOT_PATH_PLACEHOLDER}/Headers`,
    type: 'directory',
    contents: innerRoots,
  };

  return {
    version: 0,
    'case-sensitive': false,
    roots: [wrappedRoot],
  };
}

/**
 * Creates a VFS overlay YAML file from the header files in podspecs.
 * This is a convenience function that combines createVFSOverlayContents and
 * generateVFSOverlayYAML into a single call.
 *
 * @param rootFolder The root folder of the React Native package
 * @returns The VFS overlay as a YAML string ready to be written to a file
 */
function createVFSOverlay(rootFolder /*: string */) /*: string */ {
  const overlay = createVFSOverlayContents(rootFolder);
  return generateVFSOverlayYAML(overlay);
}

/**
 * Resolves a VFS overlay template by replacing the ${ROOT_PATH} placeholder
 * with the actual root path. This is the equivalent of the Ruby create_vfs_overlay
 * function in rncore.rb.
 *
 * The VFS overlay template contains ${ROOT_PATH} placeholders that need to be
 * replaced with the actual path to the xcframework on the end user's machine
 * (e.g., the path to React.xcframework in the Pods folder).
 *
 * @param vfsTemplate The VFS overlay template content (YAML string with ${ROOT_PATH} placeholders)
 * @param rootPath The actual root path to substitute for ${ROOT_PATH}
 * @returns The resolved VFS overlay YAML string with absolute paths
 */
function resolveVFSOverlay(
  vfsTemplate /*: string */,
  rootPath /*: string */,
) /*: string */ {
  return vfsTemplate.split(ROOT_PATH_PLACEHOLDER).join(rootPath);
}

module.exports = {
  createVFSOverlay,
  resolveVFSOverlay,
};

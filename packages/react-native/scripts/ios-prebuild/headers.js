/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const {PodspecExceptions} = require('./headers-config');
const utils = require('./utils');
const path = require('path');
const {globSync} = require('tinyglobby');

const {createLogger} = utils;
const headersLog = createLogger('headers');

/*::
import type {PodSpecConfiguration} from './headers-config';
type HeaderMap = { headerDir: string, specName: string, headers: {source: string, target: string}[]};
*/

function getHeaderFilesFromPodspecs(
  rootFolder /*:string*/,
) /*: { [key: string]: HeaderMap[] }*/ {
  const result /*: { [key: string]: HeaderMap[] }*/ = {};

  // 1. Find all podspec files in the rootFolder
  const podspecFiles = globSync('**/*.podspec', {
    cwd: rootFolder,
    absolute: true,
    ignore: ['**/node_modules/**', '**/Pods/**'],
  });

  headersLog(
    '🔍 Collecting header files from all podspec files in the project...',
  );

  // 2. For each podspec file, we would need to parse it and extract header information. We should
  // do this by checking if the file contains the text 'podspec_sources'.
  podspecFiles.forEach(podspecPath => {
    // Check if this podspec has an exception registered
    const relativeKey = path.relative(rootFolder, podspecPath);
    const exception = PodspecExceptions[relativeKey];

    if (exception) {
      // Check if the exception is disabled
      if ('disabled' in exception && exception.disabled === true) {
        headersLog(`⏭️ Skipping disabled podspec: ${relativeKey}`);
        return;
      }

      // Use getHeaderFilesFromPodspec for podspecs with exceptions
      const headerMaps = getHeaderFilesFromPodspec(
        exception,
        path.dirname(podspecPath),
      );
      if (headerMaps !== null) {
        result[podspecPath] = headerMaps;
      }
      return;
    }

    // Open file and read content
    const fileContent = require('fs').readFileSync(podspecPath, 'utf8');

    // Try to infer header_dir when it's a string literal.
    // We intentionally keep this simple and do not attempt to resolve Ruby variables.
    // Examples supported:
    //   s.header_dir = "ReactCommon"
    //   ss.header_dir = 'jsinspector-modern/cdp'
    const headerDirMatch = fileContent.match(
      /\.header_dir\s*=\s*(['"])([^'"\n]+)\1/,
    );
    const inferredHeaderDir = headerDirMatch ? headerDirMatch[2].trim() : '';

    // Check if it contains 'podspec_sources'
    if (fileContent.includes('podspec_sources')) {
      // Parse podspec_sources(source_files, header_patterns) - we want the SECOND argument.
      // Examples:
      //   podspec_sources("*.{cpp,h}", "**/*.h")
      //   podspec_sources(["a.m", "b.h"], "*.h")
      //   podspec_sources(["a.m", "b.h"], ["c.h", "d.h"])
      //   podspec_sources(source_files, ["*.h", "platform/ios/**/*.h"])  # first arg is a variable
      //
      // Regex explanation:
      //   podspec_sources\(              - match "podspec_sources("
      //   (?:\[[^\]]*\]|"[^"]*"|[\w]+)   - first arg: either [...] or "..." or a variable name
      //   \s*,\s*                        - comma separator with optional whitespace
      //   (\[[^\]]*\]|"[^"]*")           - second arg (captured): either [...] or "..."
      //   \)                             - closing paren
      const headerPatternRegex =
        /podspec_sources\((?:\[[^\]]*\]|"[^"]*"|\w+)\s*,\s*(\[[^\]]*\]|"[^"]*")\)/gm;
      const matches = [...fileContent.matchAll(headerPatternRegex)];

      // Also extract exclude_files patterns from the podspec
      // Examples:
      //   s.exclude_files = "tests/**/*.h"
      //   s.exclude_files = ["tests/**/*.h", "internal/**/*.h"]
      //   ss.exclude_files = "..."
      const excludeFilesRegex = /\.exclude_files\s*=\s*(\[[^\]]*\]|"[^"]*")/gm;
      const excludeMatches = [...fileContent.matchAll(excludeFilesRegex)];

      // Parse exclude patterns
      const excludePatterns = excludeMatches.flatMap(match => {
        const arg = match[1].trim();
        if (arg.startsWith('[')) {
          const arrayContent = arg.slice(1, arg.lastIndexOf(']'));
          return arrayContent
            .split(',')
            .map(s => s.trim().replace(/['"]/g, ''))
            .filter(s => s.length > 0);
        } else {
          return [arg.replace(/['"]/g, '').trim()].filter(s => s.length > 0);
        }
      });

      // Add default excludes
      const allExcludes = [...excludePatterns];

      if (matches.length > 0) {
        // Extract header patterns (second argument) from all matches
        const patterns = matches.flatMap(match => {
          const secondArg = match[1].trim();

          // Parse the second argument - it can be a string or an array
          if (secondArg.startsWith('[')) {
            // It's an array, extract the contents and split by comma
            const arrayContent = secondArg.slice(1, secondArg.lastIndexOf(']'));
            return arrayContent
              .split(',')
              .map(s => s.trim().replace(/['"]/g, ''))
              .filter(s => s.length > 0);
          } else {
            // It's a single string
            return [secondArg.replace(/['"]/g, '').trim()].filter(
              s => s.length > 0,
            );
          }
        });

        // Now we can find header files based on these patterns
        const foundHeaderFiles = patterns
          .map(pattern => {
            // our GLOB library doesn't like {h} in its patterns, so we use **/*.h instead of **/*.{h}
            if (pattern.includes('{h}')) {
              pattern = pattern.replaceAll('{h}', 'h');
            }
            return globSync(pattern, {
              cwd: path.dirname(podspecPath),
              ignore: allExcludes,
              absolute: true,
            });
          })
          .flat();

        result[podspecPath] = [
          {
            headerDir: inferredHeaderDir,
            specName: path.basename(podspecPath, '.podspec'),
            headers: foundHeaderFiles.map(headerFile => ({
              source: headerFile,
              target: inferredHeaderDir
                ? path.join(inferredHeaderDir, path.basename(headerFile))
                : path.basename(headerFile),
            })),
          },
        ];
      }
    }
  });

  return result;
}

/**
 * Extracts header files from a single podspec based on its configuration.
 * @param {PodSpecConfiguration} podSpecConfig The podspec configuration object
 * @param {string} podSpecDirectory Directory where the podspec is located
 * @returns {HeaderMap[] | null} Array of header maps or null if configuration is invalid
 */
function getHeaderFilesFromPodspec(
  podSpecConfig /*: PodSpecConfiguration*/,
  podSpecDirectory /*:string*/,
) /*: HeaderMap[] | null*/ {
  if (
    !podSpecConfig ||
    'name' in podSpecConfig === false ||
    podSpecConfig.name === ''
  ) {
    headersLog(`⚠️ Skipping podspec due to missing or invalid configuration.`);
    return null;
  }

  const headerMaps /*: HeaderMap[] */ = [];

  // Now we can start collecting header files
  const processConfig = (
    config /*: PodSpecConfiguration */,
    parents /*: Array<PodSpecConfiguration>*/,
  ) => {
    if (config.disabled === true) {
      return;
    }

    const {headerDir, headerPatterns, excludePatterns, subSpecs} = config;

    // Find header files for configuration
    const foundHeaderFiles = headerPatterns
      .map(pattern =>
        globSync(pattern, {
          cwd: podSpecDirectory,
          absolute: true,
          ignore: excludePatterns || [],
        }),
      )
      .flat();

    let resolvedHeaderDir /*:string */ = headerDir || '';

    // If headerDir is not set, we need to resolve it against parent specs
    if (parents.length > 0 && !headerDir) {
      for (let i = parents.length - 1; i >= 0; i--) {
        const parentHeaderDir = parents[i].headerDir;
        if (parentHeaderDir) {
          resolvedHeaderDir = parentHeaderDir;
          break;
        }
      }
    }

    // If still not resolved, default to spec name
    if (!resolvedHeaderDir) {
      resolvedHeaderDir = '';
    }

    // Resolve preservePaths from parent specs too
    let resolvedPreservePaths = config.preservePaths || [];
    if (resolvedPreservePaths.length === 0 && parents.length > 0) {
      for (let i = parents.length - 1; i >= 0; i--) {
        const parentPreservePaths = parents[i].preservePaths;
        if (parentPreservePaths && parentPreservePaths.length > 0) {
          resolvedPreservePaths = parentPreservePaths;
          break;
        }
      }
    }

    headerMaps.push({
      headerDir: resolvedHeaderDir,
      specName: config.name,
      headers: foundHeaderFiles.map(headerFile => {
        // Check if we have preservePath set for this file - then we need to get the subfolder structure too
        // and not just copy to the root of headerDir - we should also ignore the headerDir part of the path
        const isPreserved = resolvedPreservePaths.some(preservePattern => {
          return globSync(preservePattern, {
            cwd: podSpecDirectory,
            absolute: true,
            ignore: excludePatterns || [],
          }).includes(headerFile);
        });

        if (isPreserved) {
          // Get the subfolder for the header file
          const relativePath = path.dirname(
            path.relative(podSpecDirectory, headerFile),
          );
          return {
            source: headerFile,
            target: path.join(relativePath, path.basename(headerFile)),
          };
        }
        return {
          source: headerFile,
          target: path.join(resolvedHeaderDir, path.basename(headerFile)),
        };
      }),
    });

    // Process subSpecs recursively
    if (subSpecs && subSpecs.length > 0) {
      subSpecs.forEach(subSpecConfig => {
        processConfig(subSpecConfig, [config, ...parents]);
      });
    }
  };

  processConfig(podSpecConfig, []);

  return headerMaps;
}

module.exports = {
  getHeaderFilesFromPodspecs,
};

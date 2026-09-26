/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import RNTesterList from './RNTesterList';

export type ExampleURLTarget = {
  key: string,
  title: string,
  exampleKey: ?string,
};

/**
 * Resolves an example URL to the module (and example) it opens.
 *
 * Supported URL pattern(s):
 * *  rntester://example/<moduleKey>
 * *  rntester://example/<moduleKey>/<exampleKey>
 */
export default function resolveExampleURL(url: string): ?ExampleURLTarget {
  const match =
    /^rntester(-legacy)?:\/\/example\/([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9_-]+))?$/.exec(
      url,
    );
  if (!match) {
    console.warn(`handleOpenUrlRequest: Received unsupported URL: '${url}'`);
    return null;
  }

  const rawModuleKey = match[2];
  const exampleKey = match[3];

  // For tooling compatibility, allow all these variants for each module key:
  const validModuleKeys = [
    rawModuleKey,
    `${rawModuleKey}Index`,
    `${rawModuleKey}Example`,
    // $FlowFixMe[invalid-computed-prop]
  ].filter(k => RNTesterList.Modules[k] != null);
  if (validModuleKeys.length !== 1) {
    if (validModuleKeys.length === 0) {
      console.error(
        `handleOpenUrlRequest: Unable to find requested module with key: '${rawModuleKey}'`,
      );
    } else {
      console.error(
        `handleOpenUrlRequest: Found multiple matching module with key: '${rawModuleKey}', unable to resolve`,
      );
    }
    return null;
  }

  const resolvedModuleKey = validModuleKeys[0];
  // $FlowFixMe[invalid-computed-prop]
  const exampleModule = RNTesterList.Modules[resolvedModuleKey];

  if (exampleKey != null) {
    const validExampleKeys = exampleModule.examples.filter(
      e => e.name === exampleKey,
    );
    if (validExampleKeys.length !== 1) {
      if (validExampleKeys.length === 0) {
        console.error(
          `handleOpenUrlRequest: Unable to find requested example with key: '${exampleKey}' within module: '${resolvedModuleKey}'`,
        );
      } else {
        console.error(
          `handleOpenUrlRequest: Found multiple matching example with key: '${exampleKey}' within module: '${resolvedModuleKey}', unable to resolve`,
        );
      }
      return null;
    }
  }

  console.log(
    `handleOpenUrlRequest: Opening module: '${resolvedModuleKey}', example: '${
      exampleKey || 'null'
    }'`,
  );

  return {
    key: resolvedModuleKey,
    title: exampleModule.title || resolvedModuleKey,
    exampleKey,
  };
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {PluginObj} from '@babel/core';

function createDefaultExportNameReplacer(filePath: string): PluginObj<unknown> {
  return {
    visitor: {
      Identifier(node) {
        const fileName = filePath.split('/').pop() ?? '';
        const moduleName = fileName.split('.')[0];

        if (node.node.name === '$$EXPORT_DEFAULT_DECLARATION$$') {
          // Prefixing with $$ prevents the TS LSP server from (incorrectly)
          // discovering identifiers outside of package.json "exports" in
          // autocomplete.
          node.node.name = `$$${moduleName}`;
        }
      },
    },
  };
}

module.exports = createDefaultExportNameReplacer;

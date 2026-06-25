/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const signedsource = require('signedsource');

function translatedModuleTemplate({
  source,
  originalFileName,
  tripleSlashDirectives,
}: {
  source: string,
  originalFileName: string,
  tripleSlashDirectives: ReadonlyArray<string>,
}): string {
  return signedsource.signFile(
    `/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * ${signedsource.getSigningToken()}
 *
 * This file was translated from Flow by scripts/js-api/build-types/index.js.
 * Original file: ${originalFileName}
 */
${tripleSlashDirectives.length > 0 ? '\n/// ' + tripleSlashDirectives.join('\n/// ') + '\n\n' : ''}${source}
`,
  );
}

module.exports = translatedModuleTemplate;

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

const fs = require('node:fs');

/**
 * script to prepare package for publish.
 *
 * Due to differences to how we consume internal packages, update a flag
 */

fs.readFile('./react-native-modules.js', 'utf8', function (readError, source) {
  if (readError != null) {
    return console.error(
      'Failed to read react-native-modules.js for publish',
      readError,
    );
  }

  const result = source.replace(
    'const PACKAGE_USAGE = true;',
    'const PACKAGE_USAGE = false;',
  );

  fs.writeFile(
    './react-native-modules.js',
    result,
    'utf8',
    function (writeError) {
      if (writeError != null) {
        return console.error(
          'Failed to update react-native-modules.js for publish',
          writeError,
        );
      }
    },
  );
});

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @format
 */

'use strict';

module.exports = (path, options) => {
  const originalPackageFilter = options.packageFilter;

  return options.defaultResolver(path, {
    ...options,
    packageFilter: pkg => {
      const filteredPkg = originalPackageFilter
        ? originalPackageFilter(pkg)
        : pkg;

      // Temporarily allow any react-native subpaths to be resolved and
      // mocked by Jest (backwards compatibility around RFC0894)
      if (filteredPkg.name === 'react-native') {
        delete filteredPkg.exports;
      }

      return filteredPkg;
    },
  });
};

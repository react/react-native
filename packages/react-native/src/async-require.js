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

// ----------------------------------------------------------------------------
// react-native/async-require
//
// This is an untyped secondary entry point intended to be referenced from
// Metro's `transformer.asyncRequireModulePath` config option. Metro inlines
// it into every module that uses `import()`, so it must be a module request
// that resolves from any module in the project.
//
// Apps/libraries should not import this module; use `import()` instead.
// ----------------------------------------------------------------------------

const asyncRequire = require('metro-runtime/src/modules/asyncRequire');

// eslint-disable-next-line @react-native/monorepo/no-commonjs-exports
module.exports = asyncRequire;

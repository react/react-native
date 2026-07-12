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

const {polyfillGlobal} = require('../Utilities/PolyfillFunctions');

/**
 * Set up XMLHttpRequest. The native XMLHttpRequest in Chrome dev tools is CORS
 * aware and won't let you fetch anything from the internet.
 *
 * You can use this module directly, or just require InitializeCore.
 */
polyfillGlobal(
  'XMLHttpRequest',
  () => require('../Network/XMLHttpRequest').default,
);
polyfillGlobal('FormData', () => require('../Network/FormData').default);

polyfillGlobal('fetch', () => require('../Network/fetch').fetch);
polyfillGlobal('Headers', () => require('../Network/fetch').Headers);
polyfillGlobal('Request', () => require('../Network/fetch').Request);
polyfillGlobal('Response', () => require('../Network/fetch').Response);
polyfillGlobal('WebSocket', () => require('../WebSocket/WebSocket').default);
polyfillGlobal('Blob', () => require('../Blob/Blob').default);
polyfillGlobal('File', () => require('../Blob/File').default);
polyfillGlobal('FileReader', () => require('../Blob/FileReader').default);
polyfillGlobal('URL', () => require('../Blob/URL').URL);
polyfillGlobal('URLSearchParams', () => require('../Blob/URL').URLSearchParams);
polyfillGlobal(
  'AbortController',
  () =>
    require('../../src/private/webapis/dom/abort-api/AbortController')
      .AbortController, // flowlint-line untyped-import:off
);
polyfillGlobal(
  'AbortSignal',
  () =>
    require('../../src/private/webapis/dom/abort-api/AbortSignal')
      .AbortSignal_public, // flowlint-line untyped-import:off
);

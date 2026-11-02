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

const {PodspecExceptions} = require('../headers-config');

describe('React renderer CSS headers', () => {
  test('publishes fine-grained headers without a stable umbrella', () => {
    const rendererCss =
      PodspecExceptions[
        'ReactCommon/react/renderer/css/React-renderercss.podspec'
      ];

    expect(rendererCss.subSpecs).toEqual([
      {
        name: 'css',
        headerPatterns: ['*.h'],
        headerDir: 'react/renderer/css',
      },
    ]);
  });
});

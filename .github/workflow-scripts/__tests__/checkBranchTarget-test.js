/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const checkBranchTarget = require('../checkBranchTarget');

describe('checkBranchTarget', () => {
  test('passes for main', () => {
    expect(checkBranchTarget('main')).toEqual({
      message: '',
      status: 'PASS',
      shouldAddPickLabel: false,
    });
  });

  test('passes for a stable branch and adds the pick label', () => {
    expect(checkBranchTarget('0.76-stable')).toEqual({
      message: '',
      status: 'PASS',
      shouldAddPickLabel: true,
    });
  });

  test('passes for the head branch of another open PR', () => {
    expect(checkBranchTarget('pr58950', true)).toEqual({
      message: '',
      status: 'PASS',
      shouldAddPickLabel: false,
    });
  });

  test('fails for any other branch', () => {
    const {message, status, shouldAddPickLabel} =
      checkBranchTarget('feature-branch');

    expect(status).toBe('FAIL');
    expect(message).toContain('`feature-branch`');
    expect(shouldAddPickLabel).toBe(false);
  });
});
